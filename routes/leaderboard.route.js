import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getGlobalLeaderboard,
  getRoleLeaderboard,
  getMyRank,
} from "../controllers/leaderboard.controller.js";

const router = Router();

// Global leaderboard is public
router.get("/global", getGlobalLeaderboard);
router.get("/role/:role", getRoleLeaderboard);

// My rank requires auth
router.get("/myrank", protect, getMyRank);

export default router;
