import { error, success } from "../utils/response.js";
import {
  deleteResumeFileService,
  getResumeFileByIdService,
  getResumeFilesService,
  uploadResumeFilesService,
} from "../services/resume-file.service.js";

export const uploadResumeFilesController = async (req, res) => {
  try {
    const result = await uploadResumeFilesService({
      upload: req.resumeUpload,
      userId: req.user?._id,
    });
    return success(res, "Upload resume files successfully", result, 201);
  } catch (err) {
    return error(res, err.message, err.errorCode, err.status);
  }
};

export const getResumeFilesController = async (req, res) => {
  try {
    const result = await getResumeFilesService(req.query);
    return success(res, "Get resume files successfully", result, 200);
  } catch (err) {
    return error(res, err.message, err.errorCode, err.status);
  }
};

export const getResumeFileByIdController = async (req, res) => {
  try {
    const result = await getResumeFileByIdService(req.params.id);
    return success(res, "Get resume file detail successfully", result, 200);
  } catch (err) {
    return error(res, err.message, err.errorCode, err.status);
  }
};

export const deleteResumeFileController = async (req, res) => {
  try {
    const result = await deleteResumeFileService(req.params.id);
    return success(res, "Delete resume file successfully", result, 200);
  } catch (err) {
    return error(res, err.message, err.errorCode, err.status);
  }
};
