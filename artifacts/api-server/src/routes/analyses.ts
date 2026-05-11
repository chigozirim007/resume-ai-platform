import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, analysesTable, usersTable } from "@workspace/db";
import {
  CreateAnalysisBody,
  GetAnalysisParams,
  DeleteAnalysisParams,
} from "@workspace/api-zod";
import { analyzeResume } from "../lib/ai";

import { aiRateLimiter } from "../middlewares/rate-limiter";

const router: IRouter = Router();

router.get("/analyses", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const analyses = await db
    .select()
    .from(analysesTable)
    .where(eq(analysesTable.userId, req.user.id))
    .orderBy(desc(analysesTable.createdAt));

  res.json(
    analyses.map((a) => ({
      ...a,
      keywordsMatched: JSON.parse(a.keywordsMatched) as string[],
      keywordsMissing: JSON.parse(a.keywordsMissing) as string[],
    }))
  );
});

router.post("/analyses", aiRateLimiter, async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreateAnalysisBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { resumeId, jobTitle, companyName, jobDescription, resumeContent } = parsed.data;
  const userId = req.user.id;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const FREE_LIMIT = 3;
  if (user.plan === "free" && user.usageCount >= FREE_LIMIT) {
    res.status(403).json({ error: "Free plan limit reached. Upgrade to Pro for unlimited analyses." });
    return;
  }

  try {
    // 1. Initialize analysis record with 'analyzing' status
    const [initialAnalysis] = await db
      .insert(analysesTable)
      .values({
        userId,
        resumeId: resumeId ?? null,
        jobTitle,
        companyName: companyName ?? null,
        jobDescription,
        resumeContent,
        status: "analyzing",
      })
      .returning();

    // 2. Perform the actual AI analysis
    const result = await analyzeResume(resumeContent, jobTitle, companyName, jobDescription);

    // 3. Finalize with result data
    const [finalAnalysis] = await db
      .update(analysesTable)
      .set({
        matchScore: result.matchScore,
        tailoredResume: result.tailoredResume,
        coverLetter: result.coverLetter,
        keywordsMatched: JSON.stringify(result.keywordsMatched),
        keywordsMissing: JSON.stringify(result.keywordsMissing),
        interviewQuestions: JSON.stringify(result.interviewQuestions || []),
        status: "completed",
      })
      .where(eq(analysesTable.id, initialAnalysis.id))
      .returning();

    await db
      .update(usersTable)
      .set({ usageCount: user.usageCount + 1 })
      .where(eq(usersTable.id, userId));

    res.status(201).json({
      ...finalAnalysis,
      keywordsMatched: result.keywordsMatched,
      keywordsMissing: result.keywordsMissing,
    });
  } catch (err: any) {
    const message = err instanceof Error ? err.message : String(err);
    const status = err?.status || err?.response?.status;
    
    console.error("Analysis failed:", message);
    
    if (status === 429 || message.toLowerCase().includes("quota") || message.includes("429")) {
      res.status(429).json({ 
        error: "Our AI servers are currently at capacity. Please try again later or upgrade your plan." 
      });
      return;
    }
    
    res.status(500).json({ error: `Analysis failed: ${message}` });
  }
});

router.get("/analyses/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = GetAnalysisParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [analysis] = await db
    .select()
    .from(analysesTable)
    .where(eq(analysesTable.id, params.data.id))
    .limit(1);

  if (!analysis || analysis.userId !== req.user.id) {
    res.status(404).json({ error: "Analysis not found" });
    return;
  }

  res.json({
    ...analysis,
    keywordsMatched: JSON.parse(analysis.keywordsMatched) as string[],
    keywordsMissing: JSON.parse(analysis.keywordsMissing) as string[],
  });
});

router.delete("/analyses/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = DeleteAnalysisParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [analysis] = await db
    .delete(analysesTable)
    .where(eq(analysesTable.id, params.data.id))
    .returning();

  if (!analysis) {
    res.status(404).json({ error: "Analysis not found" });
    return;
  }

  res.sendStatus(204);
});

import PDFDocument from "pdfkit";

router.get("/analyses/:id/export", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = GetAnalysisParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [analysis] = await db
    .select()
    .from(analysesTable)
    .where(eq(analysesTable.id, params.data.id))
    .limit(1);

  if (!analysis || analysis.userId !== req.user.id) {
    res.status(404).json({ error: "Analysis not found" });
    return;
  }

  try {
    const doc = new PDFDocument({ margin: 50 });
    const filename = `Tailored_Resume_${analysis.jobTitle.replace(/\s+/g, "_")}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).font("Helvetica-Bold").text(analysis.jobTitle.toUpperCase(), { align: "center" });
    doc.moveDown();
    
    // Content
    doc.fontSize(11).font("Helvetica").text(analysis.tailoredResume, {
      align: "left",
      lineGap: 2,
    });

    doc.end();
  } catch (err) {
    console.error("PDF Export failed:", err);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

export default router;
