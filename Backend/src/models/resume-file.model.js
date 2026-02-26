import mongoose from "mongoose";

const resumeFileSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
      index: true,
    },
    originalFileName: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    sizeBytes: {
      type: Number,
      required: true,
      min: 0,
    },
    storage: {
      provider: {
        type: String,
        enum: ["local", "s3"],
        required: true,
      },
      pathOrKey: { type: String, required: true, trim: true },
      url: { type: String, default: null },
    },
    extractedText: {
      type: String,
      default: null,
    },
    extractedTextPreview: {
      type: String,
      default: "",
    },
    parseStatus: {
      type: String,
      enum: ["pending", "parsed", "failed"],
      default: "pending",
    },
    parseError: {
      type: String,
      default: null,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

resumeFileSchema.index({ candidateId: 1 });
resumeFileSchema.index({ organizationId: 1, parseStatus: 1 });

const ResumeFile = mongoose.model("ResumeFile", resumeFileSchema);

export default ResumeFile;
