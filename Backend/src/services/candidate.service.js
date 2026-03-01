import mongoose from "mongoose";

import Candidate from "../models/candidate.model.js";

const buildError = (message, status = 400, errorCode = "BAD_REQUEST") => {
  const error = new Error(message);
  error.status = status;
  error.errorCode = errorCode;
  return error;
};

const ensureObjectId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw buildError("Invalid candidate id", 400, "INVALID_CANDIDATE_ID");
  }
};

const normalizeStringArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeHardSkills = (value) => {
  const names = normalizeStringArray(value);
  return names.map((name) => ({
    name,
    level: 0,
    years: 0,
    verified: false,
  }));
};

const normalizeCandidatePayload = (payload) => {
  const normalized = {};

  if (payload.fullName !== undefined) normalized.fullName = String(payload.fullName).trim();
  if (payload.email !== undefined) normalized.email = payload.email ? String(payload.email).trim().toLowerCase() : null;
  if (payload.phone !== undefined) normalized.phone = payload.phone ? String(payload.phone).trim() : null;
  if (payload.location !== undefined) normalized.location = payload.location ? String(payload.location).trim() : null;
  if (payload.currentTitle !== undefined) normalized.currentTitle = payload.currentTitle ? String(payload.currentTitle).trim() : null;
  if (payload.currentCompany !== undefined) normalized.currentCompany = payload.currentCompany ? String(payload.currentCompany).trim() : null;
  if (payload.summary !== undefined) normalized.summary = payload.summary ? String(payload.summary).trim() : "";
  if (payload.totalYearsExperience !== undefined) {
    const years = Number(payload.totalYearsExperience);
    normalized.totalYearsExperience = Number.isNaN(years) ? 0 : Math.max(years, 0);
  }
  if (payload.profileStatus !== undefined) normalized.profileStatus = payload.profileStatus;
  if (payload.tags !== undefined) normalized.tags = normalizeStringArray(payload.tags);
  if (payload.skillsHard !== undefined) {
    normalized.skills = {
      ...(normalized.skills || {}),
      hard: normalizeHardSkills(payload.skillsHard),
    };
  }
  if (payload.skillsSoft !== undefined) {
    normalized.skills = {
      ...(normalized.skills || {}),
      soft: normalizeStringArray(payload.skillsSoft),
    };
  }

  return normalized;
};

export const createCandidateService = async (payload) => {
  const normalizedPayload = normalizeCandidatePayload(payload);

  if (!normalizedPayload.fullName) {
    throw buildError("fullName is required", 400, "VALIDATION_ERROR");
  }

  try {
    const candidate = await Candidate.create({
      fullName: normalizedPayload.fullName,
      normalizedFullName: normalizedPayload.fullName.toLowerCase(),
      email: normalizedPayload.email || null,
      phone: normalizedPayload.phone || null,
      location: normalizedPayload.location || null,
      currentTitle: normalizedPayload.currentTitle || null,
      currentCompany: normalizedPayload.currentCompany || null,
      totalYearsExperience: normalizedPayload.totalYearsExperience || 0,
      summary: normalizedPayload.summary || "",
      profileStatus: normalizedPayload.profileStatus || "needs_review",
      tags: normalizedPayload.tags || [],
      skills: normalizedPayload.skills || { hard: [], soft: [] },
      source: {
        type: "manual",
      },
    });

    return candidate;
  } catch (err) {
    if (err?.code === 11000) {
      throw buildError("Candidate email already exists", 409, "DUPLICATE_EMAIL");
    }
    throw err;
  }
};

export const getCandidatesService = async (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const filter = { isDeleted: false };

  if (query.profileStatus) {
    filter.profileStatus = query.profileStatus;
  }

  if (query.search) {
    filter.$or = [
      { fullName: { $regex: query.search, $options: "i" } },
      { email: { $regex: query.search, $options: "i" } },
      { currentTitle: { $regex: query.search, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    Candidate.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Candidate.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getCandidateByIdService = async (candidateId) => {
  ensureObjectId(candidateId);
  const candidate = await Candidate.findOne({ _id: candidateId, isDeleted: false });

  if (!candidate) {
    throw buildError("Candidate not found", 404, "CANDIDATE_NOT_FOUND");
  }

  return candidate;
};

export const updateCandidateService = async (candidateId, payload) => {
  ensureObjectId(candidateId);

  const candidate = await Candidate.findOne({ _id: candidateId, isDeleted: false });
  if (!candidate) {
    throw buildError("Candidate not found", 404, "CANDIDATE_NOT_FOUND");
  }

  const normalizedPayload = normalizeCandidatePayload(payload);
  const assignableFields = [
    "fullName",
    "email",
    "phone",
    "location",
    "currentTitle",
    "currentCompany",
    "totalYearsExperience",
    "summary",
    "profileStatus",
    "tags",
    "skills",
  ];

  for (const field of assignableFields) {
    if (normalizedPayload[field] !== undefined) {
      candidate[field] = normalizedPayload[field];
    }
  }

  if (normalizedPayload.fullName !== undefined) {
    candidate.normalizedFullName = normalizedPayload.fullName.toLowerCase();
  }

  try {
    await candidate.save();
  } catch (err) {
    if (err?.code === 11000) {
      throw buildError("Candidate email already exists", 409, "DUPLICATE_EMAIL");
    }
    throw err;
  }

  return candidate;
};

export const deleteCandidateService = async (candidateId) => {
  ensureObjectId(candidateId);

  const candidate = await Candidate.findOne({ _id: candidateId, isDeleted: false });
  if (!candidate) {
    throw buildError("Candidate not found", 404, "CANDIDATE_NOT_FOUND");
  }

  candidate.isDeleted = true;
  candidate.deletedAt = new Date();
  await candidate.save();

  return { id: candidateId };
};
