import api from "./index";

export const uploadResumeFiles = async (formData, onUploadProgress) => {
  return api.post("/resume-files/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress,
  });
};

export const getResumeFiles = async (params = {}) => {
  return api.get("/resume-files", { params });
};

export const getResumeFileById = async (resumeFileId) => {
  return api.get(`/resume-files/${resumeFileId}`);
};

export const deleteResumeFile = async (resumeFileId) => {
  return api.delete(`/resume-files/${resumeFileId}`);
};
