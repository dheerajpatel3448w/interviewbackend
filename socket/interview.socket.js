import { generateInterviewQuestions, generateResumeBasedQuestions, analyzeInterviewAnswers } from "../service/openai.service.js";
import { InterviewEvaluation } from "../models/interview.model.js";

// In-memory store per socket session
const sessionStore = new Map();

/**
 * Registers all Socket.io events for the interview flow.
 * @param {import("socket.io").Server} io
 */
export const registerInterviewSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`[Socket] User connected: ${socket.id}`);

    // ── START INTERVIEW ───────────────────────────────────────────────
    socket.on("start_interview", async (topic) => {
      console.log(`[Socket] Generating questions for:`, topic);
      try {
        let questions;
        if (topic.resumeBased && topic.resumeText) {
          questions = await generateResumeBasedQuestions(topic);
        } else {
          questions = await generateInterviewQuestions(topic);
        }
        
        sessionStore.set(socket.id, {
          questions,
          answers: [],
          meta: topic,
          startedAt: new Date(),
        });
        sendNextQuestion(socket, questions, 0);
      } catch (err) {
        console.error("[Socket] Error generating questions:", err.message);
        socket.emit("error", { message: "Failed to generate questions. Please try again." });
      }
    });

    // ── SUBMIT ANSWER ─────────────────────────────────────────────────
    socket.on("submit_answer", ({ index, answer, data2 }) => {
      const session = sessionStore.get(socket.id);
      if (!session) return;

      session.answers[index] = answer;

      if (index + 1 < session.questions.length) {
        sendNextQuestion(socket, session.questions, index + 1);
      } else {
        // All questions answered — analyze
        analyzeSession(socket, session, data2);
      }
    });

    // ── DISCONNECT ────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      console.log(`[Socket] User disconnected: ${socket.id}`);
      sessionStore.delete(socket.id);
    });
  });
};

// ── HELPERS ───────────────────────────────────────────────────────────────────

const sendNextQuestion = (socket, questions, index) => {
  socket.emit("next_question", {
    index,
    question: questions[index],
    lengthe: questions.length,
  });
};

const analyzeSession = async (socket, session, facialData) => {
  try {
    const report = await analyzeInterviewAnswers({
      questions: session.questions,
      answers: session.answers,
      facialData,
    });

    // Attach raw Q&A to report so replay works
    report._questions = session.questions;
    report._answers = session.answers;
    report._meta = session.meta;

    socket.emit("analysis_report", report);
  } catch (err) {
    console.error("[Socket] Error analyzing answers:", err.message);
    socket.emit("analysis_report", { error: "Error analyzing responses. Please try again." });
  }
};
