import fs from "fs";
import mongoose from "mongoose";
import path from "path";

import cloudinary from "../config/cloudinary.js";
import Candidate from "../models/candidate.model.js";
import Job from "../models/job.model.js";
import ResumeFile from "../models/resume-file.model.js";

const buildError = (message, status = 400, errorCode = "BAD_REQUEST") => {
  const error = new Error(message);
  error.status = status;
  error.errorCode = errorCode;
  return error;
};

const ensureObjectId = (id, errorCode, message) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw buildError(message, 400, errorCode);
  }
};

const deriveCandidateNameFromFile = (fileName) => {
  return path
    .parse(fileName)
    .name.replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "Unknown Candidate";
};

const ensureCloudinaryConfig = () => {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw buildError(
      "Cloudinary configuration is missing. Check CLOUDINARY_* env values.",
      500,
      "CLOUDINARY_CONFIG_MISSING"
    );
  }
};

const uploadFileToCloudinary = async (file) => {
  ensureCloudinaryConfig();

  const folder = process.env.CLOUDINARY_RESUME_FOLDER || "ai-resume-screener/resumes";
  const uploaded = await cloudinary.uploader.upload(file.tempFilePath, {
    resource_type: "raw",
    folder,
    use_filename: true,
    unique_filename: true,
    overwrite: false,
  });

  return uploaded;
};

const ensureJob = async (jobId) => {
  if (!jobId) return null;
  ensureObjectId(jobId, "INVALID_JOB_ID", "Invalid job id");
  const job = await Job.findOne({ _id: jobId, isDeleted: false });
  if (!job) {
    throw buildError("Job not found", 404, "JOB_NOT_FOUND");
  }
  return job;
};

const ensureCandidate = async (candidateId) => {
  if (!candidateId) return null;
  ensureObjectId(candidateId, "INVALID_CANDIDATE_ID", "Invalid candidate id");
  const candidate = await Candidate.findOne({ _id: candidateId, isDeleted: false });
  if (!candidate) {
    throw buildError("Candidate not found", 404, "CANDIDATE_NOT_FOUND");
  }
  return candidate;
};

export const uploadResumeFilesService = async ({ upload, userId }) => {
  if (!userId) {
    throw buildError("Unauthorized", 401, "UNAUTHORIZED");
  }

  const { fields, files } = upload;
  const job = await ensureJob(fields.jobId || null);
  const fixedCandidate = await ensureCandidate(fields.candidateId || null);

  const createdFiles = [];

  for (const file of files) {
    try {
      const candidate =
        fixedCandidate ||
        (await Candidate.create({
          fullName: deriveCandidateNameFromFile(file.originalFileName),
          normalizedFullName: deriveCandidateNameFromFile(file.originalFileName).toLowerCase(),
          profileStatus: "pending_parse",
          source: {
            type: "resume_upload",
            jobId: job?._id || null,
          },
        }));

      const uploadedAsset = await uploadFileToCloudinary(file);

      const resumeFile = await ResumeFile.create({
        candidateId: candidate._id,
        jobId: job?._id || null,
        originalFileName: file.originalFileName,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        storage: {
          provider: "cloudinary",
          pathOrKey: uploadedAsset.public_id,
          url: uploadedAsset.secure_url,
          bucket: process.env.CLOUDINARY_CLOUD_NAME,
        },
        uploadStatus: "uploaded",
        parseStatus: "pending",
        uploadedBy: userId,
      });

      createdFiles.push(resumeFile);
    } finally {
      if (file.tempFilePath) {
        await fs.promises.rm(file.tempFilePath, { force: true }).catch(() => {});
      }
    }
  }

  return createdFiles;
};

export const getResumeFilesService = async (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const filter = { isDeleted: false };

  if (query.jobId) {
    ensureObjectId(query.jobId, "INVALID_JOB_ID", "Invalid job id");
    filter.jobId = query.jobId;
  }

  if (query.candidateId) {
    ensureObjectId(query.candidateId, "INVALID_CANDIDATE_ID", "Invalid candidate id");
    filter.candidateId = query.candidateId;
  }

  if (query.uploadStatus) {
    filter.uploadStatus = query.uploadStatus;
  }

  const [items, total] = await Promise.all([
    ResumeFile.find(filter)
      .populate("candidateId", "fullName email")
      .populate("jobId", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ResumeFile.countDocuments(filter),
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

export const getResumeFileByIdService = async (resumeFileId) => {
  ensureObjectId(resumeFileId, "INVALID_RESUME_FILE_ID", "Invalid resume file id");

  const resumeFile = await ResumeFile.findOne({ _id: resumeFileId, isDeleted: false })
    .populate("candidateId", "fullName email")
    .populate("jobId", "title");

  if (!resumeFile) {
    throw buildError("Resume file not found", 404, "RESUME_FILE_NOT_FOUND");
  }

  return resumeFile;
};

export const deleteResumeFileService = async (resumeFileId) => {
  ensureObjectId(resumeFileId, "INVALID_RESUME_FILE_ID", "Invalid resume file id");

  const resumeFile = await ResumeFile.findOne({ _id: resumeFileId, isDeleted: false });
  if (!resumeFile) {
    throw buildError("Resume file not found", 404, "RESUME_FILE_NOT_FOUND");
  }

  if (resumeFile.storage?.provider === "cloudinary" && resumeFile.storage?.pathOrKey) {
    ensureCloudinaryConfig();
    try {
      await cloudinary.uploader.destroy(resumeFile.storage.pathOrKey, {
        resource_type: "raw",
        invalidate: true,
      });
    } catch (cloudinaryError) {
      throw buildError(cloudinaryError.message, 500, "CLOUDINARY_DELETE_FAILED");
    }
  }

  resumeFile.isDeleted = true;
  resumeFile.deletedAt = new Date();
  resumeFile.uploadStatus = "failed";
  await resumeFile.save();

  return { id: resumeFileId };
};
