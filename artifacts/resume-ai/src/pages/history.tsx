import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  Target, Clock, ArrowRight, Search, SlidersHorizontal, Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useListAnalyses,
  getListAnalysesQueryKey,
  useDeleteAnalysis,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type ScoreFilter = "all" | "strong" | "moderate" | "weak";

const scoreFilters: { label: string; value: ScoreFilter; color: string }[] = [
  { label: "All", value: "all", color: "" },
  { label: "Strong 80+", value: "strong", color: "text-primary" },
  { label: "Moderate 60–79", value: "moderate", color: "text-yellow-400" },
  { label: "Weak <60", value: "weak", color: "text-red-400" },
];

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-primary" : score >= 60 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-semibold tabular-nums">{score}%</span>
    </div>
  );
}

export default function History() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>("all");

  const { data: analyses, isLoading } = useListAnalyses(
    {},
    { query: { queryKey: getListAnalysesQueryKey({}) } }
  );

  const deleteMutation = useDeleteAnalysis({
    mutation: {
      onSuccess: () => {
        toast({ title: "Analysis deleted" });
        qc.invalidateQueries({ queryKey: getListAnalysesQueryKey({}) });
      },
    },
  });

  const filtered = useMemo(() => {
    if (!analyses) return [];
    return analyses.filter((a) => {
      const matchesSearch =
        !search ||
        a.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
        (a.companyName ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesScore =
        scoreFilter === "all" ||
        (scoreFilter === "strong" && a.matchScore >= 80) ||
        (scoreFilter === "moderate" && a.matchScore >= 60 && a.matchScore < 80) ||
        (scoreFilter === "weak" && a.matchScore < 60);
      return matchesSearch && matchesScore;
    });
  }, [analyses, search, scoreFilter]);

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Analysis History</h1>
          <p className="text-muted-foreground text-sm">All your past analyses in one place.</p>
        </div>
        <Link href="/analyze">
          <Button size="sm" className="bg-primary text-primary-foreground gap-2">
            <Target className="h-4 w-4" />
            New analysis
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 bg-card border-border"
            placeholder="Search by job title or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          {scoreFilters.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={scoreFilter === f.value ? "default" : "outline"}
              className={`text-xs h-8 ${scoreFilter === f.value ? "bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}
              onClick={() => setScoreFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary badges */}
      {analyses && (
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <Badge variant="outline" className="border-border text-muted-foreground text-xs">
            {filtered.length} of {analyses.length} analyses
          </Badge>
          {filtered.length > 0 && (
            <Badge variant="outline" className="border-primary/30 text-primary text-xs">
              Avg score: {Math.round(filtered.reduce((s, a) => s + a.matchScore, 0) / filtered.length)}%
            </Badge>
          )}
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {isLoading ? (
          [...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
        ) : filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-10 text-center">
            <Target className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
            {analyses?.length === 0 ? (
              <>
                <p className="text-sm text-muted-foreground mb-3">No analyses yet.</p>
                <Link href="/analyze">
                  <Button size="sm" className="bg-primary text-primary-foreground">
                    Run your first analysis
                  </Button>
                </Link>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No analyses match your filters.</p>
            )}
          </div>
        ) : (
          filtered.map((analysis) => (
            <div key={analysis.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/20 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <Link href={`/analyses/${analysis.id}`}>
                    <div className="font-medium text-sm truncate hover:text-primary transition-colors cursor-pointer">
                      {analysis.jobTitle}
                    </div>
                  </Link>
                  <div className="flex items-center gap-2 mt-0.5">
                    {analysis.companyName && (
                      <span className="text-xs text-muted-foreground truncate">{analysis.companyName}</span>
                    )}
                    {analysis.companyName && <span className="text-muted-foreground/40 text-xs">·</span>}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(analysis.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-4 shrink-0">
                  <ScoreBar score={analysis.matchScore} />
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="text-green-400">{analysis.keywordsMatched.length}</span>
                    <span>/</span>
                    <span className="text-red-400">{analysis.keywordsMissing.length}</span>
                    <span>keywords</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Link href={`/analyses/${analysis.id}`}>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 opacity-60 group-hover:opacity-100">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.preventDefault();
                      deleteMutation.mutate({ id: analysis.id });
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
