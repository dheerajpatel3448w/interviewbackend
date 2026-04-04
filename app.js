import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";

// Routes
import userRouter from "./routes/user.route.js";
import interviewRouter from "./routes/interview.route.js";
import analyticsRouter from "./routes/analytics.route.js";
import roadmapRouter from "./routes/roadmap.route.js";
import leaderboardRouter from "./routes/leaderboard.route.js";
import replayRouter from "./routes/replay.route.js";
import scheduleRouter from "./routes/schedule.route.js";
import questionBankRouter from "./routes/questionBank.route.js";
import speechRouter from "./routes/speech.route.js";
import resumeRouter from "./routes/resume.route.js";

// Middleware
import { errorHandler } from "./middleware/errorHandler.js";
import { apiLimiter } from "./middleware/rateLimiter.js";

const app = express();

// ── CORS ─────────────────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:5173",
  "https://interview-aifrontend.vercel.app",
  "https://interview-aifrontend-2pm2wojo2-dheeraj-patels-projects.vercel.app",
  "https://interviewbackend-9qk4.onrender.com",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// ── Core Middleware ───────────────────────────────────────────
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ── Global Rate Limiter ───────────────────────────────────────
app.use("/api", apiLimiter);

// ── Health Check ──────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), version: "2.0.0" });
});

// ── Routes ────────────────────────────────────────────────────
app.use("/", userRouter);                          // /login, /register, /user/profile
app.use("/api/interview", interviewRouter);         // /api/interview/submit, /history, /overall
app.use("/api/analytics", analyticsRouter);         // /api/analytics/progress, /breakdown, etc.
app.use("/api/roadmap", roadmapRouter);             // /api/roadmap/generate, /:id, etc.
app.use("/api/leaderboard", leaderboardRouter);     // /api/leaderboard/global, /role/:role
app.use("/api/replay", replayRouter);               // /api/replay/:id, /:id/comment
app.use("/api/schedule", scheduleRouter);           // /api/schedule CRUD
app.use("/api/questions", questionBankRouter);      // /api/questions browse + submit
app.use("/api/deepgram", speechRouter);             // /api/deepgram/speak, /stt
app.use("/api/resume", resumeRouter);               // /api/resume/parse, /questions

// ── Legacy compatibility routes ───────────────────────────────
// These forward old frontend calls to the new paths (no breaking changes)
app.post("/submitreport", (req, res) => res.redirect(307, "/api/interview/submit"));
app.post("/overallsubmit", (req, res) => res.redirect(307, "/api/interview/overall"));

// ── 404 Handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });
});

// ── Global Error Handler ──────────────────────────────────────
app.use(errorHandler);

export default app;
