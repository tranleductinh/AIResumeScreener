import mongoose from "mongoose";

const candidateActionSchema = new mongoose.Schema(
  {
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
      enum: [
        "shortlisted",
        "rejected",
        "notes",
        "tags",
        "move_stage",
        "schedule_interview",
        "restore",
      ],
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
    isAiSuggestion: {
      type: Boolean,
      default: false,
    },
    sourceScreeningResultId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ScreeningResult",
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

candidateActionSchema.index({ jobId: 1, candidateId: 1, createdAt: -1 });
candidateActionSchema.index({ actedBy: 1, createdAt: -1 });
candidateActionSchema.index({ actionType: 1, createdAt: -1 });

const CandidateAction = mongoose.model("CandidateAction", candidateActionSchema);

export default CandidateAction;
