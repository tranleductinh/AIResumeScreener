import { success, error } from "../utils/response.js";
import {
  googleLogin,
  logOutUser,
  refreshTokenProcess,
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
