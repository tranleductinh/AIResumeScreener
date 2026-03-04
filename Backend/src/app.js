import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import auditLogRoutes from "./routes/audit-log.route.js";
import authRoutes from "./routes/auth.route.js";
import candidateActionRoutes from "./routes/candidate-action.route.js";
import candidateRoutes from "./routes/candidate.route.js";
import dashboardRoutes from "./routes/dashboard.route.js";
import jobRoutes from "./routes/job.route.js";
import resumeFileRoutes from "./routes/resume-file.route.js";
import screeningResultRoutes from "./routes/screening-result.route.js";
import screeningRunRoutes from "./routes/screening-run.route.js";
import { errorHandler, notFoundHandler } from "./middlewares/error-handler.middleware.js";
import { success } from "./utils/response.js";

const defaultAllowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "https://ai-resume-screener-seven.vercel.app",
];

const normalizeOrigin = (value) => {
  return String(value || "").trim().replace(/\/+$/, "");
};

const configuredOrigins = String(process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => normalizeOrigin(origin))
  .filter(Boolean);

const allowedOrigins = new Set(
  [...defaultAllowedOrigins, ...configuredOrigins].map((origin) => normalizeOrigin(origin))
);

const allowVercelPreview = String(process.env.CORS_ALLOW_VERCEL_PREVIEW || "false") === "true";

const isAllowedOrigin = (origin) => {
  if (!origin) {
    return true;
  }

  const normalizedOrigin = normalizeOrigin(origin);
  if (allowedOrigins.has(normalizedOrigin)) {
    return true;
  }

  if (allowVercelPreview && /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(normalizedOrigin)) {
    return true;
  }

  return false;
};

export const createApp = () => {
  const app = express();

  app.use(cookieParser());
  app.use(
    cors({
      origin(origin, callback) {
        if (isAllowedOrigin(origin)) {
          return callback(null, true);
        }

        return callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
      methods: ["POST", "GET", "PUT", "DELETE", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/api/health", (_req, res) => {
    return success(res, "API is healthy", { status: "ok" }, 200);
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/audit-logs", auditLogRoutes);
  app.use("/api/candidate-actions", candidateActionRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/jobs", jobRoutes);
  app.use("/api/candidates", candidateRoutes);
  app.use("/api/resume-files", resumeFileRoutes);
  app.use("/api/screening-runs", screeningRunRoutes);
  app.use("/api/screening-results", screeningResultRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default createApp;
