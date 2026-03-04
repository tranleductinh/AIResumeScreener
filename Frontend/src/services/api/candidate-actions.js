import api from "./index";

export const createCandidateAction = async (payload) => {
  return api.post("/candidate-actions", payload);
};

export const getJobCandidateActions = async (jobId, params = {}) => {
  return api.get(`/jobs/${jobId}/actions`, { params });
};
