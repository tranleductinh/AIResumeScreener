import Job from "../models/job.model.js";
import Candidate from "../models/candidate.model.js";
import ScreeningResult from "../models/screening-result.model.js";
import ScreeningRun from "../models/screening-run.model.js";
import ResumeFile from "../models/resume-file.model.js";
import { logAuditEventService } from "./audit-log.service.js";
import { parseResumeFileService } from "./resume-file.service.js";
import {
  createScreeningResultsBulkService,
} from "./screening-result.service.js";
import {
  generateScreeningResultService,
  resolveScreeningRunAiProvider,
} from "./resume-matching.service.js";
import { buildPaginationResult, parsePagination } from "../utils/pagination.js";
import {
  buildServiceError,
  ensureObjectId,
  findCandidateOrThrow,
  findJobOrThrow,
} from "../utils/reference-validation.js";

const allowedStatuses = ["queued", "running", "completed", "failed"];
const allowedTransitions = {
  queued: ["running", "completed", "failed"],
  running: ["completed", "failed"],
  completed: [],
  failed: [],
};

const screeningQueue = [];
const queuedRunIds = new Set();
let isProcessingQueue = false;

const normalizeStringArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeObjectIdArray = (value, errorCode, message) => {
  if (!value) return [];

  const items = Array.isArray(value) ? value : [value];
  const uniqueIds = [...new Set(items.map((item) => String(item).trim()).filter(Boolean))];

  uniqueIds.forEach((id) => {
    ensureObjectId(id, errorCode, message);
  });

  return uniqueIds;
};

const normalizeFilters = (payload = {}) => {
  const minYearsExperience =
    payload.minYearsExperience === undefined || payload.minYearsExperience === null
      ? null
      : Math.max(Number(payload.minYearsExperience) || 0, 0);

  return {
    minYearsExperience,
    mustIncludeSkills: normalizeStringArray(payload.mustIncludeSkills),
    includeStatuses: normalizeStringArray(payload.includeStatuses),
  };
};

const normalizeQueueMeta = (payload = {}, total = 0) => {
  const batchSize = Math.min(Math.max(Number(payload.batchSize) || 20, 1), 100);
  return {
    batchSize,
    currentBatch: 0,
    totalBatches: total ? Math.ceil(total / batchSize) : 0,
  };
};

const ensureRerunRelation = async (rerunOfRunId, jobId) => {
  if (!rerunOfRunId) return null;

  ensureObjectId(rerunOfRunId, "INVALID_SCREENING_RUN_ID", "Invalid screening run id");
  const previousRun = await ScreeningRun.findById(rerunOfRunId);

  if (!previousRun) {
    throw buildServiceError("Previous screening run not found", 404, "SCREENING_RUN_NOT_FOUND");
  }

  if (String(previousRun.jobId) !== String(jobId)) {
    throw buildServiceError(
      "rerunOfRunId must belong to the same job",
      409,
      "SCREENING_RUN_JOB_MISMATCH"
    );
  }

  return previousRun;
};

const getResumeFilesForRun = async ({ jobId, resumeFileIds }) => {
  if (resumeFileIds.length) {
    const resumeFiles = await ResumeFile.find({
      _id: { $in: resumeFileIds },
      isDeleted: false,
    }).select("_id candidateId jobId parseStatus createdAt");

    if (resumeFiles.length !== resumeFileIds.length) {
      throw buildServiceError("One or more resume files were not found", 404, "RESUME_FILE_NOT_FOUND");
    }

    resumeFiles.forEach((resumeFile) => {
      if (resumeFile.jobId && String(resumeFile.jobId) !== String(jobId)) {
        throw buildServiceError(
          "All resume files in a screening run must belong to the selected job",
          409,
          "RESUME_FILE_JOB_MISMATCH"
        );
      }
    });

    return resumeFiles;
  }

  return ResumeFile.find({
    jobId,
    isDeleted: false,
  }).select("_id candidateId jobId parseStatus createdAt");
};

const validateCandidateIdsForJob = async ({ candidateIds, jobId, resumeFiles }) => {
  if (!candidateIds.length) {
    return [...new Set(resumeFiles.map((resumeFile) => String(resumeFile.candidateId)).filter(Boolean))];
  }

  await Promise.all(candidateIds.map((candidateId) => findCandidateOrThrow(candidateId)));

  const resumeCandidateSet = new Set(
    resumeFiles.map((resumeFile) => String(resumeFile.candidateId)).filter(Boolean)
  );

  for (const candidateId of candidateIds) {
    if (resumeCandidateSet.has(String(candidateId))) {
      continue;
    }

    const linkedResumeCount = await ResumeFile.countDocuments({
      candidateId,
      jobId,
      isDeleted: false,
    });
    const linkedScreeningCount = await ScreeningResult.countDocuments({
      candidateId,
      jobId,
    });

    if (!linkedResumeCount && !linkedScreeningCount) {
      throw buildServiceError(
        "All candidates in a screening run must be linked to the selected job",
        409,
        "CANDIDATE_JOB_MISMATCH"
      );
    }
  }

  return candidateIds;
};

const groupResumeFilesByCandidate = (resumeFiles) => {
  return resumeFiles.reduce((accumulator, resumeFile) => {
    const candidateId = String(resumeFile.candidateId || "");
    if (!candidateId) return accumulator;

    if (!accumulator.has(candidateId)) {
      accumulator.set(candidateId, []);
    }

    accumulator.get(candidateId).push(resumeFile);
    return accumulator;
  }, new Map());
};

const selectBestResumeFile = (resumeFiles = []) => {
  if (!resumeFiles.length) return null;

  return [...resumeFiles].sort((left, right) => {
    const parseRank = (resumeFile) => (resumeFile.parseStatus === "parsed" ? 1 : 0);
    if (parseRank(right) !== parseRank(left)) {
      return parseRank(right) - parseRank(left);
    }

    return new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime();
  })[0];
};

const refreshJobStats = async (jobId) => {
  const [screenedCount, shortlistedCount, rejectedCount] = await Promise.all([
    ScreeningResult.countDocuments({ jobId, isLatestForJobCandidate: true }),
    ScreeningResult.countDocuments({
      jobId,
      isLatestForJobCandidate: true,
      recommendation: "must_interview",
    }),
    ScreeningResult.countDocuments({
      jobId,
      isLatestForJobCandidate: true,
      recommendation: "reject",
    }),
  ]);

  await Job.updateOne(
    { _id: jobId },
    {
      $set: {
        "stats.screenedCount": screenedCount,
        "stats.shortlistedCount": shortlistedCount,
        "stats.rejectedCount": rejectedCount,
      },
    }
  );
};

const compactErrorMessage = (value) => {
  return String(value || "Unknown error").replace(/\s+/g, " ").trim().slice(0, 140);
};

const removeQueuedScreeningRun = (screeningRunId) => {
  const normalizedRunId = String(screeningRunId);
  const queueIndex = screeningQueue.findIndex(
    (queuedItem) => String(queuedItem.screeningRunId) === normalizedRunId
  );

  if (queueIndex >= 0) {
    screeningQueue.splice(queueIndex, 1);
  }

  queuedRunIds.delete(normalizedRunId);
};

const syncLatestResultsForCandidates = async ({ jobId, candidateIds = [] }) => {
  if (!candidateIds.length) {
    return;
  }

  const uniqueCandidateIds = [...new Set(candidateIds.map((candidateId) => String(candidateId)))];

  await ScreeningResult.updateMany(
    {
      jobId,
      candidateId: { $in: uniqueCandidateIds },
    },
    {
      $set: {
        isLatestForJobCandidate: false,
      },
    }
  );

  for (const candidateId of uniqueCandidateIds) {
    const latestResult = await ScreeningResult.findOne({
      jobId,
      candidateId,
    }).sort({ createdAt: -1, matchingScore: -1 });

    if (latestResult) {
      latestResult.isLatestForJobCandidate = true;
      await latestResult.save();
    }

    await Candidate.updateOne(
      { _id: candidateId },
      {
        $set: {
          lastScreenedAt: latestResult?.createdAt || null,
        },
      }
    );
  }
};

const processScreeningRunJob = async ({ screeningRunId, userId }) => {
  const screeningRun = await ScreeningRun.findById(screeningRunId);
  if (!screeningRun) {
    return;
  }

  try {
    const job = await findJobOrThrow(screeningRun.jobId);
    const resumeFiles = await ResumeFile.find({
      _id: { $in: screeningRun.input?.resumeFileIds || [] },
      isDeleted: false,
    }).select("_id candidateId jobId parseStatus createdAt");

    const candidateIds =
      screeningRun.input?.candidateIds?.map((candidateId) => String(candidateId)) || [];

    if (!resumeFiles.length || !candidateIds.length) {
      throw buildServiceError(
        "No screening input is available for this run",
        400,
        "SCREENING_INPUT_EMPTY"
      );
    }

    screeningRun.status = "running";
    screeningRun.startedAt = screeningRun.startedAt || new Date();
    screeningRun.finishedAt = null;
    screeningRun.errorSummary = null;
    await screeningRun.save();

    const resumeFilesByCandidate = groupResumeFilesByCandidate(resumeFiles);
    const candidateNameMap = new Map(
      (
        await Candidate.find({ _id: { $in: candidateIds } }).select("_id fullName")
      ).map((candidate) => [String(candidate._id), candidate.fullName || String(candidate._id)])
    );
    const generatedResults = [];
    let failedCount = 0;
    const failedDetails = [];
    const batchSize = screeningRun.queueMeta?.batchSize || 20;

    for (let index = 0; index < candidateIds.length; index += 1) {
      const candidateId = candidateIds[index];
      const bestResumeFile = selectBestResumeFile(resumeFilesByCandidate.get(candidateId) || []);

      screeningRun.queueMeta.currentBatch = Math.ceil((index + 1) / batchSize);
      await screeningRun.save();

      try {
        let resumeFileIdForScoring = bestResumeFile?._id || null;

        if (bestResumeFile && bestResumeFile.parseStatus !== "parsed") {
          try {
            await parseResumeFileService(bestResumeFile._id);
          } catch (_parseError) {
            // Keep screening resilient: continue scoring from candidate profile even if resume parsing fails.
            resumeFileIdForScoring = null;
          }
        }

        let result;
        try {
          result = await generateScreeningResultService({
            candidateId,
            resumeFileId: resumeFileIdForScoring,
            job,
            screeningRun,
            provider: screeningRun.aiProvider,
          });
        } catch (providerError) {
          if (screeningRun.aiProvider !== "rule_based") {
            result = await generateScreeningResultService({
              candidateId,
              resumeFileId: resumeFileIdForScoring,
              job,
              screeningRun,
              provider: "rule_based",
            });
          } else {
            throw providerError;
          }
        }

        generatedResults.push({
          candidateId,
          resumeFileId: resumeFileIdForScoring,
          matchingScore: result.matchingScore,
          statusBadge: result.statusBadge,
          rankingPosition: null,
          scoreBreakdown: result.scoreBreakdown,
          fitScores: result.fitScores,
          recommendation: result.recommendation,
          matchedSkills: result.matchedSkills,
          missingSkills: result.missingSkills,
          optionalSkills: result.optionalSkills,
          strengths: result.strengths,
          gaps: result.gaps,
          redFlags: result.redFlags,
          aiSummary: result.aiSummary,
          explanation: result.explanation,
          confidenceScore: result.confidenceScore,
          hrReview: result.hrReview,
          flags: result.flags,
        });
      } catch (error) {
        failedCount += 1;
        failedDetails.push(
          `${candidateNameMap.get(String(candidateId)) || String(candidateId)}: ${compactErrorMessage(
            error?.message
          )}`
        );
      }
    }

    const rankedResults = [...generatedResults]
      .sort((left, right) => right.matchingScore - left.matchingScore)
      .map((result, index) => ({
        ...result,
        rankingPosition: index + 1,
      }));

    if (rankedResults.length) {
      await createScreeningResultsBulkService(
        {
          screeningRunId: screeningRun._id,
          results: rankedResults,
        },
        userId
      );
    }

    screeningRun.totals.total = candidateIds.length;
    screeningRun.totals.processed = rankedResults.length;
    screeningRun.totals.failed = failedCount;
    screeningRun.status = rankedResults.length ? "completed" : "failed";
    screeningRun.finishedAt = new Date();
    screeningRun.errorSummary = failedCount
      ? `${failedCount} candidate(s) failed during screening. ${failedDetails
          .slice(0, 3)
          .join(" | ")}`
      : null;
    await screeningRun.save();

    await refreshJobStats(screeningRun.jobId);
  } catch (error) {
    screeningRun.status = "failed";
    screeningRun.finishedAt = new Date();
    screeningRun.errorSummary = error.message;
    await screeningRun.save();
  }
};

const processScreeningQueue = async () => {
  if (isProcessingQueue) {
    return;
  }

  isProcessingQueue = true;

  while (screeningQueue.length) {
    const job = screeningQueue.shift();
    queuedRunIds.delete(String(job.screeningRunId));
    await processScreeningRunJob(job);
  }

  isProcessingQueue = false;
};

const enqueueScreeningRun = async ({ screeningRunId, userId }) => {
  const normalizedRunId = String(screeningRunId);
  if (queuedRunIds.has(normalizedRunId)) {
    return;
  }

  queuedRunIds.add(normalizedRunId);
  screeningQueue.push({
    screeningRunId: normalizedRunId,
    userId: String(userId),
  });

  setTimeout(() => {
    processScreeningQueue().catch(() => {});
  }, 0);
};

const findScreeningRunByIdOrThrow = async (screeningRunId) => {
  ensureObjectId(screeningRunId, "INVALID_SCREENING_RUN_ID", "Invalid screening run id");

  const screeningRun = await ScreeningRun.findById(screeningRunId)
    .populate("jobId", "title status seniorityLevel")
    .populate("createdBy", "fullName email")
    .populate("rerunOfRunId", "status createdAt")
    .populate("input.resumeFileIds", "originalFileName candidateId jobId uploadStatus parseStatus")
    .populate("input.candidateIds", "fullName email currentTitle totalYearsExperience");

  if (!screeningRun) {
    throw buildServiceError("Screening run not found", 404, "SCREENING_RUN_NOT_FOUND");
  }

  return screeningRun;
};

export const createScreeningRunService = async (payload, userId, auditContext = {}) => {
  if (!userId) {
    throw buildServiceError("Unauthorized", 401, "UNAUTHORIZED");
  }

  if (!payload.jobId) {
    throw buildServiceError("jobId is required", 400, "VALIDATION_ERROR");
  }

  const job = await findJobOrThrow(payload.jobId);
  const rerunOfRun = await ensureRerunRelation(payload.rerunOfRunId, job._id);
  const resumeFileIds = normalizeObjectIdArray(
    payload.resumeFileIds,
    "INVALID_RESUME_FILE_ID",
    "Invalid resume file id"
  );
  const candidateIds = normalizeObjectIdArray(
    payload.candidateIds,
    "INVALID_CANDIDATE_ID",
    "Invalid candidate id"
  );

  const resumeFiles = await getResumeFilesForRun({ jobId: job._id, resumeFileIds });
  if (!resumeFiles.length) {
    throw buildServiceError(
      "No resume files available for this screening run",
      400,
      "SCREENING_INPUT_EMPTY"
    );
  }

  const validatedCandidateIds = await validateCandidateIdsForJob({
    candidateIds,
    jobId: job._id,
    resumeFiles,
  });

  const queueMeta = normalizeQueueMeta(payload.queueMeta, validatedCandidateIds.length);
  const screeningRun = await ScreeningRun.create({
    jobId: job._id,
    createdBy: userId,
    runType: payload.runType === "rerun" ? "rerun" : rerunOfRun ? "rerun" : "initial",
    rerunOfRunId: rerunOfRun?._id || null,
    triggeredBy: payload.triggeredBy === "system" ? "system" : "manual",
    status: "queued",
    input: {
      resumeFileIds: resumeFiles.map((resumeFile) => resumeFile._id),
      candidateIds: validatedCandidateIds,
    },
    filters: normalizeFilters(payload.filters),
    aiProvider: resolveScreeningRunAiProvider(payload.aiProvider),
    modelName: payload.modelName ? String(payload.modelName).trim() : null,
    promptVersion: payload.promptVersion ? String(payload.promptVersion).trim() : null,
    configSnapshot: {
      jdVersion: payload.configSnapshot?.jdVersion || null,
      autoRejectBelowScore: job.screeningConfig?.autoRejectBelowScore || 0,
      shortlistAboveScore: job.screeningConfig?.shortlistAboveScore || 85,
      requiredSkillWeight: job.screeningConfig?.requiredSkillWeight || 0.45,
      experienceWeight: job.screeningConfig?.experienceWeight || 0.25,
      educationWeight: job.screeningConfig?.educationWeight || 0.15,
      keywordWeight: job.screeningConfig?.keywordWeight || 0.15,
    },
    totals: {
      total: validatedCandidateIds.length,
      processed: 0,
      failed: 0,
    },
    queueMeta,
  });

  await logAuditEventService({
    actorId: userId,
    actorEmail: auditContext.actorEmail || null,
    entityType: "ScreeningRun",
    entityId: screeningRun._id,
    action: "screening_run_started",
    module: "screening",
    severity: "info",
    metadata: {
      jobId: screeningRun.jobId,
      runType: screeningRun.runType,
      status: screeningRun.status,
      totalCandidates: screeningRun.totals.total,
      totalResumeFiles: screeningRun.input?.resumeFileIds?.length || 0,
    },
    ipAddress: auditContext.ipAddress || null,
    userAgent: auditContext.userAgent || null,
  });

  await enqueueScreeningRun({
    screeningRunId: screeningRun._id,
    userId,
  });

  return ScreeningRun.findById(screeningRun._id)
    .populate("jobId", "title status seniorityLevel")
    .populate("createdBy", "fullName email")
    .populate("input.resumeFileIds", "originalFileName candidateId jobId")
    .populate("input.candidateIds", "fullName email currentTitle");
};

export const getScreeningRunsService = async (query) => {
  const { page, limit, skip } = parsePagination(query);

  const filter = {};

  if (query.jobId) {
    await findJobOrThrow(query.jobId);
    filter.jobId = query.jobId;
  }

  if (query.status) {
    if (!allowedStatuses.includes(query.status)) {
      throw buildServiceError("Invalid screening run status", 400, "INVALID_STATUS");
    }
    filter.status = query.status;
  }

  const [items, total] = await Promise.all([
    ScreeningRun.find(filter)
      .populate("jobId", "title status seniorityLevel")
      .populate("createdBy", "fullName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ScreeningRun.countDocuments(filter),
  ]);

  return buildPaginationResult({ items, page, limit, total });
};

export const getScreeningRunByIdService = async (screeningRunId) => {
  return findScreeningRunByIdOrThrow(screeningRunId);
};

export const updateScreeningRunStatusService = async (screeningRunId, payload) => {
  ensureObjectId(screeningRunId, "INVALID_SCREENING_RUN_ID", "Invalid screening run id");

  const screeningRun = await ScreeningRun.findById(screeningRunId);
  if (!screeningRun) {
    throw buildServiceError("Screening run not found", 404, "SCREENING_RUN_NOT_FOUND");
  }

  if (!payload.status || !allowedStatuses.includes(payload.status)) {
    throw buildServiceError("Invalid screening run status", 400, "INVALID_STATUS");
  }

  if (
    payload.status !== screeningRun.status &&
    !allowedTransitions[screeningRun.status].includes(payload.status)
  ) {
    throw buildServiceError(
      `Cannot change screening run status from ${screeningRun.status} to ${payload.status}`,
      409,
      "INVALID_STATUS_TRANSITION"
    );
  }

  screeningRun.status = payload.status;

  if (["running", "completed", "failed"].includes(payload.status) && !screeningRun.startedAt) {
    screeningRun.startedAt = new Date();
  }

  if (["completed", "failed"].includes(payload.status)) {
    screeningRun.finishedAt = new Date();
  }

  if (["queued", "running"].includes(payload.status)) {
    screeningRun.finishedAt = null;
  }

  if (payload.processed !== undefined) {
    screeningRun.totals.processed = Math.max(Number(payload.processed) || 0, 0);
  }

  if (payload.failed !== undefined) {
    screeningRun.totals.failed = Math.max(Number(payload.failed) || 0, 0);
  }

  if (payload.total !== undefined) {
    screeningRun.totals.total = Math.max(Number(payload.total) || 0, 0);
  }

  if (payload.currentBatch !== undefined) {
    screeningRun.queueMeta.currentBatch = Math.max(Number(payload.currentBatch) || 0, 0);
  }

  if (payload.totalBatches !== undefined) {
    screeningRun.queueMeta.totalBatches = Math.max(Number(payload.totalBatches) || 0, 0);
  }

  if (payload.errorSummary !== undefined) {
    screeningRun.errorSummary = payload.errorSummary ? String(payload.errorSummary).trim() : null;
  }

  await screeningRun.save();

  return ScreeningRun.findById(screeningRun._id)
    .populate("jobId", "title status seniorityLevel")
    .populate("createdBy", "fullName email");
};

export const deleteScreeningRunService = async (screeningRunId, userId, auditContext = {}) => {
  if (!userId) {
    throw buildServiceError("Unauthorized", 401, "UNAUTHORIZED");
  }

  const screeningRun = await ScreeningRun.findById(screeningRunId);
  if (!screeningRun) {
    throw buildServiceError("Screening run not found", 404, "SCREENING_RUN_NOT_FOUND");
  }

  if (screeningRun.status === "running") {
    throw buildServiceError(
      "Cannot delete a screening run while it is running",
      409,
      "SCREENING_RUN_DELETE_NOT_ALLOWED"
    );
  }

  removeQueuedScreeningRun(screeningRun._id);

  const relatedResults = await ScreeningResult.find({
    screeningRunId: screeningRun._id,
  }).select("_id candidateId jobId");

  const affectedCandidateIds = relatedResults.map((result) => result.candidateId);
  const affectedJobId = screeningRun.jobId;

  if (relatedResults.length) {
    await ScreeningResult.deleteMany({
      screeningRunId: screeningRun._id,
    });
  }

  await ScreeningRun.deleteOne({ _id: screeningRun._id });

  if (affectedCandidateIds.length) {
    await syncLatestResultsForCandidates({
      jobId: affectedJobId,
      candidateIds: affectedCandidateIds,
    });
  }

  await refreshJobStats(affectedJobId);

  await logAuditEventService({
    actorId: userId,
    actorEmail: auditContext.actorEmail || null,
    entityType: "ScreeningRun",
    entityId: screeningRun._id,
    action: "screening_run_deleted",
    module: "screening",
    severity: "warning",
    metadata: {
      jobId: screeningRun.jobId,
      deletedResultsCount: relatedResults.length,
    },
    ipAddress: auditContext.ipAddress || null,
    userAgent: auditContext.userAgent || null,
  });

  return {
    id: screeningRunId,
    deletedResultsCount: relatedResults.length,
  };
};
