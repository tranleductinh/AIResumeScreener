import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
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
        },
      ],
      soft: {
        type: [String],
        default: [],
      },
    },
    source: {
      type: {
        type: String,
        enum: ["resume_upload", "manual", "import"],
        default: "resume_upload",
      },
      sourceId: { type: String, default: null },
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
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

candidateSchema.index(
  { organizationId: 1, email: 1 },
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
candidateSchema.index({ fullName: "text", email: "text" });

const Candidate = mongoose.model("Candidate", candidateSchema);

export default Candidate;
