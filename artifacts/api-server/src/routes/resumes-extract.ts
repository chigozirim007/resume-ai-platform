import { Router, type IRouter } from "express";
import multer from "multer";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");
const Tesseract = require("tesseract.js");

import mammoth from "mammoth";
import { logger } from "../lib/logger";

import { aiRateLimiter } from "../middlewares/rate-limiter";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/resumes/extract", aiRateLimiter, upload.single("file"), async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  try {
    let text = "";
    const mimetype = req.file.mimetype;
    const filename = req.file.originalname;

    logger.info({ filename, mimetype }, "Extracting text from uploaded file");

    if (mimetype === "application/pdf") {
      const data = await pdf(req.file.buffer);
      text = data.text;

      if (!text.trim() || text.trim().length < 50) {
        logger.warn({ filename }, "PDF extraction returned very little text, possible scanned document");
      }
    } else if (
      mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimetype === "application/msword"
    ) {
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      text = result.value;
    } else if (mimetype.startsWith("image/")) {
      const { data: { text: ocrText } } = await Tesseract.recognize(req.file.buffer, "eng");
      text = ocrText;
      logger.info({ filename }, "OCR extraction complete for image");
    } else {
      // Fallback to text for other types (plain text, markdown, etc)
      text = req.file.buffer.toString("utf-8");
    }

    if (!text.trim()) {
      res.status(400).json({ error: "Could not extract any text from the file" });
      return;
    }

    res.json({ text: text.trim() });
  } catch (err) {
    logger.error({ err }, "File extraction failed");
    res.status(500).json({ error: "Failed to extract text from file. Please ensure it's a valid PDF, Word document, or clear image (PNG/JPG)." });
  }
});

export default router;
