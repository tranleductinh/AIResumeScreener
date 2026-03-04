import { error, success } from "../utils/response.js";
import {
  createScreeningResultsBulkService,
  getJobScreeningResultsService,
  getScreeningRunResultsService,
} from "../services/screening-result.service.js";

export const createScreeningResultsBulkController = async (req, res) => {
  try {
    const results = await createScreeningResultsBulkService(req.body, req.user?._id);
    return success(res, "Create screening results successfully", results, 201);
  } catch (err) {
    return error(res, err.message, err.errorCode, err.status);
  }
};

export const getJobScreeningResultsController = async (req, res) => {
  try {
    const results = await getJobScreeningResultsService(req.params.jobId, req.query);
    return success(res, "Get job screening results successfully", results, 200);
  } catch (err) {
    return error(res, err.message, err.errorCode, err.status);
  }
};

export const getScreeningRunResultsController = async (req, res) => {
  try {
    const results = await getScreeningRunResultsService(req.params.id, req.query);
    return success(res, "Get screening run results successfully", results, 200);
  } catch (err) {
    return error(res, err.message, err.errorCode, err.status);
  }
};
