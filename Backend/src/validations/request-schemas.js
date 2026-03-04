import { validators } from "../middlewares/validate-request.middleware.js";

const jobStatuses = ["open", "closed", "draft", "on_hold"];
const seniorityLevels = ["intern", "junior", "mid", "senior", "lead"];
const candidateStatuses = ["pending_parse", "parsed", "needs_review", "enriched", "failed_parse"];
const candidateActionTypes = [
  "shortlisted",
  "rejected",
  "notes",
  "tags",
  "move_stage",
  "schedule_interview",
];
const candidateStages = ["applied", "screened", "interview", "offer", "hired"];
const screeningRunStatuses = ["queued", "running", "completed", "failed"];
const screeningSorts = [
  "ranking_asc",
  "ranking_desc",
  "score_desc",
  "score_asc",
  "experience_desc",
  "experience_asc",
  "newest",
  "oldest",
];
const screeningStatusBadges = ["strong_fit", "potential", "not_suitable"];

export const authSchemas = {
  register: {
    body: {
      fullName: [validators.requiredString("fullName", "fullName", { minLength: 2 })],
      email: [
        validators.requiredString("email", "email"),
        validators.optionalEmail("email", "email"),
      ],
      password: [validators.requiredString("password", "password", { minLength: 6 })],
    },
  },
  login: {
    body: {
      email: [
        validators.requiredString("email", "email"),
        validators.optionalEmail("email", "email"),
      ],
      password: [validators.requiredString("password", "password", { minLength: 6 })],
    },
  },
  googleLogin: {
    body: {
      idToken: [validators.requiredString("idToken", "idToken")],
    },
  },
  verifyEmail: {
    body: {
      email: [
        validators.requiredString("email", "email"),
        validators.optionalEmail("email", "email"),
      ],
      token: [validators.requiredString("token", "token")],
    },
  },
  resendVerification: {
    body: {
      email: [
        validators.requiredString("email", "email"),
        validators.optionalEmail("email", "email"),
      ],
    },
  },
  forgotPassword: {
    body: {
      email: [
        validators.requiredString("email", "email"),
        validators.optionalEmail("email", "email"),
      ],
    },
  },
  resetPassword: {
    body: {
      email: [
        validators.requiredString("email", "email"),
        validators.optionalEmail("email", "email"),
      ],
      token: [validators.requiredString("token", "token")],
      newPassword: [validators.requiredString("newPassword", "newPassword", { minLength: 6 })],
    },
  },
};

export const commonSchemas = {
  objectIdParam: {
    params: {
      id: [validators.requiredObjectId("id", "id")],
    },
  },
  paginationQuery: {
    query: {
      page: [validators.optionalInteger("page", "page", { min: 1 })],
      limit: [validators.optionalInteger("limit", "limit", { min: 1, max: 100 })],
    },
  },
};

export const jobSchemas = {
  create: {
    body: {
      title: [validators.requiredString("title", "title", { minLength: 2 })],
      jdText: [validators.requiredString("jdText", "jdText", { minLength: 20 })],
      department: [validators.optionalString("department", "department")],
      seniorityLevel: [validators.optionalEnum("seniorityLevel", "seniorityLevel", seniorityLevels)],
      status: [validators.optionalEnum("status", "status", jobStatuses)],
    },
  },
  update: {
    params: {
      id: [validators.requiredObjectId("id", "id")],
    },
    body: {
      title: [validators.optionalString("title", "title", { minLength: 2 })],
      jdText: [validators.optionalString("jdText", "jdText", { minLength: 20 })],
      department: [validators.optionalString("department", "department")],
      seniorityLevel: [validators.optionalEnum("seniorityLevel", "seniorityLevel", seniorityLevels)],
      status: [validators.optionalEnum("status", "status", jobStatuses)],
    },
  },
  list: {
    query: {
      page: [validators.optionalInteger("page", "page", { min: 1 })],
      limit: [validators.optionalInteger("limit", "limit", { min: 1, max: 100 })],
      status: [validators.optionalEnum("status", "status", jobStatuses)],
      department: [validators.optionalString("department", "department")],
      search: [validators.optionalString("search", "search")],
    },
  },
};

export const candidateSchemas = {
  create: {
    body: {
      fullName: [validators.requiredString("fullName", "fullName", { minLength: 2 })],
      email: [validators.optionalEmail("email", "email")],
      phone: [validators.optionalString("phone", "phone")],
      location: [validators.optionalString("location", "location")],
      currentTitle: [validators.optionalString("currentTitle", "currentTitle")],
      currentCompany: [validators.optionalString("currentCompany", "currentCompany")],
      summary: [validators.optionalString("summary", "summary")],
      totalYearsExperience: [
        validators.optionalNumber("totalYearsExperience", "totalYearsExperience", { min: 0 }),
      ],
      profileStatus: [validators.optionalEnum("profileStatus", "profileStatus", candidateStatuses)],
      tags: [validators.optionalStringArray("tags", "tags")],
      skillsHard: [validators.optionalStringArray("skillsHard", "skillsHard")],
      skillsSoft: [validators.optionalStringArray("skillsSoft", "skillsSoft")],
    },
  },
  update: {
    params: {
      id: [validators.requiredObjectId("id", "id")],
    },
    body: {
      fullName: [validators.optionalString("fullName", "fullName", { minLength: 2 })],
      email: [validators.optionalEmail("email", "email")],
      phone: [validators.optionalString("phone", "phone")],
      location: [validators.optionalString("location", "location")],
      currentTitle: [validators.optionalString("currentTitle", "currentTitle")],
      currentCompany: [validators.optionalString("currentCompany", "currentCompany")],
      summary: [validators.optionalString("summary", "summary")],
      totalYearsExperience: [
        validators.optionalNumber("totalYearsExperience", "totalYearsExperience", { min: 0 }),
      ],
      profileStatus: [validators.optionalEnum("profileStatus", "profileStatus", candidateStatuses)],
      tags: [validators.optionalStringArray("tags", "tags")],
      skillsHard: [validators.optionalStringArray("skillsHard", "skillsHard")],
      skillsSoft: [validators.optionalStringArray("skillsSoft", "skillsSoft")],
    },
  },
  list: {
    query: {
      page: [validators.optionalInteger("page", "page", { min: 1 })],
      limit: [validators.optionalInteger("limit", "limit", { min: 1, max: 100 })],
      profileStatus: [validators.optionalEnum("profileStatus", "profileStatus", candidateStatuses)],
      search: [validators.optionalString("search", "search")],
    },
  },
};

export const resumeFileSchemas = {
  list: {
    query: {
      page: [validators.optionalInteger("page", "page", { min: 1 })],
      limit: [validators.optionalInteger("limit", "limit", { min: 1, max: 100 })],
      jobId: [validators.optionalObjectId("jobId", "jobId")],
      candidateId: [validators.optionalObjectId("candidateId", "candidateId")],
      uploadStatus: [validators.optionalEnum("uploadStatus", "uploadStatus", ["queued", "uploading", "uploaded", "failed"])],
    },
  },
  parse: {
    params: {
      id: [validators.requiredObjectId("id", "id")],
    },
  },
};

export const screeningRunSchemas = {
  create: {
    body: {
      jobId: [validators.requiredObjectId("jobId", "jobId")],
      resumeFileIds: [validators.optionalObjectIdArray("resumeFileIds", "resumeFileIds")],
      candidateIds: [validators.optionalObjectIdArray("candidateIds", "candidateIds")],
      rerunOfRunId: [validators.optionalObjectId("rerunOfRunId", "rerunOfRunId")],
      triggeredBy: [validators.optionalEnum("triggeredBy", "triggeredBy", ["manual", "system"])],
      aiProvider: [validators.optionalEnum("aiProvider", "aiProvider", ["rule_based", "openai", "gemini", "other"])],
      queueMeta: [validators.optionalObject("queueMeta", "queueMeta")],
      filters: [validators.optionalObject("filters", "filters")],
    },
  },
  list: {
    query: {
      page: [validators.optionalInteger("page", "page", { min: 1 })],
      limit: [validators.optionalInteger("limit", "limit", { min: 1, max: 100 })],
      jobId: [validators.optionalObjectId("jobId", "jobId")],
      status: [validators.optionalEnum("status", "status", screeningRunStatuses)],
    },
  },
  updateStatus: {
    params: {
      id: [validators.requiredObjectId("id", "id")],
    },
    body: {
      status: [validators.requiredString("status", "status"), validators.optionalEnum("status", "status", screeningRunStatuses)],
      processed: [validators.optionalInteger("processed", "processed", { min: 0 })],
      failed: [validators.optionalInteger("failed", "failed", { min: 0 })],
      total: [validators.optionalInteger("total", "total", { min: 0 })],
      currentBatch: [validators.optionalInteger("currentBatch", "currentBatch", { min: 0 })],
      totalBatches: [validators.optionalInteger("totalBatches", "totalBatches", { min: 0 })],
      errorSummary: [validators.optionalString("errorSummary", "errorSummary")],
    },
  },
};

export const screeningResultSchemas = {
  bulkCreate: {
    body: {
      screeningRunId: [validators.requiredObjectId("screeningRunId", "screeningRunId")],
    },
  },
  list: {
    query: {
      page: [validators.optionalInteger("page", "page", { min: 1 })],
      limit: [validators.optionalInteger("limit", "limit", { min: 1, max: 100 })],
      scoreMin: [validators.optionalNumber("scoreMin", "scoreMin", { min: 0, max: 100 })],
      scoreMax: [validators.optionalNumber("scoreMax", "scoreMax", { min: 0, max: 100 })],
      skills: [validators.optionalStringArray("skills", "skills")],
      experienceMin: [validators.optionalNumber("experienceMin", "experienceMin", { min: 0 })],
      status: [validators.optionalEnum("status", "status", screeningStatusBadges)],
      sort: [validators.optionalEnum("sort", "sort", screeningSorts)],
      latestOnly: [validators.optionalBooleanString("latestOnly", "latestOnly")],
      screeningRunId: [validators.optionalObjectId("screeningRunId", "screeningRunId")],
    },
  },
};

export const candidateActionSchemas = {
  create: {
    body: {
      jobId: [validators.requiredObjectId("jobId", "jobId")],
      candidateId: [validators.requiredObjectId("candidateId", "candidateId")],
      actionType: [validators.requiredString("actionType", "actionType"), validators.optionalEnum("actionType", "actionType", candidateActionTypes)],
      stage: [validators.optionalEnum("stage", "stage", candidateStages)],
      note: [validators.optionalString("note", "note")],
      tags: [validators.optionalStringArray("tags", "tags")],
      sourceScreeningResultId: [validators.optionalObjectId("sourceScreeningResultId", "sourceScreeningResultId")],
      metadata: [validators.optionalObject("metadata", "metadata")],
    },
  },
  list: {
    params: {
      jobId: [validators.requiredObjectId("jobId", "jobId")],
    },
    query: {
      page: [validators.optionalInteger("page", "page", { min: 1 })],
      limit: [validators.optionalInteger("limit", "limit", { min: 1, max: 100 })],
      candidateId: [validators.optionalObjectId("candidateId", "candidateId")],
      actionType: [validators.optionalEnum("actionType", "actionType", candidateActionTypes)],
    },
  },
};

export const auditLogSchemas = {
  list: {
    query: {
      page: [validators.optionalInteger("page", "page", { min: 1 })],
      limit: [validators.optionalInteger("limit", "limit", { min: 1, max: 100 })],
      module: [validators.optionalString("module", "module")],
      action: [validators.optionalString("action", "action")],
      entityType: [validators.optionalString("entityType", "entityType")],
      severity: [validators.optionalEnum("severity", "severity", ["info", "warning", "error"])],
    },
  },
};

export const dashboardSchemas = {
  recentActivity: {
    query: {
      page: [validators.optionalInteger("page", "page", { min: 1 })],
      limit: [validators.optionalInteger("limit", "limit", { min: 1, max: 50 })],
    },
  },
};
