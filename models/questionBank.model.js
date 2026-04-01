import mongoose from "mongoose";

const QuestionBankSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    role: { type: String, required: true, index: true, lowercase: true, trim: true },
    level: { type: String, required: true, index: true, lowercase: true, trim: true },
    type: { type: String, enum: ["technical", "behavioural", "mixed"], required: true },
    techstack: { type: String, lowercase: true, trim: true, index: true },
    tags: [{ type: String, lowercase: true, trim: true }],
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isPublic: { type: Boolean, default: true },
    upvotes: { type: Number, default: 0 },
    upvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isCurated: { type: Boolean, default: false }, // admin-verified quality question
    source: { type: String, enum: ["ai-generated", "user-submitted", "curated"], default: "user-submitted" },
  },
  { timestamps: true }
);

// Full-text search index
QuestionBankSchema.index({ question: "text", tags: "text", role: "text" });

export const QuestionBank = mongoose.model("QuestionBank", QuestionBankSchema);
