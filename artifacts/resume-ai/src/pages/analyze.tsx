import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Zap, Target, ChevronDown, FileUp, Loader2, Link as LucideLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCreateAnalysis, useListResumes, getListResumesQueryKey, useExtractResumeText, useScrapeJobDescription } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import UpgradeModal from "@/components/upgrade-modal";

export default function Analyze() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeContent, setResumeContent] = useState("");
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-fill from URL search params (re-analyze flow)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("jobTitle")) setJobTitle(params.get("jobTitle")!);
    if (params.get("companyName")) setCompanyName(params.get("companyName")!);
    if (params.get("jobDescription")) setJobDescription(params.get("jobDescription")!);
    if (params.get("resumeContent")) setResumeContent(params.get("resumeContent")!);
  }, []);

  const { data: savedResumes } = useListResumes(
    {},
    { query: { queryKey: getListResumesQueryKey({}) } }
  );

  const extractResume = useExtractResumeText({
    mutation: {
      onSuccess: (res) => {
        if (res.text) {
          setResumeContent(res.text);
          toast({ title: "Success", description: "Text extracted from file correctly." });
        }
      },
      onError: (err: any) => {
        const msg = err?.data?.error || "Failed to extract text. Please try pasting manually.";
        toast({ title: "Extraction failed", description: msg, variant: "destructive" });
      }
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      extractResume.mutate({ data: { file: file as unknown as Blob } });
    }
  };

  const scrapeJob = useScrapeJobDescription({
    mutation: {
      onSuccess: (res) => {
        if (res.text) {
          setJobDescription(res.text);
          toast({ title: "Success", description: "Job description extracted from URL." });
          setJobUrl("");
        }
      },
      onError: (err: any) => {
        const msg = err?.data?.error || "Failed to fetch job description. Please try pasting it.";
        toast({ title: "Scrape failed", description: msg, variant: "destructive" });
      }
    }
  });

  const handleScrape = () => {
    if (!jobUrl.trim()) return;
    scrapeJob.mutate({ data: { url: jobUrl.trim() } });
  };

  const createAnalysis = useCreateAnalysis({
    mutation: {
      onSuccess: (analysis) => {
        navigate(`/analyses/${analysis.id}`);
      },
      onError: (err: unknown) => {
        const status = (err as { status?: number })?.status;
        if (status === 403) {
          setShowUpgrade(true);
          return;
        }
        const message =
          typeof err === "object" && err !== null && "data" in err
            ? String((err as { data: unknown }).data)
            : "Something went wrong. Please try again.";
        toast({ title: "Analysis failed", description: message, variant: "destructive" });
      },
    },
  });

  const loadSavedResume = (id: number) => {
    const resume = savedResumes?.find((r) => r.id === id);
    if (resume) {
      setResumeContent(resume.content);
      setSelectedResumeId(id);
    }
  };

  const canSubmit = jobTitle.trim() && jobDescription.trim() && resumeContent.trim();

  const handleSubmit = () => {
    if (!canSubmit) return;
    createAnalysis.mutate({
      data: {
        resumeId: selectedResumeId,
        jobTitle: jobTitle.trim(),
        companyName: companyName.trim() || undefined,
        jobDescription: jobDescription.trim(),
        resumeContent: resumeContent.trim(),
      },
    });
  };

  return (
    <>
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
      <div className="p-6 lg:p-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">New Analysis</h1>
          <p className="text-muted-foreground text-sm">
            Paste the job description and your resume. We'll tailor it, score it, and write you a cover letter.
          </p>
        </div>

        {createAnalysis.isPending ? (
          <div className="flex flex-col items-center justify-center py-20 gap-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="text-center">
              <p className="font-semibold text-lg mb-1">Analyzing your resume...</p>
              <p className="text-sm text-muted-foreground">
                AI is tailoring your resume, scoring your match, and writing a cover letter.
              </p>
              <p className="text-xs text-muted-foreground mt-1">Usually takes 15–30 seconds.</p>
            </div>
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Job details */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="font-medium text-sm mb-4 text-muted-foreground uppercase tracking-wider">Job details</h2>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div className="space-y-1.5">
                  <Label htmlFor="jobTitle" className="text-sm">Job title *</Label>
                  <Input
                    id="jobTitle"
                    className="bg-background border-border"
                    placeholder="e.g. Senior Software Engineer"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="company" className="text-sm">Company name</Label>
                  <Input
                    id="company"
                    className="bg-background border-border"
                    placeholder="e.g. Stripe"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5 mb-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="jobUrl" className="text-sm">Job Posting URL (Optional)</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-[10px] uppercase tracking-wider text-primary hover:bg-primary/5 px-2"
                    onClick={handleScrape}
                    disabled={!jobUrl || scrapeJob.isPending}
                  >
                    {scrapeJob.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <LucideLink className="h-3 w-3 mr-1.5" />}
                    Pull from URL
                  </Button>
                </div>
                <Input
                  id="jobUrl"
                  className="bg-background border-border"
                  placeholder="Paste LinkedIn, Indeed, or any job link..."
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleScrape()}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="jobDesc" className="text-sm">Job description *</Label>
                <div className="relative">
                  <Textarea
                    id="jobDesc"
                    className="bg-background border-border min-h-[200px] resize-y text-sm"
                    placeholder="Paste the full job description here or pull from URL above..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                  />
                  {scrapeJob.isPending && (
                    <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center rounded-md">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="text-xs font-medium">Fetching job details...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Resume */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Your resume</h2>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".pdf,.docx,.doc,.txt"
                    onChange={handleFileChange}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs border-dashed border-primary/40 hover:border-primary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={extractResume.isPending}
                  >
                    {extractResume.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <FileUp className="h-3 w-3" />
                    )}
                    Upload PDF/Word
                  </Button>

                  {savedResumes && savedResumes.length > 0 && (
                    <div className="relative">
                      <select
                        className="text-xs bg-secondary border border-border rounded-lg px-3 py-1.5 pr-7 text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                        value={selectedResumeId ?? ""}
                        onChange={(e) => {
                          const id = Number(e.target.value);
                          if (id) loadSavedResume(id);
                        }}
                      >
                        <option value="">Load saved resume...</option>
                        {savedResumes.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.title}{r.tag ? ` [${r.tag}]` : ""}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                    </div>
                  )}
                </div>
              </div>
              <div className="relative">
                <Textarea
                  className="bg-background border-border min-h-[280px] resize-y font-mono text-sm"
                  placeholder="Paste your resume content here or upload a file. Plain text works best."
                  value={resumeContent}
                  onChange={(e) => setResumeContent(e.target.value)}
                />
                {extractResume.isPending && (
                  <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center rounded-md">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-xs font-medium">Extracting text...</span>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                PDF, Word, Markdown, or plain text. The AI handles the formatting.
              </p>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-4">
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-11 px-6"
                disabled={!canSubmit}
                onClick={handleSubmit}
              >
                <Target className="h-4 w-4" />
                Analyze resume
              </Button>
              {!canSubmit && (
                <p className="text-xs text-muted-foreground">
                  Fill in job title, job description, and resume to continue.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
