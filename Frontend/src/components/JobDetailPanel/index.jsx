import { Lightbulb, SquarePen } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const JobDetailPanel = ({ selectedJob, onOpenEdit, onDeleteJob }) => {
  return (
    <div className="space-y-6 lg:col-span-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Job Detail Preview
            <Button variant="ghost" size="sm" className="gap-2" onClick={() => onOpenEdit()}>
              <SquarePen className="size-3.5" />
              Edit Job
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {selectedJob ? (
            <>
              <div>
                <h3 className="text-xl font-bold">{selectedJob.title}</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge>{selectedJob.employmentType || "full-time"}</Badge>
                  <Badge variant="outline">
                    {selectedJob?.location?.remotePolicy || "onsite"}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Description
                </p>
                <p className="line-clamp-4 text-sm text-muted-foreground">{selectedJob.jdText}</p>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Skill Requirements
                </p>
                <div className="flex flex-wrap gap-2">
                  {(selectedJob?.jdParsed?.requiredSkills || []).slice(0, 6).map((skill) => (
                    <Badge key={skill} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                  {!selectedJob?.jdParsed?.requiredSkills?.length ? (
                    <Badge variant="outline">No parsed skills yet</Badge>
                  ) : null}
                </div>
              </div>

              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Auto-Reject Under Score</span>
                  <span className="font-bold">
                    {selectedJob?.screeningConfig?.autoRejectBelowScore || 0}%
                  </span>
                </div>
                <Progress value={selectedJob?.screeningConfig?.autoRejectBelowScore || 0} />
              </div>

              <Button
                variant="destructive"
                className="w-full"
                onClick={() => onDeleteJob(selectedJob._id)}>
                Delete Job
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Select a job to preview details.</p>
          )}
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
            Use clear JD text with required skills to get more accurate candidate ranking.
          </p>
          <Button
            variant="outline"
            className="mt-4 border-white/30 text-primary-foreground hover:bg-white/20">
            Adjust Parameters
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default JobDetailPanel;
