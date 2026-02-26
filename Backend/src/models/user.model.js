import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String,
    },
    passwordHash: {
      type: String,
      default: null,
      select: false,
    },
    google_id: {
      type: String,
    },
    role: {
      type: String,
      enum: ["admin", "recruiter", "viewer"],
      default: "recruiter",
    },
    status: {
      type: String,
      enum: ["invited", "active", "suspended"],
      default: "active",
    },
    invitedAt: {
      type: Date,
      default: null,
    },
    joinedAt: {
      type: Date,
      default: null,
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    authType: { type: String, enum: ["local", "google"], default: "local" },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1, status: 1 });
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
})

const User = mongoose.model("User", userSchema);

export default User;
