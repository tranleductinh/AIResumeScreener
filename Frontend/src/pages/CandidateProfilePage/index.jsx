import {
  CalendarDays,
  Download,
  Globe,
  Mail,
  Phone,
  Sparkles,
  TriangleAlert,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const highlights = [
  "Maintained a global design system used by 50+ engineers.",
  "Spearheaded accessibility audits for WCAG 2.1 AA compliance.",
  "Mentored 2 junior designers and facilitated weekly critiques.",
]

function CandidateProfilePage() {
  return (
    <div className="space-y-6">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Candidates / Senior Product Designer / Alex Rivera
        </p>

        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div className="flex items-center gap-4">
              <Avatar className="size-20 rounded-2xl">
                <AvatarImage src="https://i.pravatar.cc/200?img=40" alt="Alex Rivera" />
                <AvatarFallback>AR</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight">Alex Rivera</h1>
                  <Badge>94 / 100 Match Score</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Senior Product Designer • 8+ years exp • San Francisco, CA
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline">Remote</Badge>
                  <Badge variant="outline">Design Systems</Badge>
                  <Badge variant="outline">SaaS</Badge>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="gap-2">
                <Download className="size-4" />
                Resume
              </Button>
              <Button className="gap-2">
                <CalendarDays className="size-4" />
                Schedule Interview
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-12">
          <aside className="space-y-6 lg:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
                  Contact Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="size-4 text-muted-foreground" />
                  <span>alex.rivera@design.co</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="size-4 text-muted-foreground" />
                  <span>+1 (555) 234-5678</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Globe className="size-4 text-muted-foreground" />
                  <span>arivera.design</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/30 border-l-4">
              <CardHeader>
                <CardTitle>Hiring Recommendation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Strong <span className="font-bold text-primary">Must Interview</span>.
                  Excellent match on required technical and collaboration criteria.
                </p>
              </CardContent>
            </Card>
          </aside>

          <section className="space-y-6 lg:col-span-8">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-emerald-300/40 bg-emerald-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="size-4" />
                    Key Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>Expert knowledge of Figma and Design Systems.</p>
                  <p>Strong background in B2B SaaS complexity.</p>
                </CardContent>
              </Card>

              <Card className="border-amber-300/40 bg-amber-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <TriangleAlert className="size-4" />
                    Skill Gaps
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>Limited experience with native mobile design.</p>
                  <p>No advanced Framer prototyping projects.</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>AI Summary</CardTitle>
                <CardDescription>
                  Professional overview and alignment with the target role.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 text-sm text-muted-foreground">
                <p>
                  Alex Rivera is a seasoned product designer with 8+ years building
                  scalable design systems and SaaS interfaces.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">Technical Fit</p>
                    <Progress value={95} />
                    <p className="text-xs">95%</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">Cultural Fit</p>
                    <Progress value={88} />
                    <p className="text-xs">88%</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-foreground">Resume Highlights</p>
                  <ul className="space-y-1">
                    {highlights.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
                  Verified Technical Skills
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {[
                  "UI/UX Design",
                  "Product Strategy",
                  "Figma (Expert)",
                  "React Basics",
                  "User Testing",
                  "Prototyping",
                  "Design Systems",
                  "Auto Layout",
                ].map((skill) => (
                  <Badge key={skill} variant="outline">
                    {skill}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          </section>
        </div>
    </div>
  )
}

export default CandidateProfilePage
