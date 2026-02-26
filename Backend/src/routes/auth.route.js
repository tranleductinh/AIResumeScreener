import express from "express"
const router = express.Router();
import { googleLoginController, logOutController, refreshTokenController } from "../controllers/auth.controller.js";

import { protect } from "../middlewares/auth.middleware.js";
router.post("/google", googleLoginController);
router.get("/logout", protect, logOutController);
router.get("/refresh-token", refreshTokenController);
export default router;
