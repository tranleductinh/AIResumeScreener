import nodemailer from "nodemailer";

import { buildServiceError } from "../utils/reference-validation.js";

let transporterInstance = null;

const parseSmtpPort = () => {
  const parsed = Number(process.env.SMTP_PORT || 587);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 587;
  }

  return parsed;
};

const parseSecureOption = () => {
  return String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
};

const ensureMailerConfig = () => {
  const requiredKeys = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "MAIL_FROM"];
  const missingKeys = requiredKeys.filter((key) => !String(process.env[key] || "").trim());

  if (missingKeys.length) {
    throw buildServiceError(
      `Mail configuration is missing: ${missingKeys.join(", ")}`,
      500,
      "MAIL_CONFIG_MISSING"
    );
  }
};

export const getMailerTransporter = () => {
  if (transporterInstance) {
    return transporterInstance;
  }

  ensureMailerConfig();
  transporterInstance = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseSmtpPort(),
    secure: parseSecureOption(),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporterInstance;
};

export const sendMail = async ({ to, subject, html, text }) => {
  const transporter = getMailerTransporter();
  const from = process.env.MAIL_FROM;

  return transporter.sendMail({
    from,
    to,
    subject,
    html,
    text,
  });
};

