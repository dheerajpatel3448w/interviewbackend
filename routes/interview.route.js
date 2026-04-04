import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import { submitReport, getOverallReports, getInterviewHistory } from "../controllers/interview.controller.js";

const router = Router();

// All interview routes require auth
router.use(protect);

router.post("/submit", submitReport);
router.post("/overall", getOverallReports);
router.get("/history", getInterviewHistory);

export default router;
