# AI Resume Screener

AI Resume Screener is a full-stack recruiting workflow demo for HR teams. The project covers job creation, resume upload, resume parsing, AI-assisted screening, candidate ranking, HR actions, audit logs, and dashboard reporting.

## Stack

- Frontend: React, Vite, Tailwind, shadcn/ui, React Router
- Backend: Express, MongoDB, Mongoose
- Auth: Firebase Google Sign-In
- File storage: Cloudinary
- AI providers: Rule-based fallback, OpenAI, Gemini

## Main Demo Flow

1. Sign in with Google
2. Create or select a job
3. Upload resumes to the selected job
4. Parse resumes
5. Start a screening run
6. Review screening results and rankings
7. Shortlist or reject candidates
8. Review dashboard and audit logs

## Project Structure

```text
Backend/
  src/
    app.js
    server.js
    controllers/
    services/
    routes/
    models/
    middlewares/
    validations/
    utils/
  scripts/seed-demo.js
  tests/
Frontend/
  src/
    pages/
    components/
    services/api/
```

## Environment

Use [Backend/.env.example](E:/thao/AIResumeScreener/Backend/.env.example) as the template. Important groups:

- MongoDB: `MONGO_URI`
- JWT: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- Cookies: `COOKIE_SECURE`, `COOKIE_SAMESITE`
- Firebase Admin: `GOOGLE_*`
- Cloudinary: `CLOUDINARY_*`
- AI providers: `AI_JD_PROVIDER`, `AI_MATCH_PROVIDER`, `OPENAI_*`, `GEMINI_*`

Frontend should point to the backend with `VITE_API_URL`.

## Run Locally

### Backend

```bash
cd Backend
npm install
npm run dev
```

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

## Demo Seed

To create demo data for the dashboard, ranking page, and upload page:

```bash
cd Backend
npm run seed:demo
```

The seed creates:

- 1 demo recruiter
- 2 demo jobs
- 3 demo candidates
- 3 parsed resume records
- 1 completed screening run
- ranked screening results
- audit logs and HR actions

## Test

Backend integration tests use `vitest`, `supertest`, and `mongodb-memory-server`.

```bash
cd Backend
npm test
```

Covered flows:

- auth validation and refresh-token failure path
- jobs CRUD basics
- candidates CRUD basics
- screening run creation and result generation

## Backend API Notes

The API now uses a consistent response format:

```json
{
  "success": true,
  "message": "Get jobs successfully",
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "totalPages": 1
    }
  },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "totalPages": 1
    }
  }
}
```

Validation is applied to the main write endpoints and paginated list endpoints.

## CV-Friendly Highlights

- Full CRUD for jobs and candidates
- Resume upload, parsing, and AI-assisted screening
- Ranking and filtering APIs
- HR workflow actions: shortlist, reject, note, move stage
- Audit logs and dashboard metrics
- Integration tests for core backend flows

## Current Scope

This version is intentionally scoped for an intern portfolio / CV project:

- strong enough for demo and code review
- not intended as a production-grade queueing or worker architecture
- no BullMQ/Redis requirement
