import Candidate from "../models/candidate.model.js";
import ResumeFile from "../models/resume-file.model.js";
import { buildServiceError } from "../utils/reference-validation.js";

const maxResumeChars = 12000;
const maxSummaryChars = 800;
const supportedProviders = ["rule_based", "openai", "gemini"];
const skillCatalog = [
  "react",
  "react.js",
  "next.js",
  "vue",
  "angular",
  "javascript",
  "typescript",
  "node.js",
  "node",
  "express",
  "nestjs",
  "python",
  "java",
  "spring",
  "spring boot",
  "php",
  "laravel",
  "c#",
  ".net",
  "golang",
  "go",
  "mongodb",
  "postgresql",
  "mysql",
  "redis",
  "docker",
  "kubernetes",
  "aws",
  "azure",
  "gcp",
  "graphql",
  "rest api",
  "html",
  "css",
  "tailwind",
  "figma",
  "ui/ux",
  "communication",
  "leadership",
  "problem solving",
  "testing",
  "jest",
  "cypress",
  "playwright",
  "git",
  "ci/cd",
];

const normalizeWhitespace = (value) => {
  return String(value || "")
    .replace(/\r/g, " ")
    .replace(/\t/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const toDisplaySkill = (skill) => {
  return String(skill || "")
    .split(" ")
    .map((part) => {
      const lower = part.toLowerCase();
      if (lower.includes(".") || lower === "ui/ux" || lower === "ci/cd") {
        return lower.toUpperCase();
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ")
    .trim();
};

const unique = (items) => {
  return [...new Set((items || []).filter(Boolean))];
};

const normalizeStringArray = (value) => {
  if (!Array.isArray(value)) return [];
  return unique(
    value
      .map((item) => normalizeWhitespace(item))
      .filter(Boolean)
  );
};

const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};

const roundScore = (value) => {
  return Math.round(clamp(Number(value) || 0, 0, 100));
};

const roundConfidence = (value) => {
  return Math.round(clamp(Number(value) || 0, 0, 1) * 100) / 100;
};

const normalizeWeight = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const buildCandidateText = (candidate, resumeFile) => {
  const hardSkills = (candidate?.skills?.hard || []).map((skill) => skill.name).filter(Boolean);
  const softSkills = candidate?.skills?.soft || [];
  const experiences = (candidate?.experiences || [])
    .map((experience) => {
      const company = normalizeWhitespace(experience.company);
      const title = normalizeWhitespace(experience.title);
      const highlights = normalizeStringArray(experience.highlights).join(", ");
      return [title, company, highlights].filter(Boolean).join(" at ");
    })
    .filter(Boolean)
    .join(". ");

  const education = (candidate?.education || [])
    .map((item) => {
      return [item.degree, item.major, item.school].filter(Boolean).join(" - ");
    })
    .filter(Boolean)
    .join(". ");

  return normalizeWhitespace(
    [
      candidate?.fullName,
      candidate?.location,
      candidate?.currentTitle,
      candidate?.currentCompany,
      candidate?.summary,
      hardSkills.join(", "),
      softSkills.join(", "),
      experiences,
      education,
      resumeFile?.extractedText,
    ].join(". ")
  );
};

const detectSkillMatches = (text, skills) => {
  const normalizedText = ` ${String(text || "").toLowerCase()} `;

  return normalizeStringArray(skills).filter((skill) => {
    const escaped = skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(normalizedText);
  });
};

const extractCatalogSkills = (text) => {
  const normalizedText = ` ${String(text || "").toLowerCase()} `;
  return unique(
    skillCatalog
      .filter((skill) => {
        const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(normalizedText);
      })
      .map(toDisplaySkill)
  );
};

const detectEducationLevel = (text) => {
  const normalizedText = String(text || "").toLowerCase();
  if (normalizedText.includes("phd") || normalizedText.includes("doctorate")) return "phd";
  if (normalizedText.includes("master")) return "master";
  if (
    normalizedText.includes("bachelor") ||
    normalizedText.includes("undergraduate") ||
    normalizedText.includes("engineer")
  ) {
    return "bachelor";
  }
  if (normalizedText.includes("associate")) return "associate";
  return null;
};

const educationRank = {
  associate: 1,
  bachelor: 2,
  master: 3,
  phd: 4,
};

const computeEducationScore = ({ requiredLevel, candidateLevel }) => {
  if (!requiredLevel) return 100;
  if (!candidateLevel) return 25;

  const requiredRank = educationRank[String(requiredLevel).toLowerCase()] || 0;
  const candidateRank = educationRank[String(candidateLevel).toLowerCase()] || 0;

  if (!requiredRank || !candidateRank) return 50;
  if (candidateRank >= requiredRank) return 100;
  if (candidateRank === requiredRank - 1) return 60;
  return 20;
};

const computeExperienceScore = ({ candidateYears, minYears, maxYears }) => {
  const experience = Number(candidateYears) || 0;
  if (!minYears && !maxYears) return experience > 0 ? 80 : 60;
  if (minYears && experience < minYears) {
    return roundScore((experience / minYears) * 70);
  }
  if (maxYears && experience > maxYears) {
    return 90;
  }
  return 100;
};

const deriveStatusBadge = (score, screeningConfig) => {
  const shortlistAboveScore = Number(screeningConfig?.shortlistAboveScore) || 85;
  const autoRejectBelowScore = Number(screeningConfig?.autoRejectBelowScore) || 40;

  if (score >= shortlistAboveScore) return "strong_fit";
  if (score <= autoRejectBelowScore) return "not_suitable";
  return "potential";
};

const deriveRecommendation = (statusBadge) => {
  if (statusBadge === "strong_fit") return "must_interview";
  if (statusBadge === "potential") return "interview";
  return "reject";
};

const buildRuleBasedSummary = ({
  candidate,
  requiredMatched,
  requiredMissing,
  optionalMatched,
  matchingScore,
  statusBadge,
}) => {
  const summary = [];

  if (requiredMatched.length) {
    summary.push(
      `${candidate.fullName} matches ${requiredMatched.length} required skill${
        requiredMatched.length > 1 ? "s" : ""
      }.`
    );
  }

  if (requiredMissing.length) {
    summary.push(`Still missing: ${requiredMissing.slice(0, 3).join(", ")}.`);
  }

  if (optionalMatched.length) {
    summary.push(`Nice-to-have overlap: ${optionalMatched.slice(0, 3).join(", ")}.`);
  }

  summary.push(`Overall fit is ${statusBadge.replace(/_/g, " ")} at ${matchingScore}/100.`);

  return summary.join(" ").trim();
};

const buildRuleBasedExplanation = ({
  candidate,
  requiredMatched,
  requiredMissing,
  optionalMatched,
  keywordMatches,
  experienceScore,
  educationScore,
}) => {
  return [
    `${candidate.fullName} has ${candidate.totalYearsExperience || 0} year(s) of experience.`,
    candidate.location ? `Current location: ${candidate.location}.` : null,
    requiredMatched.length
      ? `Matched required skills: ${requiredMatched.join(", ")}.`
      : "No required skills were confidently matched.",
    requiredMissing.length ? `Missing skills: ${requiredMissing.join(", ")}.` : null,
    optionalMatched.length ? `Additional relevant skills: ${optionalMatched.join(", ")}.` : null,
    keywordMatches.length ? `Keyword context matched: ${keywordMatches.slice(0, 5).join(", ")}.` : null,
    `Experience fit: ${experienceScore}/100. Education fit: ${educationScore}/100.`,
  ]
    .filter(Boolean)
    .join(" ");
};

const buildRuleBasedResult = ({ candidate, resumeFile, job, screeningRun }) => {
  const candidateText = buildCandidateText(candidate, resumeFile);
  const requiredSkills = normalizeStringArray(job?.jdParsed?.requiredSkills);
  const optionalSkills = normalizeStringArray(job?.jdParsed?.niceToHaveSkills);
  const keywords = normalizeStringArray(job?.jdParsed?.keywords);
  const mustHaveSkills = normalizeStringArray(job?.screeningConfig?.mustHaveSkills);

  const requiredMatched = detectSkillMatches(candidateText, requiredSkills).map(toDisplaySkill);
  const optionalMatched = detectSkillMatches(candidateText, optionalSkills).map(toDisplaySkill);
  const keywordMatches = detectSkillMatches(candidateText, keywords).map(toDisplaySkill);
  const catalogMatches = extractCatalogSkills(candidateText);

  const requiredMissing = requiredSkills
    .filter((skill) => {
      return !requiredMatched.some(
        (matchedSkill) => matchedSkill.toLowerCase() === String(skill).toLowerCase()
      );
    })
    .map(toDisplaySkill);

  const mustHaveMissing = mustHaveSkills
    .filter((skill) => {
      return !requiredMatched.some(
        (matchedSkill) => matchedSkill.toLowerCase() === String(skill).toLowerCase()
      );
    })
    .map(toDisplaySkill);

  const requiredSkillScore = requiredSkills.length
    ? roundScore((requiredMatched.length / requiredSkills.length) * 100)
    : 75;
  const optionalSkillScore = optionalSkills.length
    ? roundScore((optionalMatched.length / optionalSkills.length) * 100)
    : 60;
  const keywordScore = keywords.length
    ? roundScore((keywordMatches.length / keywords.length) * 100)
    : 60;
  const experienceScore = computeExperienceScore({
    candidateYears: candidate.totalYearsExperience,
    minYears: job?.jdParsed?.minYearsExperience,
    maxYears: job?.jdParsed?.maxYearsExperience,
  });
  const educationScore = computeEducationScore({
    requiredLevel: job?.jdParsed?.educationLevel,
    candidateLevel: detectEducationLevel(candidateText),
  });

  const requiredWeight = normalizeWeight(job?.screeningConfig?.requiredSkillWeight, 0.45);
  const experienceWeight = normalizeWeight(job?.screeningConfig?.experienceWeight, 0.25);
  const educationWeight = normalizeWeight(job?.screeningConfig?.educationWeight, 0.15);
  const keywordWeight = normalizeWeight(job?.screeningConfig?.keywordWeight, 0.15);
  const optionalWeight = 0.1;

  let matchingScore =
    requiredSkillScore * requiredWeight +
    experienceScore * experienceWeight +
    educationScore * educationWeight +
    keywordScore * keywordWeight +
    optionalSkillScore * optionalWeight;

  if (mustHaveMissing.length) {
    matchingScore -= mustHaveMissing.length * 8;
  }

  if (
    screeningRun?.filters?.mustIncludeSkills?.length &&
    !detectSkillMatches(candidateText, screeningRun.filters.mustIncludeSkills).length
  ) {
    matchingScore -= 12;
  }

  if (
    screeningRun?.filters?.minYearsExperience &&
    (candidate.totalYearsExperience || 0) < screeningRun.filters.minYearsExperience
  ) {
    matchingScore -= 10;
  }

  matchingScore = roundScore(matchingScore);
  const statusBadge = deriveStatusBadge(matchingScore, job?.screeningConfig);
  const recommendation = deriveRecommendation(statusBadge);

  const strengths = unique(
    [
      ...requiredMatched.slice(0, 4),
      ...(candidate.totalYearsExperience >= (job?.jdParsed?.minYearsExperience || 0)
        ? [`Experience ${candidate.totalYearsExperience} years`]
        : []),
      ...optionalMatched.slice(0, 2),
    ].filter(Boolean)
  ).slice(0, 5);

  const gaps = unique(
    [
      ...requiredMissing.slice(0, 4),
      ...(candidate.totalYearsExperience < (job?.jdParsed?.minYearsExperience || 0)
        ? [`Below ${job.jdParsed.minYearsExperience}+ years requirement`]
        : []),
    ].filter(Boolean)
  ).slice(0, 5);

  const redFlags = unique(
    [
      ...(mustHaveMissing.length ? mustHaveMissing.slice(0, 3) : []),
      ...(resumeFile?.parseStatus !== "parsed" ? ["Resume not fully parsed"] : []),
    ].filter(Boolean)
  ).slice(0, 4);

  return {
    candidateId: candidate._id,
    resumeFileId: resumeFile?._id || null,
    matchingScore,
    statusBadge,
    recommendation,
    scoreBreakdown: {
      requiredSkills: requiredSkillScore,
      optionalSkills: optionalSkillScore,
      experience: experienceScore,
      education: educationScore,
      keywordContext: keywordScore,
    },
    fitScores: {
      technical: roundScore((requiredSkillScore + keywordScore + optionalSkillScore) / 3),
      cultural: roundScore((educationScore + experienceScore) / 2),
    },
    matchedSkills: unique([...requiredMatched, ...catalogMatches.slice(0, 6)]).slice(0, 12),
    missingSkills: requiredMissing.slice(0, 10),
    optionalSkills: optionalMatched.slice(0, 8),
    strengths,
    gaps,
    redFlags,
    aiSummary: buildRuleBasedSummary({
      candidate,
      requiredMatched,
      requiredMissing,
      optionalMatched,
      matchingScore,
      statusBadge,
    }).slice(0, maxSummaryChars),
    explanation: buildRuleBasedExplanation({
      candidate,
      requiredMatched,
      requiredMissing,
      optionalMatched,
      keywordMatches,
      experienceScore,
      educationScore,
    }).slice(0, maxResumeChars),
    confidenceScore: roundConfidence(
      0.55 + requiredMatched.length * 0.05 - mustHaveMissing.length * 0.04
    ),
    flags: {
      needsReview: matchingScore >= 45 && matchingScore <= 65,
      possibleHallucination: false,
    },
    analysisMeta: {
      provider: "rule_based",
      mode: "local_scoring",
    },
  };
};

const extractJsonObject = (content) => {
  const normalized = String(content || "").trim();
  const fencedMatch = normalized.match(/```json\s*([\s\S]*?)```/i);
  if (fencedMatch) {
    return JSON.parse(fencedMatch[1]);
  }

  const firstBrace = normalized.indexOf("{");
  const lastBrace = normalized.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return JSON.parse(normalized.slice(firstBrace, lastBrace + 1));
  }

  return JSON.parse(normalized);
};

const buildMatchingPrompt = ({ candidate, resumeFile, job }) => {
  return [
    "Compare the candidate resume against the job description and return JSON only.",
    "Use this schema:",
    JSON.stringify(
      {
        matchingScore: 0,
        statusBadge: "strong_fit",
        recommendation: "must_interview",
        scoreBreakdown: {
          requiredSkills: 0,
          optionalSkills: 0,
          experience: 0,
          education: 0,
          keywordContext: 0,
        },
        fitScores: {
          technical: 0,
          cultural: 0,
        },
        matchedSkills: ["string"],
        missingSkills: ["string"],
        optionalSkills: ["string"],
        strengths: ["string"],
        gaps: ["string"],
        redFlags: ["string"],
        aiSummary: "string",
        explanation: "string",
        confidenceScore: 0.7,
        flags: {
          needsReview: false,
          possibleHallucination: false,
        },
      },
      null,
      2
    ),
    "Rules:",
    "- Return valid JSON only, no markdown.",
    "- matchingScore and sub scores are numbers from 0 to 100.",
    "- confidenceScore is a number from 0 to 1.",
    "- statusBadge must be one of: strong_fit, potential, not_suitable.",
    "- recommendation must be one of: must_interview, interview, hold, reject.",
    "- Arrays should be concise and contain at most 8 items.",
    `Job title: ${job.title}`,
    `Job level: ${job.seniorityLevel}`,
    `Parsed JD: ${JSON.stringify(job.jdParsed || {})}`,
    `Screening config: ${JSON.stringify(job.screeningConfig || {})}`,
    `Candidate profile: ${JSON.stringify({
      fullName: candidate.fullName,
      email: candidate.email,
      location: candidate.location,
      currentTitle: candidate.currentTitle,
      currentCompany: candidate.currentCompany,
      totalYearsExperience: candidate.totalYearsExperience,
      summary: candidate.summary,
      hardSkills: (candidate.skills?.hard || []).map((skill) => skill.name),
      softSkills: candidate.skills?.soft || [],
    })}`,
    `Resume preview: ${String(resumeFile?.extractedText || "").slice(0, maxResumeChars)}`,
  ].join("\n\n");
};

const callOpenAiMatching = async ({ candidate, resumeFile, job }) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw buildServiceError(
      "OPENAI_API_KEY is missing for AI_MATCH_PROVIDER=openai",
      500,
      "OPENAI_MATCH_CONFIG_MISSING"
    );
  }

  const model = process.env.OPENAI_MATCH_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini";
  const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "system",
          content:
            "You are an AI hiring assistant. Return structured screening output as JSON only.",
        },
        {
          role: "user",
          content: buildMatchingPrompt({ candidate, resumeFile, job }),
        },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw buildServiceError(
      `OpenAI resume matching failed: ${errorText}`,
      502,
      "OPENAI_MATCHING_FAILED"
    );
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) {
    throw buildServiceError(
      "OpenAI resume matching returned empty content",
      502,
      "OPENAI_MATCHING_EMPTY"
    );
  }

  return extractJsonObject(content);
};

const callGeminiMatching = async ({ candidate, resumeFile, job }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw buildServiceError(
      "GEMINI_API_KEY is missing for AI_MATCH_PROVIDER=gemini",
      500,
      "GEMINI_MATCH_CONFIG_MISSING"
    );
  }

  const model = process.env.GEMINI_MATCH_MODEL || process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const baseUrl =
    process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta";
  const response = await fetch(
    `${baseUrl}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: buildMatchingPrompt({ candidate, resumeFile, job }),
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw buildServiceError(
      `Gemini resume matching failed: ${errorText}`,
      502,
      "GEMINI_MATCHING_FAILED"
    );
  }

  const payload = await response.json();
  const content = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    throw buildServiceError(
      "Gemini resume matching returned empty content",
      502,
      "GEMINI_MATCHING_EMPTY"
    );
  }

  return extractJsonObject(content);
};

const normalizeProviderResult = ({ rawResult, fallbackResult, provider }) => {
  const normalizedStatusBadge = ["strong_fit", "potential", "not_suitable"].includes(
    rawResult?.statusBadge
  )
    ? rawResult.statusBadge
    : fallbackResult.statusBadge;

  const normalizedRecommendation = ["must_interview", "interview", "hold", "reject"].includes(
    rawResult?.recommendation
  )
    ? rawResult.recommendation
    : deriveRecommendation(normalizedStatusBadge);

  return {
    ...fallbackResult,
    matchingScore: roundScore(rawResult?.matchingScore ?? fallbackResult.matchingScore),
    statusBadge: normalizedStatusBadge,
    recommendation: normalizedRecommendation,
    scoreBreakdown: {
      requiredSkills: roundScore(
        rawResult?.scoreBreakdown?.requiredSkills ?? fallbackResult.scoreBreakdown.requiredSkills
      ),
      optionalSkills: roundScore(
        rawResult?.scoreBreakdown?.optionalSkills ?? fallbackResult.scoreBreakdown.optionalSkills
      ),
      experience: roundScore(
        rawResult?.scoreBreakdown?.experience ?? fallbackResult.scoreBreakdown.experience
      ),
      education: roundScore(
        rawResult?.scoreBreakdown?.education ?? fallbackResult.scoreBreakdown.education
      ),
      keywordContext: roundScore(
        rawResult?.scoreBreakdown?.keywordContext ?? fallbackResult.scoreBreakdown.keywordContext
      ),
    },
    fitScores: {
      technical: roundScore(rawResult?.fitScores?.technical ?? fallbackResult.fitScores.technical),
      cultural: roundScore(rawResult?.fitScores?.cultural ?? fallbackResult.fitScores.cultural),
    },
    matchedSkills: normalizeStringArray(rawResult?.matchedSkills).slice(0, 12),
    missingSkills: normalizeStringArray(rawResult?.missingSkills).slice(0, 10),
    optionalSkills: normalizeStringArray(rawResult?.optionalSkills).slice(0, 8),
    strengths: normalizeStringArray(rawResult?.strengths).slice(0, 6),
    gaps: normalizeStringArray(rawResult?.gaps).slice(0, 6),
    redFlags: normalizeStringArray(rawResult?.redFlags).slice(0, 5),
    aiSummary:
      normalizeWhitespace(rawResult?.aiSummary).slice(0, maxSummaryChars) ||
      fallbackResult.aiSummary,
    explanation:
      normalizeWhitespace(rawResult?.explanation).slice(0, maxResumeChars) ||
      fallbackResult.explanation,
    confidenceScore: roundConfidence(
      rawResult?.confidenceScore ?? fallbackResult.confidenceScore
    ),
    flags: {
      needsReview:
        typeof rawResult?.flags?.needsReview === "boolean"
          ? rawResult.flags.needsReview
          : fallbackResult.flags.needsReview,
      possibleHallucination:
        typeof rawResult?.flags?.possibleHallucination === "boolean"
          ? rawResult.flags.possibleHallucination
          : fallbackResult.flags.possibleHallucination,
    },
    analysisMeta: {
      provider,
      mode: "provider_api",
    },
  };
};

const resolveMatchProvider = () => {
  const provider = String(process.env.AI_MATCH_PROVIDER || process.env.AI_JD_PROVIDER || "rule_based")
    .trim()
    .toLowerCase();

  if (!supportedProviders.includes(provider)) {
    throw buildServiceError(
      "AI_MATCH_PROVIDER must be one of: rule_based, openai, gemini",
      500,
      "AI_MATCH_PROVIDER_INVALID"
    );
  }

  return provider;
};

export const resolveScreeningRunAiProvider = (preferredProvider) => {
  const provider = String(preferredProvider || resolveMatchProvider()).trim().toLowerCase();
  if (!supportedProviders.includes(provider)) {
    throw buildServiceError("aiProvider is invalid", 400, "VALIDATION_ERROR");
  }
  return provider;
};

const findCandidateForMatching = async (candidateId) => {
  const candidate = await Candidate.findOne({ _id: candidateId, isDeleted: false });
  if (!candidate) {
    throw buildServiceError("Candidate not found", 404, "CANDIDATE_NOT_FOUND");
  }
  return candidate;
};

const findResumeForMatching = async (resumeFileId) => {
  if (!resumeFileId) return null;
  return ResumeFile.findOne({ _id: resumeFileId, isDeleted: false });
};

export const generateScreeningResultService = async ({
  candidateId,
  resumeFileId,
  job,
  screeningRun,
  provider,
}) => {
  const candidate = await findCandidateForMatching(candidateId);
  const resumeFile = await findResumeForMatching(resumeFileId);
  const fallbackResult = buildRuleBasedResult({
    candidate,
    resumeFile,
    job,
    screeningRun,
  });

  const resolvedProvider = resolveScreeningRunAiProvider(provider);
  if (resolvedProvider === "rule_based") {
    return fallbackResult;
  }

  try {
    const rawResult =
      resolvedProvider === "openai"
        ? await callOpenAiMatching({ candidate, resumeFile, job })
        : await callGeminiMatching({ candidate, resumeFile, job });

    return normalizeProviderResult({
      rawResult,
      fallbackResult,
      provider: resolvedProvider,
    });
  } catch (error) {
    if (
      error?.errorCode === "OPENAI_MATCH_CONFIG_MISSING" ||
      error?.errorCode === "GEMINI_MATCH_CONFIG_MISSING"
    ) {
      throw error;
    }

    return {
      ...fallbackResult,
      flags: {
        ...fallbackResult.flags,
        needsReview: true,
      },
      analysisMeta: {
        provider: resolvedProvider,
        mode: "fallback_rule_based",
        fallbackReason: error?.message || "Provider call failed",
      },
    };
  }
};
