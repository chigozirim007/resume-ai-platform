import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, analysesTable, usersTable } from "@workspace/db";
import {
  CreateAnalysisBody,
  GetAnalysisParams,
  DeleteAnalysisParams,
} from "@workspace/api-zod";
import { analyzeResume } from "../lib/ai";

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

router.post("/analyses", async (req, res): Promise<void> => {
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
    const result = await analyzeResume(resumeContent, jobTitle, companyName, jobDescription);

    const [analysis] = await db
      .insert(analysesTable)
      .values({
        userId,
        resumeId: resumeId ?? null,
        jobTitle,
        companyName: companyName ?? null,
        jobDescription,
        resumeContent,
        matchScore: result.matchScore,
        tailoredResume: result.tailoredResume,
        coverLetter: result.coverLetter,
        keywordsMatched: JSON.stringify(result.keywordsMatched),
        keywordsMissing: JSON.stringify(result.keywordsMissing),
        interviewQuestions: JSON.stringify(result.interviewQuestions || []),
        status: "completed",
      })
      .returning();

    await db
      .update(usersTable)
      .set({ usageCount: user.usageCount + 1 })
      .where(eq(usersTable.id, userId));

    res.status(201).json({
      ...analysis,
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

export default router;
