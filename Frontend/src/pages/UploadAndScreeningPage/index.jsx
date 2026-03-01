import {
  CheckCircle2,
  File,
  FileText,
  LoaderCircle,
  PlayCircle,
  Rocket,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getJobs } from "@/services/api/jobs";
import {
  deleteResumeFile,
  getResumeFiles,
  uploadResumeFiles,
} from "@/services/api/resume-files";
import {
  createScreeningRun,
  getScreeningRuns,
  updateScreeningRunStatus,
} from "@/services/api/screening-runs";

const defaultSkills = ["React.js", "Node.js", "TypeScript", "AWS"];

const formatBytes = (value) => {
  if (!value && value !== 0) return "0 B";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN");
};

const getStatusBadgeVariant = (status) => {
  if (status === "completed") return "success";
  if (status === "running") return "warning";
  if (status === "failed") return "destructive";
  return "outline";
};

const UploadAndScreeningPage = () => {
  const fileInputRef = useRef(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [resumeFiles, setResumeFiles] = useState([]);
  const [screeningRuns, setScreeningRuns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [screeningLoading, setScreeningLoading] = useState(false);
  const [startingRun, setStartingRun] = useState(false);
  const [updatingRunId, setUpdatingRunId] = useState("");

  const selectedJob = useMemo(
    () => jobs.find((job) => job._id === selectedJobId) || null,
    [jobs, selectedJobId]
  );

  const fetchJobs = async () => {
    try {
      const response = await getJobs({ page: 1, limit: 100 });
      const items = response?.data?.data?.items || [];
      setJobs(items);
      if (items.length && !selectedJobId) {
        setSelectedJobId(items[0]._id);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Cannot fetch jobs");
    }
  };

  const fetchResumeFiles = async (jobId) => {
    try {
      setLoading(true);
      const response = await getResumeFiles(
        jobId ? { jobId, page: 1, limit: 100 } : { page: 1, limit: 100 }
      );
      setResumeFiles(response?.data?.data?.items || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Cannot fetch resume files");
    } finally {
      setLoading(false);
    }
  };

  const fetchScreeningRuns = async (jobId) => {
    try {
      setScreeningLoading(true);
      const response = await getScreeningRuns(
        jobId ? { jobId, page: 1, limit: 20 } : { page: 1, limit: 20 }
      );
      setScreeningRuns(response?.data?.data?.items || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Cannot fetch screening runs");
    } finally {
      setScreeningLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    fetchResumeFiles(selectedJobId);
    fetchScreeningRuns(selectedJobId);
  }, [selectedJobId]);

  const handleSelectFiles = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setSelectedFiles((previous) => [...previous, ...files].slice(0, 50));
    event.target.value = "";
  };

  const handleRemoveLocalFile = (indexToRemove) => {
    setSelectedFiles((previous) => previous.filter((_, index) => index !== indexToRemove));
  };

  const handleUpload = async () => {
    if (!selectedFiles.length) {
      toast.error("Please select at least one file");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      const formData = new FormData();
      if (selectedJobId) {
        formData.append("jobId", selectedJobId);
      }
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      await uploadResumeFiles(formData, (progressEvent) => {
        const total = progressEvent.total || 1;
        const percent = Math.round((progressEvent.loaded * 100) / total);
        setUploadProgress(percent);
      });

      toast.success("Resume files uploaded");
      setSelectedFiles([]);
      await Promise.all([fetchResumeFiles(selectedJobId), fetchScreeningRuns(selectedJobId)]);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteResumeFile = async (resumeFileId) => {
    if (!window.confirm("Delete this resume file?")) return;
    try {
      await deleteResumeFile(resumeFileId);
      toast.success("Resume file deleted");
      await fetchResumeFiles(selectedJobId);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Delete resume file failed");
    }
  };

  const handleStartScreeningRun = async () => {
    if (!selectedJobId) {
      toast.error("Please select a job first");
      return;
    }

    if (!resumeFiles.length) {
      toast.error("Upload resumes for this job before starting screening");
      return;
    }

    try {
      setStartingRun(true);
      await createScreeningRun({
        jobId: selectedJobId,
        resumeFileIds: resumeFiles.map((file) => file._id),
      });
      toast.success("Screening run created");
      await fetchScreeningRuns(selectedJobId);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Cannot create screening run");
    } finally {
      setStartingRun(false);
    }
  };

  const handleUpdateRunStatus = async (runId, status) => {
    try {
      setUpdatingRunId(runId);
      await updateScreeningRunStatus(runId, { status });
      toast.success("Screening run updated");
      await fetchScreeningRuns(selectedJobId);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Cannot update screening run");
    } finally {
      setUpdatingRunId("");
    }
  };

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-xl bg-slate-900 p-8 text-white shadow-lg lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_40%,rgba(19,55,236,0.35)_0%,transparent_55%)]" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <h1 className="text-4xl font-black tracking-tight lg:text-5xl">
            Upload &amp; AI Screening
          </h1>
          <p className="text-slate-300">
            Upload multiple resumes, track file metadata, and prepare the batch for screening.
          </p>
          <Button
            variant="outline"
            className="gap-2 border-white/30 text-white hover:bg-white/15">
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
                <select
                  value={selectedJobId}
                  onChange={(event) => setSelectedJobId(event.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">No job selected</option>
                  {jobs.map((job) => (
                    <option key={job._id} value={job._id}>
                      {job.title}
                    </option>
                  ))}
                </select>
              </label>

              <div className="space-y-2">
                <span className="text-sm font-semibold">Experience Level</span>
                <div className="rounded-md border bg-muted/20 p-3">
                  <Badge>{selectedJob?.seniorityLevel || "mid"}</Badge>
                  <p className="mt-2 text-sm text-muted-foreground">
                    This level is inherited from the selected job.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-semibold">Required Skill Keywords</span>
                <div className="min-h-24 rounded-md border border-dashed border-border bg-muted/20 p-3">
                  <div className="flex flex-wrap gap-2">
                    {defaultSkills.map((skill) => (
                      <Badge key={skill} className="gap-1">
                        {skill}
                        <X className="size-3" />
                      </Badge>
                    ))}
                    <Badge variant="outline">+ Add Skill</Badge>
                  </div>
                </div>
              </div>

              {selectedJob ? (
                <div className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
                  Selected job: <span className="font-semibold text-foreground">{selectedJob.title}</span>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base text-primary">Upload Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <CardDescription className="text-sm">
                Uploaded resumes can be grouped into screening runs before AI matching starts.
              </CardDescription>
              {uploading ? (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Uploading batch</span>
                    <span className="font-bold">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Screening Runs</CardTitle>
              <CardDescription>
                Start a run from uploaded resumes and update workflow status manually for now.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 p-4">
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-foreground">Current job batch</p>
                  <p className="text-muted-foreground">
                    {resumeFiles.length} resume files ready for screening
                  </p>
                </div>
                <Button
                  onClick={handleStartScreeningRun}
                  disabled={startingRun || !selectedJobId || !resumeFiles.length}>
                  {startingRun ? "Starting..." : "Start Run"}
                </Button>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Recent Runs {screeningLoading ? "(loading...)" : `(${screeningRuns.length})`}
                </p>
                {screeningRuns.length ? (
                  screeningRuns.map((run) => (
                    <div key={run._id} className="space-y-3 rounded-lg border bg-muted/20 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-foreground">
                              {run?.jobId?.title || "Screening Run"}
                            </p>
                            <Badge variant={getStatusBadgeVariant(run.status)}>{run.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Candidates: {run?.totals?.total || 0} • Batch {run?.queueMeta?.currentBatch || 0}/
                            {run?.queueMeta?.totalBatches || 0}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDateTime(run.createdAt)}
                        </div>
                      </div>

                      <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                        <div>Processed: {run?.totals?.processed || 0}</div>
                        <div>Failed: {run?.totals?.failed || 0}</div>
                        <div>Run type: {run.runType}</div>
                        <div>Provider: {run.aiProvider}</div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateRunStatus(run._id, "running")}
                          disabled={updatingRunId === run._id || run.status !== "queued"}>
                          <LoaderCircle className="size-4" />
                          Running
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateRunStatus(run._id, "completed")}
                          disabled={
                            updatingRunId === run._id || !["queued", "running"].includes(run.status)
                          }>
                          <CheckCircle2 className="size-4" />
                          Complete
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateRunStatus(run._id, "failed")}
                          disabled={
                            updatingRunId === run._id || !["queued", "running"].includes(run.status)
                          }>
                          <XCircle className="size-4" />
                          Fail
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No screening runs have been created for this job.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle>Upload Resumes</CardTitle>
            <CardDescription>Drag and drop PDF or DOCX files (up to 50 files).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  fileInputRef.current?.click();
                }
              }}
              className="cursor-pointer rounded-xl border-2 border-dashed p-10 text-center">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={handleSelectFiles}
              />
              <span className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Upload className="size-7" />
              </span>
              <p className="font-semibold">Drag files here or click to browse</p>
              <p className="mt-1 text-sm text-muted-foreground">Max 50 files per batch</p>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Local Queue ({selectedFiles.length})
              </p>
              {selectedFiles.length ? (
                selectedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center gap-3 rounded-lg border bg-muted/20 p-3">
                    <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                      {file.type === "application/pdf" ? (
                        <File className="size-4" />
                      ) : (
                        <FileText className="size-4" />
                      )}
                    </span>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold">{file.name}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatBytes(file.size)}
                        </span>
                      </div>
                      <Progress value={uploading ? uploadProgress : 0} />
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => handleRemoveLocalFile(index)}>
                      <X className="size-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No files queued.</p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-bold text-foreground">{selectedFiles.length} files</span>{" "}
                selected for upload
              </p>
              <Button className="gap-2" onClick={handleUpload} disabled={uploading || !selectedFiles.length}>
                <Rocket className="size-4" />
                {uploading ? "Uploading..." : "Upload Selected Files"}
              </Button>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Uploaded Resume Files {loading ? "(loading...)" : `(${resumeFiles.length})`}
              </p>
              {resumeFiles.length ? (
                resumeFiles.map((file) => (
                  <div
                    key={file._id}
                    className="flex items-center gap-3 rounded-lg border bg-muted/20 p-3">
                    <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                      {file.mimeType === "application/pdf" ? (
                        <File className="size-4" />
                      ) : (
                        <FileText className="size-4" />
                      )}
                    </span>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold">{file.originalFileName}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatBytes(file.sizeBytes)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">{file.uploadStatus}</Badge>
                        <Badge variant="outline">{file.parseStatus}</Badge>
                        {file?.candidateId?.fullName ? (
                          <span>Candidate: {file.candidateId.fullName}</span>
                        ) : null}
                        {file?.jobId?.title ? <span>Job: {file.jobId.title}</span> : null}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteResumeFile(file._id)}>
                      <X className="size-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No uploaded resume files for the current filter.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default UploadAndScreeningPage;
