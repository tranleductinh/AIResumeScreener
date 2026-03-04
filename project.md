You are an experienced backend engineer and system designer.

Design and implement the core functionality of a project called “AI Resume Screener”.

Project purpose:
The system helps HR teams quickly screen and rank a large number of resumes by comparing them against a Job Description (JD) using AI.

Focus only on application features and workflows. Ignore database design and schema details.

Main user roles:
- HR / Recruiter (primary user)
- Admin (optional, advanced)

Core functional modules:

1) Job Management
- Create, update, view, and close job positions.
- Input raw Job Description text.
- Analyze Job Description using AI to extract:
  - Required skills
  - Nice-to-have skills
  - Required experience level
  - Keywords and role summary
- Store and reuse analyzed JD for screening.

2) Resume Upload & File Handling
- Upload multiple resumes at once (PDF, DOCX).
- Validate file type and size.
- Support switching storage between local storage (development) and cloud storage (production).
- Track upload status and basic file metadata.
- Allow HR to download or preview uploaded resumes securely.

3) Resume Parsing
- Automatically extract text content from uploaded resumes.
- Normalize extracted text for further processing.
- Handle parsing failures and allow retry.
- Generate a short preview of extracted content for quick review.

4) Candidate Profile Generation
- Automatically derive candidate profiles from parsed resumes:
  - Name, email, phone
  - Skills (hard and soft)
  - Work experience summary
  - Education and certifications
- Allow HR to edit or enrich extracted candidate information manually.

5) AI Screening & Matching
- Compare resumes or candidate profiles with a selected Job Description.
- Use an AI model to generate:
  - Overall matching score (0–100)
  - Matched skills
  - Missing or weak skills
  - Short natural-language explanation of the score
- Group candidates into categories:
  - Strong fit
  - Potential
  - Not suitable

6) Screening Runs Management
- Allow HR to start a screening run for a job.
- Process resumes in batches.
- Track screening status:
  - Queued
  - Running
  - Completed
  - Failed
- Allow re-running screening with updated JD or resumes.

7) Candidate Ranking & Filtering
- Rank candidates automatically by matching score.
- Provide filtering and sorting by:
  - Score range
  - Skills
  - Experience level
  - Screening status
- Support pagination for large candidate lists.

8) HR Actions & Hiring Workflow
- Allow HR to perform actions on candidates:
  - Shortlist
  - Reject
  - Add notes
  - Tag candidates
  - Move candidates through hiring stages
- Keep a clear separation between AI recommendations and human decisions.

9) Dashboard & Analytics (functional view)
- Show high-level metrics:
  - Number of resumes processed
  - Number of shortlisted candidates
  - Average matching score
  - Estimated time saved by AI
- Show recent activity (uploads, screenings).

10) System & UX Utilities
- Clear loading and progress states (e.g., “AI is analyzing resumes…”).
- Empty states with guidance for first-time users.
- Basic audit trail for important actions (upload, screening, shortlist).
- Consistent error handling and user-friendly error messages.

Design principles:
- AI acts as an assistant, not a decision-maker.
- Human HR users always have final control.
- System should be modular so AI providers and storage can be swapped later.

Output expectation:
- Provide clear service/module separation.
- Implement features in a way that they can be extended later with authentication, role-based access, and advanced analytics.

---

## Backend Implementation Tasks (From Basic to Advanced)

1. User basic auth/profile CRUD
- `POST /auth/register`, `POST /auth/login`, `GET /me`, `PATCH /me`
- Fields: `email`, `password`, `fullName`, `role`

2. Job CRUD (core)
- `POST /jobs`, `GET /jobs`, `GET /jobs/:id`, `PATCH /jobs/:id`, `DELETE /jobs/:id`
- Fields: `title`, `jdText`, `department`, `status`

3. Candidate CRUD (manual profile)
- `POST /candidates`, `GET /candidates`, `GET /candidates/:id`, `PATCH /candidates/:id`, `DELETE /candidates/:id`
- Support editing profile fields from Candidate Profile UI

4. ResumeFile CRUD + upload
- `POST /resume-files/upload` (single/multiple), `GET /resume-files`, `GET /resume-files/:id`, `DELETE /resume-files/:id`
- Track `uploadStatus` and file metadata

5. Data relationship validation
- Candidate <-> ResumeFile
- Job <-> ResumeFile
- Job <-> Candidate (through screening)
- Add reference and ID validation

6. ScreeningRun workflow CRUD
- `POST /screening-runs` (start), `GET /screening-runs`, `GET /screening-runs/:id`, `PATCH /screening-runs/:id/status`
- Status: `queued`, `running`, `completed`, `failed`

7. ScreeningResult CRUD by run
- `POST /screening-results/bulk`, `GET /jobs/:jobId/results`, `GET /screening-runs/:id/results`
- Fields: `matchingScore`, `statusBadge`, `rankingPosition`

8. Ranking and filtering API
- Query params: `scoreMin`, `scoreMax`, `skills`, `experienceMin`, `status`, `page`, `limit`, `sort`
- Fit Candidate Ranking UI

9. CandidateAction CRUD (HR workflow)
- Action types: `shortlisted`, `rejected`, `notes`, `tags`, `move_stage`, `schedule_interview`
- `POST /candidate-actions`, `GET /jobs/:jobId/actions`

10. AuditLog for key operations
- Auto log on upload, start screening, shortlist/reject
- `GET /audit-logs`

11. Dashboard aggregation APIs
- `GET /dashboard/summary`
- `GET /dashboard/recent-activity` (from audit logs)

12. AI JD parsing (advanced)
- `POST /jobs/:id/analyze-jd`
- Fill `jdParsed` + screening config suggestions

13. Resume parsing pipeline (advanced)
- `POST /resume-files/:id/parse`
- Retry parsing for failed files, generate text preview

14. AI matching pipeline (most advanced)
- On start screening run: compare candidate/resume with JD
- Save `screening_results`, rank candidates, update run progress

15. Hardening and quality
- Validation schemas for requests
- Consistent error response format
- Pagination and sorting standards
- Index optimization
- Integration tests for critical flows
