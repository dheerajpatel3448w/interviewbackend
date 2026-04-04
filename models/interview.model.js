import mongoose from "mongoose";

const InterviewEvaluationSchema = new mongoose.Schema(
  {
    // ── Scores ────────────────────────────────────────────
    accuracy: { type: Number, required: true },
    fluency: { type: Number, required: true },
    communication: { type: Number, required: true },
    confidence: { type: Number, required: true },
    stress: { type: Number, required: true },
    eyeContact: { type: Number, required: true },
    blinkRate: { type: Number, required: true },
    overall: { type: Number, required: true },
    clarity: { type: Number, required: true },
    engagement: { type: Number, required: true },
    domainExpertise: { type: Number, required: true },

    // ── Qualitative Feedback ──────────────────────────────
    improvements: { type: [String], required: true },
    feedback: { type: [String], required: true },
    mistakes: { type: [String], required: true },
    questionFeedback: { type: [String], required: true },
    nextSteps: { type: [String], required: true },

    // ── Session Metadata ──────────────────────────────────
    role: { type: String, index: true },
    level: { type: String, index: true },
    techstack: { type: String, index: true },
    type: { type: String },
    amount: { type: Number },

    // ── Raw Q&A (for replay feature) ──────────────────────
    questions: { type: [String], default: [] },
    answers: { type: [String], default: [] },

    // ── Duration ──────────────────────────────────────────
    durationMinutes: { type: Number },

    // ── Resume Context ────────────────────────────────────────
    resumeBased: { type: Boolean, default: false },  // was this a resume-based interview?
    resumeText: { type: String, select: false },      // stored text (excluded from default queries)

    // ── Relationships ─────────────────────────────────────
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    roadmapId: { type: mongoose.Schema.Types.ObjectId, ref: "Roadmap" },
  },
  { timestamps: true }
);

// Compound index for common queries
InterviewEvaluationSchema.index({ user: 1, createdAt: -1 });
InterviewEvaluationSchema.index({ user: 1, role: 1, level: 1 });

export const InterviewEvaluation = mongoose.model("InterviewEvaluation", InterviewEvaluationSchema);
