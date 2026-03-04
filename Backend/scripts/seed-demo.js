import dotenv from "dotenv";
import mongoose from "mongoose";

import connectDB from "../src/config/db.js";
import AuditLog from "../src/models/audit-log.model.js";
import CandidateAction from "../src/models/candidate-action.model.js";
import Candidate from "../src/models/candidate.model.js";
import Job from "../src/models/job.model.js";
import ResumeFile from "../src/models/resume-file.model.js";
import ScreeningResult from "../src/models/screening-result.model.js";
import ScreeningRun from "../src/models/screening-run.model.js";
import User from "../src/models/user.model.js";

dotenv.config();

const demoRecruiterEmail = "demo.hr@airesumescreener.local";
const demoCandidateEmails = [
  "linh.nguyen@demo.local",
  "minh.tran@demo.local",
  "anh.pham@demo.local",
];

const demoResumesFolder = "demo/seed";

const buildCandidatePayload = (payload) => {
  return {
    normalizedFullName: payload.fullName.toLowerCase(),
    fullName: payload.fullName,
    email: payload.email,
    phone: payload.phone,
    location: payload.location,
    currentTitle: payload.currentTitle,
    currentCompany: payload.currentCompany,
    summary: payload.summary,
    totalYearsExperience: payload.totalYearsExperience,
    profileStatus: "enriched",
    profileCompleteness: 88,
    tags: payload.tags,
    source: {
      type: "manual",
      jobId: payload.jobId,
    },
    skills: {
      hard: payload.skills.map((skill) => ({
        name: skill,
        level: 4,
        years: payload.totalYearsExperience,
        verified: false,
      })),
      soft: payload.softSkills,
    },
  };
};

const createDemoData = async () => {
  const recruiter = await User.findOneAndUpdate(
    { email: demoRecruiterEmail },
    {
      $set: {
        fullName: "Demo HR Recruiter",
        avatar: "https://api.dicebear.com/9.x/initials/svg?seed=Demo%20HR",
        role: "recruiter",
        authType: "google",
        isActive: true,
        joinedAt: new Date(),
        emailVerifiedAt: new Date(),
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const jobs = await Job.insertMany([
    {
      createdBy: recruiter._id,
      jobCode: "DEMO-FE-001",
      title: "Frontend Engineer",
      department: "Engineering",
      seniorityLevel: "mid",
      status: "open",
      openedAt: new Date(),
      jdText:
        "Build React and TypeScript web experiences, collaborate with design, write reusable UI components, and improve frontend testing quality.",
      jdParsed: {
        roleSummary: "Mid-level frontend engineer focused on React delivery.",
        requiredSkills: ["React", "TypeScript", "HTML", "CSS"],
        niceToHaveSkills: ["Jest", "Cypress"],
        minYearsExperience: 2,
        maxYearsExperience: 5,
        keywords: ["frontend", "ui", "react", "typescript"],
        responsibilities: [
          "Build reusable UI",
          "Collaborate with product and design",
          "Maintain code quality",
        ],
        educationLevel: "bachelor",
      },
      screeningConfig: {
        autoRejectBelowScore: 45,
        shortlistAboveScore: 82,
        requiredSkillWeight: 0.45,
        experienceWeight: 0.25,
        educationWeight: 0.1,
        keywordWeight: 0.2,
        mustHaveSkills: ["React", "TypeScript"],
        allowAiAutoRecommendation: true,
      },
    },
    {
      createdBy: recruiter._id,
      jobCode: "DEMO-BE-001",
      title: "Backend Node.js Engineer",
      department: "Engineering",
      seniorityLevel: "mid",
      status: "open",
      openedAt: new Date(),
      jdText:
        "Design Node.js APIs, work with MongoDB, integrate AI scoring services, and maintain backend reliability.",
      jdParsed: {
        roleSummary: "Backend engineer for screening APIs and integrations.",
        requiredSkills: ["Node.js", "Express", "MongoDB"],
        niceToHaveSkills: ["Redis", "Docker"],
        minYearsExperience: 2,
        maxYearsExperience: 5,
        keywords: ["backend", "api", "node.js", "mongodb"],
        responsibilities: [
          "Build REST APIs",
          "Integrate third-party providers",
          "Maintain backend quality",
        ],
        educationLevel: "bachelor",
      },
      screeningConfig: {
        autoRejectBelowScore: 50,
        shortlistAboveScore: 84,
        requiredSkillWeight: 0.5,
        experienceWeight: 0.25,
        educationWeight: 0.1,
        keywordWeight: 0.15,
        mustHaveSkills: ["Node.js", "MongoDB"],
        allowAiAutoRecommendation: true,
      },
    },
  ]);

  const frontendJob = jobs[0];

  const candidates = await Candidate.insertMany([
    buildCandidatePayload({
      jobId: frontendJob._id,
      fullName: "Linh Nguyen",
      email: demoCandidateEmails[0],
      phone: "+84 912 345 678",
      location: "Ho Chi Minh City, Vietnam",
      currentTitle: "Frontend Developer",
      currentCompany: "Acme UI Studio",
      summary: "Frontend developer with strong React and TypeScript experience building dashboards.",
      totalYearsExperience: 4,
      tags: ["react", "dashboard"],
      skills: ["React", "TypeScript", "HTML", "CSS", "Jest"],
      softSkills: ["Communication", "Ownership"],
    }),
    buildCandidatePayload({
      jobId: frontendJob._id,
      fullName: "Minh Tran",
      email: demoCandidateEmails[1],
      phone: "+84 938 111 222",
      location: "Da Nang, Vietnam",
      currentTitle: "Full Stack Developer",
      currentCompany: "Beta Product Lab",
      summary: "Full stack developer with React, Node.js, and testing experience.",
      totalYearsExperience: 3,
      tags: ["fullstack"],
      skills: ["React", "JavaScript", "Node.js", "MongoDB"],
      softSkills: ["Problem Solving", "Teamwork"],
    }),
    buildCandidatePayload({
      jobId: frontendJob._id,
      fullName: "Anh Pham",
      email: demoCandidateEmails[2],
      phone: "+84 909 333 444",
      location: "Ha Noi, Vietnam",
      currentTitle: "UI Designer",
      currentCompany: "Pixel House",
      summary: "Designer transitioning into frontend with strong HTML, CSS, and Figma foundations.",
      totalYearsExperience: 2,
      tags: ["design"],
      skills: ["HTML", "CSS", "Figma"],
      softSkills: ["Collaboration", "Adaptability"],
    }),
  ]);

  const resumeFiles = await ResumeFile.insertMany(
    candidates.map((candidate, index) => ({
      candidateId: candidate._id,
      jobId: frontendJob._id,
      originalFileName: `${candidate.fullName.replace(/\s+/g, "_")}_Resume.pdf`,
      mimeType: "application/pdf",
      sizeBytes: 140000 + index * 24000,
      pageCount: 2,
      storage: {
        provider: "cloudinary",
        pathOrKey: `${demoResumesFolder}/${candidate._id}`,
        url: `https://res.cloudinary.com/demo/raw/upload/${demoResumesFolder}/${candidate._id}.pdf`,
        bucket: "demo",
      },
      uploadStatus: "uploaded",
      extractedText: `${candidate.summary} Skills: ${(candidate.skills?.hard || [])
        .map((skill) => skill.name)
        .join(", ")}`,
      extractedTextPreview: candidate.summary,
      parseStatus: "parsed",
      parseAttempts: 1,
      parsedAt: new Date(),
      uploadedBy: recruiter._id,
    }))
  );

  await Promise.all(
    candidates.map((candidate, index) =>
      Candidate.updateOne(
        { _id: candidate._id },
        {
          $set: {
            latestResumeFileId: resumeFiles[index]._id,
            "source.jobId": frontendJob._id,
          },
        }
      )
    )
  );

  const screeningRun = await ScreeningRun.create({
    jobId: frontendJob._id,
    createdBy: recruiter._id,
    runType: "initial",
    triggeredBy: "manual",
    status: "completed",
    startedAt: new Date(),
    finishedAt: new Date(),
    input: {
      resumeFileIds: resumeFiles.map((resumeFile) => resumeFile._id),
      candidateIds: candidates.map((candidate) => candidate._id),
    },
    filters: {
      minYearsExperience: 2,
      mustIncludeSkills: ["React", "TypeScript"],
      includeStatuses: [],
    },
    aiProvider: "rule_based",
    configSnapshot: {
      jdVersion: "seed-demo-v1",
      autoRejectBelowScore: 45,
      shortlistAboveScore: 82,
      requiredSkillWeight: 0.45,
      experienceWeight: 0.25,
      educationWeight: 0.1,
      keywordWeight: 0.2,
    },
    totals: {
      total: 3,
      processed: 3,
      failed: 0,
    },
    queueMeta: {
      batchSize: 20,
      currentBatch: 1,
      totalBatches: 1,
    },
  });

  const screeningResults = await ScreeningResult.insertMany([
    {
      screeningRunId: screeningRun._id,
      jobId: frontendJob._id,
      candidateId: candidates[0]._id,
      resumeFileId: resumeFiles[0]._id,
      matchingScore: 91,
      rankingPosition: 1,
      scoreBreakdown: {
        requiredSkills: 96,
        optionalSkills: 80,
        experience: 88,
        education: 80,
        keywordContext: 90,
      },
      fitScores: {
        technical: 93,
        cultural: 86,
      },
      statusBadge: "strong_fit",
      recommendation: "must_interview",
      matchedSkills: ["React", "TypeScript", "HTML", "CSS"],
      missingSkills: [],
      optionalSkills: ["Jest"],
      strengths: ["Strong dashboard experience", "Good React depth"],
      gaps: [],
      redFlags: [],
      aiSummary: "Strong fit for the frontend role with direct React and TypeScript overlap.",
      explanation: "Candidate has the clearest overlap with must-have frontend skills and relevant product experience.",
      confidenceScore: 0.92,
      isLatestForJobCandidate: true,
    },
    {
      screeningRunId: screeningRun._id,
      jobId: frontendJob._id,
      candidateId: candidates[1]._id,
      resumeFileId: resumeFiles[1]._id,
      matchingScore: 78,
      rankingPosition: 2,
      scoreBreakdown: {
        requiredSkills: 75,
        optionalSkills: 60,
        experience: 74,
        education: 80,
        keywordContext: 72,
      },
      fitScores: {
        technical: 78,
        cultural: 80,
      },
      statusBadge: "potential",
      recommendation: "interview",
      matchedSkills: ["React"],
      missingSkills: ["TypeScript"],
      optionalSkills: [],
      strengths: ["Broader full-stack context"],
      gaps: ["TypeScript depth not explicit"],
      redFlags: [],
      aiSummary: "Potential fit with relevant frontend exposure but weaker TypeScript evidence.",
      explanation: "Candidate is strong enough to consider for interview, but skill alignment is less direct than the top candidate.",
      confidenceScore: 0.79,
      isLatestForJobCandidate: true,
    },
    {
      screeningRunId: screeningRun._id,
      jobId: frontendJob._id,
      candidateId: candidates[2]._id,
      resumeFileId: resumeFiles[2]._id,
      matchingScore: 54,
      rankingPosition: 3,
      scoreBreakdown: {
        requiredSkills: 50,
        optionalSkills: 30,
        experience: 62,
        education: 70,
        keywordContext: 48,
      },
      fitScores: {
        technical: 52,
        cultural: 71,
      },
      statusBadge: "potential",
      recommendation: "hold",
      matchedSkills: ["HTML", "CSS"],
      missingSkills: ["React", "TypeScript"],
      optionalSkills: ["Figma"],
      strengths: ["Strong design sense"],
      gaps: ["Missing React production experience"],
      redFlags: [],
      aiSummary: "Candidate shows adjacent UI skills but limited direct React alignment.",
      explanation: "This profile is useful as a contrast candidate in demos but not a strong shortlist.",
      confidenceScore: 0.63,
      isLatestForJobCandidate: true,
    },
  ]);

  await Candidate.updateMany(
    { _id: { $in: candidates.map((candidate) => candidate._id) } },
    { $set: { lastScreenedAt: new Date() } }
  );

  await CandidateAction.insertMany([
    {
      jobId: frontendJob._id,
      candidateId: candidates[0]._id,
      actedBy: recruiter._id,
      actionType: "shortlisted",
      note: "Strong match for the first HR interview batch.",
      sourceScreeningResultId: screeningResults[0]._id,
    },
    {
      jobId: frontendJob._id,
      candidateId: candidates[1]._id,
      actedBy: recruiter._id,
      actionType: "notes",
      note: "Good backup candidate if the shortlist is expanded.",
      sourceScreeningResultId: screeningResults[1]._id,
    },
  ]);

  await AuditLog.insertMany([
    {
      actorId: recruiter._id,
      actorEmail: recruiter.email,
      entityType: "ResumeFile",
      entityId: resumeFiles[0]._id,
      action: "resume_uploaded",
      module: "resume_upload",
      severity: "info",
      metadata: {
        originalFileName: resumeFiles[0].originalFileName,
        jobId: frontendJob._id,
      },
    },
    {
      actorId: recruiter._id,
      actorEmail: recruiter.email,
      entityType: "ScreeningRun",
      entityId: screeningRun._id,
      action: "screening_run_started",
      module: "screening",
      severity: "info",
      metadata: {
        jobId: frontendJob._id,
        totalCandidates: 3,
      },
    },
    {
      actorId: recruiter._id,
      actorEmail: recruiter.email,
      entityType: "CandidateAction",
      entityId: screeningResults[0]._id,
      action: "shortlisted",
      module: "candidate_workflow",
      severity: "info",
      metadata: {
        candidateId: candidates[0]._id,
        jobId: frontendJob._id,
        note: "Seed shortlist action",
      },
    },
  ]);

  await Job.updateOne(
    { _id: frontendJob._id },
    {
      $set: {
        "stats.totalApplicants": 3,
        "stats.screenedCount": 3,
        "stats.shortlistedCount": 1,
        "stats.rejectedCount": 0,
      },
    }
  );

  return {
    recruiter,
    jobs,
    candidates,
    screeningRun,
  };
};

const clearPreviousDemoData = async () => {
  const recruiter = await User.findOne({ email: demoRecruiterEmail }).select("_id");
  const demoJobs = await Job.find({ jobCode: { $in: ["DEMO-FE-001", "DEMO-BE-001"] } }).select("_id");
  const demoJobIds = demoJobs.map((job) => job._id);
  const demoCandidates = await Candidate.find({ email: { $in: demoCandidateEmails } }).select("_id");
  const demoCandidateIds = demoCandidates.map((candidate) => candidate._id);
  const demoRuns = await ScreeningRun.find({ jobId: { $in: demoJobIds } }).select("_id");
  const demoRunIds = demoRuns.map((run) => run._id);

  await Promise.all([
    AuditLog.deleteMany({
      $or: [
        { actorEmail: demoRecruiterEmail },
        { entityId: { $in: [...demoRunIds, ...demoCandidateIds] } },
      ],
    }),
    CandidateAction.deleteMany({
      $or: [
        { actedBy: recruiter?._id || null },
        { jobId: { $in: demoJobIds } },
        { candidateId: { $in: demoCandidateIds } },
      ],
    }),
    ScreeningResult.deleteMany({
      $or: [{ jobId: { $in: demoJobIds } }, { candidateId: { $in: demoCandidateIds } }],
    }),
    ScreeningRun.deleteMany({
      $or: [{ jobId: { $in: demoJobIds } }, { createdBy: recruiter?._id || null }],
    }),
    ResumeFile.deleteMany({
      $or: [{ jobId: { $in: demoJobIds } }, { candidateId: { $in: demoCandidateIds } }],
    }),
    Candidate.deleteMany({ email: { $in: demoCandidateEmails } }),
    Job.deleteMany({ jobCode: { $in: ["DEMO-FE-001", "DEMO-BE-001"] } }),
  ]);

  if (recruiter) {
    await User.updateOne(
      { _id: recruiter._id },
      {
        $set: {
          refreshToken: null,
        },
      }
    );
  }
};

const run = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is required to seed demo data");
    }

    await connectDB();
    await clearPreviousDemoData();
    const result = await createDemoData();

    console.log("Demo seed completed");
    console.log(`Recruiter: ${result.recruiter.email}`);
    console.log(`Jobs: ${result.jobs.length}`);
    console.log(`Candidates: ${result.candidates.length}`);
    console.log(`Screening run: ${result.screeningRun._id}`);
  } catch (error) {
    console.error("Demo seed failed", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
