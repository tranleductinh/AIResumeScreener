import AuditLog from "../models/audit-log.model.js";

const buildPagination = ({ page, limit, total }) => {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

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
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  const skip = (page - 1) * limit;

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

  return {
    items,
    pagination: buildPagination({ page, limit, total }),
  };
};
