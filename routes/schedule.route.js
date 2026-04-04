import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  createSchedule,
  getUserSchedules,
  getUpcomingSchedules,
  cancelSchedule,
  completeSchedule,
  deleteSchedule,
} from "../controllers/schedule.controller.js";

const router = Router();

router.use(protect);

router.get("/", getUserSchedules);
router.get("/upcoming", getUpcomingSchedules);
router.post("/", createSchedule);
router.patch("/:id/cancel", cancelSchedule);
router.patch("/:id/complete", completeSchedule);
router.delete("/:id", deleteSchedule);

export default router;
