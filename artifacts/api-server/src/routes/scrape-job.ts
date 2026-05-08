import { Router, type IRouter } from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/scrape/job", async (req, res): Promise<void> => {
  const { url } = req.body;

  if (!url) {
    res.status(400).json({ error: "URL is required" });
    return;
  }

  try {
    logger.info({ url }, "Scraping job description");
    
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(data);
    
    // Remove script and style tags to get cleaner text
    $("script, style, nav, footer, header").remove();

    // Try to find common job description containers
    const commonSelectors = [
      '[class*="job-description"]',
      '[id*="job-description"]',
      '[class*="JobDescription"]',
      ".description",
      "#description",
      "article",
      "main",
    ];

    let extractedText = "";
    for (const selector of commonSelectors) {
      const el = $(selector);
      if (el.length > 0) {
        extractedText = el.text();
        if (extractedText.length > 200) break; // Found something substantial
      }
    }

    // Fallback to body if no specific container found
    if (extractedText.length < 100) {
      extractedText = $("body").text();
    }

    // Clean up the text: remove extra whitespace and normalize
    const cleanedText = extractedText
      .replace(/\s+/g, " ")
      .replace(/\n+/g, "\n")
      .trim();

    if (cleanedText.length < 50) {
      res.status(400).json({ error: "Could not find a job description on this page. Please paste it manually." });
      return;
    }

    res.json({ text: cleanedText });
  } catch (err) {
    logger.error({ err, url }, "Job scraping failed");
    res.status(500).json({ error: "Failed to fetch the job page. It might be protected or require login." });
  }
});

export default router;
