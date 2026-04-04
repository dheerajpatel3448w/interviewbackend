import { InterviewEvaluation } from "../models/interview.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import { fetchLearningResources } from "../service/openai.service.js";

// ─────────────────────────────────────────────────────────────
// GET /api/resources/:interviewId
// Returns cached resources if available, otherwise fetches via web search
// NOTE: No aiLimiter here — cache-first means no AI call is made on cache hits
// ─────────────────────────────────────────────────────────────
export const getResources = asyncHandler(async (req, res) => {
  const { interviewId } = req.params;
  const userId = req.user.id;

  const interview = await InterviewEvaluation.findOne({
    _id: interviewId,
    user: userId,
  });

  if (!interview) {
    return errorResponse(res, "Interview session not found", 404);
  }

  // ✅ Return cached resources instantly (no AI call)
  if (interview.resources && interview.resources.length > 0) {
    return successResponse(res, {
      resources: interview.resources,
      cached: true,
      role: interview.role,
      level: interview.level,
    });
  }

  // Cache miss — fetch via web search
  const resources = await fetchLearningResources({
    role: interview.role || "software engineer",
    level: interview.level || "mid",
    techstack: interview.techstack || "JavaScript",
    mistakes: interview.mistakes || [],
    improvements: interview.improvements || [],
  });

  // ✅ Use atomic update to avoid Mongoose VersionError
  await InterviewEvaluation.findByIdAndUpdate(interviewId, {
    $set: { resources },
  });

  return successResponse(res, {
    resources,
    cached: false,
    role: interview.role,
    level: interview.level,
  });
});

// ─────────────────────────────────────────────────────────────
// POST /api/resources/:interviewId/refresh
// Force a re-fetch via web search, overwriting cached results
// ─────────────────────────────────────────────────────────────
export const refreshResources = asyncHandler(async (req, res) => {
  const { interviewId } = req.params;
  const userId = req.user.id;

  const interview = await InterviewEvaluation.findOne({
    _id: interviewId,
    user: userId,
  });

  if (!interview) {
    return errorResponse(res, "Interview session not found", 404);
  }

  const resources = await fetchLearningResources({
    role: interview.role || "software engineer",
    level: interview.level || "mid",
    techstack: interview.techstack || "JavaScript",
    mistakes: interview.mistakes || [],
    improvements: interview.improvements || [],
  });

  // ✅ Atomic update — no version conflict
  await InterviewEvaluation.findByIdAndUpdate(interviewId, {
    $set: { resources },
  });

  return successResponse(res, { resources, cached: false });
});

// ─────────────────────────────────────────────────────────────
// Helper: background pre-fetch (called from interview controller)
// Does NOT block the submit response — fire and forget
// ─────────────────────────────────────────────────────────────
export const prefetchResources = async (interviewId) => {
  try {
    // ✅ Small delay so the freshly created document is fully committed to MongoDB
    // before we attempt to read + update it (avoids VersionError race condition)
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const interview = await InterviewEvaluation.findById(interviewId).lean();
    if (!interview) {
      console.warn(`[Resources] Document ${interviewId} not found — skipping pre-fetch`);
      return;
    }
    if (interview.resources?.length > 0) {
      console.log(`[Resources] Already cached for ${interviewId} — skipping`);
      return;
    }

    const resources = await fetchLearningResources({
      role: interview.role || "software engineer",
      level: interview.level || "mid",
      techstack: interview.techstack || "JavaScript",
      mistakes: interview.mistakes || [],
      improvements: interview.improvements || [],
    });

    // ✅ Atomic update — avoids any version conflicts with concurrent writes
    await InterviewEvaluation.findByIdAndUpdate(interviewId, {
      $set: { resources },
    });

    console.log(`[Resources] Pre-fetched ${resources.length} resources for interview ${interviewId}`);
  } catch (err) {
    console.error("[Resources] Pre-fetch failed:", err.message);
  }
};
