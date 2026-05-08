import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, resumesTable } from "@workspace/db";
import {
  CreateResumeBody,
  GetResumeParams,
  UpdateResumeParams,
  UpdateResumeBody,
  DeleteResumeParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/resumes", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const resumes = await db
    .select()
    .from(resumesTable)
    .where(eq(resumesTable.userId, req.user.id))
    .orderBy(resumesTable.updatedAt);

  res.json(resumes);
});

router.post("/resumes", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreateResumeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [resume] = await db
    .insert(resumesTable)
    .values({ ...parsed.data, userId: req.user.id })
    .returning();
  res.status(201).json(resume);
});

router.get("/resumes/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = GetResumeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [resume] = await db
    .select()
    .from(resumesTable)
    .where(eq(resumesTable.id, params.data.id))
    .limit(1);

  if (!resume || resume.userId !== req.user.id) {
    res.status(404).json({ error: "Resume not found" });
    return;
  }

  res.json(resume);
});

router.patch("/resumes/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = UpdateResumeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateResumeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [resume] = await db
    .update(resumesTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(resumesTable.id, params.data.id))
    .returning();

  if (!resume || resume.userId !== req.user.id) {
    res.status(404).json({ error: "Resume not found" });
    return;
  }

  res.json(resume);
});

router.delete("/resumes/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = DeleteResumeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [resume] = await db
    .delete(resumesTable)
    .where(eq(resumesTable.id, params.data.id))
    .returning();

  if (!resume) {
    res.status(404).json({ error: "Resume not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
