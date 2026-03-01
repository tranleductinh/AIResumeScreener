import api from "./index";

export const createScreeningRun = async (payload) => {
  return api.post("/screening-runs", payload);
};

export const getScreeningRuns = async (params = {}) => {
  return api.get("/screening-runs", { params });
};

export const getScreeningRunById = async (screeningRunId) => {
  return api.get(`/screening-runs/${screeningRunId}`);
};

export const updateScreeningRunStatus = async (screeningRunId, payload) => {
  return api.patch(`/screening-runs/${screeningRunId}/status`, payload);
};
