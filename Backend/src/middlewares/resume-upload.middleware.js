import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import Busboy from "@fastify/busboy";

import { error } from "../utils/response.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, "../../uploads/resumes");

const allowedMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
]);

const sanitizeFileName = (value) => {
  return String(value || "resume")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_");
};

export const parseResumeUpload = async (req, res, next) => {
  const contentType = req.headers["content-type"] || "";
  if (!contentType.includes("multipart/form-data")) {
    return error(res, "Content-Type must be multipart/form-data", "INVALID_CONTENT_TYPE", 400);
  }

  await fs.promises.mkdir(uploadsDir, { recursive: true });

  const fields = {};
  const files = [];
  const fileWritePromises = [];
  let hasFailed = false;

  const busboy = new Busboy({
    headers: req.headers,
    limits: {
      files: 50,
      fileSize: 10 * 1024 * 1024,
    },
  });

  busboy.on("field", (fieldName, value) => {
    fields[fieldName] = value;
  });

  busboy.on("file", (fieldName, file, filename, _encoding, mimeType) => {
    const safeName = sanitizeFileName(filename);

    if (!allowedMimeTypes.has(mimeType)) {
      hasFailed = true;
      file.resume();
      return;
    }

    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`;
    const relativePath = path.join("uploads", "resumes", uniqueName);
    const absolutePath = path.resolve(__dirname, "../../", relativePath);
    const writeStream = fs.createWriteStream(absolutePath);
    let sizeBytes = 0;

    file.on("data", (chunk) => {
      sizeBytes += chunk.length;
    });

    file.on("limit", () => {
      hasFailed = true;
      file.unpipe(writeStream);
      writeStream.destroy();
      fs.promises.rm(absolutePath, { force: true }).catch(() => {});
    });

    const writePromise = new Promise((resolve, reject) => {
      writeStream.on("finish", () => {
        files.push({
          fieldName,
          originalFileName: safeName,
          mimeType,
          sizeBytes,
          tempFilePath: absolutePath,
          tempRelativePath: relativePath.replace(/\\/g, "/"),
        });
        resolve();
      });
      writeStream.on("error", reject);
      file.on("error", reject);
    });

    file.pipe(writeStream);
    fileWritePromises.push(writePromise);
  });

  busboy.on("finish", async () => {
    try {
      await Promise.all(fileWritePromises);

      if (hasFailed) {
        return error(
          res,
          "One or more files failed validation. Only PDF/DOC/DOCX up to 10MB are allowed.",
          "UPLOAD_VALIDATION_FAILED",
          400
        );
      }

      if (!files.length) {
        return error(res, "No files uploaded", "NO_FILES_UPLOADED", 400);
      }

      req.resumeUpload = { fields, files };
      next();
    } catch (uploadError) {
      return error(res, uploadError.message, "UPLOAD_FAILED", 500);
    }
  });

  req.pipe(busboy);
};
