import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
      type: String,
      default: null,
      trim: true,
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
      requiredSkills: { type: [String], default: [] },
      niceToHaveSkills: { type: [String], default: [] },
      minYearsExperience: { type: Number, default: null },
      maxYearsExperience: { type: Number, default: null },
      keywords: { type: [String], default: [] },
    },
    status: {
      type: String,
      enum: ["open", "closed", "draft"],
      default: "draft",
    },
    openedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

jobSchema.index({ organizationId: 1, status: 1 });
jobSchema.index({ title: "text", jdText: "text" });

const Job = mongoose.model("Job", jobSchema);

export default Job;
