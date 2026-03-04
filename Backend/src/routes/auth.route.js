import express from "express";
import { validateRequest } from "../middlewares/validate-request.middleware.js";
import { authSchemas } from "../validations/request-schemas.js";
const router = express.Router();
import {
  forgotPasswordController,
  googleLoginController,
  loginLocalController,
  logOutController,
  refreshTokenController,
  registerLocalController,
  resendVerificationController,
  resetPasswordController,
  verifyEmailController,
} from "../controllers/auth.controller.js";

import { protect } from "../middlewares/auth.middleware.js";

router.post("/register", validateRequest(authSchemas.register), registerLocalController);
router.post("/login", validateRequest(authSchemas.login), loginLocalController);
router.post("/google", validateRequest(authSchemas.googleLogin), googleLoginController);
router.post("/verify-email", validateRequest(authSchemas.verifyEmail), verifyEmailController);
router.post(
  "/resend-verification",
  validateRequest(authSchemas.resendVerification),
  resendVerificationController
);
router.post(
  "/forgot-password",
  validateRequest(authSchemas.forgotPassword),
  forgotPasswordController
);
router.post("/reset-password", validateRequest(authSchemas.resetPassword), resetPasswordController);
router.get("/logout", protect, logOutController);
router.get("/refresh-token", refreshTokenController);
export default router;
