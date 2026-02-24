import { Download, Eye, Filter, Layers, PlusCircle, XCircle } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const candidates = [
  {
    rank: 1,
    name: "Sarah Jenkins",
    location: "San Francisco, CA",
    role: "Senior Product Designer",
    company: "Airbnb",
    experience: "4.5 yrs",
    score: 98,
    skills: ["Design Systems", "Figma", "Prototyping"],
  },
  {
    rank: 2,
    name: "Michael Chen",
    location: "New York, NY",
    role: "Lead UI Designer",
    company: "Spotify",
    experience: "6 yrs",
    score: 94,
    skills: ["User Research", "UI Design", "+2"],
  },
  {
    rank: 3,
    name: "Elena Rodriguez",
    location: "Austin, TX",
    role: "Product Designer II",
    company: "Stripe",
    experience: "3 yrs",
    score: 89,
    skills: ["Fintech", "Motion Design"],
  },
]

function CandidateRankingPage() {
  return (
    <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-primary">Senior Product Designer Role</p>
            <h1 className="text-3xl font-black tracking-tight">Candidate Ranking</h1>
            <p className="text-sm text-muted-foreground">
              Reviewing 248 applicants ranked by AI matching score.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="size-4" />
              Export Results
            </Button>
            <Button className="gap-2">
              <PlusCircle className="size-4" />
              Create Shortlist
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="grid gap-4 p-4 lg:grid-cols-12 lg:items-end">
            <div className="space-y-2 lg:col-span-5">
              <p className="text-sm font-semibold">Matching Score Range</p>
              <Progress value={75} />
              <p className="text-xs font-bold text-primary">75% - 100%</p>
            </div>
            <label className="space-y-2 lg:col-span-2">
              <span className="text-sm font-semibold">Experience</span>
              <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option>5+ Years</option>
                <option>8+ Years</option>
                <option>10+ Years</option>
              </select>
            </label>
            <label className="space-y-2 lg:col-span-2">
              <span className="text-sm font-semibold">Status</span>
              <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option>All Candidates</option>
                <option>New Applicants</option>
                <option>Screened</option>
                <option>Shortlisted</option>
              </select>
            </label>
            <div className="flex flex-wrap justify-end gap-2 lg:col-span-3">
              <Button variant="outline" className="gap-2">
                <Filter className="size-4" />
                Advanced Filters
              </Button>
              <Button variant="outline" className="gap-2">
                <Layers className="size-4" />
                Bulk Actions
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead className="w-52">AI Match Score</TableHead>
                  <TableHead>Key Matched Skills</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((candidate) => (
                  <TableRow key={candidate.name}>
                    <TableCell>
                      <Badge variant={candidate.rank === 1 ? "warning" : "outline"}>
                        #{candidate.rank}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10">
                          <AvatarImage src={`https://i.pravatar.cc/120?img=${candidate.rank + 10}`} />
                          <AvatarFallback>{candidate.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{candidate.name}</p>
                          <p className="text-xs text-muted-foreground">{candidate.location}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{candidate.role}</p>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {candidate.company} • {candidate.experience}
                      </p>
                    </TableCell>
                    <TableCell className="space-y-2">
                      <p className="text-xs font-bold text-primary">{candidate.score}% Match</p>
                      <Progress value={candidate.score} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {candidate.skills.map((skill) => (
                          <Badge key={skill}>{skill}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon">
                          <PlusCircle className="size-4 text-emerald-600" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <XCircle className="size-4 text-rose-600" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Eye className="size-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between border-t px-6 py-4">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-bold text-foreground">1-10</span> of{" "}
                <span className="font-bold text-foreground">248</span> candidates
              </p>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline">
                  1
                </Button>
                <Button size="sm" variant="ghost">
                  2
                </Button>
                <Button size="sm" variant="ghost">
                  3
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  )
}

export default CandidateRankingPage
