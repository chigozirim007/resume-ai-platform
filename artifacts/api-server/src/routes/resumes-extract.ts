import { Router, type IRouter } from "express";
import multer from "multer";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

import mammoth from "mammoth";
import { logger } from "../lib/logger";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/resumes/extract", upload.single("file"), async (req, res): Promise<void> => {
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
    } else if (
      mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimetype === "application/msword"
    ) {
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      text = result.value;
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
    res.status(500).json({ error: "Failed to extract text from file. Please ensure it's a valid PDF or Word document." });
  }
});

export default router;
