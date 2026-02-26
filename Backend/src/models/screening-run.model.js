import mongoose from "mongoose";

const screeningRunSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    runType: {
      type: String,
      enum: ["initial", "rerun"],
      default: "initial",
    },
    rerunOfRunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ScreeningRun",
      default: null,
    },
    triggeredBy: {
      type: String,
      enum: ["manual", "system"],
      default: "manual",
    },
    status: {
      type: String,
      enum: ["queued", "running", "completed", "failed"],
      default: "queued",
    },
    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },
    input: {
      resumeFileIds: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ResumeFile",
        },
      ],
      candidateIds: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Candidate",
        },
      ],
    },
    filters: {
      minYearsExperience: { type: Number, default: null },
      mustIncludeSkills: { type: [String], default: [] },
      includeStatuses: { type: [String], default: [] },
    },
    aiProvider: {
      type: String,
      enum: ["gemini", "openai", "other"],
      default: "openai",
    },
    modelName: { type: String, default: null },
    promptVersion: { type: String, default: null },
    configSnapshot: {
      jdVersion: { type: String, default: null },
      autoRejectBelowScore: { type: Number, default: 0 },
      shortlistAboveScore: { type: Number, default: 85 },
      requiredSkillWeight: { type: Number, default: 0.45 },
      experienceWeight: { type: Number, default: 0.25 },
      educationWeight: { type: Number, default: 0.15 },
      keywordWeight: { type: Number, default: 0.15 },
    },
    totals: {
      total: { type: Number, default: 0 },
      processed: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
    },
    queueMeta: {
      batchSize: { type: Number, default: 20 },
      currentBatch: { type: Number, default: 0 },
      totalBatches: { type: Number, default: 0 },
    },
    errorSummary: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

screeningRunSchema.index({ jobId: 1, createdAt: -1 });
screeningRunSchema.index({ status: 1 });
screeningRunSchema.index({ jobId: 1, runType: 1, createdAt: -1 });

const ScreeningRun = mongoose.model("ScreeningRun", screeningRunSchema);

export default ScreeningRun;
