import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import JobDetailPanel from "@/components/JobDetailPanel";
import JobFormDialog from "@/components/JobFormDialog";
import JobTable from "@/components/JobTable";
import {
  createJob,
  deleteJob,
  getJobById,
  getJobs,
  updateJob,
} from "@/services/api/jobs";
import { Button } from "@/components/ui/button";

const initialForm = {
  title: "",
  department: "",
  status: "draft",
  jdText: "",
};

const JobManagementPage = () => {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createForm, setCreateForm] = useState(initialForm);
  const [editForm, setEditForm] = useState(initialForm);

  const getErrorMessage = (err, fallback) => {
    return err?.response?.data?.message || fallback;
  };

  const fetchJobs = async (preferredSelectedId = null) => {
    try {
      setLoading(true);
      const response = await getJobs({ page: 1, limit: 100 });
      const items = response?.data?.data?.items || [];
      setJobs(items);

      if (!items.length) {
        setSelectedJobId(null);
        setSelectedJob(null);
        return;
      }

      const currentSelectedId = preferredSelectedId || selectedJobId;
      const hasCurrentSelected = items.some((job) => job._id === currentSelectedId);
      setSelectedJobId(hasCurrentSelected ? currentSelectedId : items[0]._id);
    } catch (err) {
      toast.error(getErrorMessage(err, "Cannot fetch jobs"));
    } finally {
      setLoading(false);
    }
  };

  const fetchJobDetail = async (jobId) => {
    try {
      const response = await getJobById(jobId);
      setSelectedJob(response?.data?.data || null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Cannot fetch job detail"));
      setSelectedJob(null);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (!selectedJobId) {
      setSelectedJob(null);
      return;
    }
    fetchJobDetail(selectedJobId);
  }, [selectedJobId]);

  const handleCreateJob = async (event) => {
    event.preventDefault();
    if (!createForm.title.trim() || !createForm.jdText.trim()) {
      toast.error("Title and JD text are required");
      return;
    }

    try {
      setSaving(true);
      const response = await createJob({
        title: createForm.title.trim(),
        department: createForm.department.trim(),
        status: createForm.status,
        jdText: createForm.jdText.trim(),
      });
      const createdJob = response?.data?.data;
      toast.success("Job created");
      setCreateOpen(false);
      setCreateForm(initialForm);
      await fetchJobs(createdJob?._id || null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Create job failed"));
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (jobData = selectedJob) => {
    if (!jobData) return;
    setEditForm({
      title: jobData.title || "",
      department: jobData.department || "",
      status: jobData.status || "draft",
      jdText: jobData.jdText || "",
    });
    setEditOpen(true);
  };

  const handleUpdateJob = async (event) => {
    event.preventDefault();
    if (!selectedJobId) return;

    if (!editForm.title.trim() || !editForm.jdText.trim()) {
      toast.error("Title and JD text are required");
      return;
    }

    try {
      setSaving(true);
      await updateJob(selectedJobId, {
        title: editForm.title.trim(),
        department: editForm.department.trim(),
        status: editForm.status,
        jdText: editForm.jdText.trim(),
      });
      toast.success("Job updated");
      setEditOpen(false);
      await fetchJobs(selectedJobId);
      await fetchJobDetail(selectedJobId);
    } catch (err) {
      toast.error(getErrorMessage(err, "Update job failed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!jobId) return;
    if (!window.confirm("Delete this job?")) return;

    try {
      await deleteJob(jobId);
      toast.success("Job deleted");
      await fetchJobs();
    } catch (err) {
      toast.error(getErrorMessage(err, "Delete job failed"));
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Job Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage, monitor, and screen your active job listings with AI insights.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Create New Job
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <JobTable
          jobs={jobs}
          selectedJobId={selectedJobId}
          loading={loading}
          onSelectJob={setSelectedJobId}
          onEditJob={(job) => {
            setSelectedJobId(job._id);
            openEditModal(job);
          }}
          onDeleteJob={handleDeleteJob}
        />

        <JobDetailPanel
          selectedJob={selectedJob}
          onOpenEdit={openEditModal}
          onDeleteJob={handleDeleteJob}
        />
      </div>

      <JobFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create New Job"
        description="Fill basic fields for core Job CRUD."
        form={createForm}
        onChangeForm={handleCreateFormChange}
        onSubmit={handleCreateJob}
        saving={saving}
        submitLabel="Create Job"
      />

      <JobFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Update Job"
        description="Edit selected job fields."
        form={editForm}
        onChangeForm={handleEditFormChange}
        onSubmit={handleUpdateJob}
        saving={saving}
        submitLabel="Update Job"
      />
    </div>
  );
};

export default JobManagementPage;
