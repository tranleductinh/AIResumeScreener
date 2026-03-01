import { error, success } from "../utils/response.js";
import {
  createJobService,
  deleteJobService,
  getJobByIdService,
  getJobsService,
  updateJobService,
} from "../services/job.service.js";

export const createJobController = async (req, res) => {
  try {
    const job = await createJobService(req.body, req.user?._id);
    return success(res, "Create job successfully", job, 201);
  } catch (err) {
    return error(res, err.message, err.errorCode, err.status);
  }
};

export const getJobsController = async (req, res) => {
  try {
    const jobs = await getJobsService(req.query);
    return success(res, "Get jobs successfully", jobs, 200);
  } catch (err) {
    return error(res, err.message, err.errorCode, err.status);
  }
};

export const getJobByIdController = async (req, res) => {
  try {
    const job = await getJobByIdService(req.params.id);
    return success(res, "Get job detail successfully", job, 200);
  } catch (err) {
    return error(res, err.message, err.errorCode, err.status);
  }
};

export const updateJobController = async (req, res) => {
  try {
    const job = await updateJobService(req.params.id, req.body);
    return success(res, "Update job successfully", job, 200);
  } catch (err) {
    return error(res, err.message, err.errorCode, err.status);
  }
};

export const deleteJobController = async (req, res) => {
  try {
    const result = await deleteJobService(req.params.id);
    return success(res, "Delete job successfully", result, 200);
  } catch (err) {
    return error(res, err.message, err.errorCode, err.status);
  }
};
