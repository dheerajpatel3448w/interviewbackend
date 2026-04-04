import { InterviewEvaluation } from "../models/interview.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";
import { generateProgressCommentary } from "../service/openai.service.js";

// ─────────────────────────────────────────────────────────────
// GET /api/analytics/progress?limit=10
// Score trend over last N sessions
// ─────────────────────────────────────────────────────────────
export const getProgressTrend = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);

  const records = await InterviewEvaluation.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("overall accuracy fluency communication confidence clarity domainExpertise role level createdAt");

  // Reverse so oldest→newest for chart
  const trend = records.reverse().map((r) => ({
    date: r.createdAt,
    overall: r.overall,
    accuracy: r.accuracy,
    fluency: r.fluency,
    communication: r.communication,
    confidence: r.confidence,
    clarity: r.clarity,
    domainExpertise: r.domainExpertise,
    role: r.role,
    level: r.level,
  }));

  return successResponse(res, { trend, count: trend.length });
});

// ─────────────────────────────────────────────────────────────
// GET /api/analytics/breakdown
// Average scores grouped by role
// ─────────────────────────────────────────────────────────────
export const getScoreBreakdown = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const breakdown = await InterviewEvaluation.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: { role: "$role", level: "$level" },
        avgOverall: { $avg: "$overall" },
        avgAccuracy: { $avg: "$accuracy" },
        avgFluency: { $avg: "$fluency" },
        avgCommunication: { $avg: "$communication" },
        avgConfidence: { $avg: "$confidence" },
        avgDomainExpertise: { $avg: "$domainExpertise" },
        count: { $sum: 1 },
        lastPracticed: { $max: "$createdAt" },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const formatted = breakdown.map((b) => ({
    role: b._id.role,
    level: b._id.level,
    sessions: b.count,
    lastPracticed: b.lastPracticed,
    scores: {
      overall: +b.avgOverall.toFixed(2),
      accuracy: +b.avgAccuracy.toFixed(2),
      fluency: +b.avgFluency.toFixed(2),
      communication: +b.avgCommunication.toFixed(2),
      confidence: +b.avgConfidence.toFixed(2),
      domainExpertise: +b.avgDomainExpertise.toFixed(2),
    },
  }));

  return successResponse(res, formatted);
});

// ─────────────────────────────────────────────────────────────
// GET /api/analytics/top-weaknesses
// Most frequent improvement areas from AI feedback
// ─────────────────────────────────────────────────────────────
export const getTopWeaknesses = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const records = await InterviewEvaluation.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(20)
    .select("improvements mistakes");

  const frequencyMap = {};
  for (const r of records) {
    const combined = [...(r.improvements || []), ...(r.mistakes || [])];
    for (const item of combined) {
      // Simple keyword extraction
      const key = item.toLowerCase().substring(0, 60);
      frequencyMap[key] = (frequencyMap[key] || 0) + 1;
    }
  }

  const weaknesses = Object.entries(frequencyMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([text, count]) => ({ text, count }));

  return successResponse(res, weaknesses);
});

// ─────────────────────────────────────────────────────────────
// GET /api/analytics/streak
// Practice streak & activity calendar data
// ─────────────────────────────────────────────────────────────
export const getStreakData = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const records = await InterviewEvaluation.find({ user: userId })
    .select("createdAt overall")
    .sort({ createdAt: -1 });

  // Activity calendar — group by date
  const activityMap = {};
  for (const r of records) {
    const dateStr = new Date(r.createdAt).toISOString().split("T")[0];
    if (!activityMap[dateStr]) {
      activityMap[dateStr] = { count: 0, bestScore: 0 };
    }
    activityMap[dateStr].count++;
    activityMap[dateStr].bestScore = Math.max(activityMap[dateStr].bestScore, r.overall);
  }

  // Calculate current streak
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sortedDays = Object.keys(activityMap).sort((a, b) => new Date(b) - new Date(a));

  let currentStreak = 0;
  let expectedDate = today;
  for (const day of sortedDays) {
    const dayDate = new Date(day);
    dayDate.setHours(0, 0, 0, 0);
    if (dayDate.getTime() === expectedDate.getTime()) {
      currentStreak++;
      expectedDate = new Date(expectedDate.getTime() - 86400000);
    } else break;
  }

  return successResponse(res, {
    currentStreak,
    totalDays: sortedDays.length,
    totalInterviews: records.length,
    activityCalendar: activityMap,
    longestStreak: currentStreak, // TODO: track historically
  });
});

// ─────────────────────────────────────────────────────────────
// GET /api/analytics/summary
// Full dashboard summary in one call
// ─────────────────────────────────────────────────────────────
export const getDashboardSummary = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [records, latestFive] = await Promise.all([
    InterviewEvaluation.find({ user: userId }).select("overall createdAt role level"),
    InterviewEvaluation.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("overall role level techstack type createdAt"),
  ]);

  const totalInterviews = records.length;
  const avgScore = totalInterviews
    ? +(records.reduce((s, r) => s + r.overall, 0) / totalInterviews).toFixed(2)
    : 0;
  const bestScore = totalInterviews ? Math.max(...records.map((r) => r.overall)) : 0;
  const improvement =
    records.length >= 2
      ? +(records[records.length - 1].overall - records[records.length - 2]?.overall || 0).toFixed(2)
      : 0;

  return successResponse(res, {
    totalInterviews,
    avgScore,
    bestScore,
    improvement, // positive = improving
    recentInterviews: latestFive,
  });
});

// ─────────────────────────────────────────────────────────────
// GET /api/analytics/compare?role=&level=
// Delta comparison between two most recent sessions
// ─────────────────────────────────────────────────────────────
export const compareLastTwoSessions = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { role, level } = req.query;

  const filter = { user: userId };
  if (role) filter.role = role.toLowerCase().trim();
  if (level) filter.level = level.toLowerCase().trim();

  const sessions = await InterviewEvaluation.find(filter)
    .sort({ createdAt: -1 })
    .limit(2)
    .select("overall accuracy fluency communication confidence clarity engagement domainExpertise stress eyeContact blinkRate role level techstack createdAt improvements nextSteps");

  if (sessions.length < 2) {
    return successResponse(res, {
      hasComparison: false,
      message: "Need at least 2 sessions to compare. Keep practicing!",
      sessions: sessions.length,
    });
  }

  const [latest, previous] = sessions; // latest is sessions[0], previous is sessions[1]

  const metrics = ["overall", "accuracy", "fluency", "communication", "confidence", "clarity", "engagement", "domainExpertise"];

  // Compute per-metric deltas (latest - previous)
  const deltas = {};
  for (const m of metrics) {
    deltas[m] = parseFloat((latest[m] - previous[m]).toFixed(2));
  }

  const overallDelta = deltas.overall;
  const trend = overallDelta > 0.5 ? "improving" : overallDelta < -0.5 ? "declining" : "plateauing";

  // Get AI commentary (non-blocking fallback if OpenAI fails)
  let aiCommentary = "";
  try {
    aiCommentary = await generateProgressCommentary({ sessionA: previous, sessionB: latest, deltas });
  } catch (_) {
    aiCommentary = "";
  }

  return successResponse(res, {
    hasComparison: true,
    sessionA: {
      id: previous._id,
      date: previous.createdAt,
      overall: previous.overall,
      role: previous.role,
      level: previous.level,
    },
    sessionB: {
      id: latest._id,
      date: latest.createdAt,
      overall: latest.overall,
      role: latest.role,
      level: latest.level,
    },
    deltas,
    trend,
    aiCommentary,
  });
});

// ─────────────────────────────────────────────────────────────
// GET /api/analytics/insights
// Performance trend insights across last 5 sessions
// ─────────────────────────────────────────────────────────────
export const getImprovementInsights = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const sessions = await InterviewEvaluation.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(5)
    .select("overall accuracy fluency communication confidence clarity engagement domainExpertise createdAt role");

  if (sessions.length < 2) {
    return successResponse(res, {
      hasInsights: false,
      message: "Complete at least 2 interviews to see insights.",
    });
  }

  const metrics = ["accuracy", "fluency", "communication", "confidence", "clarity", "engagement", "domainExpertise"];

  // For each metric, compute the trend slope across all sessions (older → newer)
  const reversed = [...sessions].reverse(); // oldest first
  const metricTrends = {};

  for (const m of metrics) {
    const values = reversed.map((s) => s[m]);
    const first = values[0];
    const last = values[values.length - 1];
    const delta = parseFloat((last - first).toFixed(2));
    const avg = parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2));
    const variance = parseFloat(
      (values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length).toFixed(2)
    );
    metricTrends[m] = { delta, avg, variance, first, last };
  }

  // Sort by delta descending
  const sorted = Object.entries(metricTrends).sort((a, b) => b[1].delta - a[1].delta);

  const bestImproving = { metric: sorted[0][0], ...sorted[0][1] };
  const worstDeclining = { metric: sorted[sorted.length - 1][0], ...sorted[sorted.length - 1][1] };

  // Most consistent = lowest variance
  const mostConsistentEntry = Object.entries(metricTrends).sort((a, b) => a[1].variance - b[1].variance)[0];
  const mostConsistent = { metric: mostConsistentEntry[0], ...mostConsistentEntry[1] };

  // Overall trend
  const overallValues = reversed.map((s) => s.overall);
  const overallFirst = overallValues[0];
  const overallLast = overallValues[overallValues.length - 1];
  const overallDelta = overallLast - overallFirst;
  const overallTrend = overallDelta > 0.5 ? "improving" : overallDelta < -0.5 ? "declining" : "plateauing";

  return successResponse(res, {
    hasInsights: true,
    sessionCount: sessions.length,
    overallTrend,
    overallDelta: parseFloat(overallDelta.toFixed(2)),
    bestImproving,
    worstDeclining,
    mostConsistent,
    metricTrends,
    recentRole: sessions[0]?.role,
  });
});
