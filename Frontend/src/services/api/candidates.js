import api from "./index";

export const getCandidates = async (params = {}) => {
  return api.get("/candidates", { params });
};

export const getCandidateById = async (candidateId) => {
  return api.get(`/candidates/${candidateId}`);
};

export const createCandidate = async (payload) => {
  return api.post("/candidates", payload);
};

export const updateCandidate = async (candidateId, payload) => {
  return api.patch(`/candidates/${candidateId}`, payload);
};

export const deleteCandidate = async (candidateId) => {
  return api.delete(`/candidates/${candidateId}`);
};
