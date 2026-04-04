import { QuestionBank } from "../models/questionBank.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

// ─────────────────────────────────────────────────────────────
// GET /api/questions?role=&level=&type=&search=&page=1
// Browse question bank with filters + search
// ─────────────────────────────────────────────────────────────
export const getQuestions = asyncHandler(async (req, res) => {
  const { role, level, type, techstack, search, page = 1, limit = 20 } = req.query;

  const query = { isPublic: true };
  if (role) query.role = role.toLowerCase();
  if (level) query.level = level.toLowerCase();
  if (type) query.type = type.toLowerCase();
  if (techstack) query.techstack = { $regex: techstack, $options: "i" };
  if (search) query.$text = { $search: search };

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [questions, total] = await Promise.all([
    QuestionBank.find(query)
      .sort({ upvotes: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("submittedBy", "fullName username avatar"),
    QuestionBank.countDocuments(query),
  ]);

  return successResponse(res, {
    questions,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
  });
});

// ─────────────────────────────────────────────────────────────
// POST /api/questions
// Submit a new question to the bank
// ─────────────────────────────────────────────────────────────
export const submitQuestion = asyncHandler(async (req, res) => {
  const { question, role, level, type, techstack, tags, isPublic } = req.body;

  if (!question || !role || !level || !type) {
    return errorResponse(res, "question, role, level, and type are required", 400);
  }

  const newQ = await QuestionBank.create({
    question: question.trim(),
    role: role.toLowerCase().trim(),
    level: level.toLowerCase().trim(),
    type: type.toLowerCase(),
    techstack: techstack?.toLowerCase().trim(),
    tags: tags || [],
    submittedBy: req.user.id,
    isPublic: isPublic !== false,
    source: "user-submitted",
  });

  return successResponse(res, newQ, "Question submitted to the bank", 201);
});

// ─────────────────────────────────────────────────────────────
// POST /api/questions/:id/upvote
// Upvote a question (toggle)
// ─────────────────────────────────────────────────────────────
export const upvoteQuestion = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const question = await QuestionBank.findById(req.params.id);
  if (!question) return errorResponse(res, "Question not found", 404);

  const alreadyUpvoted = question.upvotedBy.includes(userId);

  if (alreadyUpvoted) {
    question.upvotedBy.pull(userId);
    question.upvotes = Math.max(0, question.upvotes - 1);
  } else {
    question.upvotedBy.push(userId);
    question.upvotes++;
  }

  await question.save();
  return successResponse(res, { upvotes: question.upvotes, upvoted: !alreadyUpvoted });
});

// ─────────────────────────────────────────────────────────────
// GET /api/questions/favorites
// Questions this user has upvoted
// ─────────────────────────────────────────────────────────────
export const getFavorites = asyncHandler(async (req, res) => {
  const questions = await QuestionBank.find({
    upvotedBy: req.user.id,
    isPublic: true,
  }).sort({ upvotes: -1 });

  return successResponse(res, questions);
});

// ─────────────────────────────────────────────────────────────
// GET /api/questions/my-submissions
// Questions submitted by this user
// ─────────────────────────────────────────────────────────────
export const getMySubmissions = asyncHandler(async (req, res) => {
  const questions = await QuestionBank.find({ submittedBy: req.user.id }).sort({ createdAt: -1 });
  return successResponse(res, questions);
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/questions/:id
// Delete your own question
// ─────────────────────────────────────────────────────────────
export const deleteQuestion = asyncHandler(async (req, res) => {
  const question = await QuestionBank.findOneAndDelete({
    _id: req.params.id,
    submittedBy: req.user.id,
  });
  if (!question) return errorResponse(res, "Question not found or unauthorized", 404);
  return successResponse(res, null, "Question deleted");
});
