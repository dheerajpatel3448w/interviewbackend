import { Router } from "express";
import { ttsHandler, sttHandler, upload } from "../controllers/speech.controller.js";

const router = Router();

router.post("/speak", ttsHandler);
router.post("/stt", upload.single("audio"), sttHandler);

export default router;
