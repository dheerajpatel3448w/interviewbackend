import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import connectdb from "./db/db.js";
import { registerInterviewSocket } from "./socket/interview.socket.js";

const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  "http://localhost:5173",
  "https://interview-aifrontend.vercel.app",
  "https://interview-aifrontend-2pm2wojo2-dheeraj-patels-projects.vercel.app",
  "https://interviewbackend-9qk4.onrender.com",
];

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true, methods: ["GET", "POST"] },
});

// Register all socket event handlers
registerInterviewSocket(io);

// Connect DB then start server
connectdb().then(() => {
  server.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  });
});
