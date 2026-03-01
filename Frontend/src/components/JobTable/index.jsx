import { ChevronLeft, ChevronRight, SquarePen, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const getStatusVariant = (status) => {
  if (status === "open") return "success";
  if (status === "closed") return "outline";
  return "secondary";
};

const JobTable = ({
  jobs,
  selectedJobId,
  loading,
  onSelectJob,
  onEditJob,
  onDeleteJob,
}) => {
  return (
    <Card className="lg:col-span-8">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job Title</TableHead>
              <TableHead>Department</TableHead>
              <TableHead className="text-center">Candidates</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow
                key={job._id}
                onClick={() => onSelectJob(job._id)}
                className={
                  selectedJobId === job._id ? "bg-primary/5 cursor-pointer" : "cursor-pointer"
                }>
                <TableCell>
                  <p className="font-bold">{job.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {job.seniorityLevel || "N/A"} level
                  </p>
                </TableCell>
                <TableCell>{job.department || "N/A"}</TableCell>
                <TableCell className="text-center">
                  <p className="font-bold">{job?.stats?.totalApplicants || 0}</p>
                  <p className="text-xs text-muted-foreground">Applicants</p>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(job.status)}>
                    {(job.status || "draft").replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(event) => {
                        event.stopPropagation();
                        onEditJob(job);
                      }}>
                      <SquarePen className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteJob(job._id);
                      }}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between border-t bg-muted/20 px-6 py-4">
          <p className="text-xs text-muted-foreground">
            {loading ? "Loading jobs..." : `Showing ${jobs.length} jobs`}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" disabled>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="icon" disabled>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default JobTable;
