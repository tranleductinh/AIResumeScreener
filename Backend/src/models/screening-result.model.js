import mongoose from "mongoose";

const screeningResultSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    screeningRunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ScreeningRun",
      required: true,
      index: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
      index: true,
    },
    resumeFileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ResumeFile",
      default: null,
    },
    matchingScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
      index: true,
    },
    statusBadge: {
      type: String,
      enum: ["strong_fit", "potential", "not_suitable"],
      required: true,
    },
    matchedSkills: { type: [String], default: [] },
    missingSkills: { type: [String], default: [] },
    optionalSkills: { type: [String], default: [] },
    strengths: { type: [String], default: [] },
    gaps: { type: [String], default: [] },
    aiSummary: { type: String, default: "" },
    explanation: { type: String, default: "" },
    flags: {
      needsReview: { type: Boolean, default: false },
      possibleHallucination: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

screeningResultSchema.index(
  { jobId: 1, candidateId: 1, screeningRunId: 1 },
  { unique: true }
);
screeningResultSchema.index({ jobId: 1, matchingScore: -1 });
screeningResultSchema.index({ organizationId: 1, jobId: 1, statusBadge: 1 });

const ScreeningResult = mongoose.model("ScreeningResult", screeningResultSchema);

export default ScreeningResult;
