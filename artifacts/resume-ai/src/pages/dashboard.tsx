import { Link } from "wouter";
import { ArrowRight, Target, FileText, Zap, TrendingUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetDashboardStats,
  getGetDashboardStatsQueryKey,
  useGetRecentAnalyses,
  getGetRecentAnalysesQueryKey,
} from "@workspace/api-client-react";

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-primary" : score >= 60 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-sm font-semibold tabular-nums w-8 text-right">{score}%</span>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats(
    {},
    { query: { queryKey: getGetDashboardStatsQueryKey({}) } }
  );

  const { data: recentAnalyses, isLoading: analysesLoading } = useGetRecentAnalyses(
    { limit: 5 },
    { query: { queryKey: getGetRecentAnalysesQueryKey({ limit: 5 }) } }
  );

  const usagePercent = stats ? Math.round((stats.usageCount / stats.usageLimit) * 100) : 0;

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Welcome back. Here's your application overview.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Analyses run",
            value: statsLoading ? null : stats?.totalAnalyses ?? 0,
            icon: Zap,
            sub: "total",
          },
          {
            label: "Avg match score",
            value: statsLoading ? null : `${stats?.averageMatchScore ?? 0}%`,
            icon: Target,
            sub: "across all analyses",
          },
          {
            label: "Saved resumes",
            value: statsLoading ? null : stats?.totalResumes ?? 0,
            icon: FileText,
            sub: "in library",
          },
          {
            label: "Plan",
            value: statsLoading ? null : stats?.plan === "pro" ? "Pro" : "Free",
            icon: TrendingUp,
            sub: statsLoading ? "" : `${stats?.usageCount}/${stats?.usageLimit} uses`,
          },
        ].map((card) => (
          <div key={card.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">{card.label}</span>
              <card.icon className="h-4 w-4 text-primary opacity-60" />
            </div>
            {card.value === null ? (
              <Skeleton className="h-7 w-16 mb-1" />
            ) : (
              <div className="text-2xl font-bold mb-1">{card.value}</div>
            )}
            <div className="text-xs text-muted-foreground">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Usage bar (free plan) */}
      {stats && stats.plan === "free" && (
        <div className="bg-card border border-border rounded-xl p-4 mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Free plan usage</span>
            <Badge variant="outline" className="text-xs border-primary/30 text-primary">
              {stats.usageCount} / {stats.usageLimit} analyses
            </Badge>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {stats.usageLimit - stats.usageCount} free analyses remaining. Upgrade to Pro for unlimited.
          </p>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <Link href="/analyze">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 hover:bg-primary/10 transition-colors cursor-pointer group">
            <div className="flex items-center justify-between mb-3">
              <Zap className="h-5 w-5 text-primary" />
              <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="font-semibold mb-1">New analysis</div>
            <div className="text-sm text-muted-foreground">Paste a job description and get an optimized resume in seconds.</div>
          </div>
        </Link>
        <Link href="/resumes">
          <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors cursor-pointer group">
            <div className="flex items-center justify-between mb-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="font-semibold mb-1">My resumes</div>
            <div className="text-sm text-muted-foreground">Manage your saved resume versions and base templates.</div>
          </div>
        </Link>
      </div>

      {/* Recent analyses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Recent analyses</h2>
          <Link href="/history">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
              View all
            </Button>
          </Link>
        </div>
        <div className="space-y-3">
          {analysesLoading ? (
            [...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))
          ) : !recentAnalyses || recentAnalyses.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <Target className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-3">No analyses yet.</p>
              <Link href="/analyze">
                <Button size="sm" className="bg-primary text-primary-foreground">
                  Run your first analysis
                </Button>
              </Link>
            </div>
          ) : (
            recentAnalyses.map((analysis) => (
              <Link key={analysis.id} href={`/analyses/${analysis.id}`}>
                <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{analysis.jobTitle}</div>
                      {analysis.companyName && (
                        <div className="text-xs text-muted-foreground truncate">{analysis.companyName}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="w-32 hidden sm:block">
                        <ScoreBar score={analysis.matchScore} />
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(analysis.createdAt).toLocaleDateString()}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
