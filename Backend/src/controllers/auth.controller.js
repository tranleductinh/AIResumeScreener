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
  sameSite: process.env.COOKIE_SAMESITE,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const googleLoginController = async (req, res) => {
  try {
    const { idToken } = req.body;
    const user = await googleLogin(idToken);
    res.cookie("refreshToken", user.refreshToken);
    const { refreshToken, ...safeUser } = user;
    return success(res, "Login successfully", safeUser, 200);
  } catch (err) {
    return error(res, err.message, err.errorCode, err.status);
  }
};

export const logOutController = async (req, res) => {
  try {
    await logOutUser(req.user_id);
    res.clearCookie("refreshToken");
    return success(res, "Logout successfully", null, 200);
  } catch (err) {
    return error(res, err.message, err.errorCode, err.status);
  }
};

export const refreshTokenController = async (req, res) => {
  try {
    const { refreshTokenFromCookie } = req.cookies;
    const token = await refreshTokenProcess(refreshTokenFromCookie);
    res.cookie("refreshToken");
    return success(res, "Refresh token successfully", token, 200);
  } catch (err) {
    return error(res, err.message, err.errorCode, err.status);
  }
};
