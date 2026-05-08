import OpenAI from "openai";
import { logger } from "./logger";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || "https://api.openai.com/v1",
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
});

export interface AnalysisResult {
  matchScore: number;
  tailoredResume: string;
  coverLetter: string;
  keywordsMatched: string[];
  keywordsMissing: string[];
}

export async function analyzeResume(
  resumeContent: string,
  jobTitle: string,
  companyName: string | null | undefined,
  jobDescription: string
): Promise<AnalysisResult> {
  const systemPrompt = `You are an expert resume coach and ATS (Applicant Tracking System) optimization specialist. 
Your job is to:
1. Analyze a resume against a job description
2. Calculate a match score (0-100) based on keyword alignment, skills match, and experience relevance
3. Produce a tailored version of the resume optimized for the job
4. Write a compelling, personalized cover letter
5. Identify matched and missing keywords
6. Generate 5-7 tailored interview questions based on the role and the candidate's specific background

Always respond with valid JSON matching the specified format.`;

  const userPrompt = `Analyze this resume for the following job and provide a complete analysis.

JOB TITLE: ${jobTitle}
COMPANY: ${companyName || "Not specified"}

JOB DESCRIPTION:
${jobDescription}

RESUME:
${resumeContent}

Respond with JSON in this exact format:
{
  "matchScore": <integer 0-100>,
  "keywordsMatched": [<array of matched keywords/skills>],
  "keywordsMissing": [<array of important missing keywords/skills>],
  "tailoredResume": "<the full tailored resume text, formatted professionally>",
  "coverLetter": "<a compelling 3-4 paragraph cover letter addressing this specific role and company>",
  "interviewQuestions": [<array of 5-7 string interview questions tailored to this role and candidate>]
}

Be thorough and professional. The tailored resume should be complete (not truncated). The cover letter should feel personal and specific to this job, not generic.`;

  logger.info({ jobTitle, companyName }, "Starting AI resume analysis");

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 4096,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI");
  }

  const parsed = JSON.parse(content) as AnalysisResult;
  logger.info({ matchScore: parsed.matchScore }, "AI analysis complete");
  return parsed;
}
