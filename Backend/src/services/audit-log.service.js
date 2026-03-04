import AuditLog from "../models/audit-log.model.js";
import { buildPaginationResult, parsePagination } from "../utils/pagination.js";

export const logAuditEventService = async ({
  actorId = null,
  actorEmail = null,
  entityType,
  entityId,
  action,
  module,
  severity = "info",
  metadata = {},
  ipAddress = null,
  userAgent = null,
}) => {
  return AuditLog.create({
    actorId,
    actorEmail,
    entityType,
    entityId,
    action,
    module,
    severity,
    metadata,
    ipAddress,
    userAgent,
  });
};

export const logAuditEventsBulkService = async (events = []) => {
  if (!events.length) {
    return [];
  }

  return AuditLog.insertMany(events, { ordered: true });
};

export const getAuditLogsService = async (query = {}) => {
  const { page, limit, skip } = parsePagination(query);

  const filter = {};

  if (query.module) {
    filter.module = query.module;
  }

  if (query.action) {
    filter.action = query.action;
  }

  if (query.entityType) {
    filter.entityType = query.entityType;
  }

  if (query.severity) {
    filter.severity = query.severity;
  }

  const [items, total] = await Promise.all([
    AuditLog.find(filter)
      .populate("actorId", "fullName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    AuditLog.countDocuments(filter),
  ]);

  return buildPaginationResult({ items, page, limit, total });
};
