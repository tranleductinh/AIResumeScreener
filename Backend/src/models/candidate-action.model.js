import mongoose from "mongoose";

const candidateActionSchema = new mongoose.Schema(
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
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
      index: true,
    },
    actedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    actionType: {
      type: String,
      enum: ["shortlisted", "rejected", "notes", "tags", "move_stage"],
      required: true,
    },
    stage: {
      type: String,
      enum: ["applied", "screened", "interview", "offer", "hired"],
      default: null,
    },
    note: {
      type: String,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

candidateActionSchema.index({ jobId: 1, candidateId: 1, createdAt: -1 });
candidateActionSchema.index({ organizationId: 1, actedBy: 1 });

const CandidateAction = mongoose.model("CandidateAction", candidateActionSchema);

export default CandidateAction;
