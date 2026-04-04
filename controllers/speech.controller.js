import { textToSpeech } from "../service/deepgram.service.js";
import { speechToText } from "../service/deepgram.service.js";
import multer from "multer";
import asyncHandler from "../utils/asyncHandler.js";

export const upload = multer({ storage: multer.memoryStorage() });

// POST /api/deepgram/speak
export const ttsHandler = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ success: false, message: "Text is required" });
  const audioData = await textToSpeech(text);
  res.send(audioData);
});

// POST /api/deepgram/stt
export const sttHandler = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No audio file uploaded" });
  }
  const transcript = await speechToText(req.file.buffer);
  res.json(transcript);
});
