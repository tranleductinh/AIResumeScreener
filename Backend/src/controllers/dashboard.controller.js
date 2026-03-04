import { error, success } from "../utils/response.js";
import {
  getDashboardRecentActivityService,
  getDashboardSummaryService,
} from "../services/dashboard.service.js";

export const getDashboardSummaryController = async (req, res) => {
  try {
    const summary = await getDashboardSummaryService();
    return success(res, "Get dashboard summary successfully", summary, 200);
  } catch (err) {
    return error(res, err.message, err.errorCode, err.status);
  }
};

export const getDashboardRecentActivityController = async (req, res) => {
  try {
    const activities = await getDashboardRecentActivityService(req.query);
    return success(res, "Get dashboard recent activity successfully", activities, 200);
  } catch (err) {
    return error(res, err.message, err.errorCode, err.status);
  }
};
