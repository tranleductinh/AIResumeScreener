import { ChevronLeft, ChevronRight, Lightbulb, Plus, SquarePen } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const jobs = [
  {
    title: "Senior Frontend Engineer",
    exp: "5-8 years experience",
    dept: "Engineering",
    candidates: 124,
    delta: "+12 today",
    open: true,
  },
  {
    title: "Product Designer",
    exp: "3-5 years experience",
    dept: "Design",
    candidates: 86,
    delta: "0 new",
    open: true,
  },
  {
    title: "Data Scientist",
    exp: "4+ years experience",
    dept: "AI Research",
    candidates: 210,
    delta: "Closed",
    open: false,
  },
  {
    title: "Marketing Manager",
    exp: "2-4 years experience",
    dept: "Growth",
    candidates: 45,
    delta: "+3 today",
    open: true,
  },
]

const JobManagementPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Job Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage, monitor, and screen your active job listings with AI insights.
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="size-4" />
          Create New Job
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-center">Candidates</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job, index) => (
                  <TableRow key={job.title} className={index === 0 ? "bg-primary/5" : ""}>
                    <TableCell>
                      <p className="font-bold">{job.title}</p>
                      <p className="text-xs text-muted-foreground">{job.exp}</p>
                    </TableCell>
                    <TableCell>{job.dept}</TableCell>
                    <TableCell className="text-center">
                      <p className="font-bold">{job.candidates}</p>
                      <p className="text-xs text-muted-foreground">{job.delta}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={job.open ? "success" : "outline"}>
                        {job.open ? "Open" : "Closed"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between border-t bg-muted/20 px-6 py-4">
              <p className="text-xs text-muted-foreground">Showing 4 of 24 active roles</p>
              <div className="flex gap-2">
                <Button variant="outline" size="icon">
                  <ChevronLeft className="size-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Job Detail Preview
                <Button variant="ghost" size="sm" className="gap-2">
                  <SquarePen className="size-3.5" />
                  Edit Job
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <h3 className="text-xl font-bold">Senior Frontend Engineer</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge>Full-Time</Badge>
                  <Badge variant="outline">Remote Friendly</Badge>
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Description
                </p>
                <p className="text-sm text-muted-foreground">
                  Lead complex UI development and scale AI-driven dashboards across
                  web products.
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Skill Requirements
                </p>
                <div className="flex flex-wrap gap-2">
                  {["React.js", "TypeScript", "Tailwind CSS", "Next.js", "Testing"].map(
                    (skill) => (
                      <Badge key={skill} variant="outline">
                        {skill}
                      </Badge>
                    )
                  )}
                </div>
              </div>

              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Auto-Reject Under Score</span>
                  <span className="font-bold">75%</span>
                </div>
                <Progress value={75} />
              </div>

              <Button className="w-full">View All 124 Candidates</Button>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="size-4" />
                AI Matching Insight
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-primary-foreground/90">
                Required experience is 15% higher than local competitors for this role.
              </p>
              <Button
                variant="outline"
                className="mt-4 border-white/30 text-primary-foreground hover:bg-white/20">
                Adjust Parameters
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default JobManagementPage
