import {
  CheckCircle2,
  Download,
  Eye,
  MessageSquareText,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trophy,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createCandidateAction,
  getJobCandidateActions,
} from "@/services/api/candidate-actions";
import { getJobById, getJobs } from "@/services/api/jobs";
import { getJobScreeningResults } from "@/services/api/screening-results";

const initialFilters = {
  scoreMin: "",
  scoreMax: "",
  skills: "",
  experienceMin: "",
  status: "",
  sort: "ranking_asc",
};

const safeInitials = (name) => {
  if (!name) return "NA";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

const getStatusVariant = (status) => {
  if (status === "strong_fit") return "success";
  if (status === "potential") return "warning";
  if (status === "not_suitable") return "destructive";
  return "outline";
};

const formatPercentage = (value) => {
  return `${Math.round(Number(value) || 0)}%`;
};

const CandidateRankingPage = () => {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [latestActions, setLatestActions] = useState({});
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteValue, setNoteValue] = useState("");
  const [noteTargetResult, setNoteTargetResult] = useState(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const getErrorMessage = (err, fallback) => {
    return err?.response?.data?.message || fallback;
  };

  const fetchJobs = async () => {
    try {
      const response = await getJobs({ page: 1, limit: 100 });
      const items = response?.data?.data?.items || [];
      setJobs(items);
      if (!selectedJobId && items.length) {
        setSelectedJobId(items[0]._id);
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Cannot fetch jobs"));
    }
  };

  const fetchJobDetail = async (jobId) => {
    if (!jobId) {
      setSelectedJob(null);
      return;
    }

    try {
      const response = await getJobById(jobId);
      setSelectedJob(response?.data?.data || null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Cannot fetch job detail"));
      setSelectedJob(null);
    }
  };

  const fetchActions = async (jobId) => {
    if (!jobId) {
      setLatestActions({});
      return;
    }

    try {
      const response = await getJobCandidateActions(jobId, { page: 1, limit: 100 });
      const items = response?.data?.data?.items || [];
      const nextLatestActions = {};

      items.forEach((action) => {
        const candidateId = action?.candidateId?._id;
        if (!candidateId || nextLatestActions[candidateId]) return;
        nextLatestActions[candidateId] = action;
      });

      setLatestActions(nextLatestActions);
    } catch (err) {
      toast.error(getErrorMessage(err, "Cannot fetch candidate actions"));
    }
  };

  const fetchResults = async (jobId, currentFilters, page = 1) => {
    if (!jobId) {
      setResults([]);
      setPagination({ page: 1, limit: 20, total: 0, totalPages: 1 });
      return;
    }

    try {
      setLoading(true);
      const params = {
        ...currentFilters,
        page,
        limit: 20,
      };

      Object.keys(params).forEach((key) => {
        if (params[key] === "" || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await getJobScreeningResults(jobId, params);
      setResults(response?.data?.data?.items || []);
      setPagination(
        response?.data?.data?.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 1,
        }
      );
    } catch (err) {
      toast.error(getErrorMessage(err, "Cannot fetch ranking results"));
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    fetchJobDetail(selectedJobId);
    fetchResults(selectedJobId, appliedFilters, 1);
    fetchActions(selectedJobId);
  }, [selectedJobId, appliedFilters]);

  const rankingSummary = useMemo(() => {
    const total = results.length;
    const averageScore = total
      ? Math.round(
          results.reduce((sum, item) => sum + (item.matchingScore || 0), 0) / total
        )
      : 0;
    const strongFitCount = results.filter(
      (item) => item.statusBadge === "strong_fit"
    ).length;

    return {
      total,
      averageScore,
      strongFitCount,
    };
  }, [results]);

  const handleFilterChange = (field, value) => {
    setFilters((previous) => ({ ...previous, [field]: value }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
  };

  const openProfileModal = (result) => {
    setSelectedResult(result);
    setProfileOpen(true);
  };

  const handleCreateAction = async ({ result, actionType, note = "", metadata = {} }) => {
    if (!selectedJobId || !result?.candidateId?._id) {
      toast.error("Missing job or candidate information");
      return;
    }

    try {
      setActionSubmitting(true);
      await createCandidateAction({
        jobId: selectedJobId,
        candidateId: result.candidateId._id,
        actionType,
        note: note || undefined,
        metadata,
        sourceScreeningResultId: result._id,
      });
      toast.success("Candidate action created");
      await fetchActions(selectedJobId);
    } catch (err) {
      toast.error(getErrorMessage(err, "Cannot create candidate action"));
    } finally {
      setActionSubmitting(false);
    }
  };

  const openNoteDialog = (result) => {
    setNoteTargetResult(result);
    setNoteValue("");
    setNoteDialogOpen(true);
  };

  const submitNoteAction = async () => {
    if (!noteTargetResult) return;
    if (!noteValue.trim()) {
      toast.error("Note is required");
      return;
    }

    await handleCreateAction({
      result: noteTargetResult,
      actionType: "notes",
      note: noteValue.trim(),
    });
    setNoteDialogOpen(false);
    setNoteTargetResult(null);
    setNoteValue("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-primary">Talent Pipeline</p>
          <h1 className="text-3xl font-black tracking-tight">Candidate Ranking</h1>
          <p className="text-sm text-muted-foreground">
            Rank screened candidates by job and filter results by score, skills,
            experience, and fit status.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => fetchResults(selectedJobId, appliedFilters, 1)}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          <Button variant="outline" className="gap-2" disabled>
            <Download className="size-4" />
            Export Results
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Selected Job</CardTitle>
            <CardDescription>Current ranking scope</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-lg font-bold">{selectedJob?.title || "No job selected"}</p>
            <div className="flex gap-2">
              <Badge>{selectedJob?.seniorityLevel || "-"}</Badge>
              <Badge variant="outline">{selectedJob?.status || "-"}</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Average Score</CardTitle>
            <CardDescription>Current page results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-primary/10 p-3 text-primary">
                <Trophy className="size-5" />
              </span>
              <div>
                <p className="text-2xl font-black text-primary">
                  {rankingSummary.averageScore}
                </p>
                <p className="text-sm text-muted-foreground">out of 100</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Strong Fits</CardTitle>
            <CardDescription>Visible results only</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black">{rankingSummary.strongFitCount}</p>
            <p className="text-sm text-muted-foreground">
              {rankingSummary.total} candidates on this page
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-4 lg:grid-cols-12 lg:items-end">
          <label className="space-y-2 lg:col-span-3">
            <span className="text-sm font-semibold">Job</span>
            <select
              value={selectedJobId}
              onChange={(event) => setSelectedJobId(event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Select job</option>
              {jobs.map((job) => (
                <option key={job._id} value={job._id}>
                  {job.title}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 lg:col-span-2">
            <span className="text-sm font-semibold">Score Min</span>
            <Input
              type="number"
              min="0"
              max="100"
              value={filters.scoreMin}
              onChange={(event) => handleFilterChange("scoreMin", event.target.value)}
              placeholder="70"
            />
          </label>
          <label className="space-y-2 lg:col-span-2">
            <span className="text-sm font-semibold">Score Max</span>
            <Input
              type="number"
              min="0"
              max="100"
              value={filters.scoreMax}
              onChange={(event) => handleFilterChange("scoreMax", event.target.value)}
              placeholder="100"
            />
          </label>
          <label className="space-y-2 lg:col-span-2">
            <span className="text-sm font-semibold">Experience Min</span>
            <Input
              type="number"
              min="0"
              value={filters.experienceMin}
              onChange={(event) =>
                handleFilterChange("experienceMin", event.target.value)
              }
              placeholder="3"
            />
          </label>
          <label className="space-y-2 lg:col-span-3">
            <span className="text-sm font-semibold">Skills</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filters.skills}
                onChange={(event) => handleFilterChange("skills", event.target.value)}
                placeholder="React, Node.js"
                className="pl-9"
              />
            </div>
          </label>
          <label className="space-y-2 lg:col-span-3">
            <span className="text-sm font-semibold">Fit Status</span>
            <select
              value={filters.status}
              onChange={(event) => handleFilterChange("status", event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">All</option>
              <option value="strong_fit">strong_fit</option>
              <option value="potential">potential</option>
              <option value="not_suitable">not_suitable</option>
            </select>
          </label>
          <label className="space-y-2 lg:col-span-3">
            <span className="text-sm font-semibold">Sort</span>
            <select
              value={filters.sort}
              onChange={(event) => handleFilterChange("sort", event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="ranking_asc">Ranking Asc</option>
              <option value="ranking_desc">Ranking Desc</option>
              <option value="score_desc">Score Desc</option>
              <option value="score_asc">Score Asc</option>
              <option value="experience_desc">Experience Desc</option>
              <option value="experience_asc">Experience Asc</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </label>
          <div className="flex flex-wrap justify-end gap-2 lg:col-span-6">
            <Button variant="outline" className="gap-2" onClick={handleResetFilters}>
              <SlidersHorizontal className="size-4" />
              Reset
            </Button>
            <Button className="gap-2" onClick={handleApplyFilters}>
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Rank</TableHead>
                <TableHead>Candidate</TableHead>
                <TableHead className="w-56">Match Score</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Fit Status</TableHead>
                <TableHead>Matched Skills</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length ? (
                results.map((result, index) => {
                  const candidate = result.candidateId;
                  const latestAction = latestActions[candidate?._id];
                  const rankLabel =
                    result.rankingPosition ||
                    (pagination.page - 1) * pagination.limit + index + 1;
                  return (
                    <TableRow key={result._id}>
                      <TableCell>
                        <Badge variant="outline">#{rankLabel}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-10">
                            <AvatarImage
                              src={`https://i.pravatar.cc/120?u=${candidate?._id || result._id}`}
                            />
                            <AvatarFallback>
                              {safeInitials(candidate?.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">
                              {candidate?.fullName || "Unknown Candidate"}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-xs text-muted-foreground">
                                {candidate?.currentTitle || "No title"}
                              </p>
                              {latestAction ? (
                                <Badge variant="outline">{latestAction.actionType}</Badge>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-bold text-primary">
                            {formatPercentage(result.matchingScore)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {result?.screeningRunId?.status || "-"}
                          </span>
                        </div>
                        <Progress value={result.matchingScore || 0} />
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">
                          {candidate?.totalYearsExperience || 0} years
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {candidate?.location || "Unknown location"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(result.statusBadge)}>
                          {result.statusBadge}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex max-w-xs flex-wrap gap-1">
                          {(result.matchedSkills || []).length ? (
                            result.matchedSkills.slice(0, 3).map((skill) => (
                              <Badge key={skill} variant="outline">
                                {skill}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              No skill match data
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleCreateAction({
                                result,
                                actionType: "shortlisted",
                                note: "Shortlisted from ranking page",
                              })
                            }
                            disabled={actionSubmitting}>
                            <CheckCircle2 className="size-4 text-emerald-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleCreateAction({
                                result,
                                actionType: "rejected",
                                note: "Rejected from ranking page",
                              })
                            }
                            disabled={actionSubmitting}>
                            <XCircle className="size-4 text-rose-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openNoteDialog(result)}
                            disabled={actionSubmitting}>
                            <MessageSquareText className="size-4 text-amber-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openProfileModal(result)}>
                            <Eye className="size-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-sm text-muted-foreground">
                    {loading
                      ? "Loading ranking results..."
                      : "No screening results matched the current filters."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between border-t px-6 py-4">
            <p className="text-sm text-muted-foreground">
              {loading
                ? "Loading results..."
                : `Showing ${results.length} of ${pagination.total} results`}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  fetchResults(
                    selectedJobId,
                    appliedFilters,
                    Math.max(pagination.page - 1, 1)
                  )
                }
                disabled={loading || pagination.page <= 1}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  fetchResults(selectedJobId, appliedFilters, pagination.page + 1)
                }
                disabled={loading || pagination.page >= pagination.totalPages}>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ranking Detail</DialogTitle>
            <DialogDescription>
              Candidate profile and screening outcome for the selected ranking row.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3 rounded-lg border bg-muted/20 p-4">
              <Avatar className="size-12">
                <AvatarImage
                  src={`https://i.pravatar.cc/120?u=${selectedResult?.candidateId?._id || "candidate"}`}
                />
                <AvatarFallback>
                  {safeInitials(selectedResult?.candidateId?.fullName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">
                  {selectedResult?.candidateId?.fullName || "Unknown Candidate"}
                </p>
                <p className="text-muted-foreground">
                  {selectedResult?.candidateId?.currentTitle || "No title"}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 rounded-lg border p-4">
                <p className="font-semibold">Score Overview</p>
                <p className="text-2xl font-black text-primary">
                  {formatPercentage(selectedResult?.matchingScore || 0)}
                </p>
                <Badge variant={getStatusVariant(selectedResult?.statusBadge)}>
                  {selectedResult?.statusBadge || "-"}
                </Badge>
              </div>
              <div className="space-y-2 rounded-lg border p-4">
                <p className="font-semibold">Candidate Snapshot</p>
                <p>
                  {selectedResult?.candidateId?.totalYearsExperience || 0} years
                  experience
                </p>
                <p className="text-muted-foreground">
                  {selectedResult?.candidateId?.location || "Unknown location"}
                </p>
              </div>
            </div>

            <div className="space-y-2 rounded-lg border p-4">
              <p className="font-semibold">Matched Skills</p>
              <div className="flex flex-wrap gap-2">
                {(selectedResult?.matchedSkills || []).length ? (
                  selectedResult.matchedSkills.map((skill) => (
                    <Badge key={skill} variant="outline">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground">No matched skills</span>
                )}
              </div>
            </div>

            <div className="space-y-2 rounded-lg border p-4">
              <p className="font-semibold">Missing Skills</p>
              <div className="flex flex-wrap gap-2">
                {(selectedResult?.missingSkills || []).length ? (
                  selectedResult.missingSkills.map((skill) => (
                    <Badge key={skill} variant="destructive">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground">No missing skill data</span>
                )}
              </div>
            </div>

            <div className="space-y-2 rounded-lg border p-4">
              <p className="font-semibold">AI Summary</p>
              <p className="text-muted-foreground">
                {selectedResult?.aiSummary ||
                  selectedResult?.explanation ||
                  "No AI summary available yet."}
              </p>
            </div>
            <div className="space-y-2 rounded-lg border p-4">
              <p className="font-semibold">Latest HR Action</p>
              {latestActions[selectedResult?.candidateId?._id] ? (
                <div className="space-y-1">
                  <Badge variant="outline">
                    {latestActions[selectedResult.candidateId._id].actionType}
                  </Badge>
                  <p className="text-muted-foreground">
                    {latestActions[selectedResult.candidateId._id].note || "No note"}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">No HR action yet.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setProfileOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Candidate Note</DialogTitle>
            <DialogDescription>
              Save an HR note for the selected candidate and job.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold">Note</span>
              <textarea
                value={noteValue}
                onChange={(event) => setNoteValue(event.target.value)}
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Add your hiring note..."
              />
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={submitNoteAction} disabled={actionSubmitting}>
              {actionSubmitting ? "Saving..." : "Save Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CandidateRankingPage;
