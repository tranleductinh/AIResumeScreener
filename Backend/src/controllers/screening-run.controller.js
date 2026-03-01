import { error, success } from "../utils/response.js";
import {
  createScreeningRunService,
  getScreeningRunByIdService,
  getScreeningRunsService,
  updateScreeningRunStatusService,
} from "../services/screening-run.service.js";

export const createScreeningRunController = async (req, res) => {
  try {
    const screeningRun = await createScreeningRunService(req.body, req.user?._id);
    return success(res, "Create screening run successfully", screeningRun, 201);
  } catch (err) {
    return error(res, err.message, err.errorCode, err.status);
  }
};

export const getScreeningRunsController = async (req, res) => {
  try {
    const screeningRuns = await getScreeningRunsService(req.query);
    return success(res, "Get screening runs successfully", screeningRuns, 200);
  } catch (err) {
    return error(res, err.message, err.errorCode, err.status);
  }
};

export const getScreeningRunByIdController = async (req, res) => {
  try {
    const screeningRun = await getScreeningRunByIdService(req.params.id);
    return success(res, "Get screening run detail successfully", screeningRun, 200);
  } catch (err) {
    return error(res, err.message, err.errorCode, err.status);
  }
};

export const updateScreeningRunStatusController = async (req, res) => {
  try {
    const screeningRun = await updateScreeningRunStatusService(req.params.id, req.body);
    return success(res, "Update screening run status successfully", screeningRun, 200);
  } catch (err) {
    return error(res, err.message, err.errorCode, err.status);
  }
};
