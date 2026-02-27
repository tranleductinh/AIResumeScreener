import { CloudUpload, LoaderCircle, PlayCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"

const EmptyAndLoadingStatesPage = () => {
  return (
    <div className="mx-auto max-w-5xl space-y-10">
        <Card>
          <CardContent className="flex flex-col items-center px-6 py-14 text-center">
            <span className="mb-7 flex size-28 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CloudUpload className="size-14" />
            </span>
            <h2 className="text-2xl font-bold tracking-tight">No resumes uploaded yet</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Upload your first batch of resumes. AI will extract skills, education,
              and rank candidates against job descriptions.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button>Upload Resumes</Button>
              <Button variant="outline" className="gap-2">
                <PlayCircle className="size-4" />
                View Tutorial
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="items-center text-center">
            <span className="mb-3 flex size-20 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <LoaderCircle className="size-10 animate-spin" />
            </span>
            <CardTitle className="text-2xl">AI is analyzing resumes...</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="mx-auto max-w-xl space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Processing 12 candidate files</span>
                <span className="font-bold text-primary">65%</span>
              </div>
              <Progress value={65} />
              <p className="text-center text-sm text-muted-foreground">
                This may take a few seconds while AI extracts skills and education data.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="space-y-2 rounded-lg border p-4">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
    </div>
  )
}

export default EmptyAndLoadingStatesPage
