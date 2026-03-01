import { error, success } from "../utils/response.js";
import {
  createCandidateService,
  deleteCandidateService,
  getCandidateByIdService,
  getCandidatesService,
  updateCandidateService,
} from "../services/candidate.service.js";

export const createCandidateController = async (req, res) => {
  try {
    const candidate = await createCandidateService(req.body);
    return success(res, "Create candidate successfully", candidate, 201);
  } catch (err) {
    return error(res, err.message, err.errorCode, err.status);
  }
};

export const getCandidatesController = async (req, res) => {
  try {
    const candidates = await getCandidatesService(req.query);
    return success(res, "Get candidates successfully", candidates, 200);
  } catch (err) {
    return error(res, err.message, err.errorCode, err.status);
  }
};

export const getCandidateByIdController = async (req, res) => {
  try {
    const candidate = await getCandidateByIdService(req.params.id);
    return success(res, "Get candidate detail successfully", candidate, 200);
  } catch (err) {
    return error(res, err.message, err.errorCode, err.status);
  }
};

export const updateCandidateController = async (req, res) => {
  try {
    const candidate = await updateCandidateService(req.params.id, req.body);
    return success(res, "Update candidate successfully", candidate, 200);
  } catch (err) {
    return error(res, err.message, err.errorCode, err.status);
  }
};

export const deleteCandidateController = async (req, res) => {
  try {
    const result = await deleteCandidateService(req.params.id);
    return success(res, "Delete candidate successfully", result, 200);
  } catch (err) {
    return error(res, err.message, err.errorCode, err.status);
  }
};
