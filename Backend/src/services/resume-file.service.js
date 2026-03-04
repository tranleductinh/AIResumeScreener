import fs from "fs";

import cloudinary from "../config/cloudinary.js";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";
import Candidate from "../models/candidate.model.js";
import ResumeFile from "../models/resume-file.model.js";
import { logAuditEventsBulkService } from "./audit-log.service.js";
import { buildPaginationResult, parsePagination } from "../utils/pagination.js";
import {
  buildServiceError,
  countResumeFileLinkedRecords,
  ensureObjectId,
  findCandidateOrThrow,
  findJobOrThrow,
  findResumeFileOrThrow,
  syncCandidateLatestResumeFile,
} from "../utils/reference-validation.js";

const ensureCloudinaryConfig = () => {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw buildServiceError(
      "Cloudinary configuration is missing. Check CLOUDINARY_* env values.",
      500,
      "CLOUDINARY_CONFIG_MISSING"
    );
  }
};

const resolveCloudinaryDeliveryType = () => {
  const deliveryType = String(process.env.CLOUDINARY_DELIVERY_TYPE || "upload")
    .trim()
    .toLowerCase();
  if (["upload", "authenticated", "private"].includes(deliveryType)) {
    return deliveryType;
  }
  return "upload";
};

const resolveSignedUrlTtlSeconds = () => {
  const fallback = 300;
  const parsed = Number(process.env.CLOUDINARY_SIGNED_URL_EXPIRES_SECONDS || fallback);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.round(parsed);
};

const inferExtensionFromMimeType = (mimeType) => {
  if (mimeType === "application/pdf") return "pdf";
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "docx";
  }
  if (mimeType === "application/msword") return "doc";
  return undefined;
};

const buildCloudinaryCanonicalUrl = ({ publicId, mimeType }) => {
  if (!publicId || !process.env.CLOUDINARY_CLOUD_NAME) {
    return null;
  }

  const deliveryType = resolveCloudinaryDeliveryType();
  const extension = inferExtensionFromMimeType(mimeType);
  return cloudinary.url(publicId, {
    resource_type: "raw",
    type: deliveryType,
    format: extension,
    secure: true,
    sign_url: false,
  });
};

const buildCloudinarySignedAccessUrls = ({ publicId, mimeType }) => {
  if (!publicId || !process.env.CLOUDINARY_CLOUD_NAME) {
    return [];
  }

  const deliveryType = resolveCloudinaryDeliveryType();
  const expiresAt = Math.floor(Date.now() / 1000) + resolveSignedUrlTtlSeconds();
  const urls = [];
  const extension = inferExtensionFromMimeType(mimeType);

  urls.push(
    cloudinary.url(publicId, {
      resource_type: "raw",
      type: deliveryType,
      format: extension,
      secure: true,
      sign_url: deliveryType !== "upload",
      expires_at: deliveryType !== "upload" ? expiresAt : undefined,
    })
  );

  if (deliveryType !== "upload") {
    const extension = inferExtensionFromMimeType(mimeType);
    const downloadUrl = cloudinary.utils.private_download_url(publicId, extension, {
      resource_type: "raw",
      type: deliveryType,
      expires_at: expiresAt,
      attachment: false,
      secure: true,
    });
    urls.push(downloadUrl);
  }

  return [...new Set(urls.filter(Boolean))];
};

const uploadFileToCloudinary = async (file) => {
  ensureCloudinaryConfig();

  const folder = process.env.CLOUDINARY_RESUME_FOLDER || "ai-resume-screener/resumes";
  const uploaded = await cloudinary.uploader.upload(file.tempFilePath, {
    resource_type: "raw",
    folder,
    use_filename: true,
    unique_filename: true,
    overwrite: false,
  });

  if (!uploaded?.public_id) {
    throw buildServiceError(
      "Cloudinary upload did not return public_id",
      502,
      "CLOUDINARY_UPLOAD_FAILED"
    );
  }

  return uploaded;
};

const normalizeExtractedText = (value) => {
  return String(value || "")
    .replace(/\r/g, " ")
    .replace(/\t/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const buildExtractedTextPreview = (text) => {
  const normalized = normalizeExtractedText(text);
  if (!normalized) return "";
  return normalized.slice(0, 280);
};

const fallbackParseMarker = "Fallback parse was generated because file download from storage failed.";

const normalizeLine = (value) => {
  return String(value || "").replace(/\s+/g, " ").trim();
};

const splitResumeLines = (text) => {
  return String(text || "")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => normalizeLine(line))
    .filter(Boolean);
};

const normalizeForCompare = (value) => {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
};

const nonNameKeywords = [
  "curriculum vitae",
  "resume",
  "cv",
  "objective",
  "summary",
  "education",
  "experience",
  "skills",
  "projects",
  "certifications",
  "phone",
  "email",
  "address",
  "location",
  "linkedin",
  "github",
];

const looksLikePersonalName = (value) => {
  const text = normalizeLine(value);
  if (!text || text.length < 4 || text.length > 70) return false;
  if (/@|https?:\/\/|www\./i.test(text)) return false;
  if (/\d/.test(text)) return false;

  const lower = text.toLowerCase();
  if (nonNameKeywords.some((keyword) => lower.includes(keyword))) return false;

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 6) return false;
  if (words.some((word) => !/[\p{L}]/u.test(word))) return false;
  return true;
};

const sanitizeDetectedName = (value) => {
  const cleaned = normalizeLine(
    String(value || "")
      .replace(/^(full\s*name|name|ho va ten|ho ten)\s*[:\-]?\s*/i, "")
      .replace(/\s*\|.*$/, "")
      .replace(/\s*[-|]\s*(male|female|nam|nu)\b.*$/i, "")
  );

  if (!looksLikePersonalName(cleaned)) return null;
  return cleaned;
};

const extractNameFromTextStart = (text) => {
  const compact = normalizeLine(String(text || ""));
  if (!compact) return null;

  const candidate = compact
    .split(/[\|\-–—]/)[0]
    .split(/\s+/)
    .slice(0, 5)
    .join(" ")
    .trim();

  return sanitizeDetectedName(candidate);
};

const extractCandidateNameFromResumeText = (text) => {
  const raw = String(text || "");
  if (!raw) return null;

  const labelPatterns = [
    /(?:full\s*name|name|ho va ten|ho ten)\s*[:\-]\s*([^\n\r|]{2,80})/i,
  ];

  for (const pattern of labelPatterns) {
    const matched = raw.match(pattern);
    const detected = sanitizeDetectedName(matched?.[1]);
    if (detected) return detected;
  }

  const lines = splitResumeLines(raw).slice(0, 15);
  for (const line of lines) {
    const detected = sanitizeDetectedName(line);
    if (detected) return detected;
  }

  return extractNameFromTextStart(raw);
};

const normalizeLocationValue = (value) => {
  const cleaned = normalizeLine(
    String(value || "")
      .replace(/\s*\|.*$/, "")
      .replace(/^(location|address|current location|dia chi|noi o)\s*[:\-]?\s*/i, "")
  );

  if (!cleaned || cleaned.length < 2 || cleaned.length > 90) return null;
  if (/@|https?:\/\/|www\./i.test(cleaned)) return null;
  return cleaned;
};

const locationHints = [
  "ho chi minh",
  "hcm",
  "hanoi",
  "ha noi",
  "da nang",
  "can tho",
  "hai phong",
  "binh duong",
  "dong nai",
  "gia lai",
  "quy nhon",
  "binh dinh",
  "viet nam",
  "vietnam",
  "remote",
  "hybrid",
];

const looksLikeLocationLine = (value) => {
  const location = normalizeLocationValue(value);
  if (!location) return false;

  const lower = normalizeForCompare(location);
  if (
    lower.includes("@") ||
    lower.includes("http") ||
    lower.includes("linkedin") ||
    lower.includes("github")
  ) {
    return false;
  }

  if (/\d{4,}/.test(lower)) return false;
  if (location.length > 80) return false;

  if (locationHints.some((hint) => lower.includes(hint))) return true;
  if (location.includes(",")) return true;
  return false;
};

const extractCandidateLocationFromResumeText = (text) => {
  const raw = String(text || "");
  if (!raw) return null;

  const labelPatterns = [
    /(?:location|current location|address|dia chi|noi o)\s*[:\-]\s*([^\n\r|]{2,90})/i,
  ];

  for (const pattern of labelPatterns) {
    const matched = raw.match(pattern);
    const detected = normalizeLocationValue(matched?.[1]);
    if (detected) return detected;
  }

  const lines = splitResumeLines(raw).slice(0, 30);
  const contactAnchorIndexes = [];

  lines.forEach((line, index) => {
    const normalized = normalizeForCompare(line);
    if (/@/.test(line) || /(phone|email|linkedin|github|portfolio|contact)/i.test(normalized)) {
      contactAnchorIndexes.push(index);
    }
  });

  for (const index of contactAnchorIndexes) {
    const neighbors = [lines[index - 2], lines[index - 1], lines[index + 1], lines[index + 2]];
    for (const neighbor of neighbors) {
      if (!neighbor) continue;
      if (!looksLikeLocationLine(neighbor)) continue;
      const detected = normalizeLocationValue(neighbor);
      if (detected) return detected;
    }
  }

  for (const line of lines) {
    if (!looksLikeLocationLine(line)) continue;
    const detected = normalizeLocationValue(line);
    if (detected) return detected;
  }

  const inlineMatch = raw.match(
    /([A-Za-z\u00C0-\u024F\u1E00-\u1EFF\s]+,\s*[A-Za-z\u00C0-\u024F\u1E00-\u1EFF\s]+)/g
  );
  if (inlineMatch?.length) {
    const detected = inlineMatch
      .map((item) => normalizeLocationValue(item))
      .find((item) => looksLikeLocationLine(item));
    if (detected) return detected;
  }

  return null;
};

const clampExperienceYears = (value) => {
  const years = Number(value);
  if (!Number.isFinite(years) || years < 0) return null;
  return Math.min(Math.round(years * 10) / 10, 50);
};

const extractCandidateExperienceYearsFromResumeText = (text) => {
  const raw = String(text || "");
  if (!raw) return null;

  const patterns = [
    /(\d+(?:[.,]\d+)?)\s*\+?\s*(?:years?|yrs?|nam)\s*(?:of\s*)?(?:experience|exp|kinh nghiem)/gi,
    /(?:experience|exp|kinh nghiem)\s*[:\-]?\s*(?:over\s*|more than\s*)?(\d+(?:[.,]\d+)?)\s*\+?\s*(?:years?|yrs?|nam)\b/gi,
  ];

  const matches = [];
  for (const pattern of patterns) {
    let result = pattern.exec(raw);
    while (result) {
      const normalized = String(result[1] || "").replace(",", ".");
      const parsedYears = clampExperienceYears(normalized);
      if (parsedYears !== null) {
        matches.push(parsedYears);
      }
      result = pattern.exec(raw);
    }
  }

  if (!matches.length) return null;
  const maxDetectedYears = Math.max(...matches);
  if (maxDetectedYears > 0) return Math.min(maxDetectedYears, 40);

  return null;
};

const parseResumeDateToken = (value, isEndToken = false) => {
  const token = normalizeForCompare(value);
  if (!token) return null;
  const currentYear = new Date().getUTCFullYear();

  if (["present", "current", "now", "hien tai"].includes(token)) {
    return new Date();
  }

  const monthYearMatch = token.match(/^(\d{1,2})\s*\/\s*(\d{4})$/);
  if (monthYearMatch) {
    const month = Number(monthYearMatch[1]);
    const year = Number(monthYearMatch[2]);
    if (month < 1 || month > 12) return null;
    if (year < 1980 || year > currentYear + 1) return null;
    return new Date(Date.UTC(year, month - 1, isEndToken ? 28 : 1));
  }

  const yearMatch = token.match(/^(\d{4})$/);
  if (yearMatch) {
    const year = Number(yearMatch[1]);
    if (year < 1980 || year > currentYear + 1) return null;
    return new Date(Date.UTC(year, isEndToken ? 11 : 0, isEndToken ? 28 : 1));
  }

  return null;
};

const mergeMonthRanges = (ranges) => {
  if (!ranges.length) return [];

  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const merged = [sorted[0]];

  for (let index = 1; index < sorted.length; index += 1) {
    const current = sorted[index];
    const last = merged[merged.length - 1];

    if (current.start <= last.end + 1) {
      last.end = Math.max(last.end, current.end);
      continue;
    }

    merged.push(current);
  }

  return merged;
};

const workContextHints = [
  "work experience",
  "experience",
  "employment",
  "intern",
  "developer",
  "engineer",
  "company",
  "projects",
  "full stack",
  "frontend",
  "backend",
];

const educationContextHints = [
  "education",
  "university",
  "college",
  "high school",
  "gpa",
  "bachelor",
  "master",
  "course",
  "major",
  "certificate",
  "certification",
];

const isLikelyWorkDateRangeContext = (value) => {
  const normalized = normalizeForCompare(value);
  if (!normalized) return false;

  const hasWorkHint = workContextHints.some((hint) => normalized.includes(hint));
  const hasEducationHint = educationContextHints.some((hint) => normalized.includes(hint));

  if (hasEducationHint && !hasWorkHint) {
    return false;
  }

  return hasWorkHint;
};

const deriveExperienceYearsFromDateRanges = (text) => {
  const raw = String(text || "");
  if (!raw) return null;

  const regex =
    /(\d{1,2}\s*\/\s*\d{4}|\d{4})\s*(?:-|–|—|to)\s*(\d{1,2}\s*\/\s*\d{4}|\d{4}|present|current|now|hien tai)/gi;
  const ranges = [];
  const tryPushRangeFromMatch = (matchedStart, matchedEnd) => {
    const startDate = parseResumeDateToken(matchedStart, false);
    const endDate = parseResumeDateToken(matchedEnd, true);

    if (!(startDate && endDate && endDate >= startDate)) {
      return;
    }

    const startMonth = startDate.getUTCFullYear() * 12 + startDate.getUTCMonth();
    const endMonth = endDate.getUTCFullYear() * 12 + endDate.getUTCMonth();
    if (endMonth < startMonth) {
      return;
    }

    ranges.push({
      start: startMonth,
      end: endMonth,
    });
  };

  const rawLines = String(text || "").replace(/\r/g, "\n").split("\n");
  for (let lineIndex = 0; lineIndex < rawLines.length; lineIndex += 1) {
    const line = rawLines[lineIndex];
    if (!line) continue;

    const context = [
      rawLines[lineIndex - 1] || "",
      line,
      rawLines[lineIndex + 1] || "",
    ].join(" ");

    if (!isLikelyWorkDateRangeContext(context)) {
      continue;
    }

    let lineMatch = regex.exec(line);
    while (lineMatch) {
      tryPushRangeFromMatch(lineMatch[1], lineMatch[2]);
      lineMatch = regex.exec(line);
    }
    regex.lastIndex = 0;
  }

  if (!ranges.length) {
    let matched = regex.exec(raw);
    while (matched) {
      const contextStart = Math.max(matched.index - 120, 0);
      const contextEnd = Math.min(
        matched.index + String(matched[0] || "").length + 120,
        raw.length
      );
      const context = raw.slice(contextStart, contextEnd);

      if (isLikelyWorkDateRangeContext(context)) {
        tryPushRangeFromMatch(matched[1], matched[2]);
      }

      matched = regex.exec(raw);
    }
  }

  if (!ranges.length) return null;

  const mergedRanges = mergeMonthRanges(ranges);
  const totalMonths = mergedRanges.reduce((sum, item) => sum + (item.end - item.start + 1), 0);
  if (!totalMonths) return null;

  return clampExperienceYears(totalMonths / 12);
};

const extractCandidateProfileFromResumeText = (text) => {
  const experienceFromPhrase = extractCandidateExperienceYearsFromResumeText(text);
  const experienceFromDateRanges = deriveExperienceYearsFromDateRanges(text);
  const resolvedExperienceYears = experienceFromDateRanges ?? experienceFromPhrase ?? null;

  return {
    fullName: extractCandidateNameFromResumeText(text),
    location: extractCandidateLocationFromResumeText(text),
    totalYearsExperience: resolvedExperienceYears,
  };
};

const applyCandidateProfileFromResumeText = async ({ candidateId, text }) => {
  if (!candidateId) return;

  const candidate = await Candidate.findById(candidateId).select(
    "fullName normalizedFullName location totalYearsExperience source profileStatus"
  );
  if (!candidate) return;

  const extractedProfile = extractCandidateProfileFromResumeText(text);
  const updates = {
    profileStatus: "parsed",
  };

  if (extractedProfile.fullName && extractedProfile.fullName !== candidate.fullName) {
    updates.fullName = extractedProfile.fullName;
    updates.normalizedFullName = extractedProfile.fullName.toLowerCase();
  }

  if (extractedProfile.location) {
    updates.location = extractedProfile.location;
  }

  if (extractedProfile.totalYearsExperience !== null) {
    updates.totalYearsExperience = extractedProfile.totalYearsExperience;
  }

  await Candidate.updateOne(
    { _id: candidate._id },
    {
      $set: updates,
    }
  );
};

const buildFallbackExtractedText = ({ resumeFile, candidate }) => {
  return normalizeExtractedText(
    [
      candidate?.fullName || "Unknown candidate",
      candidate?.currentTitle || "",
      candidate?.summary || "",
      (candidate?.skills?.hard || []).map((skill) => skill?.name).filter(Boolean).join(", "),
      (candidate?.skills?.soft || []).join(", "),
      resumeFile?.originalFileName ? `Source file: ${resumeFile.originalFileName}` : "",
      fallbackParseMarker,
    ]
      .filter(Boolean)
      .join(". ")
  );
};

const fetchResumeFileBuffer = async (resumeFile) => {
  if (resumeFile.storage?.provider === "cloudinary") {
    const candidateUrls = [];
    const attemptErrors = [];

    if (resumeFile.storage?.url) {
      candidateUrls.push(resumeFile.storage.url);
    }

    const generatedCanonicalUrl = buildCloudinaryCanonicalUrl({
      publicId: resumeFile.storage?.pathOrKey,
      mimeType: resumeFile.mimeType,
    });
    if (generatedCanonicalUrl && !candidateUrls.includes(generatedCanonicalUrl)) {
      candidateUrls.push(generatedCanonicalUrl);
    }

    for (const signedUrl of buildCloudinarySignedAccessUrls({
      publicId: resumeFile.storage?.pathOrKey,
      mimeType: resumeFile.mimeType,
    })) {
      if (!candidateUrls.includes(signedUrl)) {
        candidateUrls.push(signedUrl);
      }
    }

    for (const url of candidateUrls) {
      const response = await fetch(url);
      if (!response.ok) {
        attemptErrors.push(`${response.status} ${response.statusText}`.trim());
        continue;
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }

    throw buildServiceError(
      `Cannot download resume file from storage${attemptErrors.length ? ` (${attemptErrors.join(" | ")})` : ""}`,
      502,
      "RESUME_DOWNLOAD_FAILED"
    );
  }

  if (resumeFile.storage?.provider === "local") {
    return fs.promises.readFile(resumeFile.storage.pathOrKey);
  }

  throw buildServiceError(
    `Unsupported storage provider for parsing: ${resumeFile.storage?.provider || "unknown"}`,
    400,
    "UNSUPPORTED_STORAGE_PROVIDER"
  );
};

const parseBufferByMimeType = async ({ mimeType, fileBuffer }) => {
  if (mimeType === "application/pdf") {
    const parsed = await pdfParse(fileBuffer);
    return {
      rawText: String(parsed.text || ""),
      extractedText: normalizeExtractedText(parsed.text),
      pageCount: parsed.numpages || null,
    };
  }

  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const parsed = await mammoth.extractRawText({ buffer: fileBuffer });
    return {
      rawText: String(parsed.value || ""),
      extractedText: normalizeExtractedText(parsed.value),
      pageCount: null,
    };
  }

  if (mimeType === "application/msword") {
    throw buildServiceError(
      "Legacy DOC parsing is not supported. Please upload DOCX or PDF.",
      400,
      "DOC_PARSING_NOT_SUPPORTED"
    );
  }

  throw buildServiceError("Unsupported mime type for parsing", 400, "UNSUPPORTED_MIME_TYPE");
};

const detectCandidateProfileFromUploadedFile = async (file) => {
  if (!file?.tempFilePath || !file?.mimeType) {
    return {
      fullName: null,
      location: null,
      totalYearsExperience: null,
    };
  }

  try {
    const fileBuffer = await fs.promises.readFile(file.tempFilePath);
    const parsedResult = await parseBufferByMimeType({
      mimeType: file.mimeType,
      fileBuffer,
    });
    return extractCandidateProfileFromResumeText(parsedResult.rawText || parsedResult.extractedText);
  } catch (_error) {
    return {
      fullName: null,
      location: null,
      totalYearsExperience: null,
    };
  }
};

export const uploadResumeFilesService = async ({ upload, userId, auditContext = {} }) => {
  if (!userId) {
    throw buildServiceError("Unauthorized", 401, "UNAUTHORIZED");
  }

  const { fields, files } = upload;
  const job = fields.jobId ? await findJobOrThrow(fields.jobId) : null;
  const fixedCandidate = fields.candidateId ? await findCandidateOrThrow(fields.candidateId) : null;

  const createdFiles = [];

  for (const file of files) {
    try {
      const extractedProfile = await detectCandidateProfileFromUploadedFile(file);
      const candidateName = extractedProfile.fullName || "Pending Candidate";
      const candidate =
        fixedCandidate ||
        (await Candidate.create({
          fullName: candidateName,
          normalizedFullName: candidateName.toLowerCase(),
          location: extractedProfile.location || null,
          totalYearsExperience: extractedProfile.totalYearsExperience || 0,
          profileStatus: "pending_parse",
          source: {
            type: "resume_upload",
            jobId: job?._id || null,
          },
        }));

      if (fixedCandidate) {
        const candidateUpdates = {};
        if (extractedProfile.fullName && !normalizeLine(fixedCandidate.fullName || "")) {
          candidateUpdates.fullName = extractedProfile.fullName;
          candidateUpdates.normalizedFullName = extractedProfile.fullName.toLowerCase();
        }
        if (extractedProfile.location && !normalizeLine(fixedCandidate.location || "")) {
          candidateUpdates.location = extractedProfile.location;
        }
        if (
          extractedProfile.totalYearsExperience !== null &&
          Number(fixedCandidate.totalYearsExperience || 0) <= 0
        ) {
          candidateUpdates.totalYearsExperience = extractedProfile.totalYearsExperience;
        }

        if (Object.keys(candidateUpdates).length) {
          await Candidate.updateOne(
            { _id: fixedCandidate._id },
            {
              $set: candidateUpdates,
            }
          );
        }
      }

      const uploadedAsset = await uploadFileToCloudinary(file);
      const resolvedCloudinaryUrl = uploadedAsset.secure_url || buildCloudinaryCanonicalUrl({
        publicId: uploadedAsset.public_id,
        mimeType: file.mimeType,
      });

      const resumeFile = await ResumeFile.create({
        candidateId: candidate._id,
        jobId: job?._id || null,
        originalFileName: file.originalFileName,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        storage: {
          provider: "cloudinary",
          pathOrKey: uploadedAsset.public_id,
          url: resolvedCloudinaryUrl,
          bucket: process.env.CLOUDINARY_CLOUD_NAME,
        },
        uploadStatus: "uploaded",
        parseStatus: "pending",
        uploadedBy: userId,
      });

      await Candidate.updateOne(
        { _id: candidate._id },
        {
          $set: {
            latestResumeFileId: resumeFile._id,
            ...(job?._id ? { "source.jobId": job._id } : {}),
          },
        }
      );

      createdFiles.push(resumeFile);
    } finally {
      if (file.tempFilePath) {
        await fs.promises.rm(file.tempFilePath, { force: true }).catch(() => {});
      }
    }
  }

  await logAuditEventsBulkService(
    createdFiles.map((resumeFile) => ({
      actorId: userId,
      actorEmail: auditContext.actorEmail || null,
      entityType: "ResumeFile",
      entityId: resumeFile._id,
      action: "resume_uploaded",
      module: "resume_upload",
      severity: "info",
      metadata: {
        candidateId: resumeFile.candidateId,
        jobId: resumeFile.jobId,
        originalFileName: resumeFile.originalFileName,
        sizeBytes: resumeFile.sizeBytes,
        uploadStatus: resumeFile.uploadStatus,
      },
      ipAddress: auditContext.ipAddress || null,
      userAgent: auditContext.userAgent || null,
    }))
  );

  return createdFiles;
};

export const getResumeFilesService = async (query) => {
  const { page, limit, skip } = parsePagination(query);

  const filter = { isDeleted: false };

  if (query.jobId) {
    await findJobOrThrow(query.jobId);
    filter.jobId = query.jobId;
  }

  if (query.candidateId) {
    await findCandidateOrThrow(query.candidateId);
    filter.candidateId = query.candidateId;
  }

  if (query.uploadStatus) {
    filter.uploadStatus = query.uploadStatus;
  }

  const [items, total] = await Promise.all([
    ResumeFile.find(filter)
      .populate("candidateId", "fullName email")
      .populate("jobId", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ResumeFile.countDocuments(filter),
  ]);

  return buildPaginationResult({ items, page, limit, total });
};

export const getResumeFileByIdService = async (resumeFileId) => {
  ensureObjectId(resumeFileId, "INVALID_RESUME_FILE_ID", "Invalid resume file id");

  const resumeFile = await ResumeFile.findOne({ _id: resumeFileId, isDeleted: false })
    .populate("candidateId", "fullName email")
    .populate("jobId", "title");

  if (!resumeFile) {
    throw buildServiceError("Resume file not found", 404, "RESUME_FILE_NOT_FOUND");
  }

  return resumeFile;
};

export const parseResumeFileService = async (resumeFileId) => {
  const resumeFile = await findResumeFileOrThrow(resumeFileId);
  const hasFallbackParsedContent = String(resumeFile.extractedText || "").includes(
    fallbackParseMarker
  );

  if (resumeFile.parseStatus === "parsed" && resumeFile.extractedText && !hasFallbackParsedContent) {
    await applyCandidateProfileFromResumeText({
      candidateId: resumeFile.candidateId,
      text: resumeFile.extractedText,
    });

    return ResumeFile.findById(resumeFile._id)
      .populate("candidateId", "fullName email")
      .populate("jobId", "title");
  }

  if (resumeFile.parseStatus === "parsing") {
    throw buildServiceError(
      "Resume file is already being parsed",
      409,
      "RESUME_ALREADY_PARSING"
    );
  }

  resumeFile.parseStatus = "parsing";
  resumeFile.parseAttempts = (resumeFile.parseAttempts || 0) + 1;
  resumeFile.parseError = null;
  await resumeFile.save();

  try {
    let parsedResult;
    try {
      const fileBuffer = await fetchResumeFileBuffer(resumeFile);
      parsedResult = await parseBufferByMimeType({
        mimeType: resumeFile.mimeType,
        fileBuffer,
      });
    } catch (parsingSourceError) {
      if (parsingSourceError?.errorCode !== "RESUME_DOWNLOAD_FAILED") {
        throw parsingSourceError;
      }

      const candidate = await Candidate.findById(resumeFile.candidateId).select(
        "fullName currentTitle summary skills"
      );
      parsedResult = {
        rawText: "",
        extractedText: buildFallbackExtractedText({ resumeFile, candidate }),
        pageCount: null,
      };
    }

    resumeFile.extractedText = parsedResult.extractedText;
    resumeFile.extractedTextPreview = buildExtractedTextPreview(parsedResult.extractedText);
    resumeFile.pageCount = parsedResult.pageCount;
    resumeFile.parseStatus = "parsed";
    resumeFile.parsedAt = new Date();
    resumeFile.parseError = null;
    await resumeFile.save();

    await applyCandidateProfileFromResumeText({
      candidateId: resumeFile.candidateId,
      text: parsedResult.rawText || parsedResult.extractedText,
    });

    return ResumeFile.findById(resumeFile._id)
      .populate("candidateId", "fullName email")
      .populate("jobId", "title");
  } catch (error) {
    resumeFile.parseStatus = "failed";
    resumeFile.parseError = error.message;
    resumeFile.parsedAt = null;
    await resumeFile.save();

    await Candidate.updateOne(
      { _id: resumeFile.candidateId },
      {
        $set: {
          profileStatus: "failed_parse",
        },
      }
    );

    throw error;
  }
};

export const deleteResumeFileService = async (resumeFileId) => {
  const resumeFile = await findResumeFileOrThrow(resumeFileId);
  const linkedRecords = await countResumeFileLinkedRecords(resumeFile._id);

  if (linkedRecords.screeningResultsCount > 0 || linkedRecords.screeningRunsCount > 0) {
    throw buildServiceError(
      "Cannot delete resume file while linked screening records still exist",
      409,
      "RESUME_FILE_RELATIONSHIP_CONFLICT"
    );
  }

  if (resumeFile.storage?.provider === "cloudinary" && resumeFile.storage?.pathOrKey) {
    ensureCloudinaryConfig();
    try {
      await cloudinary.uploader.destroy(resumeFile.storage.pathOrKey, {
        resource_type: "raw",
        invalidate: true,
      });
    } catch (cloudinaryError) {
      throw buildServiceError(cloudinaryError.message, 500, "CLOUDINARY_DELETE_FAILED");
    }
  }

  resumeFile.isDeleted = true;
  resumeFile.deletedAt = new Date();
  resumeFile.uploadStatus = "failed";
  await resumeFile.save();
  await syncCandidateLatestResumeFile(resumeFile.candidateId);

  return { id: resumeFileId };
};
