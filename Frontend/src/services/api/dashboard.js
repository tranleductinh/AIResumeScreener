import api from "./index";

export const getDashboardSummary = async () => {
  return api.get("/dashboard/summary");
};

export const getDashboardRecentActivity = async (params = {}) => {
  return api.get("/dashboard/recent-activity", { params });
};
