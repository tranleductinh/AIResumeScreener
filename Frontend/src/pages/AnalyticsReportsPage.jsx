import { Download, FileChartColumn, MoreHorizontal, Users } from "lucide-react"

import StatCard from "@/components/StatCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const kpis = [
  { label: "Total Resumes", value: "12,450", delta: 12, trend: "positive" },
  { label: "Avg. Match Score", value: "84%", delta: 5, trend: "positive" },
  { label: "Shortlisted", value: "1,204", delta: 2, trend: "negative" },
  { label: "Total Hires", value: "156", delta: 8, trend: "positive" },
]

const reports = [
  "Q2 Diversity & Inclusion Report",
  "Monthly Recruitment Efficiency",
  "Source Quality Audit (LinkedIn vs Indeed)",
]

function AnalyticsReportsPage() {
  return (
    <div className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Analytics &amp; Reports</h1>
            <p className="text-sm text-muted-foreground">
              Data-driven insights into recruitment performance and pipeline quality.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="size-4" />
              Export PDF
            </Button>
            <Button className="gap-2">
              <FileChartColumn className="size-4" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((item) => (
            <StatCard key={item.label} {...item} />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Hiring Funnel</CardTitle>
              <MoreHorizontal className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                ["Sourced", 100, "12.4k"],
                ["Screened", 34, "4.2k"],
                ["Interviewed", 7, "850"],
                ["Offered", 2, "180"],
                ["Hired", 1.5, "156"],
              ].map(([label, percent, volume]) => (
                <div key={label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">
                      {label} ({volume})
                    </span>
                    <span className="text-primary">{percent}%</span>
                  </div>
                  <Progress value={percent} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Time-to-Hire Reduction</CardTitle>
              <CardDescription>Impact of AI screening vs manual process (Days)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative h-64 rounded-lg border bg-muted/10 p-3">
                <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 800 240">
                  <path
                    d="M0,40 L160,35 L320,42 L480,38 L640,40 L800,45"
                    fill="none"
                    stroke="#94a3b8"
                    strokeDasharray="8 4"
                    strokeWidth="3"
                  />
                  <path
                    d="M0,50 L160,80 L320,120 L480,140 L640,180 L800,210"
                    fill="none"
                    stroke="#1337ec"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Skill Analysis: Frontend Developer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                ["React.js / Next.js", 92],
                ["TypeScript Mastery", 84],
                ["System Design", 65],
                ["Testing (Jest/Cypress)", 48],
              ].map(([skill, score]) => (
                <div key={skill} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>{skill}</span>
                    <span className="text-muted-foreground">{score}% Match</span>
                  </div>
                  <Progress value={score} />
                </div>
              ))}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4 text-xs text-primary">
                  Insight: strong technical fundamentals but a significant gap in end-to-end
                  testing.
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Reports Generated</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {reports.map((report) => (
                <div key={report} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Users className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{report}</p>
                      <p className="text-xs text-muted-foreground">Generated recently</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Download className="size-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" className="w-full">
                View All Historical Reports
              </Button>
            </CardContent>
          </Card>
        </div>
    </div>
  )
}

export default AnalyticsReportsPage
