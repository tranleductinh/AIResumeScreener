import {
  Activity,
  CheckCircle2,
  FileUp,
  History,
  Rocket,
  Sparkles,
} from "lucide-react"

import StatCard from "@/components/StatCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const stats = [
  { label: "Total CVs", value: "12,450", delta: 12, trend: "positive" },
  { label: "Active Jobs", value: "42", delta: 0, trend: "neutral" },
  { label: "Shortlisted", value: "890", delta: 5, trend: "negative" },
  { label: "AI Time Saved", value: "320 hrs", delta: 18, trend: "positive" },
]

const scoreDistribution = [
  { range: "0-20", value: 15 },
  { range: "21-40", value: 35 },
  { range: "41-60", value: 65 },
  { range: "61-80", value: 85 },
  { range: "81-100", value: 45 },
]

const activities = [
  {
    title: "15 New Resumes Uploaded",
    sub: "Senior Product Designer role",
    time: "12 mins ago",
    icon: FileUp,
  },
  {
    title: "AI Analysis Complete",
    sub: "Found 4 top candidates for Backend Engineer",
    time: "2 hours ago",
    icon: Sparkles,
  },
  {
    title: "Job Posted Successfully",
    sub: "Marketing Lead position is now active",
    time: "5 hours ago",
    icon: CheckCircle2,
  },
]

const DashboardPage = () => {
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
            <Button className="gap-2">
              <FileUp className="size-4" />
              Upload Resume
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
                {scoreDistribution.map((entry) => (
                  <div key={entry.range} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-52 w-full items-end rounded-md bg-secondary">
                      <div
                        className="w-full rounded-md bg-primary/80"
                        style={{ height: `${entry.value}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {entry.range}
                    </span>
                  </div>
                ))}
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
                  <span className="text-muted-foreground">In Screening</span>
                  <span className="font-bold">65%</span>
                </div>
                <Progress value={65} />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Shortlisted</span>
                  <span className="font-bold">25%</span>
                </div>
                <Progress value={25} />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Rejected</span>
                  <span className="font-bold">10%</span>
                </div>
                <Progress value={10} />
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
            {activities.map((item) => (
              <div key={item.title} className="flex gap-3">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <item.icon className="size-4" />
                </span>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.sub}</p>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {item.time}
                  </p>
                </div>
              </div>
            ))}
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
  )
}

export default DashboardPage
