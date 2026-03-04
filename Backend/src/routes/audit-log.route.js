import express from "express";

import { getAuditLogsController } from "../controllers/audit-log.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validate-request.middleware.js";
import { auditLogSchemas } from "../validations/request-schemas.js";

const router = express.Router();

router.use(protect);

router.get("/", validateRequest(auditLogSchemas.list), getAuditLogsController);

export default router;
