import Candidate from "../models/candidate.model.js";
import ScreeningResult from "../models/screening-result.model.js";
import ScreeningRun from "../models/screening-run.model.js";
import {
  buildServiceError,
  ensureObjectId,
  findCandidateOrThrow,
  findJobOrThrow,
  findResumeFileOrThrow,
} from "../utils/reference-validation.js";

const allowedStatusBadges = ["strong_fit", "potential", "not_suitable"];
const allowedRecommendations = ["must_interview", "interview", "hold", "reject"];

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

const normalizeScore = (value, fieldName) => {
  const score = Number(value);
  if (Number.isNaN(score) || score < 0 || score > 100) {
    throw buildServiceError(`${fieldName} must be a number between 0 and 100`, 400, "VALIDATION_ERROR");
  }
  return score;
};

const normalizeConfidenceScore = (value) => {
  if (value === undefined || value === null || value === "") return 0.7;
  const score = Number(value);
  if (Number.isNaN(score) || score < 0 || score > 1) {
    throw buildServiceError("confidenceScore must be a number between 0 and 1", 400, "VALIDATION_ERROR");
  }
  return score;
};

const getDefaultRecommendation = (statusBadge) => {
  if (statusBadge === "strong_fit") return "must_interview";
  if (statusBadge === "potential") return "interview";
  return "reject";
};

const findScreeningRunOrThrow = async (screeningRunId) => {
  ensureObjectId(screeningRunId, "INVALID_SCREENING_RUN_ID", "Invalid screening run id");

  const screeningRun = await ScreeningRun.findById(screeningRunId);
  if (!screeningRun) {
    throw buildServiceError("Screening run not found", 404, "SCREENING_RUN_NOT_FOUND");
  }

  return screeningRun;
};

const buildResultPayload = async ({ result, screeningRun, userId }) => {
  if (!result?.candidateId) {
    throw buildServiceError("candidateId is required for each screening result", 400, "VALIDATION_ERROR");
  }

  const candidate = await findCandidateOrThrow(result.candidateId);
  const runCandidateIds = new Set((screeningRun.input?.candidateIds || []).map((item) => String(item)));
  if (runCandidateIds.size && !runCandidateIds.has(String(candidate._id))) {
    throw buildServiceError(
      "candidateId must belong to the selected screening run",
      409,
      "SCREENING_RESULT_CANDIDATE_MISMATCH"
    );
  }

  let resumeFileId = null;
  if (result.resumeFileId) {
    const resumeFile = await findResumeFileOrThrow(result.resumeFileId);
    if (String(resumeFile.candidateId) !== String(candidate._id)) {
      throw buildServiceError(
        "resumeFileId must belong to the same candidate",
        409,
        "SCREENING_RESULT_RESUME_MISMATCH"
      );
    }
    if (resumeFile.jobId && String(resumeFile.jobId) !== String(screeningRun.jobId)) {
      throw buildServiceError(
        "resumeFileId must belong to the same job as the screening run",
        409,
        "SCREENING_RESULT_JOB_MISMATCH"
      );
    }

    const runResumeIds = new Set((screeningRun.input?.resumeFileIds || []).map((item) => String(item)));
    if (runResumeIds.size && !runResumeIds.has(String(resumeFile._id))) {
      throw buildServiceError(
        "resumeFileId must belong to the selected screening run",
        409,
        "SCREENING_RESULT_RUN_RESUME_MISMATCH"
      );
    }

    resumeFileId = resumeFile._id;
  }

  if (!allowedStatusBadges.includes(result.statusBadge)) {
    throw buildServiceError("statusBadge is invalid", 400, "VALIDATION_ERROR");
  }

  const recommendation = result.recommendation || getDefaultRecommendation(result.statusBadge);
  if (!allowedRecommendations.includes(recommendation)) {
    throw buildServiceError("recommendation is invalid", 400, "VALIDATION_ERROR");
  }

  return {
    screeningRunId: screeningRun._id,
    jobId: screeningRun.jobId,
    candidateId: candidate._id,
    resumeFileId,
    matchingScore: normalizeScore(result.matchingScore, "matchingScore"),
    rankingPosition:
      result.rankingPosition === undefined || result.rankingPosition === null || result.rankingPosition === ""
        ? null
        : Math.max(Number(result.rankingPosition) || 1, 1),
    scoreBreakdown: {
      requiredSkills: normalizeScore(result.scoreBreakdown?.requiredSkills ?? 0, "requiredSkills"),
      optionalSkills: normalizeScore(result.scoreBreakdown?.optionalSkills ?? 0, "optionalSkills"),
      experience: normalizeScore(result.scoreBreakdown?.experience ?? 0, "experience"),
      education: normalizeScore(result.scoreBreakdown?.education ?? 0, "education"),
      keywordContext: normalizeScore(result.scoreBreakdown?.keywordContext ?? 0, "keywordContext"),
    },
    fitScores: {
      technical: normalizeScore(result.fitScores?.technical ?? 0, "technical"),
      cultural: normalizeScore(result.fitScores?.cultural ?? 0, "cultural"),
    },
    statusBadge: result.statusBadge,
    recommendation,
    matchedSkills: normalizeStringArray(result.matchedSkills),
    missingSkills: normalizeStringArray(result.missingSkills),
    optionalSkills: normalizeStringArray(result.optionalSkills),
    strengths: normalizeStringArray(result.strengths),
    gaps: normalizeStringArray(result.gaps),
    redFlags: normalizeStringArray(result.redFlags),
    aiSummary: result.aiSummary ? String(result.aiSummary).trim() : "",
    explanation: result.explanation ? String(result.explanation).trim() : "",
    confidenceScore: normalizeConfidenceScore(result.confidenceScore),
    hrReview: {
      reviewedBy: result.hrReview?.reviewedBy || userId || null,
      reviewedAt: result.hrReview?.reviewedAt || null,
      overrideStatusBadge: result.hrReview?.overrideStatusBadge || null,
      overrideNote: result.hrReview?.overrideNote ? String(result.hrReview.overrideNote).trim() : null,
    },
    isLatestForJobCandidate: true,
    flags: {
      needsReview: Boolean(result.flags?.needsReview),
      possibleHallucination: Boolean(result.flags?.possibleHallucination),
    },
  };
};

const buildPagination = ({ page, limit, total }) => {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const createScreeningResultsBulkService = async (payload, userId) => {
  if (!userId) {
    throw buildServiceError("Unauthorized", 401, "UNAUTHORIZED");
  }

  if (!payload.screeningRunId) {
    throw buildServiceError("screeningRunId is required", 400, "VALIDATION_ERROR");
  }

  if (!Array.isArray(payload.results) || !payload.results.length) {
    throw buildServiceError("results must be a non-empty array", 400, "VALIDATION_ERROR");
  }

  const screeningRun = await findScreeningRunOrThrow(payload.screeningRunId);
  await findJobOrThrow(screeningRun.jobId);

  const normalizedResults = [];
  for (const result of payload.results) {
    normalizedResults.push(await buildResultPayload({ result, screeningRun, userId }));
  }

  const candidateIds = [...new Set(normalizedResults.map((item) => String(item.candidateId)))];

  await ScreeningResult.updateMany(
    {
      jobId: screeningRun.jobId,
      candidateId: { $in: candidateIds },
      screeningRunId: { $ne: screeningRun._id },
    },
    {
      $set: {
        isLatestForJobCandidate: false,
      },
    }
  );

  const bulkOperations = normalizedResults.map((result) => ({
    updateOne: {
      filter: {
        screeningRunId: screeningRun._id,
        jobId: screeningRun.jobId,
        candidateId: result.candidateId,
      },
      update: {
        $set: result,
      },
      upsert: true,
    },
  }));

  await ScreeningResult.bulkWrite(bulkOperations, { ordered: true });

  const now = new Date();
  await Candidate.updateMany(
    { _id: { $in: candidateIds } },
    {
      $set: {
        lastScreenedAt: now,
      },
    }
  );

  const processedCount = await ScreeningResult.countDocuments({ screeningRunId: screeningRun._id });
  screeningRun.totals.processed = processedCount;
  if (screeningRun.status === "queued" && processedCount > 0) {
    screeningRun.status = "running";
    screeningRun.startedAt = screeningRun.startedAt || now;
  }
  await screeningRun.save();

  const items = await ScreeningResult.find({ screeningRunId: screeningRun._id })
    .populate("candidateId", "fullName email currentTitle totalYearsExperience")
    .populate("resumeFileId", "originalFileName uploadStatus parseStatus")
    .populate("jobId", "title seniorityLevel")
    .populate("screeningRunId", "status createdAt")
    .sort({ rankingPosition: 1, matchingScore: -1, createdAt: -1 });

  return items;
};

export const getJobScreeningResultsService = async (jobId, query = {}) => {
  await findJobOrThrow(jobId);

  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const filter = { jobId };
  if (query.latestOnly !== "false") {
    filter.isLatestForJobCandidate = true;
  }
  if (query.screeningRunId) {
    const screeningRun = await findScreeningRunOrThrow(query.screeningRunId);
    if (String(screeningRun.jobId) !== String(jobId)) {
      throw buildServiceError(
        "screeningRunId must belong to the same job",
        409,
        "SCREENING_RESULT_JOB_MISMATCH"
      );
    }
    filter.screeningRunId = query.screeningRunId;
  }

  const [items, total] = await Promise.all([
    ScreeningResult.find(filter)
      .populate("candidateId", "fullName email currentTitle totalYearsExperience")
      .populate("resumeFileId", "originalFileName uploadStatus parseStatus")
      .populate("screeningRunId", "status createdAt")
      .sort({ rankingPosition: 1, matchingScore: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ScreeningResult.countDocuments(filter),
  ]);

  return {
    items,
    pagination: buildPagination({ page, limit, total }),
  };
};

export const getScreeningRunResultsService = async (screeningRunId, query = {}) => {
  await findScreeningRunOrThrow(screeningRunId);

  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const filter = { screeningRunId };

  const [items, total] = await Promise.all([
    ScreeningResult.find(filter)
      .populate("candidateId", "fullName email currentTitle totalYearsExperience")
      .populate("resumeFileId", "originalFileName uploadStatus parseStatus")
      .populate("jobId", "title seniorityLevel")
      .sort({ rankingPosition: 1, matchingScore: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ScreeningResult.countDocuments(filter),
  ]);

  return {
    items,
    pagination: buildPagination({ page, limit, total }),
  };
};
