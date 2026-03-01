import fs from "fs";
import path from "path";

import cloudinary from "../config/cloudinary.js";
import Candidate from "../models/candidate.model.js";
import ResumeFile from "../models/resume-file.model.js";
import {
  buildServiceError,
  countResumeFileLinkedRecords,
  ensureObjectId,
  findCandidateOrThrow,
  findJobOrThrow,
  findResumeFileOrThrow,
  syncCandidateLatestResumeFile,
} from "../utils/reference-validation.js";

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
    throw buildServiceError(
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

export const uploadResumeFilesService = async ({ upload, userId }) => {
  if (!userId) {
    throw buildServiceError("Unauthorized", 401, "UNAUTHORIZED");
  }

  const { fields, files } = upload;
  const job = fields.jobId ? await findJobOrThrow(fields.jobId) : null;
  const fixedCandidate = fields.candidateId ? await findCandidateOrThrow(fields.candidateId) : null;

  const createdFiles = [];

  for (const file of files) {
    try {
      const candidateName = deriveCandidateNameFromFile(file.originalFileName);
      const candidate =
        fixedCandidate ||
        (await Candidate.create({
          fullName: candidateName,
          normalizedFullName: candidateName.toLowerCase(),
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

      await Candidate.updateOne(
        { _id: candidate._id },
        {
          $set: {
            latestResumeFileId: resumeFile._id,
            ...(job?._id ? { "source.jobId": job._id } : {}),
          },
        }
      );

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
    await findJobOrThrow(query.jobId);
    filter.jobId = query.jobId;
  }

  if (query.candidateId) {
    await findCandidateOrThrow(query.candidateId);
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
    throw buildServiceError("Resume file not found", 404, "RESUME_FILE_NOT_FOUND");
  }

  return resumeFile;
};

export const deleteResumeFileService = async (resumeFileId) => {
  const resumeFile = await findResumeFileOrThrow(resumeFileId);
  const linkedRecords = await countResumeFileLinkedRecords(resumeFile._id);

  if (linkedRecords.screeningResultsCount > 0 || linkedRecords.screeningRunsCount > 0) {
    throw buildServiceError(
      "Cannot delete resume file while linked screening records still exist",
      409,
      "RESUME_FILE_RELATIONSHIP_CONFLICT"
    );
  }

  if (resumeFile.storage?.provider === "cloudinary" && resumeFile.storage?.pathOrKey) {
    ensureCloudinaryConfig();
    try {
      await cloudinary.uploader.destroy(resumeFile.storage.pathOrKey, {
        resource_type: "raw",
        invalidate: true,
      });
    } catch (cloudinaryError) {
      throw buildServiceError(cloudinaryError.message, 500, "CLOUDINARY_DELETE_FAILED");
    }
  }

  resumeFile.isDeleted = true;
  resumeFile.deletedAt = new Date();
  resumeFile.uploadStatus = "failed";
  await resumeFile.save();
  await syncCandidateLatestResumeFile(resumeFile.candidateId);

  return { id: resumeFileId };
};
