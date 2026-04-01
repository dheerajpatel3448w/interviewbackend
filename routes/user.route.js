import { Router } from "express";
import { login, register, userprofile, logout, updateProfile, changePassword } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.post("/login", authLimiter, login);
router.post("/register", authLimiter, register);
router.get("/user/profile", userprofile);
router.put("/user/profile", protect, updateProfile);
router.put("/user/change-password", protect, changePassword);
router.get("/user/logout", logout);

export default router;