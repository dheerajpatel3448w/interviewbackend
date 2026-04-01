import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["ADMIN", "USER"], default: "USER" },
    avatar: { type: String, default: "/images/default.jpeg" },

    // ── Extended Profile ─────────────────────────────────
    bio: { type: String, maxlength: 300 },
    targetRole: { type: String }, // e.g. "Frontend Engineer at Google"
    linkedinUrl: { type: String },
    githubUrl: { type: String },
    currentLevel: { type: String, enum: ["fresher", "junior", "mid", "senior", "lead"], default: "fresher" },
    targetTechstack: { type: String }, // preferred tech e.g. "React, Node.js"

    // ── Stats (updated on each interview save) ───────────
    totalInterviews: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    bestScore: { type: Number, default: 0 },
    practiceStreak: { type: Number, default: 0 }, // consecutive days
    lastPracticeDate: { type: Date },

    // ── Preferences ───────────────────────────────────────
    isPublicProfile: { type: Boolean, default: true }, // show on leaderboard
    preferredInterviewType: { type: String, enum: ["technical", "behavioural", "mixed"], default: "technical" },

    // ── Auth extras ───────────────────────────────────────
    googleId: { type: String },
    refreshToken: { type: String },
    isEmailVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

export const User = new model("User", userSchema);