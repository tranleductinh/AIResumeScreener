import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll } from "vitest";

import createApp from "../../src/app.js";
import Candidate from "../../src/models/candidate.model.js";
import Job from "../../src/models/job.model.js";
import ResumeFile from "../../src/models/resume-file.model.js";
import ScreeningResult from "../../src/models/screening-result.model.js";
import ScreeningRun from "../../src/models/screening-run.model.js";
import User from "../../src/models/user.model.js";
import { generateToken } from "../../src/utils/generateToken.js";

process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "test-access-secret";
process.env.JWT_ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || "1d";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "test-refresh-secret";
process.env.JWT_REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || "7d";

let mongoServer;

export const app = createApp();

export const setupTestDatabase = () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {
      dbName: "ai-resume-screener-test",
    });
  });

  afterEach(async () => {
    const collections = mongoose.connection.collections;
    await Promise.all(
      Object.values(collections).map((collection) => collection.deleteMany({}))
    );
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });
};

export const createAuthSession = async () => {
  const user = await User.create({
    fullName: "Test Recruiter",
    email: "test.recruiter@demo.local",
    authType: "google",
    role: "recruiter",
    joinedAt: new Date(),
    emailVerifiedAt: new Date(),
  });

  const { accessToken, refreshToken } = generateToken(user._id);
  await User.findByIdAndUpdate(user._id, {
    refreshToken,
  });

  return {
    user,
    accessToken,
    refreshToken,
  };
};

export const createDemoScreeningGraph = async ({ recruiterId }) => {
  const job = await Job.create({
    createdBy: recruiterId,
    title: "Frontend Engineer",
    department: "Engineering",
    seniorityLevel: "mid",
    status: "open",
    jdText: "Build React and TypeScript UI features for a recruiting product.",
    screeningConfig: {
      autoRejectBelowScore: 40,
      shortlistAboveScore: 80,
      requiredSkillWeight: 0.45,
      experienceWeight: 0.25,
      educationWeight: 0.1,
      keywordWeight: 0.2,
      mustHaveSkills: ["React", "TypeScript"],
      allowAiAutoRecommendation: true,
    },
  });

  const candidate = await Candidate.create({
    fullName: "Screening Candidate",
    normalizedFullName: "screening candidate",
    email: "screening.candidate@demo.local",
    totalYearsExperience: 4,
    currentTitle: "Frontend Developer",
    summary: "React and TypeScript developer with dashboard experience.",
    profileStatus: "enriched",
    skills: {
      hard: [
        { name: "React", level: 4, years: 4, verified: false },
        { name: "TypeScript", level: 4, years: 3, verified: false },
      ],
      soft: ["Communication"],
    },
    source: {
      type: "manual",
      jobId: job._id,
    },
  });

  const resumeFile = await ResumeFile.create({
    candidateId: candidate._id,
    jobId: job._id,
    originalFileName: "screening-candidate.pdf",
    mimeType: "application/pdf",
    sizeBytes: 123456,
    pageCount: 2,
    storage: {
      provider: "local",
      pathOrKey: "tests/fixtures/screening-candidate.pdf",
      bucket: null,
      url: null,
    },
    uploadStatus: "uploaded",
    extractedText:
      "Screening Candidate React TypeScript dashboard product testing communication",
    extractedTextPreview: "Screening Candidate React TypeScript dashboard product testing",
    parseStatus: "parsed",
    parseAttempts: 1,
    parsedAt: new Date(),
    uploadedBy: recruiterId,
  });

  await Candidate.updateOne(
    { _id: candidate._id },
    {
      $set: {
        latestResumeFileId: resumeFile._id,
        "source.jobId": job._id,
      },
    }
  );

  return {
    job,
    candidate,
    resumeFile,
  };
};

export const waitForScreeningCompletion = async (runId, timeoutMs = 3000) => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const run = await ScreeningRun.findById(runId);
    if (run && ["completed", "failed"].includes(run.status)) {
      const results = await ScreeningResult.find({ screeningRunId: runId });
      return { run, results };
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  throw new Error("Screening run did not complete in time");
};
