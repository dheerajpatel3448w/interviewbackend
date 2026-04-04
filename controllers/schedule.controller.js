import { Schedule } from "../models/schedule.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

// ─────────────────────────────────────────────────────────────
// POST /api/schedule
// Create a new scheduled interview session
// ─────────────────────────────────────────────────────────────
export const createSchedule = asyncHandler(async (req, res) => {
  const { title, scheduledAt, role, level, techstack, type, amount, notes } = req.body;

  if (!scheduledAt || !role || !level || !techstack) {
    return errorResponse(res, "scheduledAt, role, level, and techstack are required", 400);
  }

  const date = new Date(scheduledAt);
  if (date <= new Date()) {
    return errorResponse(res, "scheduledAt must be a future date", 400);
  }

  const schedule = await Schedule.create({
    user: req.user.id,
    title: title || `${role} Interview Practice`,
    scheduledAt: date,
    role: role.toLowerCase().trim(),
    level: level.toLowerCase().trim(),
    techstack: techstack.toLowerCase().trim(),
    type: type || "technical",
    amount: amount || 5,
    notes,
  });

  return successResponse(res, schedule, "Interview session scheduled", 201);
});

// ─────────────────────────────────────────────────────────────
// GET /api/schedule
// Get upcoming sessions for user
// ─────────────────────────────────────────────────────────────
export const getUserSchedules = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = { user: req.user.id };
  if (status) query.status = status;

  const schedules = await Schedule.find(query)
    .sort({ scheduledAt: 1 })
    .limit(50);

  return successResponse(res, schedules);
});

// ─────────────────────────────────────────────────────────────
// GET /api/schedule/upcoming
// Get sessions in the next 7 days
// ─────────────────────────────────────────────────────────────
export const getUpcomingSchedules = asyncHandler(async (req, res) => {
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const schedules = await Schedule.find({
    user: req.user.id,
    status: "pending",
    scheduledAt: { $gte: now, $lte: nextWeek },
  }).sort({ scheduledAt: 1 });

  return successResponse(res, schedules);
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/schedule/:id/cancel
// Cancel a scheduled session
// ─────────────────────────────────────────────────────────────
export const cancelSchedule = asyncHandler(async (req, res) => {
  const schedule = await Schedule.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id, status: "pending" },
    { status: "cancelled" },
    { new: true }
  );

  if (!schedule) return errorResponse(res, "Schedule not found or already completed", 404);
  return successResponse(res, schedule, "Session cancelled");
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/schedule/:id/complete
// Mark session as completed (called after interview finishes)
// ─────────────────────────────────────────────────────────────
export const completeSchedule = asyncHandler(async (req, res) => {
  const { interviewId } = req.body;
  const schedule = await Schedule.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { status: "completed", completedInterviewId: interviewId },
    { new: true }
  );
  if (!schedule) return errorResponse(res, "Schedule not found", 404);
  return successResponse(res, schedule, "Session marked as completed");
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/schedule/:id
// Delete a schedule permanently
// ─────────────────────────────────────────────────────────────
export const deleteSchedule = asyncHandler(async (req, res) => {
  const schedule = await Schedule.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!schedule) return errorResponse(res, "Schedule not found", 404);
  return successResponse(res, null, "Schedule deleted");
});
