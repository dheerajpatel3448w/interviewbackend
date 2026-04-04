import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getQuestions,
  submitQuestion,
  upvoteQuestion,
  getFavorites,
  getMySubmissions,
  deleteQuestion,
} from "../controllers/questionBank.controller.js";

const router = Router();

// Public browse
router.get("/", getQuestions);

// Auth required for the rest
router.post("/", protect, submitQuestion);
router.post("/:id/upvote", protect, upvoteQuestion);
router.get("/favorites", protect, getFavorites);
router.get("/my-submissions", protect, getMySubmissions);
router.delete("/:id", protect, deleteQuestion);

export default router;
