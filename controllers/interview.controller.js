import { InterviewEvaluation } from "../models/interview.model.js";
import { User } from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import { autoGenerateRoadmap } from "./roadmap.controller.js";

// ─────────────────────────────────────────────────────────────
// POST /api/interview/submit
// Save interview report + update user stats
// ─────────────────────────────────────────────────────────────
export const submitReport = asyncHandler(async (req, res) => {
  const report = req.body;
  const userId = req.user.id;

  if (!report || !report.overall) {
    return errorResponse(res, "Invalid report data", 400);
  }

  // Normalize meta fields
  const normalize = (str) => (str || "").toLowerCase().trim().split(/\s+/).join("");

  // Check for duplicate
  const exists = await InterviewEvaluation.findOne({
    user: userId,
    overall: report.overall,
    accuracy: report.accuracy,
    role: normalize(report._meta?.role),
    createdAt: { $gte: new Date(Date.now() - 60 * 1000) }, // within last 1 min
  });
  if (exists) {
    return res.json({ success: false, message: "Report already exists" });
  }

  const saved = await InterviewEvaluation.create({
    accuracy: report.accuracy,
    fluency: report.fluency,
    communication: report.communication,
    confidence: report.confidence,
    stress: report.stress,
    eyeContact: report.eyeContact,
    blinkRate: report.blinkRate,
    overall: report.overall,
    clarity: report.clarity,
    engagement: report.engagement,
    domainExpertise: report.domainExpertise,
    improvements: report.improvements,
    feedback: report.feedback,
    mistakes: report.mistakes,
    questionFeedback: report.questionFeedback,
    nextSteps: report.nextSteps,
    questions: report._questions || [],
    answers: report._answers || [],
    role: normalize(report._meta?.role),
    level: normalize(report._meta?.level),
    techstack: normalize(report._meta?.techstack),
    type: (report._meta?.type || "").toLowerCase(),
    amount: report._meta?.amount,
    resumeBased: report._meta?.resumeBased || false,
    resumeText: report._meta?.resumeText || "",
    user: userId,
  });

  // Update user stats
  await updateUserStats(userId);

  // Auto-generate roadmap in background if score is below threshold
  let roadmapSuggested = false;
  if (saved.overall < 7) {
    roadmapSuggested = true;
    autoGenerateRoadmap(userId, saved._id).catch((err) =>
      console.error("[AutoRoadmap] Background generation failed:", err.message)
    );
  }

  return successResponse(res, { id: saved._id, roadmapSuggested }, "Report saved successfully", 201);
});

// ─────────────────────────────────────────────────────────────
// POST /api/interview/overall
// Get all reports for a role/level/techstack combination
// ─────────────────────────────────────────────────────────────
export const getOverallReports = asyncHandler(async (req, res) => {
  const { role, level, techstack } = req.body;
  const userId = req.user.id;

  const normalize = (str) => (str || "").toLowerCase().trim().split(/\s+/).join("");

  const reports = await InterviewEvaluation.find({
    user: userId,
    role: normalize(role),
    level: normalize(level),
    techstack: normalize(techstack),
  }).sort({ createdAt: -1 });

  return successResponse(res, reports);
});

// ─────────────────────────────────────────────────────────────
// GET /api/interview/history
// Get paginated interview history for user
// ─────────────────────────────────────────────────────────────
export const getInterviewHistory = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [interviews, total] = await Promise.all([
    InterviewEvaluation.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-questions -answers"), // exclude heavy fields from list view
    InterviewEvaluation.countDocuments({ user: userId }),
  ]);

  return successResponse(res, {
    interviews,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// ─────────────────────────────────────────────────────────────
// Helper: Recalculate user stats after new interview
// ─────────────────────────────────────────────────────────────
const updateUserStats = async (userId) => {
  const all = await InterviewEvaluation.find({ user: userId }).select("overall createdAt");
  if (!all.length) return;

  const totalInterviews = all.length;
  const averageScore = parseFloat(
    (all.reduce((sum, r) => sum + r.overall, 0) / totalInterviews).toFixed(2)
  );
  const bestScore = Math.max(...all.map((r) => r.overall));

  // Streak calculation
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sortedDates = [...new Set(
    all.map((r) => {
      const d = new Date(r.createdAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  )].sort((a, b) => b - a);

  let streak = 0;
  let expectedDate = today.getTime();
  for (const ts of sortedDates) {
    if (ts === expectedDate) {
      streak++;
      expectedDate -= 86400000; // subtract 1 day
    } else break;
  }

  await User.findByIdAndUpdate(userId, {
    totalInterviews,
    averageScore,
    bestScore,
    practiceStreak: streak,
    lastPracticeDate: new Date(),
  });
};
