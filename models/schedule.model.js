import mongoose from "mongoose";

const ScheduleSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "Practice Interview" },
    scheduledAt: { type: Date, required: true, index: true },
    role: { type: String, required: true },
    level: { type: String, required: true },
    techstack: { type: String, required: true },
    type: { type: String, enum: ["technical", "behavioural", "mixed"], default: "technical" },
    amount: { type: Number, default: 5, min: 1, max: 20 },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled", "missed"],
      default: "pending",
      index: true,
    },
    reminderSent: { type: Boolean, default: false },
    notes: String,
    completedInterviewId: { type: mongoose.Schema.Types.ObjectId, ref: "InterviewEvaluation" },
  },
  { timestamps: true }
);

export const Schedule = mongoose.model("Schedule", ScheduleSchema);
