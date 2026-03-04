import { error, success } from "../utils/response.js";
import {
  createCandidateActionService,
  getJobCandidateActionsService,
} from "../services/candidate-action.service.js";

export const createCandidateActionController = async (req, res) => {
  try {
    const action = await createCandidateActionService(req.body, req.user?._id, {
      actorEmail: req.user?.email || null,
      ipAddress: req.ip || null,
      userAgent: req.get("user-agent") || null,
    });
    return success(res, "Create candidate action successfully", action, 201);
  } catch (err) {
    return error(res, err.message, err.errorCode, err.status);
  }
};

export const getJobCandidateActionsController = async (req, res) => {
  try {
    const actions = await getJobCandidateActionsService(req.params.jobId, req.query);
    return success(res, "Get candidate actions successfully", actions, 200);
  } catch (err) {
    return error(res, err.message, err.errorCode, err.status);
  }
};
