import {
  File,
  FileText,
  PlayCircle,
  Rocket,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import { getJobs } from "@/services/api/jobs";
import {
  deleteResumeFile,
  getResumeFiles,
  uploadResumeFiles,
} from "@/services/api/resume-files";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const defaultSkills = ["React.js", "Node.js", "TypeScript", "AWS"];

const formatBytes = (value) => {
  if (!value && value !== 0) return "0 B";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const UploadAndScreeningPage = () => {
  const fileInputRef = useRef(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [resumeFiles, setResumeFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
      const response = await getResumeFiles(jobId ? { jobId, page: 1, limit: 100 } : { page: 1, limit: 100 });
      setResumeFiles(response?.data?.data?.items || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Cannot fetch resume files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    fetchResumeFiles(selectedJobId);
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
      await fetchResumeFiles(selectedJobId);
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
                Backend stores local file metadata and marks uploaded resumes as pending parse.
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
              className="rounded-xl border-2 border-dashed p-10 text-center cursor-pointer">
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
