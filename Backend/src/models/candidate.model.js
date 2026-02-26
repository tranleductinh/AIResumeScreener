import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedFullName: {
      type: String,
      default: null,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    location: {
      type: String,
      trim: true,
      default: null,
    },
    links: {
      linkedin: { type: String, default: null },
      github: { type: String, default: null },
      portfolio: { type: String, default: null },
    },
    summary: {
      type: String,
      default: "",
    },
    totalYearsExperience: {
      type: Number,
      min: 0,
      default: 0,
    },
    currentTitle: {
      type: String,
      trim: true,
      default: null,
    },
    currentCompany: {
      type: String,
      trim: true,
      default: null,
    },
    experiences: [
      {
        company: { type: String, trim: true },
        title: { type: String, trim: true },
        startDate: { type: Date, default: null },
        endDate: { type: Date, default: null },
        isCurrent: { type: Boolean, default: false },
        highlights: { type: [String], default: [] },
      },
    ],
    education: [
      {
        school: { type: String, trim: true },
        degree: { type: String, trim: true },
        major: { type: String, trim: true },
        startYear: { type: Number, default: null },
        endYear: { type: Number, default: null },
      },
    ],
    certifications: [
      {
        name: { type: String, trim: true },
        issuer: { type: String, trim: true },
        year: { type: Number, default: null },
      },
    ],
    skills: {
      hard: [
        {
          name: { type: String, trim: true },
          level: { type: Number, min: 0, max: 5, default: 0 },
          years: { type: Number, min: 0, default: 0 },
          verified: { type: Boolean, default: false },
        },
      ],
      soft: {
        type: [String],
        default: [],
      },
    },
    languageSkills: [
      {
        language: { type: String, trim: true },
        level: {
          type: String,
          enum: ["basic", "intermediate", "advanced", "native"],
          default: "intermediate",
        },
      },
    ],
    source: {
      type: {
        type: String,
        enum: ["resume_upload", "manual", "import"],
        default: "resume_upload",
      },
      sourceId: { type: String, default: null },
      jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job",
        default: null,
      },
    },
    profileStatus: {
      type: String,
      enum: ["pending_parse", "parsed", "needs_review", "enriched", "failed_parse"],
      default: "pending_parse",
    },
    profileCompleteness: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    availability: {
      type: String,
      enum: ["actively_looking", "open", "not_looking", "unknown"],
      default: "unknown",
    },
    expectedSalary: {
      min: { type: Number, default: null },
      max: { type: Number, default: null },
      currency: { type: String, default: "USD" },
    },
    isDuplicateCandidate: {
      type: Boolean,
      default: false,
    },
    mergedIntoCandidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      default: null,
    },
    tags: { type: [String], default: [] },
    lastScreenedAt: { type: Date, default: null },
    latestResumeFileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ResumeFile",
      default: null,
    },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

candidateSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      email: { $exists: true, $type: "string" },
      isDeleted: false,
    },
  }
);
candidateSchema.index({ email: 1 }, { sparse: true });
candidateSchema.index({ phone: 1 }, { sparse: true });
candidateSchema.index({ profileStatus: 1, lastScreenedAt: -1 });
candidateSchema.index({ totalYearsExperience: -1 });
candidateSchema.index({ fullName: "text", email: "text" });

const Candidate = mongoose.model("Candidate", candidateSchema);

export default Candidate;
