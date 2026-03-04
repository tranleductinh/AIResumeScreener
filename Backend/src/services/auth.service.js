import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";

import getFirebaseAdmin from "../config/firebase.js";
import { sendMail } from "../config/mailer.js";
import User from "../models/user.model.js";
import { buildServiceError } from "../utils/reference-validation.js";
import { generateToken } from "../utils/generateToken.js";

const verifyTokenExpiryMinutes = Number(process.env.EMAIL_VERIFY_EXPIRES_MINUTES || 24 * 60);
const resetTokenExpiryMinutes = Number(process.env.RESET_PASSWORD_EXPIRES_MINUTES || 30);
const frontendBaseUrl = String(process.env.FRONTEND_APP_URL || "http://localhost:5173").replace(
  /\/+$/,
  ""
);

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const hashRawToken = (rawToken) => {
  return crypto.createHash("sha256").update(String(rawToken || "")).digest("hex");
};

const createRawToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

const createTokenExpiryDate = (minutes) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

const buildPublicUser = (user) => {
  return {
    email: user.email,
    fullName: user.fullName,
    avatar: user.avatar || null,
    role: user.role,
    authType: user.authType,
    emailVerifiedAt: user.emailVerifiedAt || null,
  };
};

const buildVerificationLink = ({ email, token }) => {
  return `${frontendBaseUrl}/verify-email?email=${encodeURIComponent(
    email
  )}&token=${encodeURIComponent(token)}`;
};

const buildResetPasswordLink = ({ email, token }) => {
  return `${frontendBaseUrl}/reset-password?email=${encodeURIComponent(
    email
  )}&token=${encodeURIComponent(token)}`;
};

const sendVerificationMail = async ({ email, fullName, rawToken }) => {
  const verifyLink = buildVerificationLink({ email, token: rawToken });
  const safeName = fullName || "there";
  const subject = "Verify your email for AI Resume Screener";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px;">
      <h2 style="margin-bottom: 8px;">Verify your email</h2>
      <p>Hi ${safeName},</p>
      <p>Thanks for registering. Please verify your email to activate your account.</p>
      <p style="margin: 20px 0;">
        <a href="${verifyLink}" style="background:#2563eb;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px;display:inline-block;">
          Verify Email
        </a>
      </p>
      <p>If the button does not work, copy this link:</p>
      <p>${verifyLink}</p>
      <p>This link expires in ${verifyTokenExpiryMinutes} minutes.</p>
    </div>
  `;

  const text = [
    `Hi ${safeName},`,
    "",
    "Thanks for registering. Please verify your email to activate your account.",
    `Verify link: ${verifyLink}`,
    `This link expires in ${verifyTokenExpiryMinutes} minutes.`,
  ].join("\n");

  await sendMail({
    to: email,
    subject,
    html,
    text,
  });
};

const sendResetPasswordMail = async ({ email, fullName, rawToken }) => {
  const resetLink = buildResetPasswordLink({ email, token: rawToken });
  const safeName = fullName || "there";
  const subject = "Reset your password for AI Resume Screener";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px;">
      <h2 style="margin-bottom: 8px;">Reset your password</h2>
      <p>Hi ${safeName},</p>
      <p>We received a request to reset your password.</p>
      <p style="margin: 20px 0;">
        <a href="${resetLink}" style="background:#2563eb;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px;display:inline-block;">
          Reset Password
        </a>
      </p>
      <p>If the button does not work, copy this link:</p>
      <p>${resetLink}</p>
      <p>This link expires in ${resetTokenExpiryMinutes} minutes.</p>
    </div>
  `;

  const text = [
    `Hi ${safeName},`,
    "",
    "We received a request to reset your password.",
    `Reset link: ${resetLink}`,
    `This link expires in ${resetTokenExpiryMinutes} minutes.`,
  ].join("\n");

  await sendMail({
    to: email,
    subject,
    html,
    text,
  });
};

const persistSessionTokens = async (userId) => {
  const tokens = generateToken(userId);
  await User.findByIdAndUpdate(userId, {
    refreshToken: tokens.refreshToken,
  });

  return tokens;
};

const createAndStoreEmailVerificationToken = async (user) => {
  const rawToken = createRawToken();
  user.emailVerificationTokenHash = hashRawToken(rawToken);
  user.emailVerificationExpiresAt = createTokenExpiryDate(verifyTokenExpiryMinutes);
  await user.save();
  return rawToken;
};

const createAndStorePasswordResetToken = async (user) => {
  const rawToken = createRawToken();
  user.passwordResetTokenHash = hashRawToken(rawToken);
  user.passwordResetExpiresAt = createTokenExpiryDate(resetTokenExpiryMinutes);
  await user.save();
  return rawToken;
};

export const registerLocal = async ({ fullName, email, password }) => {
  const normalizedEmail = normalizeEmail(email);
  const normalizedName = String(fullName || "").trim();

  const existingUser = await User.findOne({ email: normalizedEmail }).select("+passwordHash");
  if (existingUser && existingUser.emailVerifiedAt) {
    throw buildServiceError("Email is already registered", 409, "EMAIL_ALREADY_REGISTERED");
  }

  if (existingUser && existingUser.authType === "google" && !existingUser.passwordHash) {
    throw buildServiceError(
      "This email is linked to Google sign-in. Please use Google login.",
      409,
      "ACCOUNT_LINKED_TO_GOOGLE"
    );
  }

  const passwordHash = await bcrypt.hash(String(password), 12);
  let user = existingUser;

  if (!user) {
    user = await User.create({
      fullName: normalizedName,
      email: normalizedEmail,
      passwordHash,
      authType: "local",
      status: "active",
      isActive: true,
      joinedAt: null,
      emailVerifiedAt: null,
    });
  } else {
    user.fullName = normalizedName || user.fullName;
    user.passwordHash = passwordHash;
    user.authType = "local";
    user.status = "active";
    user.isActive = true;
  }

  const rawVerificationToken = await createAndStoreEmailVerificationToken(user);
  await sendVerificationMail({
    email: user.email,
    fullName: user.fullName,
    rawToken: rawVerificationToken,
  });

  return {
    email: user.email,
    fullName: user.fullName,
  };
};

export const loginLocal = async ({ email, password }) => {
  const normalizedEmail = normalizeEmail(email);

  const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");
  if (!user || !user.passwordHash) {
    throw buildServiceError("Email or password is invalid", 401, "INVALID_CREDENTIALS");
  }

  const isPasswordValid = await bcrypt.compare(String(password), user.passwordHash);
  if (!isPasswordValid) {
    throw buildServiceError("Email or password is invalid", 401, "INVALID_CREDENTIALS");
  }

  if (!user.emailVerifiedAt) {
    throw buildServiceError(
      "Email is not verified. Please check your inbox.",
      403,
      "EMAIL_NOT_VERIFIED"
    );
  }

  if (!user.isActive || user.status === "suspended") {
    throw buildServiceError("Account is not active", 403, "ACCOUNT_INACTIVE");
  }

  const tokens = await persistSessionTokens(user._id);
  return {
    refreshToken: tokens.refreshToken,
    accessToken: tokens.accessToken,
    user: buildPublicUser(user),
  };
};

export const verifyEmailToken = async ({ email, token }) => {
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail }).select(
    "+emailVerificationTokenHash +emailVerificationExpiresAt"
  );

  if (!user) {
    throw buildServiceError("Verification link is invalid", 400, "VERIFY_EMAIL_INVALID");
  }

  if (user.emailVerifiedAt) {
    return {
      alreadyVerified: true,
      email: user.email,
    };
  }

  const hashedToken = hashRawToken(token);
  const isTokenValid =
    user.emailVerificationTokenHash &&
    user.emailVerificationTokenHash === hashedToken &&
    user.emailVerificationExpiresAt &&
    user.emailVerificationExpiresAt.getTime() > Date.now();

  if (!isTokenValid) {
    throw buildServiceError(
      "Verification link is invalid or expired",
      400,
      "VERIFY_EMAIL_TOKEN_INVALID"
    );
  }

  user.emailVerifiedAt = new Date();
  user.joinedAt = user.joinedAt || new Date();
  user.emailVerificationTokenHash = null;
  user.emailVerificationExpiresAt = null;
  await user.save();

  return {
    email: user.email,
    emailVerifiedAt: user.emailVerifiedAt,
  };
};

export const resendVerificationEmail = async ({ email }) => {
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");

  if (!user || user.authType !== "local") {
    return {
      email: normalizedEmail,
    };
  }

  if (user.emailVerifiedAt) {
    return {
      email: user.email,
      alreadyVerified: true,
    };
  }

  const rawVerificationToken = await createAndStoreEmailVerificationToken(user);
  await sendVerificationMail({
    email: user.email,
    fullName: user.fullName,
    rawToken: rawVerificationToken,
  });

  return {
    email: user.email,
    sent: true,
  };
};

export const forgotPassword = async ({ email }) => {
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");

  if (!user || user.authType !== "local" || !user.passwordHash) {
    return {
      email: normalizedEmail,
      sent: true,
    };
  }

  const rawResetToken = await createAndStorePasswordResetToken(user);
  await sendResetPasswordMail({
    email: user.email,
    fullName: user.fullName,
    rawToken: rawResetToken,
  });

  return {
    email: user.email,
    sent: true,
  };
};

export const resetPassword = async ({ email, token, newPassword }) => {
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail }).select(
    "+passwordHash +passwordResetTokenHash +passwordResetExpiresAt"
  );

  if (!user || user.authType !== "local") {
    throw buildServiceError("Reset password token is invalid", 400, "RESET_PASSWORD_INVALID");
  }

  const hashedToken = hashRawToken(token);
  const isTokenValid =
    user.passwordResetTokenHash &&
    user.passwordResetTokenHash === hashedToken &&
    user.passwordResetExpiresAt &&
    user.passwordResetExpiresAt.getTime() > Date.now();

  if (!isTokenValid) {
    throw buildServiceError(
      "Reset password token is invalid or expired",
      400,
      "RESET_PASSWORD_TOKEN_INVALID"
    );
  }

  user.passwordHash = await bcrypt.hash(String(newPassword), 12);
  user.passwordResetTokenHash = null;
  user.passwordResetExpiresAt = null;
  user.refreshToken = null;
  user.isActive = true;
  user.status = "active";
  await user.save();

  return {
    email: user.email,
  };
};

export const googleLogin = async (idToken) => {
  try {
    if (!idToken) {
      throw buildServiceError("Token is required", 400, "TOKEN_IS_REQUIRED");
    }

    const tokenParts = String(idToken).split(".");
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
    const normalizedEmail = normalizeEmail(email);

    let user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");

    if (user) {
      if (!user.google_id) {
        user.google_id = uid;
      }
      user.avatar = picture || user.avatar;
      if (!user.passwordHash) {
        user.authType = "google";
      }
      user.joinedAt = user.joinedAt || new Date();
      if (decodedToken.email_verified && !user.emailVerifiedAt) {
        user.emailVerifiedAt = new Date();
      }
      await user.save();
    } else {
      user = await User.create({
        google_id: uid,
        email: normalizedEmail,
        fullName: name,
        avatar: picture,
        authType: "google",
        joinedAt: new Date(),
        emailVerifiedAt: decodedToken.email_verified ? new Date() : null,
      });
    }

    const tokens = await persistSessionTokens(user._id);
    return {
      refreshToken: tokens.refreshToken,
      accessToken: tokens.accessToken,
      user: buildPublicUser(user),
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
      decoded = jwt.verify(refreshTokenFromCookie, process.env.JWT_REFRESH_SECRET);
    } catch (_error) {
      throw buildServiceError("Refresh token is not valid", 401, "INVALID_REFRESH_TOKEN");
    }

    const user = await User.findById(decoded.id).select("+refreshToken");
    if (!user || user.refreshToken !== refreshTokenFromCookie) {
      throw buildServiceError("Refresh token is not valid", 401, "INVALID_REFRESH_TOKEN");
    }

    const token = await persistSessionTokens(user._id);
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

export const logOutUser = async (userId) => {
  try {
    if (!userId) {
      return;
    }

    await User.findByIdAndUpdate(userId, { refreshToken: null });
  } catch (error) {
    throw buildServiceError(error.message, 500, "LOGOUT_FAILED");
  }
};

