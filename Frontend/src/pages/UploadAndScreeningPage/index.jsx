import {
  File,
  FileText,
  PlayCircle,
  Rocket,
  Upload,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const skills = ["React.js", "Node.js", "TypeScript", "AWS"]

const files = [
  { name: "alex_smith_cv_2024.pdf", size: "1.2 MB", type: "pdf", progress: 100 },
  { name: "sarah_connor_portfolio.docx", size: "Uploading", type: "doc", progress: 65 },
  { name: "j_doe_resume_v2.pdf", size: "890 KB", type: "pdf", progress: 100 },
  { name: "michael_brown_dev_ops.pdf", size: "2.4 MB", type: "pdf", progress: 100 },
]

const UploadAndScreeningPage = () => {
  return (
    <div className="space-y-8">
        <section className="relative overflow-hidden rounded-xl bg-slate-900 p-8 text-white shadow-lg lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_40%,rgba(19,55,236,0.35)_0%,transparent_55%)]" />
          <div className="relative z-10 max-w-2xl space-y-4">
            <h1 className="text-4xl font-black tracking-tight lg:text-5xl">
              Upload &amp; AI Screening
            </h1>
            <p className="text-slate-300">
              Select a target role and competencies, then let AI rank resumes by
              skill match and experience depth.
            </p>
            <Button variant="outline" className="gap-2 border-white/30 text-white hover:bg-white/15">
              <PlayCircle className="size-4" />
              Watch Tutorial
            </Button>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-5">
            <Card>
              <CardHeader>
                <CardTitle>Job Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <label className="space-y-2">
                  <span className="text-sm font-semibold">Target Job Position</span>
                  <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option>Senior Fullstack Engineer</option>
                    <option>Product Marketing Manager</option>
                    <option>Data Scientist (L5)</option>
                    <option>UX Designer</option>
                  </select>
                </label>

                <div className="space-y-2">
                  <span className="text-sm font-semibold">Experience Level</span>
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" size="sm">
                      Junior
                    </Button>
                    <Button size="sm">Mid-Level</Button>
                    <Button variant="outline" size="sm">
                      Senior
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-sm font-semibold">Required Skill Keywords</span>
                  <div className="min-h-24 rounded-md border border-dashed border-border bg-muted/20 p-3">
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <Badge key={skill} className="gap-1">
                          {skill}
                          <X className="size-3" />
                        </Badge>
                      ))}
                      <Badge variant="outline">+ Add Skill</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-base text-primary">AI Match Score</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  The more skill keywords you define, the more accurate the ranking.
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <Card className="lg:col-span-7">
            <CardHeader>
              <CardTitle>Upload Resumes</CardTitle>
              <CardDescription>Drag and drop PDF or DOCX files (up to 50 files).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-xl border-2 border-dashed p-10 text-center">
                <span className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Upload className="size-7" />
                </span>
                <p className="font-semibold">Drag files here or click to browse</p>
                <p className="mt-1 text-sm text-muted-foreground">Max 50 files per batch</p>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Queued Files (4)
                </p>
                {files.map((file) => (
                  <div
                    key={file.name}
                    className="flex items-center gap-3 rounded-lg border bg-muted/20 p-3">
                    <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                      {file.type === "pdf" ? <File className="size-4" /> : <FileText className="size-4" />}
                    </span>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold">{file.name}</p>
                        <span className="text-xs text-muted-foreground">{file.size}</span>
                      </div>
                      <Progress value={file.progress} />
                    </div>
                    <Button size="icon" variant="ghost">
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">
                  <span className="font-bold text-foreground">4 files</span> selected for screening
                </p>
                <Button className="gap-2">
                  <Rocket className="size-4" />
                  Start AI Screening
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
    </div>
  )
}

export default UploadAndScreeningPage
