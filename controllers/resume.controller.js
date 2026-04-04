import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import { parseResumeProfile, generateResumeBasedQuestions } from "../service/openai.service.js";

// ─────────────────────────────────────────────────────────────
// POST /api/resume/parse
// Extract structured profile data from raw resume text
// ─────────────────────────────────────────────────────────────
export const parseResume = asyncHandler(async (req, res) => {
  const { resumeText } = req.body;

  if (!resumeText || resumeText.trim().length < 50) {
    return errorResponse(res, "Please provide a resume with at least 50 characters.", 400);
  }

  if (resumeText.length > 10000) {
    return errorResponse(res, "Resume text too long. Please limit to 10,000 characters.", 400);
  }

  const profile = await parseResumeProfile({ resumeText });

  return successResponse(res, { profile, resumeLength: resumeText.trim().length }, "Resume parsed successfully");
});

// ─────────────────────────────────────────────────────────────
// POST /api/resume/questions
// Generate interview questions tailored to the user's resume
// ─────────────────────────────────────────────────────────────
export const getResumeQuestions = asyncHandler(async (req, res) => {
  const { resumeText, role, level, amount } = req.body;

  if (!resumeText || resumeText.trim().length < 50) {
    return errorResponse(res, "Please provide resume text to generate questions.", 400);
  }

  if (!role) {
    return errorResponse(res, "Role is required to generate targeted questions.", 400);
  }

  const questionCount = Math.min(parseInt(amount) || 8, 15); // cap at 15
  const interviewLevel = level || "junior";

  const questions = await generateResumeBasedQuestions({
    resumeText,
    role,
    level: interviewLevel,
    amount: questionCount,
  });

  if (!questions || questions.length === 0) {
    return errorResponse(res, "Failed to generate questions from resume. Please try again.", 500);
  }

  return successResponse(res, {
    questions,
    count: questions.length,
    resumeBased: true,
    role,
    level: interviewLevel,
  }, "Resume-based questions generated successfully");
});
