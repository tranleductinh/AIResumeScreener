import mongoose from "mongoose";

const screeningResultSchema = new mongoose.Schema(
  {
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
    rankingPosition: {
      type: Number,
      default: null,
      min: 1,
    },
    scoreBreakdown: {
      requiredSkills: { type: Number, min: 0, max: 100, default: 0 },
      optionalSkills: { type: Number, min: 0, max: 100, default: 0 },
      experience: { type: Number, min: 0, max: 100, default: 0 },
      education: { type: Number, min: 0, max: 100, default: 0 },
      keywordContext: { type: Number, min: 0, max: 100, default: 0 },
    },
    fitScores: {
      technical: { type: Number, min: 0, max: 100, default: 0 },
      cultural: { type: Number, min: 0, max: 100, default: 0 },
    },
    statusBadge: {
      type: String,
      enum: ["strong_fit", "potential", "not_suitable"],
      required: true,
    },
    recommendation: {
      type: String,
      enum: ["must_interview", "interview", "hold", "reject"],
      default: "hold",
    },
    matchedSkills: { type: [String], default: [] },
    missingSkills: { type: [String], default: [] },
    optionalSkills: { type: [String], default: [] },
    strengths: { type: [String], default: [] },
    gaps: { type: [String], default: [] },
    redFlags: { type: [String], default: [] },
    aiSummary: { type: String, default: "" },
    explanation: { type: String, default: "" },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.7,
    },
    hrReview: {
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      reviewedAt: { type: Date, default: null },
      overrideStatusBadge: {
        type: String,
        enum: ["strong_fit", "potential", "not_suitable", null],
        default: null,
      },
      overrideNote: { type: String, default: null },
    },
    isLatestForJobCandidate: {
      type: Boolean,
      default: true,
      index: true,
    },
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
screeningResultSchema.index({ jobId: 1, statusBadge: 1 });
screeningResultSchema.index({ jobId: 1, isLatestForJobCandidate: 1 });
screeningResultSchema.index({ screeningRunId: 1, rankingPosition: 1 });

const ScreeningResult = mongoose.model("ScreeningResult", screeningResultSchema);

export default ScreeningResult;
