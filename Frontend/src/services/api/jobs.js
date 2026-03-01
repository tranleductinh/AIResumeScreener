import api from "./index";

export const getJobs = async (params = {}) => {
  return api.get("/jobs", { params });
};

export const getJobById = async (jobId) => {
  return api.get(`/jobs/${jobId}`);
};

export const createJob = async (payload) => {
  return api.post("/jobs", payload);
};

export const updateJob = async (jobId, payload) => {
  return api.patch(`/jobs/${jobId}`, payload);
};

export const deleteJob = async (jobId) => {
  return api.delete(`/jobs/${jobId}`);
};
