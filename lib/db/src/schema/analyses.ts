import { pgTable, text, serial, timestamp, integer, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const analysesTable = pgTable("analyses", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => usersTable.id),
  resumeId: integer("resume_id"),
  jobTitle: text("job_title").notNull(),
  companyName: text("company_name"),
  jobDescription: text("job_description").notNull(),
  resumeContent: text("resume_content").notNull().default(""),
  matchScore: integer("match_score").notNull().default(0),
  tailoredResume: text("tailored_resume").notNull().default(""),
  coverLetter: text("cover_letter").notNull().default(""),
  keywordsMatched: text("keywords_matched").notNull().default("[]"),
  keywordsMissing: text("keywords_missing").notNull().default("[]"),
  interviewQuestions: text("interview_questions").notNull().default("[]"),
  status: varchar("status", { length: 20 }).notNull().default("saved"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAnalysisSchema = createInsertSchema(analysesTable).omit({ id: true, createdAt: true });
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analysesTable.$inferSelect;
