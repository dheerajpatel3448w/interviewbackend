import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getProgressTrend,
  getScoreBreakdown,
  getTopWeaknesses,
  getStreakData,
  getDashboardSummary,
  compareLastTwoSessions,
  getImprovementInsights,
} from "../controllers/analytics.controller.js";

const router = Router();

router.use(protect);

router.get("/progress", getProgressTrend);
router.get("/breakdown", getScoreBreakdown);
router.get("/top-weaknesses", getTopWeaknesses);
router.get("/streak", getStreakData);
router.get("/summary", getDashboardSummary);
router.get("/compare", compareLastTwoSessions);
router.get("/insights", getImprovementInsights);

export default router;
