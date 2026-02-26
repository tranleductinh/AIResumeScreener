import mongoose from "mongoose";

const resumeFileSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
      index: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      default: null,
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
    pageCount: {
      type: Number,
      default: null,
      min: 0,
    },
    fileHash: {
      type: String,
      default: null,
      index: true,
    },
    storage: {
      provider: {
        type: String,
        enum: ["local", "s3"],
        required: true,
      },
      pathOrKey: { type: String, required: true, trim: true },
      url: { type: String, default: null },
      bucket: { type: String, default: null },
    },
    uploadStatus: {
      type: String,
      enum: ["queued", "uploading", "uploaded", "failed"],
      default: "uploaded",
      index: true,
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
      enum: ["pending", "parsing", "parsed", "failed"],
      default: "pending",
    },
    parseAttempts: {
      type: Number,
      default: 0,
    },
    parsedAt: {
      type: Date,
      default: null,
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
resumeFileSchema.index({ parseStatus: 1 });
resumeFileSchema.index({ uploadStatus: 1, createdAt: -1 });
resumeFileSchema.index({ candidateId: 1, createdAt: -1 });
resumeFileSchema.index({ jobId: 1, createdAt: -1 });

const ResumeFile = mongoose.model("ResumeFile", resumeFileSchema);

export default ResumeFile;
