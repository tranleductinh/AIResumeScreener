import express from "express";
import { validateRequest } from "../middlewares/validate-request.middleware.js";
import { authSchemas } from "../validations/request-schemas.js";
const router = express.Router();
import { googleLoginController, logOutController, refreshTokenController } from "../controllers/auth.controller.js";

import { protect } from "../middlewares/auth.middleware.js";
router.post("/google", validateRequest(authSchemas.googleLogin), googleLoginController);
router.get("/logout", protect, logOutController);
router.get("/refresh-token", refreshTokenController);
export default router;
