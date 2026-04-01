import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import { aiLimiter } from "../middleware/rateLimiter.js";
import { getInterviewReplay, getAnswerCommentary } from "../controllers/replay.controller.js";

const router = Router();

router.use(protect);

router.get("/:interviewId", getInterviewReplay);
router.post("/:interviewId/comment", aiLimiter, getAnswerCommentary);

export default router;
