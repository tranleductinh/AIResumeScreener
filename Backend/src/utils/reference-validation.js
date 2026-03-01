import mongoose from "mongoose";

import Candidate from "../models/candidate.model.js";
import Job from "../models/job.model.js";
import ResumeFile from "../models/resume-file.model.js";
import ScreeningResult from "../models/screening-result.model.js";
import ScreeningRun from "../models/screening-run.model.js";

export const buildServiceError = (message, status = 400, errorCode = "BAD_REQUEST") => {
  const error = new Error(message);
  error.status = status;
  error.errorCode = errorCode;
  return error;
};

export const ensureObjectId = (id, errorCode, message) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw buildServiceError(message, 400, errorCode);
  }
};

export const findCandidateOrThrow = async (candidateId) => {
  ensureObjectId(candidateId, "INVALID_CANDIDATE_ID", "Invalid candidate id");

  const candidate = await Candidate.findOne({ _id: candidateId, isDeleted: false });
  if (!candidate) {
    throw buildServiceError("Candidate not found", 404, "CANDIDATE_NOT_FOUND");
  }

  return candidate;
};

export const findJobOrThrow = async (jobId) => {
  ensureObjectId(jobId, "INVALID_JOB_ID", "Invalid job id");

  const job = await Job.findOne({ _id: jobId, isDeleted: false });
  if (!job) {
    throw buildServiceError("Job not found", 404, "JOB_NOT_FOUND");
  }

  return job;
};

export const findResumeFileOrThrow = async (resumeFileId) => {
  ensureObjectId(resumeFileId, "INVALID_RESUME_FILE_ID", "Invalid resume file id");

  const resumeFile = await ResumeFile.findOne({ _id: resumeFileId, isDeleted: false });
  if (!resumeFile) {
    throw buildServiceError("Resume file not found", 404, "RESUME_FILE_NOT_FOUND");
  }

  return resumeFile;
};

export const syncCandidateLatestResumeFile = async (candidateId) => {
  const latestResume = await ResumeFile.findOne({
    candidateId,
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .select("_id jobId");

  await Candidate.updateOne(
    { _id: candidateId },
    {
      $set: {
        latestResumeFileId: latestResume?._id || null,
        "source.jobId": latestResume?.jobId || null,
      },
    }
  );
};

export const getCandidateJobScreeningRelation = async ({ candidateId, jobId }) => {
  ensureObjectId(candidateId, "INVALID_CANDIDATE_ID", "Invalid candidate id");
  ensureObjectId(jobId, "INVALID_JOB_ID", "Invalid job id");

  return ScreeningResult.findOne({ candidateId, jobId }).sort({ createdAt: -1 });
};

export const countCandidateLinkedRecords = async (candidateId) => {
  const [resumeFilesCount, screeningResultsCount, screeningRunsCount] = await Promise.all([
    ResumeFile.countDocuments({ candidateId, isDeleted: false }),
    ScreeningResult.countDocuments({ candidateId }),
    ScreeningRun.countDocuments({ "input.candidateIds": candidateId }),
  ]);

  return {
    resumeFilesCount,
    screeningResultsCount,
    screeningRunsCount,
  };
};

export const countJobLinkedRecords = async (jobId) => {
  const [resumeFilesCount, screeningResultsCount, screeningRunsCount] = await Promise.all([
    ResumeFile.countDocuments({ jobId, isDeleted: false }),
    ScreeningResult.countDocuments({ jobId }),
    ScreeningRun.countDocuments({ jobId }),
  ]);

  return {
    resumeFilesCount,
    screeningResultsCount,
    screeningRunsCount,
  };
};

export const countResumeFileLinkedRecords = async (resumeFileId) => {
  const [screeningResultsCount, screeningRunsCount] = await Promise.all([
    ScreeningResult.countDocuments({ resumeFileId }),
    ScreeningRun.countDocuments({ "input.resumeFileIds": resumeFileId }),
  ]);

  return {
    screeningResultsCount,
    screeningRunsCount,
  };
};
