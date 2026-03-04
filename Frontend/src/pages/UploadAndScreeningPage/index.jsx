import {
  FileSearch,
  File,
  FileText,
  LoaderCircle,
  PlayCircle,
  Rocket,
  Trash2,
  Upload,
  X,
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
  parseResumeFile,
  uploadResumeFiles,
} from "@/services/api/resume-files";
import {
  createScreeningRun,
  deleteScreeningRun,
  getScreeningRuns,
} from "@/services/api/screening-runs";
import { getScreeningRunResults } from "@/services/api/screening-results";

const defaultSkills = ["React.js", "Node.js", "TypeScript", "AWS"];
const allowedFileTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const maxUploadBytes = 10 * 1024 * 1024;
const fallbackParseMarker = "Fallback parse was generated because file download from storage failed.";

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

const getResultBadgeVariant = (statusBadge) => {
  if (statusBadge === "strong_fit") return "success";
  if (statusBadge === "potential") return "warning";
  return "destructive";
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
  const [parsingResumeId, setParsingResumeId] = useState("");
  const [selectedRunId, setSelectedRunId] = useState("");
  const [screeningResults, setScreeningResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);

  const selectedJob = useMemo(
    () => jobs.find((job) => job._id === selectedJobId) || null,
    [jobs, selectedJobId]
  );
  const selectedRun = useMemo(
    () => screeningRuns.find((run) => run._id === selectedRunId) || screeningRuns[0] || null,
    [screeningRuns, selectedRunId]
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

  const fetchScreeningResults = async (screeningRunId) => {
    if (!screeningRunId) {
      setScreeningResults([]);
      return;
    }

    try {
      setResultsLoading(true);
      const response = await getScreeningRunResults(screeningRunId, {
        page: 1,
        limit: 10,
        sort: "ranking_asc",
      });
      setScreeningResults(response?.data?.data?.items || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Cannot fetch screening results");
    } finally {
      setResultsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    fetchResumeFiles(selectedJobId);
    fetchScreeningRuns(selectedJobId);
  }, [selectedJobId]);

  useEffect(() => {
    if (!screeningRuns.length) {
      setSelectedRunId("");
      setScreeningResults([]);
      return;
    }

    if (!selectedRunId || !screeningRuns.some((run) => run._id === selectedRunId)) {
      setSelectedRunId(screeningRuns[0]._id);
    }
  }, [screeningRuns, selectedRunId]);

  useEffect(() => {
    if (!selectedRun?._id) {
      setScreeningResults([]);
      return;
    }

    fetchScreeningResults(selectedRun._id);
  }, [selectedRun?._id]);

  useEffect(() => {
    if (!selectedJobId || !selectedRun?._id || !["queued", "running"].includes(selectedRun.status)) {
      return undefined;
    }

    const poller = window.setInterval(() => {
      fetchScreeningRuns(selectedJobId);
      fetchScreeningResults(selectedRun._id);
    }, 3000);

    return () => window.clearInterval(poller);
  }, [selectedJobId, selectedRun?._id, selectedRun?.status]);

  const handleSelectFiles = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const acceptedFiles = [];
    const rejectedMessages = [];

    files.forEach((file) => {
      const fileKey = `${file.name}-${file.size}`;
      const hasDuplicate = [...selectedFiles, ...acceptedFiles].some(
        (queuedFile) => `${queuedFile.name}-${queuedFile.size}` === fileKey
      );

      if (!allowedFileTypes.has(file.type)) {
        rejectedMessages.push(`${file.name}: unsupported file type`);
        return;
      }

      if (file.size > maxUploadBytes) {
        rejectedMessages.push(`${file.name}: file exceeds 10MB`);
        return;
      }

      if (hasDuplicate) {
        rejectedMessages.push(`${file.name}: duplicate file skipped`);
        return;
      }

      acceptedFiles.push(file);
    });

    if (rejectedMessages.length) {
      toast.error(rejectedMessages[0]);
    }

    if (!acceptedFiles.length) {
      event.target.value = "";
      return;
    }

    setSelectedFiles((previous) => [...previous, ...acceptedFiles].slice(0, 50));
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

  const handleParseResumeFile = async (resumeFileId) => {
    try {
      setParsingResumeId(resumeFileId);
      await parseResumeFile(resumeFileId);
      toast.success("Resume parsed");
      await fetchResumeFiles(selectedJobId);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Parse resume file failed");
    } finally {
      setParsingResumeId("");
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
      const response = await createScreeningRun({
        jobId: selectedJobId,
        resumeFileIds: resumeFiles.map((file) => file._id),
      });
      const createdRun = response?.data?.data || null;
      if (createdRun?._id) {
        setSelectedRunId(createdRun._id);
      }
      toast.success("Screening run queued");
      await Promise.all([
        fetchScreeningRuns(selectedJobId),
        createdRun?._id ? fetchScreeningResults(createdRun._id) : Promise.resolve(),
      ]);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Cannot create screening run");
    } finally {
      setStartingRun(false);
    }
  };

  const handleDeleteScreeningRun = async (screeningRunId) => {
    if (!window.confirm("Delete this screening run and all of its screening results?")) {
      return;
    }

    try {
      await deleteScreeningRun(screeningRunId);
      toast.success("Screening run deleted");

      if (selectedRunId === screeningRunId) {
        setSelectedRunId("");
        setScreeningResults([]);
      }

      await fetchScreeningRuns(selectedJobId);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Cannot delete screening run");
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
            Upload multiple resumes, parse them, and run AI matching against the selected job.
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
                Uploaded resumes will be parsed automatically during screening if they are still pending.
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
                Starting a run will parse missing resumes, generate AI scores, save ranking results, and complete the batch automatically.
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
                  {startingRun ? "Running AI..." : "Start Run"}
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

                      <div className="space-y-3">
                        <Progress
                          value={
                            run?.totals?.total
                              ? Math.round(((run?.totals?.processed || 0) / run.totals.total) * 100)
                              : 0
                          }
                        />
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs text-muted-foreground">
                            {run.status === "queued" && "Waiting in background queue"}
                            {run.status === "running" && "AI is scoring candidates in the background"}
                            {run.status === "completed" && "Results are ready to review"}
                            {run.status === "failed" && "Run failed. Check error summary or retry"}
                          </p>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant={selectedRun?._id === run._id ? "default" : "outline"}
                              onClick={() => setSelectedRunId(run._id)}>
                              View Results
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => handleDeleteScreeningRun(run._id)}
                              disabled={run.status === "running"}
                              title={
                                run.status === "running"
                                  ? "Cannot delete a run while it is running"
                                  : "Delete run"
                              }>
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                        {run?.errorSummary ? (
                          <p className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                            {run.errorSummary}
                          </p>
                        ) : null}
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
                  (() => {
                    const isFallbackParsed = String(file.extractedText || "").includes(
                      fallbackParseMarker
                    );
                    return (
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
                      {file?.extractedTextPreview ? (
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          Preview: {file.extractedTextPreview}
                        </p>
                      ) : null}
                      {file?.parseError ? (
                        <p className="rounded-md border border-destructive/20 bg-destructive/5 p-2 text-xs text-destructive">
                          Parse error: {file.parseError}
                        </p>
                      ) : null}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleParseResumeFile(file._id)}
                      disabled={
                        parsingResumeId === file._id ||
                        file.parseStatus === "parsing" ||
                        (file.parseStatus === "parsed" && !isFallbackParsed)
                      }>
                      <FileSearch className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteResumeFile(file._id)}>
                      <X className="size-4" />
                    </Button>
                  </div>
                    );
                  })()
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

      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Latest Screening Results</CardTitle>
            <CardDescription>
              Review ranked candidates from the selected screening run without leaving the upload page.
            </CardDescription>
          </div>
          <div className="flex w-full max-w-sm items-center gap-3">
            <select
              value={selectedRun?._id || ""}
              onChange={(event) => setSelectedRunId(event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Select screening run</option>
              {screeningRuns.map((run) => (
                <option key={run._id} value={run._id}>
                  {`${run?.jobId?.title || "Run"} • ${run.status} • ${formatDateTime(run.createdAt)}`}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              onClick={() => selectedRun?._id && fetchScreeningResults(selectedRun._id)}
              disabled={!selectedRun?._id || resultsLoading}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedRun ? (
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant={getStatusBadgeVariant(selectedRun.status)}>{selectedRun.status}</Badge>
                </div>
              </div>
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Processed</p>
                <p className="mt-2 text-2xl font-bold text-foreground">
                  {selectedRun?.totals?.processed || 0}/{selectedRun?.totals?.total || 0}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Failed</p>
                <p className="mt-2 text-2xl font-bold text-foreground">
                  {selectedRun?.totals?.failed || 0}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Provider</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{selectedRun.aiProvider}</p>
              </div>
            </div>
          ) : null}

          {resultsLoading ? (
            <div className="flex items-center gap-2 rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" />
              Loading screening results...
            </div>
          ) : null}

          {!resultsLoading && !selectedRun ? (
            <p className="text-sm text-muted-foreground">
              Start or select a screening run to review ranked candidates here.
            </p>
          ) : null}

          {!resultsLoading && selectedRun && !screeningResults.length ? (
            <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
              {["queued", "running"].includes(selectedRun.status)
                ? "The run is still processing in the background. Results will appear here automatically."
                : "No screening results available for this run."}
            </div>
          ) : null}

          {!resultsLoading && screeningResults.length ? (
            <div className="space-y-3">
              {screeningResults.map((result) => (
                <div key={result._id} className="rounded-lg border bg-muted/20 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-foreground">
                          #{result.rankingPosition || "-"} {result?.candidateId?.fullName || "Candidate"}
                        </p>
                        <Badge variant={getResultBadgeVariant(result.statusBadge)}>
                          {result.statusBadge}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {result?.candidateId?.currentTitle || "No current title"} •{" "}
                        {result?.candidateId?.totalYearsExperience || 0} years experience
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black text-foreground">{result.matchingScore}</p>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">match score</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-md border bg-background/60 p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Matched Skills</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(result.matchedSkills || []).slice(0, 6).map((skill) => (
                          <Badge key={skill} variant="outline">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-md border bg-background/60 p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Missing Skills</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(result.missingSkills || []).slice(0, 6).map((skill) => (
                          <Badge key={skill} variant="destructive">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-md border bg-background/60 p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Confidence</p>
                      <p className="mt-2 text-2xl font-bold text-foreground">
                        {Math.round((result.confidenceScore || 0) * 100)}%
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    <p className="font-medium text-foreground">{result.aiSummary}</p>
                    <p className="text-muted-foreground">{result.explanation}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadAndScreeningPage;

