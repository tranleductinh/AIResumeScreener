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

export const analyzeJobDescriptionService = ({ title, jdText }) => {
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
