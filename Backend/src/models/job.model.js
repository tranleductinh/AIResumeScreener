import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    jobCode: {
      type: String,
      default: null,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      default: null,
      trim: true,
    },
    location: {
      city: { type: String, default: null },
      country: { type: String, default: null },
      remotePolicy: {
        type: String,
        enum: ["onsite", "hybrid", "remote"],
        default: "onsite",
      },
    },
    employmentType: {
      type: String,
      enum: ["full-time", "part-time", "contract"],
      default: "full-time",
    },
    seniorityLevel: {
      type: String,
      enum: ["intern", "junior", "mid", "senior", "lead"],
      default: "mid",
    },
    jdText: {
      type: String,
      required: true,
      trim: true,
    },
    jdParsed: {
      roleSummary: { type: String, default: "" },
      requiredSkills: { type: [String], default: [] },
      niceToHaveSkills: { type: [String], default: [] },
      minYearsExperience: { type: Number, default: null },
      maxYearsExperience: { type: Number, default: null },
      keywords: { type: [String], default: [] },
      responsibilities: { type: [String], default: [] },
      educationLevel: { type: String, default: null },
    },
    screeningConfig: {
      autoRejectBelowScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      shortlistAboveScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 85,
      },
      requiredSkillWeight: { type: Number, default: 0.45 },
      experienceWeight: { type: Number, default: 0.25 },
      educationWeight: { type: Number, default: 0.15 },
      keywordWeight: { type: Number, default: 0.15 },
      mustHaveSkills: { type: [String], default: [] },
      allowAiAutoRecommendation: {
        type: Boolean,
        default: true,
      },
    },
    stats: {
      totalApplicants: { type: Number, default: 0 },
      screenedCount: { type: Number, default: 0 },
      shortlistedCount: { type: Number, default: 0 },
      rejectedCount: { type: Number, default: 0 },
      interviewCount: { type: Number, default: 0 },
      hiredCount: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ["open", "closed", "draft", "on_hold"],
      default: "draft",
    },
    openedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
    archivedAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

jobSchema.index({ status: 1 });
jobSchema.index({ department: 1, status: 1 });
jobSchema.index({ title: 1, createdAt: -1 });
jobSchema.index({ jobCode: 1 }, { unique: true, sparse: true });
jobSchema.index({ title: "text", jdText: "text" });

const Job = mongoose.model("Job", jobSchema);

export default Job;
