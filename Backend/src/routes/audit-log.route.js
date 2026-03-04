import express from "express";

import { getAuditLogsController } from "../controllers/audit-log.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getAuditLogsController);

export default router;
