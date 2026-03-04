import Candidate from "../models/candidate.model.js";
import ScreeningResult from "../models/screening-result.model.js";
import ScreeningRun from "../models/screening-run.model.js";
import { buildPaginationResult, parsePagination } from "../utils/pagination.js";
import {
  buildServiceError,
  ensureObjectId,
  findCandidateOrThrow,
  findJobOrThrow,
  findResumeFileOrThrow,
} from "../utils/reference-validation.js";

const allowedStatusBadges = ["strong_fit", "potential", "not_suitable"];
const allowedRecommendations = ["must_interview", "interview", "hold", "reject"];
const allowedSorts = [
  "ranking_asc",
  "ranking_desc",
  "score_desc",
  "score_asc",
  "experience_desc",
  "experience_asc",
  "newest",
  "oldest",
];

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
    throw buildServiceError(
      `${fieldName} must be a number between 0 and 100`,
      400,
      "VALIDATION_ERROR"
    );
  }
  return score;
};

const normalizeConfidenceScore = (value) => {
  if (value === undefined || value === null || value === "") return 0.7;
  const score = Number(value);
  if (Number.isNaN(score) || score < 0 || score > 1) {
    throw buildServiceError(
      "confidenceScore must be a number between 0 and 1",
      400,
      "VALIDATION_ERROR"
    );
  }
  return score;
};

const getDefaultRecommendation = (statusBadge) => {
  if (statusBadge === "strong_fit") return "must_interview";
  if (statusBadge === "potential") return "interview";
  return "reject";
};

const findScreeningRunOrThrow = async (screeningRunId) => {
  ensureObjectId(
    screeningRunId,
    "INVALID_SCREENING_RUN_ID",
    "Invalid screening run id"
  );

  const screeningRun = await ScreeningRun.findById(screeningRunId);
  if (!screeningRun) {
    throw buildServiceError(
      "Screening run not found",
      404,
      "SCREENING_RUN_NOT_FOUND"
    );
  }

  return screeningRun;
};

const populateResultQuery = (query) => {
  return query
    .populate(
      "candidateId",
      "fullName email currentTitle totalYearsExperience location summary skills"
    )
    .populate("resumeFileId", "originalFileName uploadStatus parseStatus")
    .populate("jobId", "title seniorityLevel")
    .populate("screeningRunId", "status createdAt");
};

const resolveCandidateIdsByExperience = async (experienceMin) => {
  if (experienceMin === undefined || experienceMin === null || experienceMin === "") {
    return null;
  }

  const minYears = Number(experienceMin);
  if (Number.isNaN(minYears) || minYears < 0) {
    throw buildServiceError(
      "experienceMin must be a non-negative number",
      400,
      "VALIDATION_ERROR"
    );
  }

  const candidates = await Candidate.find({
    isDeleted: false,
    totalYearsExperience: { $gte: minYears },
  }).select("_id");

  return candidates.map((candidate) => candidate._id);
};

const buildBaseFilter = async (scope = {}, query = {}) => {
  const filter = { ...scope };

  if (query.latestOnly !== "false" && !scope.screeningRunId) {
    filter.isLatestForJobCandidate = true;
  }

  if (query.screeningRunId) {
    const screeningRun = await findScreeningRunOrThrow(query.screeningRunId);
    if (scope.jobId && String(screeningRun.jobId) !== String(scope.jobId)) {
      throw buildServiceError(
        "screeningRunId must belong to the same job",
        409,
        "SCREENING_RESULT_JOB_MISMATCH"
      );
    }
    filter.screeningRunId = screeningRun._id;
  }

  if (query.scoreMin !== undefined && query.scoreMin !== "") {
    filter.matchingScore = {
      ...(filter.matchingScore || {}),
      $gte: normalizeScore(query.scoreMin, "scoreMin"),
    };
  }

  if (query.scoreMax !== undefined && query.scoreMax !== "") {
    filter.matchingScore = {
      ...(filter.matchingScore || {}),
      $lte: normalizeScore(query.scoreMax, "scoreMax"),
    };
  }

  if (
    filter.matchingScore?.$gte !== undefined &&
    filter.matchingScore?.$lte !== undefined &&
    filter.matchingScore.$gte > filter.matchingScore.$lte
  ) {
    throw buildServiceError(
      "scoreMin cannot be greater than scoreMax",
      400,
      "VALIDATION_ERROR"
    );
  }

  if (query.status) {
    if (!allowedStatusBadges.includes(query.status)) {
      throw buildServiceError("status is invalid", 400, "VALIDATION_ERROR");
    }
    filter.statusBadge = query.status;
  }

  const skills = normalizeStringArray(query.skills);
  if (skills.length) {
    filter.matchedSkills = { $all: skills };
  }

  const candidateIdsByExperience = await resolveCandidateIdsByExperience(
    query.experienceMin
  );
  if (candidateIdsByExperience) {
    filter.candidateId = { $in: candidateIdsByExperience };
  }

  return filter;
};

const resolveSort = (sort) => {
  const sortValue = sort || "ranking_asc";
  if (!allowedSorts.includes(sortValue)) {
    throw buildServiceError("sort is invalid", 400, "VALIDATION_ERROR");
  }

  if (sortValue === "ranking_desc") {
    return { rankingPosition: -1, matchingScore: -1, createdAt: -1 };
  }
  if (sortValue === "score_desc") {
    return { matchingScore: -1, rankingPosition: 1, createdAt: -1 };
  }
  if (sortValue === "score_asc") {
    return { matchingScore: 1, rankingPosition: 1, createdAt: -1 };
  }
  if (sortValue === "newest") {
    return { createdAt: -1 };
  }
  if (sortValue === "oldest") {
    return { createdAt: 1 };
  }

  return { rankingPosition: 1, matchingScore: -1, createdAt: -1 };
};

const sortResultsInMemory = (items, sort) => {
  if (sort === "experience_desc") {
    return [...items].sort((a, b) => {
      return (
        (b?.candidateId?.totalYearsExperience || 0) -
        (a?.candidateId?.totalYearsExperience || 0)
      );
    });
  }

  if (sort === "experience_asc") {
    return [...items].sort((a, b) => {
      return (
        (a?.candidateId?.totalYearsExperience || 0) -
        (b?.candidateId?.totalYearsExperience || 0)
      );
    });
  }

  return items;
};

const executeResultQuery = async ({ filter, query = {} }) => {
  const { page, limit, skip } = parsePagination(query);
  const sort = query.sort || "ranking_asc";

  if (sort === "experience_desc" || sort === "experience_asc") {
    const items = await populateResultQuery(ScreeningResult.find(filter));
    const sortedItems = sortResultsInMemory(items, sort);
    const paginatedItems = sortedItems.slice(skip, skip + limit);

    return {
      items: paginatedItems,
      pagination: buildPaginationResult({
        items: paginatedItems,
        page,
        limit,
        total: sortedItems.length,
      }).pagination,
    };
  }

  const [items, total] = await Promise.all([
    populateResultQuery(ScreeningResult.find(filter))
      .sort(resolveSort(sort))
      .skip(skip)
      .limit(limit),
    ScreeningResult.countDocuments(filter),
  ]);

  return buildPaginationResult({ items, page, limit, total });
};

const buildResultPayload = async ({ result, screeningRun, userId }) => {
  if (!result?.candidateId) {
    throw buildServiceError(
      "candidateId is required for each screening result",
      400,
      "VALIDATION_ERROR"
    );
  }

  const candidate = await findCandidateOrThrow(result.candidateId);
  const runCandidateIds = new Set(
    (screeningRun.input?.candidateIds || []).map((item) => String(item))
  );
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

    const runResumeIds = new Set(
      (screeningRun.input?.resumeFileIds || []).map((item) => String(item))
    );
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

  const recommendation =
    result.recommendation || getDefaultRecommendation(result.statusBadge);
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
      result.rankingPosition === undefined ||
      result.rankingPosition === null ||
      result.rankingPosition === ""
        ? null
        : Math.max(Number(result.rankingPosition) || 1, 1),
    scoreBreakdown: {
      requiredSkills: normalizeScore(
        result.scoreBreakdown?.requiredSkills ?? 0,
        "requiredSkills"
      ),
      optionalSkills: normalizeScore(
        result.scoreBreakdown?.optionalSkills ?? 0,
        "optionalSkills"
      ),
      experience: normalizeScore(result.scoreBreakdown?.experience ?? 0, "experience"),
      education: normalizeScore(result.scoreBreakdown?.education ?? 0, "education"),
      keywordContext: normalizeScore(
        result.scoreBreakdown?.keywordContext ?? 0,
        "keywordContext"
      ),
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
      overrideNote: result.hrReview?.overrideNote
        ? String(result.hrReview.overrideNote).trim()
        : null,
    },
    isLatestForJobCandidate: true,
    flags: {
      needsReview: Boolean(result.flags?.needsReview),
      possibleHallucination: Boolean(result.flags?.possibleHallucination),
    },
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
    throw buildServiceError(
      "results must be a non-empty array",
      400,
      "VALIDATION_ERROR"
    );
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

  const processedCount = await ScreeningResult.countDocuments({
    screeningRunId: screeningRun._id,
  });
  screeningRun.totals.processed = processedCount;
  if (screeningRun.status === "queued" && processedCount > 0) {
    screeningRun.status = "running";
    screeningRun.startedAt = screeningRun.startedAt || now;
  }
  await screeningRun.save();

  const items = await populateResultQuery(
    ScreeningResult.find({ screeningRunId: screeningRun._id })
  ).sort({
    rankingPosition: 1,
    matchingScore: -1,
    createdAt: -1,
  });

  return items;
};

export const getJobScreeningResultsService = async (jobId, query = {}) => {
  await findJobOrThrow(jobId);
  const filter = await buildBaseFilter({ jobId }, query);
  return executeResultQuery({ filter, query });
};

export const getScreeningRunResultsService = async (screeningRunId, query = {}) => {
  await findScreeningRunOrThrow(screeningRunId);
  const filter = await buildBaseFilter({ screeningRunId }, query);
  return executeResultQuery({ filter, query });
};
