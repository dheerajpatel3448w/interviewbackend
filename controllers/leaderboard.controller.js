import { InterviewEvaluation } from "../models/interview.model.js";
import { User } from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";

// ─────────────────────────────────────────────────────────────
// GET /api/leaderboard/global?limit=50
// Top users by average overall score
// ─────────────────────────────────────────────────────────────
export const getGlobalLeaderboard = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);

  const topUsers = await InterviewEvaluation.aggregate([
    {
      $group: {
        _id: "$user",
        avgOverall: { $avg: "$overall" },
        bestScore: { $max: "$overall" },
        totalInterviews: { $sum: 1 },
        lastActive: { $max: "$createdAt" },
      },
    },
    { $match: { totalInterviews: { $gte: 1 } } },
    { $sort: { avgOverall: -1, bestScore: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "userInfo",
      },
    },
    { $unwind: "$userInfo" },
    {
      $match: { "userInfo.isPublicProfile": true },
    },
    {
      $project: {
        _id: 0,
        userId: "$_id",
        fullName: "$userInfo.fullName",
        username: "$userInfo.username",
        avatar: "$userInfo.avatar",
        avgOverall: { $round: ["$avgOverall", 2] },
        bestScore: 1,
        totalInterviews: 1,
        lastActive: 1,
      },
    },
  ]);

  const ranked = topUsers.map((u, i) => ({ rank: i + 1, ...u }));
  return successResponse(res, ranked);
});

// ─────────────────────────────────────────────────────────────
// GET /api/leaderboard/role/:role?level=senior
// Top users for a specific role/level
// ─────────────────────────────────────────────────────────────
export const getRoleLeaderboard = asyncHandler(async (req, res) => {
  const { role } = req.params;
  const { level } = req.query;

  const matchStage = { role: role.toLowerCase().trim() };
  if (level) matchStage.level = level.toLowerCase().trim();

  const topUsers = await InterviewEvaluation.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: "$user",
        avgOverall: { $avg: "$overall" },
        bestScore: { $max: "$overall" },
        totalInterviews: { $sum: 1 },
        avgDomainExpertise: { $avg: "$domainExpertise" },
      },
    },
    { $sort: { avgOverall: -1 } },
    { $limit: 50 },
    {
      $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "userInfo" },
    },
    { $unwind: "$userInfo" },
    { $match: { "userInfo.isPublicProfile": true } },
    {
      $project: {
        _id: 0,
        userId: "$_id",
        fullName: "$userInfo.fullName",
        username: "$userInfo.username",
        avatar: "$userInfo.avatar",
        avgOverall: { $round: ["$avgOverall", 2] },
        avgDomainExpertise: { $round: ["$avgDomainExpertise", 2] },
        bestScore: 1,
        totalInterviews: 1,
      },
    },
  ]);

  const ranked = topUsers.map((u, i) => ({ rank: i + 1, ...u }));
  return successResponse(res, { role, level: level || "all", leaderboard: ranked });
});

// ─────────────────────────────────────────────────────────────
// GET /api/leaderboard/myrank
// Current user's global rank
// ─────────────────────────────────────────────────────────────
export const getMyRank = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const allUsers = await InterviewEvaluation.aggregate([
    {
      $group: {
        _id: "$user",
        avgOverall: { $avg: "$overall" },
        totalInterviews: { $sum: 1 },
      },
    },
    { $sort: { avgOverall: -1 } },
  ]);

  const myIndex = allUsers.findIndex((u) => u._id.toString() === userId.toString());
  const myStats = allUsers[myIndex];

  if (myIndex === -1) {
    return successResponse(res, { rank: null, message: "Complete at least one interview to appear on the leaderboard." });
  }

  // Percentile
  const percentile = Math.round(((allUsers.length - myIndex) / allUsers.length) * 100);

  return successResponse(res, {
    rank: myIndex + 1,
    totalUsers: allUsers.length,
    percentile,
    avgScore: myStats ? +myStats.avgOverall.toFixed(2) : 0,
    totalInterviews: myStats?.totalInterviews || 0,
  });
});
