import { buildServiceError } from "../utils/reference-validation.js";

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

const stopWords = new Set([
  "the",
  "and",
  "for",
  "with",
  "will",
  "this",
  "that",
  "you",
  "your",
  "our",
  "are",
  "have",
  "has",
  "from",
  "into",
  "using",
  "used",
  "about",
  "role",
  "team",
  "work",
  "candidate",
  "experience",
  "years",
  "job",
  "requirements",
  "required",
  "preferred",
  "plus",
  "must",
]);

const sentenceSplitRegex = /(?<=[.!?])\s+|\n+/;
const maxJsonChars = 12000;

const normalizeWhitespace = (value) => {
  return String(value || "")
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .trim();
};

const toTitleSkill = (skill) => {
  return skill
    .split(" ")
    .map((part) => {
      if (part.includes(".") || part === "ui/ux" || part === "ci/cd") {
        return part.toUpperCase();
      }
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
};

const unique = (items) => {
  return [...new Set(items.filter(Boolean))];
};

const extractSentences = (jdText) => {
  return normalizeWhitespace(jdText)
    .split(sentenceSplitRegex)
    .map((sentence) => sentence.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);
};

const extractYearsExperience = (jdText) => {
  const text = jdText.toLowerCase();
  const rangeMatch = text.match(/(\d+)\s*[-to]{1,3}\s*(\d+)\s+years?/i);
  if (rangeMatch) {
    return {
      minYearsExperience: Number(rangeMatch[1]),
      maxYearsExperience: Number(rangeMatch[2]),
    };
  }

  const plusMatch = text.match(/(\d+)\+?\s+years?/i);
  if (plusMatch) {
    return {
      minYearsExperience: Number(plusMatch[1]),
      maxYearsExperience: null,
    };
  }

  return {
    minYearsExperience: null,
    maxYearsExperience: null,
  };
};

const extractEducationLevel = (jdText) => {
  const text = jdText.toLowerCase();
  if (text.includes("phd") || text.includes("doctorate")) return "phd";
  if (text.includes("master")) return "master";
  if (
    text.includes("bachelor") ||
    text.includes("bs ") ||
    text.includes("ba ") ||
    text.includes("undergraduate")
  ) {
    return "bachelor";
  }
  if (text.includes("associate")) return "associate";
  return null;
};

const extractResponsibilities = (sentences) => {
  const responsibilityHints = [
    "build",
    "develop",
    "design",
    "lead",
    "collaborate",
    "maintain",
    "own",
    "support",
    "deliver",
    "implement",
    "manage",
  ];

  return sentences
    .filter((sentence) => {
      const lower = sentence.toLowerCase();
      return responsibilityHints.some((hint) => lower.includes(hint));
    })
    .slice(0, 6);
};

const extractSkills = (sentences) => {
  const requiredIndicators = [
    "required",
    "must have",
    "must-have",
    "strong",
    "proficient",
    "hands-on",
    "experience with",
    "expertise in",
  ];
  const preferredIndicators = [
    "nice to have",
    "preferred",
    "bonus",
    "plus",
    "good to have",
    "familiarity with",
  ];

  const requiredSkills = [];
  const niceToHaveSkills = [];
  const allSkills = [];

  sentences.forEach((sentence) => {
    const lowerSentence = sentence.toLowerCase();
    const matchedSkills = skillCatalog.filter((skill) => {
      const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`(^|[^a-z0-9])${escapedSkill}([^a-z0-9]|$)`, "i").test(
        lowerSentence
      );
    });

    matchedSkills.forEach((skill) => {
      const displaySkill = toTitleSkill(skill);
      allSkills.push(displaySkill);

      if (preferredIndicators.some((indicator) => lowerSentence.includes(indicator))) {
        niceToHaveSkills.push(displaySkill);
        return;
      }

      if (requiredIndicators.some((indicator) => lowerSentence.includes(indicator))) {
        requiredSkills.push(displaySkill);
        return;
      }

      requiredSkills.push(displaySkill);
    });
  });

  return {
    requiredSkills: unique(requiredSkills).slice(0, 12),
    niceToHaveSkills: unique(
      niceToHaveSkills.filter((skill) => !requiredSkills.includes(skill))
    ).slice(0, 10),
    allSkills: unique(allSkills),
  };
};

const extractKeywords = ({ title, jdText, allSkills }) => {
  const titleWords = String(title || "")
    .toLowerCase()
    .split(/[^a-z0-9+#./-]+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2 && !stopWords.has(word));

  const jdWords = String(jdText || "")
    .toLowerCase()
    .split(/[^a-z0-9+#./-]+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2 && !stopWords.has(word));

  const rankedWords = Object.entries(
    jdWords.reduce((accumulator, word) => {
      accumulator[word] = (accumulator[word] || 0) + 1;
      return accumulator;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word]) => word);

  return unique([
    ...allSkills.slice(0, 6),
    ...titleWords.map(toTitleSkill),
    ...rankedWords.map(toTitleSkill),
  ]).slice(0, 12);
};

const buildScreeningConfig = ({
  requiredSkills,
  niceToHaveSkills,
  minYearsExperience,
}) => {
  const mustHaveSkills = requiredSkills.slice(0, 5);
  const hasStrongRequirements = requiredSkills.length >= 6 || (minYearsExperience || 0) >= 5;
  const hasPreferredBreadth = niceToHaveSkills.length >= 3;

  return {
    autoRejectBelowScore: hasStrongRequirements ? 50 : 40,
    shortlistAboveScore: hasStrongRequirements ? 85 : 80,
    requiredSkillWeight: hasStrongRequirements ? 0.5 : 0.45,
    experienceWeight: minYearsExperience && minYearsExperience >= 5 ? 0.3 : 0.25,
    educationWeight: 0.1,
    keywordWeight: hasPreferredBreadth ? 0.1 : 0.15,
    mustHaveSkills,
    allowAiAutoRecommendation: true,
  };
};

const buildRuleBasedAnalysis = ({ title, jdText }) => {
  const normalizedText = normalizeWhitespace(jdText);
  const sentences = extractSentences(normalizedText);
  const { requiredSkills, niceToHaveSkills, allSkills } = extractSkills(sentences);
  const { minYearsExperience, maxYearsExperience } = extractYearsExperience(normalizedText);
  const responsibilities = extractResponsibilities(sentences);
  const educationLevel = extractEducationLevel(normalizedText);
  const roleSummary = sentences.slice(0, 2).join(" ").slice(0, 320);
  const keywords = extractKeywords({ title, jdText: normalizedText, allSkills });

  return {
    jdParsed: {
      roleSummary,
      requiredSkills,
      niceToHaveSkills,
      minYearsExperience,
      maxYearsExperience,
      keywords,
      responsibilities,
      educationLevel,
    },
    screeningConfig: buildScreeningConfig({
      requiredSkills,
      niceToHaveSkills,
      minYearsExperience,
    }),
    analysisMeta: {
      provider: "rule_based",
      analyzedAt: new Date(),
    },
  };
};

const coerceStringArray = (value) => {
  if (!Array.isArray(value)) return [];
  return unique(
    value
      .map((item) => normalizeWhitespace(item))
      .filter(Boolean)
  );
};

const coerceNumberOrNull = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const normalizeProviderAnalysis = (rawResult, fallbackResult, provider) => {
  const jdParsed = rawResult?.jdParsed || {};
  const screeningConfig = rawResult?.screeningConfig || {};

  const normalizedJdParsed = {
    roleSummary:
      normalizeWhitespace(jdParsed.roleSummary).slice(0, 400) ||
      fallbackResult.jdParsed.roleSummary,
    requiredSkills:
      coerceStringArray(jdParsed.requiredSkills).slice(0, 12) ||
      fallbackResult.jdParsed.requiredSkills,
    niceToHaveSkills:
      coerceStringArray(jdParsed.niceToHaveSkills).slice(0, 10) ||
      fallbackResult.jdParsed.niceToHaveSkills,
    minYearsExperience:
      coerceNumberOrNull(jdParsed.minYearsExperience) ??
      fallbackResult.jdParsed.minYearsExperience,
    maxYearsExperience:
      coerceNumberOrNull(jdParsed.maxYearsExperience) ??
      fallbackResult.jdParsed.maxYearsExperience,
    keywords:
      coerceStringArray(jdParsed.keywords).slice(0, 12) ||
      fallbackResult.jdParsed.keywords,
    responsibilities:
      coerceStringArray(jdParsed.responsibilities).slice(0, 6) ||
      fallbackResult.jdParsed.responsibilities,
    educationLevel:
      normalizeWhitespace(jdParsed.educationLevel) ||
      fallbackResult.jdParsed.educationLevel,
  };

  const mergedScreeningConfig = {
    ...fallbackResult.screeningConfig,
    autoRejectBelowScore:
      coerceNumberOrNull(screeningConfig.autoRejectBelowScore) ??
      fallbackResult.screeningConfig.autoRejectBelowScore,
    shortlistAboveScore:
      coerceNumberOrNull(screeningConfig.shortlistAboveScore) ??
      fallbackResult.screeningConfig.shortlistAboveScore,
    requiredSkillWeight:
      coerceNumberOrNull(screeningConfig.requiredSkillWeight) ??
      fallbackResult.screeningConfig.requiredSkillWeight,
    experienceWeight:
      coerceNumberOrNull(screeningConfig.experienceWeight) ??
      fallbackResult.screeningConfig.experienceWeight,
    educationWeight:
      coerceNumberOrNull(screeningConfig.educationWeight) ??
      fallbackResult.screeningConfig.educationWeight,
    keywordWeight:
      coerceNumberOrNull(screeningConfig.keywordWeight) ??
      fallbackResult.screeningConfig.keywordWeight,
    mustHaveSkills:
      coerceStringArray(screeningConfig.mustHaveSkills).slice(0, 5) ||
      fallbackResult.screeningConfig.mustHaveSkills,
    allowAiAutoRecommendation:
      typeof screeningConfig.allowAiAutoRecommendation === "boolean"
        ? screeningConfig.allowAiAutoRecommendation
        : fallbackResult.screeningConfig.allowAiAutoRecommendation,
  };

  return {
    jdParsed: normalizedJdParsed,
    screeningConfig: mergedScreeningConfig,
    analysisMeta: {
      provider,
      analyzedAt: new Date(),
      mode: "provider_api",
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

const buildAnalysisPrompt = ({ title, jdText }) => {
  return [
    "Analyze the following job description and return JSON only.",
    "Schema:",
    JSON.stringify(
      {
        jdParsed: {
          roleSummary: "string",
          requiredSkills: ["string"],
          niceToHaveSkills: ["string"],
          minYearsExperience: 0,
          maxYearsExperience: 0,
          keywords: ["string"],
          responsibilities: ["string"],
          educationLevel: "string or null",
        },
        screeningConfig: {
          autoRejectBelowScore: 0,
          shortlistAboveScore: 0,
          requiredSkillWeight: 0,
          experienceWeight: 0,
          educationWeight: 0,
          keywordWeight: 0,
          mustHaveSkills: ["string"],
          allowAiAutoRecommendation: true,
        },
      },
      null,
      2
    ),
    "Rules:",
    "- Return valid JSON only, no markdown.",
    "- requiredSkills max 12 items.",
    "- niceToHaveSkills max 10 items.",
    "- responsibilities max 6 items.",
    "- keywords max 12 items.",
    "- mustHaveSkills max 5 items.",
    "- Use null when data is unknown.",
    "- Scores are percentages from 0 to 100.",
    "- Weights are decimals and should sum approximately to 1.",
    `Job title: ${title}`,
    `Job description:\n${String(jdText || "").slice(0, maxJsonChars)}`,
  ].join("\n\n");
};

const callOpenAiAnalysis = async ({ title, jdText }) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw buildServiceError(
      "OPENAI_API_KEY is missing for AI_JD_PROVIDER=openai",
      500,
      "OPENAI_CONFIG_MISSING"
    );
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
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
            "You extract structured hiring data from job descriptions. Return JSON only.",
        },
        {
          role: "user",
          content: buildAnalysisPrompt({ title, jdText }),
        },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw buildServiceError(
      `OpenAI JD analysis failed: ${errorText}`,
      502,
      "OPENAI_ANALYSIS_FAILED"
    );
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) {
    throw buildServiceError(
      "OpenAI JD analysis returned empty content",
      502,
      "OPENAI_ANALYSIS_EMPTY"
    );
  }

  return extractJsonObject(content);
};

const callGeminiAnalysis = async ({ title, jdText }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw buildServiceError(
      "GEMINI_API_KEY is missing for AI_JD_PROVIDER=gemini",
      500,
      "GEMINI_CONFIG_MISSING"
    );
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
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
                text: buildAnalysisPrompt({ title, jdText }),
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
      `Gemini JD analysis failed: ${errorText}`,
      502,
      "GEMINI_ANALYSIS_FAILED"
    );
  }

  const payload = await response.json();
  const content = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    throw buildServiceError(
      "Gemini JD analysis returned empty content",
      502,
      "GEMINI_ANALYSIS_EMPTY"
    );
  }

  return extractJsonObject(content);
};

const resolveProvider = () => {
  const provider = String(process.env.AI_JD_PROVIDER || "rule_based")
    .trim()
    .toLowerCase();

  if (!["rule_based", "openai", "gemini"].includes(provider)) {
    throw buildServiceError(
      "AI_JD_PROVIDER must be one of: rule_based, openai, gemini",
      500,
      "AI_PROVIDER_INVALID"
    );
  }

  return provider;
};

export const analyzeJobDescriptionService = async ({ title, jdText }) => {
  const fallbackResult = buildRuleBasedAnalysis({ title, jdText });
  const provider = resolveProvider();

  if (provider === "rule_based") {
    return fallbackResult;
  }

  try {
    const rawResult =
      provider === "openai"
        ? await callOpenAiAnalysis({ title, jdText })
        : await callGeminiAnalysis({ title, jdText });

    return normalizeProviderAnalysis(rawResult, fallbackResult, provider);
  } catch (error) {
    if (
      error?.errorCode === "OPENAI_CONFIG_MISSING" ||
      error?.errorCode === "GEMINI_CONFIG_MISSING"
    ) {
      throw error;
    }

    return {
      ...fallbackResult,
      analysisMeta: {
        provider,
        analyzedAt: new Date(),
        mode: "fallback_rule_based",
        fallbackReason: error?.message || "Provider call failed",
      },
    };
  }
};
