import {
  Activity,
  CheckCircle2,
  FileUp,
  History,
  Rocket,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import StatCard from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  getDashboardRecentActivity,
  getDashboardSummary,
} from "@/services/api/dashboard";

const activityIcons = {
  FileUp,
  Sparkles,
  CheckCircle2,
  XCircle,
  History,
};

const formatRelativeTime = (value) => {
  if (!value) return "-";

  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(Math.floor(diffMs / 60000), 0);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} mins ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hours ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days ago`;
};

const DashboardPage = () => {
  const [summary, setSummary] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [summaryResponse, activityResponse] = await Promise.all([
        getDashboardSummary(),
        getDashboardRecentActivity({ page: 1, limit: 5 }),
      ]);

      setSummary(summaryResponse?.data?.data || null);
      setActivities(activityResponse?.data?.data?.items || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Cannot fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const stats = useMemo(() => {
    const data = summary?.stats;
    return [
      {
        label: "Total CVs",
        value: data?.totalResumes ?? 0,
        delta: 0,
        trend: "neutral",
      },
      {
        label: "Active Jobs",
        value: data?.activeJobs ?? 0,
        delta: 0,
        trend: "neutral",
      },
      {
        label: "Shortlisted",
        value: data?.shortlistedCandidates ?? 0,
        delta: 0,
        trend: "neutral",
      },
      {
        label: "AI Time Saved",
        value: `${data?.estimatedTimeSavedHours ?? 0} hrs`,
        delta: 0,
        trend: "neutral",
      },
    ];
  }, [summary]);

  const scoreDistribution = summary?.scoreDistribution || [];
  const candidateStatus = summary?.candidateStatus || {
    inScreening: { count: 0, percentage: 0 },
    shortlisted: { count: 0, percentage: 0 },
    rejected: { count: 0, percentage: 0 },
  };

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-8">
        <section className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight">Dashboard Overview</h1>
              <p className="text-sm text-muted-foreground">
                Real-time insights into your hiring pipeline and AI efficiency.
              </p>
            </div>
            <Button className="gap-2" onClick={fetchDashboardData}>
              <FileUp className="size-4" />
              {loading ? "Refreshing..." : "Refresh Dashboard"}
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((item) => (
              <StatCard key={item.label} {...item} />
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Matching Score Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-64 items-end gap-4">
                {scoreDistribution.length ? (
                  scoreDistribution.map((entry) => {
                    const maxValue = Math.max(
                      ...scoreDistribution.map((item) => item.value || 0),
                      1
                    );
                    const height = Math.max(((entry.value || 0) / maxValue) * 100, 4);

                    return (
                      <div
                        key={entry.range}
                        className="flex flex-1 flex-col items-center gap-2">
                        <div className="flex h-52 w-full items-end rounded-md bg-secondary">
                          <div
                            className="w-full rounded-md bg-primary/80"
                            style={{ height: `${height}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground">
                          {entry.range}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                    No screening results yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Candidate Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    In Screening ({candidateStatus.inScreening.count})
                  </span>
                  <span className="font-bold">{candidateStatus.inScreening.percentage}%</span>
                </div>
                <Progress value={candidateStatus.inScreening.percentage} />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Shortlisted ({candidateStatus.shortlisted.count})
                  </span>
                  <span className="font-bold">{candidateStatus.shortlisted.percentage}%</span>
                </div>
                <Progress value={candidateStatus.shortlisted.percentage} />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Rejected ({candidateStatus.rejected.count})
                  </span>
                  <span className="font-bold">{candidateStatus.rejected.percentage}%</span>
                </div>
                <Progress value={candidateStatus.rejected.percentage} />
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      <aside className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Activity
              <History className="size-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {activities.length ? (
              activities.map((item) => {
                const ActivityIcon = activityIcons[item.icon] || History;
                return (
                  <div key={item._id} className="flex gap-3">
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <ActivityIcon className="size-4" />
                    </span>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.sub}</p>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {formatRelativeTime(item.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">No recent activity yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-primary/20 bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-4" />
              Need Help?
            </CardTitle>
            <CardDescription className="text-primary-foreground/85">
              Learn how AI scoring works and improve matching efficiency.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <Badge variant="outline" className="border-white/40 text-primary-foreground">
              Documentation
            </Badge>
            <Rocket className="size-5 text-primary-foreground/80" />
          </CardContent>
        </Card>
      </aside>
    </div>
  );
};

export default DashboardPage;
