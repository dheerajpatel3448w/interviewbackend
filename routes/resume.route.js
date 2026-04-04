import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import { aiLimiter } from "../middleware/rateLimiter.js";
import { parseResume, getResumeQuestions } from "../controllers/resume.controller.js";

const router = Router();

// Both routes require auth + AI rate limiter
router.use(protect);

router.post("/parse", aiLimiter, parseResume);
router.post("/questions", aiLimiter, getResumeQuestions);

export default router;
