import api from "./index";

export const createScreeningResultsBulk = async (payload) => {
  return api.post("/screening-results/bulk", payload);
};

export const getJobScreeningResults = async (jobId, params = {}) => {
  return api.get(`/jobs/${jobId}/results`, { params });
};

export const getScreeningRunResults = async (screeningRunId, params = {}) => {
  return api.get(`/screening-runs/${screeningRunId}/results`, { params });
};
