import { InterviewEvaluation } from "../models/interview.model.js";
import { generateAnswerCommentary } from "../service/openai.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

// ─────────────────────────────────────────────────────────────
// GET /api/replay/:interviewId
// Full interview session replay: questions + answers + per-question feedback
// ─────────────────────────────────────────────────────────────
export const getInterviewReplay = asyncHandler(async (req, res) => {
  const interview = await InterviewEvaluation.findOne({
    _id: req.params.interviewId,
    user: req.user.id,
  });

  if (!interview) return errorResponse(res, "Interview not found", 404);

  // Build Q&A pairs
  const pairs = (interview.questions || []).map((q, i) => ({
    index: i,
    question: q,
    answer: interview.answers?.[i] || "No answer recorded",
    aiFeedback: interview.questionFeedback?.[i] || null,
  }));

  return successResponse(res, {
    id: interview._id,
    meta: {
      role: interview.role,
      level: interview.level,
      techstack: interview.techstack,
      type: interview.type,
      date: interview.createdAt,
    },
    scores: {
      overall: interview.overall,
      accuracy: interview.accuracy,
      fluency: interview.fluency,
      communication: interview.communication,
      confidence: interview.confidence,
      domainExpertise: interview.domainExpertise,
    },
    pairs,
    improvements: interview.improvements,
    nextSteps: interview.nextSteps,
  });
});

// ─────────────────────────────────────────────────────────────
// POST /api/replay/:interviewId/comment
// Deep-dive AI commentary on a specific answer
// ─────────────────────────────────────────────────────────────
export const getAnswerCommentary = asyncHandler(async (req, res) => {
  const { questionIndex } = req.body;

  const interview = await InterviewEvaluation.findOne({
    _id: req.params.interviewId,
    user: req.user.id,
  });

  if (!interview) return errorResponse(res, "Interview not found", 404);
  if (questionIndex == null || !interview.questions?.[questionIndex]) {
    return errorResponse(res, "Question index out of range", 400);
  }

  const commentary = await generateAnswerCommentary({
    question: interview.questions[questionIndex],
    answer: interview.answers?.[questionIndex] || "",
    role: interview.role,
    level: interview.level,
  });

  return successResponse(res, {
    questionIndex,
    question: interview.questions[questionIndex],
    answer: interview.answers?.[questionIndex],
    commentary,
  });
});
