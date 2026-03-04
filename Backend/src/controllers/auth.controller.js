import { success, error } from "../utils/response.js";
import {
  forgotPassword,
  googleLogin,
  loginLocal,
  logOutUser,
  registerLocal,
  resendVerificationEmail,
  resetPassword,
  refreshTokenProcess,
  verifyEmailToken,
} from "../services/auth.service.js";
import dotenv from "dotenv";
dotenv.config();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === "true",
  sameSite: process.env.COOKIE_SAMESITE || "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const googleLoginController = async (req, res) => {
  try {
    const { idToken } = req.body;
    const user = await googleLogin(idToken);
    res.cookie("refreshToken", user.refreshToken, COOKIE_OPTIONS);
    const { refreshToken, ...safeUser } = user;
    return success(res, "Login successfully", safeUser, 200);
  } catch (err) {
    return error(res, err.message, err.errorCode, err.status);
  }
};

export const registerLocalController = async (req, res) => {
  try {
    const result = await registerLocal(req.body);
    return success(
      res,
      "Register successfully. Please check your email for verification.",
      result,
      201
    );
  } catch (err) {
    return error(res, err.message, err.errorCode, err.status);
  }
};

export const loginLocalController = async (req, res) => {
  try {
    const user = await loginLocal(req.body);
    res.cookie("refreshToken", user.refreshToken, COOKIE_OPTIONS);
    const { refreshToken, ...safeUser } = user;
    return success(res, "Login successfully", safeUser, 200);
  } catch (err) {
    return error(res, err.message, err.errorCode, err.status);
  }
};

export const verifyEmailController = async (req, res) => {
  try {
    const result = await verifyEmailToken(req.body);
    return success(res, "Verify email successfully", result, 200);
  } catch (err) {
    return error(res, err.message, err.errorCode, err.status);
  }
};

export const resendVerificationController = async (req, res) => {
  try {
    const result = await resendVerificationEmail(req.body);
    return success(
      res,
      "If your email exists and is not verified, a verification email has been sent.",
      result,
      200
    );
  } catch (err) {
    return error(res, err.message, err.errorCode, err.status);
  }
};

export const forgotPasswordController = async (req, res) => {
  try {
    const result = await forgotPassword(req.body);
    return success(
      res,
      "If your email exists, a password reset email has been sent.",
      result,
      200
    );
  } catch (err) {
    return error(res, err.message, err.errorCode, err.status);
  }
};

export const resetPasswordController = async (req, res) => {
  try {
    const result = await resetPassword(req.body);
    return success(res, "Reset password successfully", result, 200);
  } catch (err) {
    return error(res, err.message, err.errorCode, err.status);
  }
};

export const logOutController = async (req, res) => {
  try {
    await logOutUser(req.user?._id);
    res.clearCookie("refreshToken", COOKIE_OPTIONS);
    return success(res, "Logout successfully", null, 200);
  } catch (err) {
    return error(res, err.message, err.errorCode, err.status);
  }
};

export const refreshTokenController = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    const token = await refreshTokenProcess(refreshToken);
    res.cookie("refreshToken", token.refreshToken, COOKIE_OPTIONS);
    return success(res, "Refresh token successfully", token, 200);
  } catch (err) {
    return error(res, err.message, err.errorCode, err.status);
  }
};
