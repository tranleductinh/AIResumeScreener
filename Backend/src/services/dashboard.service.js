import AuditLog from "../models/audit-log.model.js";
import CandidateAction from "../models/candidate-action.model.js";
import Job from "../models/job.model.js";
import ResumeFile from "../models/resume-file.model.js";
import ScreeningResult from "../models/screening-result.model.js";
import { buildPaginationResult, parsePagination } from "../utils/pagination.js";

const minutesSavedPerResume = 5;

const scoreBuckets = [
  { range: "0-20", min: 0, max: 20 },
  { range: "21-40", min: 21, max: 40 },
  { range: "41-60", min: 41, max: 60 },
  { range: "61-80", min: 61, max: 80 },
  { range: "81-100", min: 81, max: 100 },
];

const formatHours = (value) => {
  return Number(value.toFixed(1));
};

const mapActivityVisual = (log) => {
  if (log.action === "resume_uploaded") {
    return {
      icon: "FileUp",
      title: "Resume uploaded",
      sub:
        log.metadata?.jobId || log.metadata?.originalFileName
          ? `${log.metadata?.originalFileName || "Resume file"} uploaded`
          : "A resume file was uploaded",
    };
  }

  if (log.action === "screening_run_started") {
    return {
      icon: "Sparkles",
      title: "Screening run started",
      sub: `Run started for ${log.metadata?.totalCandidates || 0} candidates`,
    };
  }

  if (log.action === "shortlisted") {
    return {
      icon: "CheckCircle2",
      title: "Candidate shortlisted",
      sub: log.metadata?.note || "A candidate was shortlisted by HR",
    };
  }

  if (log.action === "rejected") {
    return {
      icon: "XCircle",
      title: "Candidate rejected",
      sub: log.metadata?.note || "A candidate was rejected by HR",
    };
  }

  return {
    icon: "History",
    title: log.action,
    sub: log.entityType,
  };
};

export const getDashboardSummaryService = async () => {
  const [
    totalResumes,
    activeJobs,
    latestResults,
    shortlistedCount,
    rejectedCount,
  ] = await Promise.all([
    ResumeFile.countDocuments({ isDeleted: false }),
    Job.countDocuments({ isDeleted: false, status: "open" }),
    ScreeningResult.find({ isLatestForJobCandidate: true }).select(
      "matchingScore statusBadge recommendation"
    ),
    CandidateAction.countDocuments({ actionType: "shortlisted" }),
    CandidateAction.countDocuments({ actionType: "rejected" }),
  ]);

  const totalLatestResults = latestResults.length;
  const averageMatchingScore = totalLatestResults
    ? Number(
        (
          latestResults.reduce((sum, item) => sum + (item.matchingScore || 0), 0) /
          totalLatestResults
        ).toFixed(1)
      )
    : 0;

  const scoreDistribution = scoreBuckets.map((bucket) => {
    const value = latestResults.filter((result) => {
      return (
        result.matchingScore >= bucket.min && result.matchingScore <= bucket.max
      );
    }).length;

    return {
      range: bucket.range,
      value,
    };
  });

  const inScreeningCount = Math.max(
    totalLatestResults - shortlistedCount - rejectedCount,
    0
  );

  const statusBase = totalLatestResults || 1;
  const candidateStatus = {
    inScreening: {
      count: inScreeningCount,
      percentage: Math.round((inScreeningCount / statusBase) * 100),
    },
    shortlisted: {
      count: shortlistedCount,
      percentage: Math.round((shortlistedCount / statusBase) * 100),
    },
    rejected: {
      count: rejectedCount,
      percentage: Math.round((rejectedCount / statusBase) * 100),
    },
  };

  return {
    stats: {
      totalResumes,
      activeJobs,
      shortlistedCandidates: shortlistedCount,
      averageMatchingScore,
      estimatedTimeSavedHours: formatHours(
        (totalResumes * minutesSavedPerResume) / 60
      ),
    },
    scoreDistribution,
    candidateStatus,
  };
};

export const getDashboardRecentActivityService = async (query = {}) => {
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 10, maxLimit: 50 });

  const [items, total] = await Promise.all([
    AuditLog.find({})
      .populate("actorId", "fullName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    AuditLog.countDocuments({}),
  ]);

  return buildPaginationResult({
    items: items.map((log) => ({
      _id: log._id,
      action: log.action,
      module: log.module,
      severity: log.severity,
      entityType: log.entityType,
      entityId: log.entityId,
      actor: log.actorId
        ? {
            fullName: log.actorId.fullName,
            email: log.actorId.email,
          }
        : {
            fullName: null,
            email: log.actorEmail || null,
          },
      metadata: log.metadata,
      createdAt: log.createdAt,
      ...mapActivityVisual(log),
    })),
    page,
    limit,
    total,
  });
};
