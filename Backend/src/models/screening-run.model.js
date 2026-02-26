import mongoose from "mongoose";

const screeningRunSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
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
    aiProvider: {
      type: String,
      enum: ["gemini", "openai", "other"],
      default: "openai",
    },
    modelName: { type: String, default: null },
    promptVersion: { type: String, default: null },
    totals: {
      total: { type: Number, default: 0 },
      processed: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

screeningRunSchema.index({ jobId: 1, createdAt: -1 });
screeningRunSchema.index({ organizationId: 1, status: 1 });

const ScreeningRun = mongoose.model("ScreeningRun", screeningRunSchema);

export default ScreeningRun;
