import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.route.js";
import auditLogRoutes from "./routes/audit-log.route.js";
import candidateActionRoutes from "./routes/candidate-action.route.js";
import dashboardRoutes from "./routes/dashboard.route.js";
import jobRoutes from "./routes/job.route.js";
import candidateRoutes from "./routes/candidate.route.js";
import resumeFileRoutes from "./routes/resume-file.route.js";
import screeningRunRoutes from "./routes/screening-run.route.js";
import screeningResultRoutes from "./routes/screening-result.route.js";
dotenv.config();

const app = express();

app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"],
    credentials: true,
    methods: ["POST", "GET", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/auth", authRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/candidate-actions", candidateActionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/resume-files", resumeFileRoutes);
app.use("/api/screening-runs", screeningRunRoutes);
app.use("/api/screening-results", screeningResultRoutes);

const port = process.env.PORT || 3000;

async function startServer() {
  try {
    const connection = await connectDB();

    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
}

startServer();
