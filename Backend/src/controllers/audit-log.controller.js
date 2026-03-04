import { error, success } from "../utils/response.js";
import { getAuditLogsService } from "../services/audit-log.service.js";

export const getAuditLogsController = async (req, res) => {
  try {
    const auditLogs = await getAuditLogsService(req.query);
    return success(res, "Get audit logs successfully", auditLogs, 200);
  } catch (err) {
    return error(res, err.message, err.errorCode, err.status);
  }
};
