import { Router, type IRouter } from "express";
import { eq, desc, avg, count } from "drizzle-orm";
import { db, usersTable, resumesTable, analysesTable } from "@workspace/db";
import { GetRecentAnalysesQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/stats", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.user.id;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const [resumeStats] = await db
    .select({ totalResumes: count() })
    .from(resumesTable)
    .where(eq(resumesTable.userId, userId));

  const [analysisStats] = await db
    .select({ totalAnalyses: count(), avgScore: avg(analysesTable.matchScore) })
    .from(analysesTable)
    .where(eq(analysesTable.userId, userId));

  const FREE_LIMIT = 3;

  res.json({
    totalResumes: resumeStats?.totalResumes ?? 0,
    totalAnalyses: analysisStats?.totalAnalyses ?? 0,
    averageMatchScore: Math.round(Number(analysisStats?.avgScore ?? 0)),
    plan: user.plan,
    usageCount: user.usageCount,
    usageLimit: user.plan === "free" ? FREE_LIMIT : 999999,
  });
});

router.get("/dashboard/recent-analyses", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const query = GetRecentAnalysesQueryParams.safeParse(req.query);
  const limit = query.success ? (query.data.limit ?? 5) : 5;

  const analyses = await db
    .select()
    .from(analysesTable)
    .where(eq(analysesTable.userId, req.user.id))
    .orderBy(desc(analysesTable.createdAt))
    .limit(limit);

  res.json(
    analyses.map((a) => ({
      ...a,
      keywordsMatched: JSON.parse(a.keywordsMatched) as string[],
      keywordsMissing: JSON.parse(a.keywordsMissing) as string[],
    }))
  );
});

export default router;
