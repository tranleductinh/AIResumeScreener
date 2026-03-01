import ScreeningResult from "../models/screening-result.model.js";
import ScreeningRun from "../models/screening-run.model.js";
import ResumeFile from "../models/resume-file.model.js";
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
    }).select("_id candidateId jobId");

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
  }).select("_id candidateId jobId");
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

export const createScreeningRunService = async (payload, userId) => {
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
    aiProvider: payload.aiProvider || "openai",
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

  return ScreeningRun.findById(screeningRun._id)
    .populate("jobId", "title status seniorityLevel")
    .populate("createdBy", "fullName email")
    .populate("input.resumeFileIds", "originalFileName candidateId jobId")
    .populate("input.candidateIds", "fullName email currentTitle");
};

export const getScreeningRunsService = async (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  const skip = (page - 1) * limit;

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

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getScreeningRunByIdService = async (screeningRunId) => {
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
