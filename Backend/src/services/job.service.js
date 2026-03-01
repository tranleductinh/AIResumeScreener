import Job from "../models/job.model.js";
import {
  buildServiceError,
  countJobLinkedRecords,
  ensureObjectId,
  findJobOrThrow,
} from "../utils/reference-validation.js";

export const createJobService = async (payload, userId) => {
  const { title, jdText, department, seniorityLevel, status } = payload;

  if (!title || !jdText) {
    throw buildServiceError("title and jdText are required", 400, "VALIDATION_ERROR");
  }

  if (!userId) {
    throw buildServiceError("Unauthorized", 401, "UNAUTHORIZED");
  }

  const job = await Job.create({
    createdBy: userId,
    title: title.trim(),
    jdText: jdText.trim(),
    department: department?.trim() || null,
    seniorityLevel: seniorityLevel || "mid",
    status: status || "draft",
    openedAt: status === "open" ? new Date() : null,
  });

  return job;
};

export const getJobsService = async (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const filter = { isDeleted: false };

  if (query.status) {
    filter.status = query.status;
  }

  if (query.department) {
    filter.department = query.department;
  }

  if (query.search) {
    filter.$or = [
      { title: { $regex: query.search, $options: "i" } },
      { jdText: { $regex: query.search, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    Job.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Job.countDocuments(filter),
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

export const getJobByIdService = async (jobId) => {
  ensureObjectId(jobId, "INVALID_JOB_ID", "Invalid job id");
  return findJobOrThrow(jobId);
};

export const updateJobService = async (jobId, payload) => {
  ensureObjectId(jobId, "INVALID_JOB_ID", "Invalid job id");

  const job = await findJobOrThrow(jobId);
  const previousStatus = job.status;
  const allowedFields = ["title", "jdText", "department", "seniorityLevel", "status"];
  for (const key of allowedFields) {
    if (payload[key] !== undefined) {
      job[key] = payload[key];
    }
  }

  if (payload.status && payload.status !== previousStatus) {
    if (payload.status === "open" && !job.openedAt) {
      job.openedAt = new Date();
    }
    if (payload.status === "closed") {
      job.closedAt = new Date();
    }
    if (payload.status !== "closed") {
      job.closedAt = null;
    }
  }
  await job.save();
  return job;
};

export const deleteJobService = async (jobId) => {
  ensureObjectId(jobId, "INVALID_JOB_ID", "Invalid job id");

  const job = await findJobOrThrow(jobId);
  const linkedRecords = await countJobLinkedRecords(job._id);

  if (
    linkedRecords.resumeFilesCount > 0 ||
    linkedRecords.screeningResultsCount > 0 ||
    linkedRecords.screeningRunsCount > 0
  ) {
    throw buildServiceError(
      "Cannot delete job while linked resume files or screening records still exist",
      409,
      "JOB_RELATIONSHIP_CONFLICT"
    );
  }

  job.isDeleted = true;
  job.deletedAt = new Date();
  await job.save();

  return { id: jobId };
};
