import axios from "axios";
import { createClient } from "@deepgram/sdk";

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

/**
 * Text-to-Speech via Deepgram
 */
export const textToSpeech = async (text) => {
  const response = await axios.post(
    "https://api.deepgram.com/v1/speak",
    { text },
    {
      headers: {
        Authorization: `Token ${DEEPGRAM_API_KEY}`,
        "Content-Type": "application/json",
      },
      responseType: "arraybuffer",
    }
  );
  return response.data;
};

/**
 * Speech-to-Text via Deepgram (buffer input)
 */
export const speechToText = async (audioBuffer) => {
  const deepgram = createClient(DEEPGRAM_API_KEY);
  const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
    audioBuffer,
    { model: "nova-3", smart_format: true }
  );
  if (error) throw error;
  return result.results.channels[0].alternatives[0].transcript;
};
