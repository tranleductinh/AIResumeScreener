import User from "../models/user.model.js";
import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";
import { generateToken } from "../utils/generateToken.js";
import { buildServiceError } from "../utils/reference-validation.js";
import getFirebaseAdmin from "../config/firebase.js";

export const googleLogin = async (idToken) => {
  try {
    if (!idToken) {
      throw buildServiceError("Token is required", 400, "TOKEN_IS_REQUIRED");
    }

    const tokenParts = idToken.split(".");
    if (tokenParts.length !== 3) {
      throw buildServiceError(
        "Invalid token format. Firebase ID token must have 3 parts.",
        400,
        "INVALID_TOKEN_FORMAT"
      );
    }

    const admin = getFirebaseAdmin();
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    let user = await User.findOne({ email });

    if (user) {
      if (!user.google_id) {
        user.google_id = uid;
        user.avatar = picture || user.avatar;
        user.authType = "google";
        await user.save();
      }
    } else {

      user = await User.create({
        google_id: uid,
        email,
        fullName: name,
        avatar: picture,
        authType: "google",
        joinedAt: new Date(),
        emailVerifiedAt: decodedToken.email_verified ? new Date() : null,
      });
    }

    const tokens = generateToken(user._id);

    await User.findByIdAndUpdate(user._id, {
      refreshToken: tokens.refreshToken,
    });

    return {
      refreshToken: tokens.refreshToken,
      accessToken: tokens.accessToken,
      user: {
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
        role: user.role,
      },
    };
  } catch (error) {
    if (error.code === "auth/argument-error") {
      throw buildServiceError("Invalid Firebase ID token format", 400, "INVALID_TOKEN_FORMAT");
    }

    if (error.code === "auth/id-token-expired") {
      throw buildServiceError("Firebase ID token has expired", 401, "TOKEN_HAS_EXPIRED");
    }
    if (error?.errorCode) {
      throw error;
    }
    throw buildServiceError(error.message, 401, "AUTHENTICATION_FAILED");
  }
};

export const refreshTokenProcess = async (refreshTokenFromCookie) => {
  try {
    if (!refreshTokenFromCookie) {
      throw buildServiceError("Refresh token not found", 401, "REFRESH_TOKEN_NOT_FOUND");
    }
    let decoded;
    try {
      decoded = jwt.verify(
        refreshTokenFromCookie,
        process.env.JWT_REFRESH_SECRET
      );
    } catch (_error) {
      throw buildServiceError("Refresh token is not valid", 401, "INVALID_REFRESH_TOKEN");
    }
    const user = await User.findById(decoded.id).select("+refreshToken");
    if (!user || user.refreshToken !== refreshTokenFromCookie) {
      throw buildServiceError("Refresh token is not valid", 401, "INVALID_REFRESH_TOKEN");
    }
    const token = generateToken(user._id);
    await User.findByIdAndUpdate(user._id, {
      refreshToken: token.refreshToken,
    });
    return {
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
    };
  } catch (error) {
    if (error?.errorCode) {
      throw error;
    }
    throw buildServiceError(error.message, 401, "REFRESH_TOKEN_FAILED");
  }
};
export const logOutUser = async (user_id) => {
  try {
    await User.findByIdAndUpdate(user_id, { refreshToken: null });
  } catch (error) {
    throw buildServiceError(error.message, 500, "LOGOUT_FAILED");
  }
};
