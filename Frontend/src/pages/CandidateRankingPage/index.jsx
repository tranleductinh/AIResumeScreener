import { Download, Eye, Filter, Layers, PlusCircle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import {
  createCandidate,
  deleteCandidate,
  getCandidateById,
  getCandidates,
  updateCandidate,
} from "@/services/api/candidates";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  currentTitle: "",
  currentCompany: "",
  totalYearsExperience: 0,
  summary: "",
  skillsHard: "",
  skillsSoft: "",
  profileStatus: "needs_review",
};

const getStatusVariant = (status) => {
  if (status === "enriched" || status === "parsed") return "success";
  if (status === "failed_parse") return "destructive";
  return "outline";
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

const CandidateRankingPage = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [createForm, setCreateForm] = useState(initialForm);
  const [editForm, setEditForm] = useState(initialForm);

  const getErrorMessage = (err, fallback) => {
    return err?.response?.data?.message || fallback;
  };

  const mapCandidateToForm = (candidate) => {
    return {
      fullName: candidate?.fullName || "",
      email: candidate?.email || "",
      phone: candidate?.phone || "",
      location: candidate?.location || "",
      currentTitle: candidate?.currentTitle || "",
      currentCompany: candidate?.currentCompany || "",
      totalYearsExperience: candidate?.totalYearsExperience || 0,
      summary: candidate?.summary || "",
      skillsHard: (candidate?.skills?.hard || []).map((item) => item.name).join(", "),
      skillsSoft: (candidate?.skills?.soft || []).join(", "),
      profileStatus: candidate?.profileStatus || "needs_review",
    };
  };

  const fetchCandidates = async (preferredSelectedId = null) => {
    try {
      setLoading(true);
      const response = await getCandidates({ page: 1, limit: 100 });
      const items = response?.data?.data?.items || [];
      setCandidates(items);

      if (!items.length) {
        setSelectedCandidateId(null);
        setSelectedCandidate(null);
        return;
      }

      const currentSelectedId = preferredSelectedId || selectedCandidateId;
      const hasCurrentSelected = items.some((item) => item._id === currentSelectedId);
      setSelectedCandidateId(hasCurrentSelected ? currentSelectedId : items[0]._id);
    } catch (err) {
      toast.error(getErrorMessage(err, "Cannot fetch candidates"));
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidateDetail = async (candidateId) => {
    if (!candidateId) {
      setSelectedCandidate(null);
      return;
    }
    try {
      const response = await getCandidateById(candidateId);
      setSelectedCandidate(response?.data?.data || null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Cannot fetch candidate profile"));
      setSelectedCandidate(null);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  useEffect(() => {
    fetchCandidateDetail(selectedCandidateId);
  }, [selectedCandidateId]);

  const handleCreateCandidate = async (event) => {
    event.preventDefault();
    if (!createForm.fullName.trim()) {
      toast.error("Full name is required");
      return;
    }

    try {
      setSaving(true);
      const response = await createCandidate({
        ...createForm,
        fullName: createForm.fullName.trim(),
        email: createForm.email.trim() || null,
      });
      const createdCandidate = response?.data?.data;
      toast.success("Candidate created");
      setCreateOpen(false);
      setCreateForm(initialForm);
      await fetchCandidates(createdCandidate?._id || null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Create candidate failed"));
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (candidate = selectedCandidate) => {
    if (!candidate) return;
    setSelectedCandidateId(candidate._id);
    setEditForm(mapCandidateToForm(candidate));
    setEditOpen(true);
  };

  const openProfileModal = (candidate = selectedCandidate) => {
    if (!candidate) return;
    setSelectedCandidateId(candidate._id);
    setEditForm(mapCandidateToForm(candidate));
    setProfileOpen(true);
  };

  const handleUpdateCandidate = async (event) => {
    event.preventDefault();
    if (!selectedCandidateId) return;

    if (!editForm.fullName.trim()) {
      toast.error("Full name is required");
      return;
    }

    try {
      setSaving(true);
      await updateCandidate(selectedCandidateId, {
        ...editForm,
        fullName: editForm.fullName.trim(),
        email: editForm.email.trim() || null,
      });
      toast.success("Candidate updated");
      setEditOpen(false);
      setProfileOpen(false);
      await fetchCandidates(selectedCandidateId);
      await fetchCandidateDetail(selectedCandidateId);
    } catch (err) {
      toast.error(getErrorMessage(err, "Update candidate failed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCandidate = async (candidateId) => {
    if (!candidateId) return;
    if (!window.confirm("Delete this candidate?")) return;

    try {
      await deleteCandidate(candidateId);
      toast.success("Candidate deleted");
      await fetchCandidates();
    } catch (err) {
      toast.error(getErrorMessage(err, "Delete candidate failed"));
    }
  };

  const handleCreateFormChange = (field, value) => {
    setCreateForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleEditFormChange = (field, value) => {
    setEditForm((previous) => ({ ...previous, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-primary">Talent Pipeline</p>
          <h1 className="text-3xl font-black tracking-tight">Candidate Ranking</h1>
          <p className="text-sm text-muted-foreground">
            Manage candidates and update profile fields directly.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="size-4" />
            Export Results
          </Button>
          <Button className="gap-2" onClick={() => setCreateOpen(true)}>
            <PlusCircle className="size-4" />
            Add Candidate
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-4 lg:grid-cols-12 lg:items-end">
          <div className="space-y-2 lg:col-span-5">
            <p className="text-sm font-semibold">Profile Completeness (visual)</p>
            <Progress value={75} />
            <p className="text-xs font-bold text-primary">0% - 100%</p>
          </div>
          <label className="space-y-2 lg:col-span-2">
            <span className="text-sm font-semibold">Experience</span>
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option>All</option>
              <option>3+ Years</option>
              <option>5+ Years</option>
            </select>
          </label>
          <label className="space-y-2 lg:col-span-2">
            <span className="text-sm font-semibold">Status</span>
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option>All Candidates</option>
              <option>needs_review</option>
              <option>enriched</option>
              <option>parsed</option>
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
                <TableHead className="w-16">#</TableHead>
                <TableHead>Candidate</TableHead>
                <TableHead>Current Role</TableHead>
                <TableHead className="w-52">Experience</TableHead>
                <TableHead>Profile Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((candidate, index) => (
                <TableRow
                  key={candidate._id}
                  className={selectedCandidateId === candidate._id ? "bg-primary/5" : ""}>
                  <TableCell>
                    <Badge variant="outline">#{index + 1}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10">
                        <AvatarImage src={`https://i.pravatar.cc/120?img=${(index % 60) + 1}`} />
                        <AvatarFallback>{safeInitials(candidate.fullName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{candidate.fullName}</p>
                        <p className="text-xs text-muted-foreground">{candidate.location || "N/A"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{candidate.currentTitle || "N/A"}</p>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {candidate.currentCompany || "N/A"}
                    </p>
                  </TableCell>
                  <TableCell className="space-y-2">
                    <p className="text-xs font-bold text-primary">
                      {candidate.totalYearsExperience || 0} years
                    </p>
                    <Progress value={Math.min((candidate.totalYearsExperience || 0) * 10, 100)} />
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(candidate.profileStatus)}>
                      {candidate.profileStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(candidate)}>
                        <PlusCircle className="size-4 text-emerald-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCandidate(candidate._id)}>
                        <XCircle className="size-4 text-rose-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedCandidateId(candidate._id);
                          openProfileModal(candidate);
                        }}>
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
              {loading
                ? "Loading candidates..."
                : `Showing ${candidates.length} candidates`}
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Candidate</DialogTitle>
            <DialogDescription>Create manual candidate profile.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCandidate} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold">Full Name</span>
                <Input
                  value={createForm.fullName}
                  onChange={(event) => handleCreateFormChange("fullName", event.target.value)}
                  placeholder="Alex Rivera"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold">Email</span>
                <Input
                  value={createForm.email}
                  onChange={(event) => handleCreateFormChange("email", event.target.value)}
                  placeholder="alex@email.com"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold">Phone</span>
                <Input
                  value={createForm.phone}
                  onChange={(event) => handleCreateFormChange("phone", event.target.value)}
                  placeholder="+84..."
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold">Location</span>
                <Input
                  value={createForm.location}
                  onChange={(event) => handleCreateFormChange("location", event.target.value)}
                  placeholder="Ho Chi Minh City"
                />
              </label>
            </div>
            <label className="space-y-2">
              <span className="text-sm font-semibold">Current Title</span>
              <Input
                value={createForm.currentTitle}
                onChange={(event) => handleCreateFormChange("currentTitle", event.target.value)}
                placeholder="Frontend Engineer"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold">Current Company</span>
              <Input
                value={createForm.currentCompany}
                onChange={(event) => handleCreateFormChange("currentCompany", event.target.value)}
                placeholder="Company name"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold">Total Years Experience</span>
              <Input
                type="number"
                min="0"
                value={createForm.totalYearsExperience}
                onChange={(event) =>
                  handleCreateFormChange("totalYearsExperience", event.target.value)
                }
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold">Summary</span>
              <textarea
                value={createForm.summary}
                onChange={(event) => handleCreateFormChange("summary", event.target.value)}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold">Hard Skills (comma separated)</span>
              <Input
                value={createForm.skillsHard}
                onChange={(event) => handleCreateFormChange("skillsHard", event.target.value)}
                placeholder="React, Node.js, MongoDB"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold">Soft Skills (comma separated)</span>
              <Input
                value={createForm.skillsSoft}
                onChange={(event) => handleCreateFormChange("skillsSoft", event.target.value)}
                placeholder="Communication, Teamwork"
              />
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Create Candidate"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Candidate</DialogTitle>
            <DialogDescription>Update candidate profile fields.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateCandidate} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold">Full Name</span>
                <Input
                  value={editForm.fullName}
                  onChange={(event) => handleEditFormChange("fullName", event.target.value)}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold">Email</span>
                <Input
                  value={editForm.email}
                  onChange={(event) => handleEditFormChange("email", event.target.value)}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold">Phone</span>
                <Input
                  value={editForm.phone}
                  onChange={(event) => handleEditFormChange("phone", event.target.value)}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold">Location</span>
                <Input
                  value={editForm.location}
                  onChange={(event) => handleEditFormChange("location", event.target.value)}
                />
              </label>
            </div>
            <label className="space-y-2">
              <span className="text-sm font-semibold">Current Title</span>
              <Input
                value={editForm.currentTitle}
                onChange={(event) => handleEditFormChange("currentTitle", event.target.value)}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold">Current Company</span>
              <Input
                value={editForm.currentCompany}
                onChange={(event) => handleEditFormChange("currentCompany", event.target.value)}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold">Total Years Experience</span>
              <Input
                type="number"
                min="0"
                value={editForm.totalYearsExperience}
                onChange={(event) =>
                  handleEditFormChange("totalYearsExperience", event.target.value)
                }
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold">Summary</span>
              <textarea
                value={editForm.summary}
                onChange={(event) => handleEditFormChange("summary", event.target.value)}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold">Hard Skills</span>
              <Input
                value={editForm.skillsHard}
                onChange={(event) => handleEditFormChange("skillsHard", event.target.value)}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold">Soft Skills</span>
              <Input
                value={editForm.skillsSoft}
                onChange={(event) => handleEditFormChange("skillsSoft", event.target.value)}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold">Profile Status</span>
              <select
                value={editForm.profileStatus}
                onChange={(event) => handleEditFormChange("profileStatus", event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="pending_parse">pending_parse</option>
                <option value="parsed">parsed</option>
                <option value="needs_review">needs_review</option>
                <option value="enriched">enriched</option>
                <option value="failed_parse">failed_parse</option>
              </select>
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Update Candidate"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Candidate Profile UI</DialogTitle>
            <DialogDescription>Edit profile fields and save changes.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateCandidate} className="space-y-4">
            <label className="space-y-2">
              <span className="text-sm font-semibold">Full Name</span>
              <Input
                value={editForm.fullName}
                onChange={(event) => handleEditFormChange("fullName", event.target.value)}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold">Email</span>
              <Input
                value={editForm.email}
                onChange={(event) => handleEditFormChange("email", event.target.value)}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold">Phone</span>
              <Input
                value={editForm.phone}
                onChange={(event) => handleEditFormChange("phone", event.target.value)}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold">Location</span>
              <Input
                value={editForm.location}
                onChange={(event) => handleEditFormChange("location", event.target.value)}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold">Current Title</span>
              <Input
                value={editForm.currentTitle}
                onChange={(event) => handleEditFormChange("currentTitle", event.target.value)}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold">Summary</span>
              <textarea
                value={editForm.summary}
                onChange={(event) => handleEditFormChange("summary", event.target.value)}
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setProfileOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CandidateRankingPage;
