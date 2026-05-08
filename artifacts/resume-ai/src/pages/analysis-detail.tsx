import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useReactToPrint } from "react-to-print";
import {
  ArrowLeft, Target, Copy, Check, CheckCircle, XCircle, Zap, FileText, Trash2,
  Download, RefreshCw, GitCompare, MessageSquare, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetAnalysis, getGetAnalysisQueryKey, useDeleteAnalysis } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// ── Helpers ──────────────────────────────────────────────────────────────────

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs border-border" onClick={copy}>
      {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : label ?? "Copy"}
    </Button>
  );
}

function DownloadButton({ text, filename }: { text: string; filename: string }) {
  const download = () => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs border-border" onClick={download}>
      <Download className="h-3.5 w-3.5" />
      Download
    </Button>
  );
}

function ScoreMeter({ score }: { score: number }) {
  const color = score >= 80 ? "text-primary" : score >= 60 ? "text-yellow-400" : "text-red-400";
  const bgColor = score >= 80 ? "bg-primary/10 border-primary/30" : score >= 60 ? "bg-yellow-400/10 border-yellow-400/30" : "bg-red-400/10 border-red-400/30";
  const label = score >= 80 ? "Strong match" : score >= 60 ? "Moderate match" : "Weak match";
  const strokeColor = score >= 80 ? "hsl(160 100% 45%)" : score >= 60 ? "#facc15" : "#f87171";
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl border p-6 ${bgColor}`}>
      <div className="relative w-24 h-24 mb-3">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-border" />
          <circle
            cx="48" cy="48" r={r} fill="none"
            stroke={strokeColor} strokeWidth="6"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${color}`}>{score}</span>
          <span className={`text-xs ${color}`}>/ 100</span>
        </div>
      </div>
      <Badge variant="outline" className={`text-xs border ${bgColor} ${color}`}>{label}</Badge>
    </div>
  );
}

// ── Simple line-level diff ────────────────────────────────────────────────────
type DiffLine = { type: "same" | "removed" | "added"; text: string };

function computeDiff(original: string, tailored: string): DiffLine[] {
  const origLines = original.split("\n");
  const newLines = tailored.split("\n");
  const result: DiffLine[] = [];

  // Build a simple LCS-based diff using dp
  const m = origLines.length;
  const n = newLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (origLines[i] === newLines[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  let i = 0, j = 0;
  while (i < m || j < n) {
    if (i < m && j < n && origLines[i] === newLines[j]) {
      result.push({ type: "same", text: origLines[i] });
      i++; j++;
    } else if (j < n && (i >= m || dp[i][j + 1] >= dp[i + 1][j])) {
      result.push({ type: "added", text: newLines[j] });
      j++;
    } else {
      result.push({ type: "removed", text: origLines[i] });
      i++;
    }
  }
  return result;
}

function DiffView({ original, tailored }: { original: string; tailored: string }) {
  const lines = computeDiff(original, tailored);
  const added = lines.filter((l) => l.type === "added").length;
  const removed = lines.filter((l) => l.type === "removed").length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-green-500/20 border border-green-500/40 inline-block" />
          {added} additions
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-red-500/20 border border-red-500/40 inline-block" />
          {removed} removals
        </span>
      </div>
      <div className="font-mono text-xs leading-relaxed overflow-x-auto max-h-[500px] overflow-y-auto rounded-lg border border-border bg-background p-3 space-y-0.5">
        {lines.map((line, idx) => (
          <div
            key={idx}
            className={`px-2 py-0.5 rounded ${
              line.type === "added"
                ? "bg-green-500/10 text-green-300 border-l-2 border-green-500"
                : line.type === "removed"
                ? "bg-red-500/10 text-red-300 border-l-2 border-red-500 line-through opacity-60"
                : "text-foreground/80"
            }`}
          >
            <span className="select-none mr-3 text-muted-foreground/40">
              {line.type === "added" ? "+" : line.type === "removed" ? "−" : " "}
            </span>
            {line.text || " "}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AnalysisDetail({ id }: { id: string }) {
  const analysisId = parseInt(id, 10);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const resumeRef = useRef<HTMLDivElement>(null);

  const { data: analysis, isLoading } = useGetAnalysis(analysisId, {
    query: { enabled: !!analysisId, queryKey: getGetAnalysisQueryKey(analysisId) },
  });

  const handlePrint = useReactToPrint({
    contentRef: resumeRef,
    documentTitle: analysis ? `Resume-${analysis.jobTitle.replace(/\s+/g, "-")}` : "Resume",
  });

  const deleteMutation = useDeleteAnalysis({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries();
        toast({ title: "Analysis deleted" });
        navigate("/history");
      },
    },
  });

  const handleReAnalyze = () => {
    if (!analysis) return;
    const params = new URLSearchParams({
      jobTitle: analysis.jobTitle,
      companyName: analysis.companyName ?? "",
      jobDescription: analysis.jobDescription,
      resumeContent: analysis.resumeContent,
    });
    navigate(`/analyze?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="p-6 lg:p-8 text-center">
        <p className="text-muted-foreground">Analysis not found.</p>
        <Link href="/history">
          <Button variant="ghost" size="sm" className="mt-3">Back to history</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <Link href="/history">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground -ml-2 mt-0.5">
            <ArrowLeft className="h-4 w-4" />
            History
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">{analysis.jobTitle}</h1>
          {analysis.companyName && (
            <p className="text-muted-foreground text-sm">{analysis.companyName}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Analyzed {new Date(analysis.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-border text-sm"
            onClick={handleReAnalyze}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Re-analyze
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => deleteMutation.mutate({ id: analysisId })}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Score + Keywords */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <ScoreMeter score={analysis.matchScore} />
        <div className="sm:col-span-2 space-y-3">
          {analysis.keywordsMatched.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Matched keywords</span>
                <Badge variant="outline" className="text-xs border-primary/30 text-primary ml-auto">
                  {analysis.keywordsMatched.length}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {analysis.keywordsMatched.map((kw) => (
                  <span key={kw} className="text-xs bg-primary/10 text-primary border border-primary/20 rounded px-2 py-0.5">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
          {analysis.keywordsMissing.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="h-4 w-4 text-red-400" />
                <span className="text-sm font-medium">Missing keywords</span>
                <Badge variant="outline" className="text-xs border-red-400/30 text-red-400 ml-auto">
                  {analysis.keywordsMissing.length}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {analysis.keywordsMissing.map((kw) => (
                  <span key={kw} className="text-xs bg-red-400/10 text-red-400 border border-red-400/20 rounded px-2 py-0.5">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="resume">
        <TabsList className="mb-6 bg-card border border-border">
          <TabsTrigger value="resume" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Zap className="h-3.5 w-3.5" />
            Tailored Resume
          </TabsTrigger>
          <TabsTrigger value="cover" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <FileText className="h-3.5 w-3.5" />
            Cover Letter
          </TabsTrigger>
          <TabsTrigger value="interview" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <MessageSquare className="h-3.5 w-3.5" />
            Interview Prep
          </TabsTrigger>
          {analysis.resumeContent && (
            <TabsTrigger value="diff" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <GitCompare className="h-3.5 w-3.5" />
              Diff View
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="resume">
          <div className="bg-card border border-border rounded-xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Tailored resume</span>
                <span className="text-xs text-muted-foreground">Optimized for this role</span>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="gap-1.5 h-8 text-xs border-border bg-primary/5 hover:bg-primary/10 border-primary/20" 
                  onClick={() => handlePrint()}
                >
                  <Download className="h-3.5 w-3.5" />
                  Download PDF
                </Button>
                <DownloadButton
                  text={analysis.tailoredResume}
                  filename={`resume-${analysis.jobTitle.toLowerCase().replace(/\s+/g, "-")}.txt`}
                />
                <CopyButton text={analysis.tailoredResume} label="Copy" />
              </div>
            </div>
            <div className="p-5">
              <pre className="text-sm leading-relaxed whitespace-pre-wrap font-mono text-foreground/90 overflow-x-auto">
                {analysis.tailoredResume}
              </pre>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="cover">
          <div className="bg-card border border-border rounded-xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Cover letter</span>
                <span className="text-xs text-muted-foreground">
                  Personalized for {analysis.companyName || "this role"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <DownloadButton
                  text={analysis.coverLetter}
                  filename={`cover-letter-${analysis.jobTitle.toLowerCase().replace(/\s+/g, "-")}.txt`}
                />
                <CopyButton text={analysis.coverLetter} label="Copy" />
              </div>
            </div>
            <div className="p-5">
              <div className="prose prose-sm prose-invert max-w-none">
                {analysis.coverLetter.split("\n").filter(Boolean).map((para, i) => (
                  <p key={i} className="text-sm leading-relaxed text-foreground/90 mb-3 last:mb-0">
                    {para}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="interview">
          <div className="bg-card border border-border rounded-xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">AI-Tailored Interview Questions</span>
                <span className="text-xs text-muted-foreground">Based on the job and your experience</span>
              </div>
            </div>
            <div className="p-5 space-y-4">
              {analysis.interviewQuestions && analysis.interviewQuestions.length > 0 ? (
                <div className="space-y-4">
                  {analysis.interviewQuestions.map((q, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-lg bg-secondary/50 border border-border/50">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                        {i + 1}
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium leading-relaxed">{q}</p>
                        <div className="flex items-center gap-3">
                          <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-primary px-0">
                            Suggested Answer Tips
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-sm text-muted-foreground">No interview questions generated for this analysis.</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {analysis.resumeContent && (
          <TabsContent value="diff">
            <div className="bg-card border border-border rounded-xl">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <GitCompare className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">What changed</span>
                  <span className="text-xs text-muted-foreground">Original vs tailored, line by line</span>
                </div>
              </div>
              <div className="p-5">
                <DiffView original={analysis.resumeContent} tailored={analysis.tailoredResume} />
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Hidden PDF Printable Component */}
      <div className="hidden">
        <div ref={resumeRef} className="p-16 text-black bg-white font-serif leading-relaxed max-w-[800px] mx-auto">
          <style>{`
            @media print {
              body { background: white !important; }
              pre { font-family: 'Times New Roman', serif !important; font-size: 11pt !important; color: black !important; background: transparent !important; border: none !important; }
            }
          `}</style>
          <pre className="whitespace-pre-wrap text-[11pt]">
            {analysis.tailoredResume}
          </pre>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="mt-8 border-t border-border pt-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Want to optimize for a different role?</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-border gap-1.5" onClick={handleReAnalyze}>
            <RefreshCw className="h-3.5 w-3.5" />
            Re-analyze this job
          </Button>
          <Link href="/analyze">
            <Button size="sm" className="bg-primary text-primary-foreground gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              New analysis
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
