import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { aiLimiter } from "../middleware/rateLimiter.js";
import { getResources, refreshResources } from "../controllers/resources.controller.js";

const router = express.Router();

// GET /api/resources/:interviewId  — cache-first, no aiLimiter needed
router.get("/:interviewId", protect, getResources);

// POST /api/resources/:interviewId/refresh  — always calls AI, rate limit applies
router.post("/:interviewId/refresh", protect, aiLimiter, refreshResources);

export default router;
