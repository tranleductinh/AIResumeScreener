import { CalendarDays, CheckCircle2, Download, Star, TriangleAlert } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

const candidateCols = [
  {
    name: "Elena Rodriguez",
    label: "Top Match",
    score: 98,
    experience: "8 Years",
    previous: ["Stripe", "Airbnb"],
    education: "MFA Design / RISD",
    skills: ["Design Systems (Adv)", "Figma / Prototyping", "React Fundamentals"],
  },
  {
    name: "Marcus Thorne",
    label: "Strong Contender",
    score: 92,
    experience: "12 Years",
    previous: ["Microsoft", "Uber"],
    education: "BS Computer Science / Stanford",
    skills: ["Design Systems (Expert)", "Team Leadership", "User Research"],
  },
  {
    name: "Aisha Kim",
    label: "Qualified",
    score: 89,
    experience: "6 Years",
    previous: ["Figma", "Canva"],
    education: "PhD HCI / CMU",
    skills: ["Visual UI Design", "Motion Graphics", "React (Limited)"],
  },
]

function CandidateComparisonPage() {
  return (
    <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-primary">Back to Job: Senior Product Designer</p>
            <h1 className="text-3xl font-black tracking-tight">Candidate Comparison</h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Side-by-side AI analysis of top shortlisted candidates.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="size-4" />
              Export PDF
            </Button>
            <Button className="gap-2">
              <CalendarDays className="size-4" />
              Schedule Interviews
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
                  View Modes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start">Comparison</Button>
                <Button variant="ghost" className="w-full justify-start">
                  Resume Details
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  AI Insights
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  Feedback
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Filtering Criteria</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Badge>Design Systems</Badge>
                <Badge>SaaS Exp</Badge>
                <Badge variant="outline">Figma</Badge>
                <Badge variant="outline">Leadership</Badge>
              </CardContent>
            </Card>
          </aside>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate Comparison</TableHead>
                    {candidateCols.map((candidate, index) => (
                      <TableHead key={candidate.name}>
                        <div className="flex flex-col items-center gap-2 text-center">
                          <Avatar className="size-14">
                            <AvatarImage src={`https://i.pravatar.cc/160?img=${index + 20}`} />
                            <AvatarFallback>{candidate.name.slice(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{candidate.name}</p>
                            <p className="text-xs text-muted-foreground">{candidate.label}</p>
                          </div>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-semibold">AI Compatibility Score</TableCell>
                    {candidateCols.map((candidate) => (
                      <TableCell key={candidate.name} className="space-y-2">
                        <p className="text-xl font-black text-primary">{candidate.score}</p>
                        <Progress value={candidate.score} />
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold">Skills Match</TableCell>
                    {candidateCols.map((candidate) => (
                      <TableCell key={candidate.name} className="space-y-2">
                        {candidate.skills.map((skill) => (
                          <p key={skill} className="text-xs">
                            • {skill}
                          </p>
                        ))}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold">Experience</TableCell>
                    {candidateCols.map((candidate) => (
                      <TableCell key={candidate.name}>{candidate.experience}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold">Previous Companies</TableCell>
                    {candidateCols.map((candidate) => (
                      <TableCell key={candidate.name}>
                        {candidate.previous.join(" • ")}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold">Education</TableCell>
                    {candidateCols.map((candidate) => (
                      <TableCell key={candidate.name}>{candidate.education}</TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-l-4 border-primary">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-sm">
                Recommendation
                <CheckCircle2 className="size-4 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Elena is the strongest overall fit with direct fintech product exposure.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-sm">
                Key Insight
                <Star className="size-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Marcus brings deep leadership experience if the team is split into pods.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-sm">
                Potential Risk
                <TriangleAlert className="size-4 text-amber-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Aisha may require more ramp-up for production-level frontend engineering.
            </CardContent>
          </Card>
        </div>
    </div>
  )
}

export default CandidateComparisonPage
