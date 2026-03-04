import Candidate from "../models/candidate.model.js";
import CandidateAction from "../models/candidate-action.model.js";
import ScreeningResult from "../models/screening-result.model.js";
import { logAuditEventService } from "./audit-log.service.js";
import { buildPaginationResult, parsePagination } from "../utils/pagination.js";
import {
  buildServiceError,
  ensureCandidateLinkedToJob,
  ensureObjectId,
  findCandidateOrThrow,
  findJobOrThrow,
} from "../utils/reference-validation.js";

const allowedActionTypes = [
  "shortlisted",
  "rejected",
  "notes",
  "tags",
  "move_stage",
  "schedule_interview",
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

const ensureScreeningResultRelation = async ({
  sourceScreeningResultId,
  jobId,
  candidateId,
}) => {
  if (!sourceScreeningResultId) return null;

  ensureObjectId(
    sourceScreeningResultId,
    "INVALID_SCREENING_RESULT_ID",
    "Invalid screening result id"
  );

  const screeningResult = await ScreeningResult.findById(sourceScreeningResultId);
  if (!screeningResult) {
    throw buildServiceError(
      "Screening result not found",
      404,
      "SCREENING_RESULT_NOT_FOUND"
    );
  }

  if (
    String(screeningResult.jobId) !== String(jobId) ||
    String(screeningResult.candidateId) !== String(candidateId)
  ) {
    throw buildServiceError(
      "sourceScreeningResultId must belong to the same job and candidate",
      409,
      "CANDIDATE_ACTION_RESULT_MISMATCH"
    );
  }

  return screeningResult;
};

const applyCandidateSideEffects = async ({
  candidate,
  actionType,
  tags,
  sourceScreeningResult,
  actedBy,
  note,
}) => {
  if (actionType === "tags" && tags.length) {
    const nextTags = Array.from(new Set([...(candidate.tags || []), ...tags]));
    candidate.tags = nextTags;
    await candidate.save();
  }

  if (!sourceScreeningResult) {
    return;
  }

  if (actionType === "shortlisted") {
    sourceScreeningResult.recommendation = "must_interview";
    sourceScreeningResult.hrReview = {
      ...sourceScreeningResult.hrReview,
      reviewedBy: actedBy,
      reviewedAt: new Date(),
      overrideStatusBadge:
        sourceScreeningResult.hrReview?.overrideStatusBadge || "strong_fit",
      overrideNote: note || sourceScreeningResult.hrReview?.overrideNote || null,
    };
    await sourceScreeningResult.save();
  }

  if (actionType === "rejected") {
    sourceScreeningResult.recommendation = "reject";
    sourceScreeningResult.hrReview = {
      ...sourceScreeningResult.hrReview,
      reviewedBy: actedBy,
      reviewedAt: new Date(),
      overrideStatusBadge:
        sourceScreeningResult.hrReview?.overrideStatusBadge || "not_suitable",
      overrideNote: note || sourceScreeningResult.hrReview?.overrideNote || null,
    };
    await sourceScreeningResult.save();
  }
};

export const createCandidateActionService = async (payload, userId, auditContext = {}) => {
  if (!userId) {
    throw buildServiceError("Unauthorized", 401, "UNAUTHORIZED");
  }

  const { jobId, candidateId, actionType } = payload;
  if (!jobId || !candidateId || !actionType) {
    throw buildServiceError(
      "jobId, candidateId, and actionType are required",
      400,
      "VALIDATION_ERROR"
    );
  }

  if (!allowedActionTypes.includes(actionType)) {
    throw buildServiceError("actionType is invalid", 400, "VALIDATION_ERROR");
  }

  await findJobOrThrow(jobId);
  const candidate = await findCandidateOrThrow(candidateId);
  await ensureCandidateLinkedToJob({ candidateId, jobId });

  const note = payload.note ? String(payload.note).trim() : null;
  const tags = normalizeStringArray(payload.tags);
  const metadata = payload.metadata && typeof payload.metadata === "object" ? payload.metadata : {};
  const stage = payload.stage ? String(payload.stage).trim() : null;

  if (actionType === "notes" && !note) {
    throw buildServiceError("note is required for notes action", 400, "VALIDATION_ERROR");
  }

  if (actionType === "tags" && !tags.length) {
    throw buildServiceError("tags are required for tags action", 400, "VALIDATION_ERROR");
  }

  if (actionType === "move_stage" && !stage) {
    throw buildServiceError("stage is required for move_stage action", 400, "VALIDATION_ERROR");
  }

  if (
    actionType === "schedule_interview" &&
    !metadata.scheduledAt &&
    !metadata.interviewDate &&
    !note
  ) {
    throw buildServiceError(
      "schedule_interview requires scheduledAt, interviewDate, or note",
      400,
      "VALIDATION_ERROR"
    );
  }

  const sourceScreeningResult = await ensureScreeningResultRelation({
    sourceScreeningResultId: payload.sourceScreeningResultId,
    jobId,
    candidateId,
  });

  const action = await CandidateAction.create({
    jobId,
    candidateId,
    actedBy: userId,
    actionType,
    stage: stage || null,
    note,
    tags,
    isAiSuggestion: Boolean(payload.isAiSuggestion),
    sourceScreeningResultId: sourceScreeningResult?._id || null,
    metadata,
  });

  await applyCandidateSideEffects({
    candidate,
    actionType,
    tags,
    sourceScreeningResult,
    actedBy: userId,
    note,
  });

  if (actionType === "shortlisted" || actionType === "rejected") {
    await logAuditEventService({
      actorId: userId,
      actorEmail: auditContext.actorEmail || null,
      entityType: "CandidateAction",
      entityId: action._id,
      action: actionType,
      module: "candidate_workflow",
      severity: "info",
      metadata: {
        jobId,
        candidateId,
        sourceScreeningResultId: sourceScreeningResult?._id || null,
        note,
      },
      ipAddress: auditContext.ipAddress || null,
      userAgent: auditContext.userAgent || null,
    });
  }

  return CandidateAction.findById(action._id)
    .populate("candidateId", "fullName email currentTitle")
    .populate("jobId", "title")
    .populate("actedBy", "fullName email")
    .populate("sourceScreeningResultId", "matchingScore statusBadge rankingPosition");
};

export const getJobCandidateActionsService = async (jobId, query = {}) => {
  await findJobOrThrow(jobId);

  const { page, limit, skip } = parsePagination(query);

  const filter = { jobId };

  if (query.candidateId) {
    await findCandidateOrThrow(query.candidateId);
    await ensureCandidateLinkedToJob({ candidateId: query.candidateId, jobId });
    filter.candidateId = query.candidateId;
  }

  if (query.actionType) {
    if (!allowedActionTypes.includes(query.actionType)) {
      throw buildServiceError("actionType is invalid", 400, "VALIDATION_ERROR");
    }
    filter.actionType = query.actionType;
  }

  const [items, total] = await Promise.all([
    CandidateAction.find(filter)
      .populate("candidateId", "fullName email currentTitle")
      .populate("jobId", "title")
      .populate("actedBy", "fullName email")
      .populate("sourceScreeningResultId", "matchingScore statusBadge rankingPosition")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    CandidateAction.countDocuments(filter),
  ]);

  return buildPaginationResult({ items, page, limit, total });
};
