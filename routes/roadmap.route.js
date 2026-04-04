import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import { aiLimiter } from "../middleware/rateLimiter.js";
import {
  generateRoadmap,
  getUserRoadmaps,
  getRoadmapById,
  getLatestRoadmap,
  markTopicComplete,
  deleteRoadmap,
} from "../controllers/roadmap.controller.js";

const router = Router();

router.use(protect);

router.get("/", getUserRoadmaps);
router.get("/latest", getLatestRoadmap);        // must come before /:id
router.get("/:id", getRoadmapById);
router.post("/generate", aiLimiter, generateRoadmap);
router.put("/:id/topic/:topicId/complete", markTopicComplete);
router.delete("/:id", deleteRoadmap);

export default router;
