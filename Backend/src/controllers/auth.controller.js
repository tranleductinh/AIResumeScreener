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

const normalizeSameSite = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "none" || normalized === "lax" || normalized === "strict") {
    return normalized;
  }
  return null;
};

const isProductionLike =
  process.env.NODE_ENV === "production" || String(process.env.RENDER || "").length > 0;

const resolvedSameSite = normalizeSameSite(process.env.COOKIE_SAMESITE) || (isProductionLike ? "none" : "lax");
const resolvedSecure =
  process.env.COOKIE_SECURE === "true" || resolvedSameSite === "none" || isProductionLike;
const resolvedCookieDomain = String(process.env.COOKIE_DOMAIN || "").trim();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: resolvedSecure,
  sameSite: resolvedSameSite,
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  ...(resolvedCookieDomain ? { domain: resolvedCookieDomain } : {}),
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
    res.clearCookie("refreshToken", COOKIE_OPTIONS);
    return error(res, err.message, err.errorCode, err.status);
  }
};
