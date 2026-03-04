import fs from "fs";
import path from "path";

import cloudinary from "../config/cloudinary.js";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";
import Candidate from "../models/candidate.model.js";
import ResumeFile from "../models/resume-file.model.js";
import { logAuditEventsBulkService } from "./audit-log.service.js";
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

const normalizeExtractedText = (value) => {
  return String(value || "")
    .replace(/\r/g, " ")
    .replace(/\t/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const buildExtractedTextPreview = (text) => {
  const normalized = normalizeExtractedText(text);
  if (!normalized) return "";
  return normalized.slice(0, 280);
};

const fetchResumeFileBuffer = async (resumeFile) => {
  if (resumeFile.storage?.provider === "cloudinary") {
    const response = await fetch(resumeFile.storage.url);
    if (!response.ok) {
      throw buildServiceError(
        "Cannot download resume file from storage",
        502,
        "RESUME_DOWNLOAD_FAILED"
      );
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  if (resumeFile.storage?.provider === "local") {
    return fs.promises.readFile(resumeFile.storage.pathOrKey);
  }

  throw buildServiceError(
    `Unsupported storage provider for parsing: ${resumeFile.storage?.provider || "unknown"}`,
    400,
    "UNSUPPORTED_STORAGE_PROVIDER"
  );
};

const parseBufferByMimeType = async ({ mimeType, fileBuffer }) => {
  if (mimeType === "application/pdf") {
    const parsed = await pdfParse(fileBuffer);
    return {
      extractedText: normalizeExtractedText(parsed.text),
      pageCount: parsed.numpages || null,
    };
  }

  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const parsed = await mammoth.extractRawText({ buffer: fileBuffer });
    return {
      extractedText: normalizeExtractedText(parsed.value),
      pageCount: null,
    };
  }

  if (mimeType === "application/msword") {
    throw buildServiceError(
      "Legacy DOC parsing is not supported. Please upload DOCX or PDF.",
      400,
      "DOC_PARSING_NOT_SUPPORTED"
    );
  }

  throw buildServiceError("Unsupported mime type for parsing", 400, "UNSUPPORTED_MIME_TYPE");
};

export const uploadResumeFilesService = async ({ upload, userId, auditContext = {} }) => {
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

  await logAuditEventsBulkService(
    createdFiles.map((resumeFile) => ({
      actorId: userId,
      actorEmail: auditContext.actorEmail || null,
      entityType: "ResumeFile",
      entityId: resumeFile._id,
      action: "resume_uploaded",
      module: "resume_upload",
      severity: "info",
      metadata: {
        candidateId: resumeFile.candidateId,
        jobId: resumeFile.jobId,
        originalFileName: resumeFile.originalFileName,
        sizeBytes: resumeFile.sizeBytes,
        uploadStatus: resumeFile.uploadStatus,
      },
      ipAddress: auditContext.ipAddress || null,
      userAgent: auditContext.userAgent || null,
    }))
  );

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

export const parseResumeFileService = async (resumeFileId) => {
  const resumeFile = await findResumeFileOrThrow(resumeFileId);

  if (resumeFile.parseStatus === "parsing") {
    throw buildServiceError(
      "Resume file is already being parsed",
      409,
      "RESUME_ALREADY_PARSING"
    );
  }

  resumeFile.parseStatus = "parsing";
  resumeFile.parseAttempts = (resumeFile.parseAttempts || 0) + 1;
  resumeFile.parseError = null;
  await resumeFile.save();

  try {
    const fileBuffer = await fetchResumeFileBuffer(resumeFile);
    const parsedResult = await parseBufferByMimeType({
      mimeType: resumeFile.mimeType,
      fileBuffer,
    });

    resumeFile.extractedText = parsedResult.extractedText;
    resumeFile.extractedTextPreview = buildExtractedTextPreview(parsedResult.extractedText);
    resumeFile.pageCount = parsedResult.pageCount;
    resumeFile.parseStatus = "parsed";
    resumeFile.parsedAt = new Date();
    resumeFile.parseError = null;
    await resumeFile.save();

    await Candidate.updateOne(
      { _id: resumeFile.candidateId },
      {
        $set: {
          profileStatus: "parsed",
        },
      }
    );

    return ResumeFile.findById(resumeFile._id)
      .populate("candidateId", "fullName email")
      .populate("jobId", "title");
  } catch (error) {
    resumeFile.parseStatus = "failed";
    resumeFile.parseError = error.message;
    resumeFile.parsedAt = null;
    await resumeFile.save();

    await Candidate.updateOne(
      { _id: resumeFile.candidateId },
      {
        $set: {
          profileStatus: "failed_parse",
        },
      }
    );

    throw error;
  }
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
