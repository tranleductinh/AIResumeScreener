import mongoose from "mongoose";

import Job from "../models/job.model.js";

const buildError = (message, status = 400, errorCode = "BAD_REQUEST") => {
  const error = new Error(message);
  error.status = status;
  error.errorCode = errorCode;
  return error;
};

const ensureObjectId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw buildError("Invalid job id", 400, "INVALID_JOB_ID");
  }
};

export const createJobService = async (payload, userId) => {
  const { title, jdText, department, seniorityLevel, status } = payload;

  if (!title || !jdText) {
    throw buildError("title and jdText are required", 400, "VALIDATION_ERROR");
  }

  if (!userId) {
    throw buildError("Unauthorized", 401, "UNAUTHORIZED");
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
  ensureObjectId(jobId);
  const job = await Job.findOne({ _id: jobId, isDeleted: false });

  if (!job) {
    throw buildError("Job not found", 404, "JOB_NOT_FOUND");
  }

  return job;
};

export const updateJobService = async (jobId, payload) => {
  ensureObjectId(jobId);

  const job = await Job.findOne({ _id: jobId, isDeleted: false });
  if (!job) {
    throw buildError("Job not found", 404, "JOB_NOT_FOUND");
  }

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
  ensureObjectId(jobId);

  const job = await Job.findOne({ _id: jobId, isDeleted: false });
  if (!job) {
    throw buildError("Job not found", 404, "JOB_NOT_FOUND");
  }

  job.isDeleted = true;
  job.deletedAt = new Date();
  await job.save();

  return { id: jobId };
};
