# Architecture

## Overview

InterviewAI follows a clean architecture pattern with clear separation between presentation, application, domain, and infrastructure layers.

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│  Next.js App Router · React Components · shadcn/ui    │
├─────────────────────────────────────────────────────────┤
│                    Application Layer                     │
│  Server Actions · API Routes · TanStack Query           │
├─────────────────────────────────────────────────────────┤
│                      Domain Layer                        │
│  Types · Validations (Zod) · Business Rules           │
├─────────────────────────────────────────────────────────┤
│                   Infrastructure Layer                   │
│  Prisma · Google Gemini · Clerk · UploadThing · Upstash  │
└─────────────────────────────────────────────────────────┘
```

## Data Flow

### Interview Flow

```
User Config → createInterview() → Generate Questions (Gemini)
     ↓
startInterview() → AI Introduction Message
     ↓
Session Page → User Answer → submitAnswer() → evaluateAnswer() (Gemini)
     ↓
AI Follow-up → getInterviewerResponse() (Gemini)
     ↓
completeInterview() → generateFeedback() → Save Report
```

### Authentication Flow

```
Clerk Middleware → Protect Routes → getOrCreateDbUser()
     ↓
Sync Clerk user → PostgreSQL User record + Settings
```

## Database Schema

Key entities and relationships:

- **User** — Core profile, linked to Clerk via `clerkId`
- **Interview** — Configuration, status, scores, phases
- **Question / Answer** — Q&A pairs with AI analysis
- **Feedback** — Post-interview comprehensive evaluation
- **Report** — Structured report with transcript
- **Resume** — Uploaded files with AI analysis
- **JobDescription / JobMatch** — JD matching results
- **CodingSession** — Code submissions with evaluation
- **CoachPlan** — Weekly AI-generated study plans
- **ProgressSnapshot** — Daily/weekly progress tracking

## AI Prompt Library

Located in `src/lib/prompts/index.ts`:

| Prompt | Purpose |
|--------|---------|
| `interviewerSystemPrompt` | Interviewer personality and behavior |
| `QUESTION_GENERATION_PROMPT` | Generate interview questions |
| `ANSWER_EVALUATION_PROMPT` | Per-answer analysis |
| `FEEDBACK_GENERATION_PROMPT` | Post-interview feedback |
| `RESUME_ANALYSIS_PROMPT` | Resume parsing and ATS scoring |
| `JD_MATCHING_PROMPT` | Resume vs JD comparison |
| `CODING_REVIEW_PROMPT` | Code evaluation |
| `COACH_PLAN_PROMPT` | Weekly study plan generation |

## API Design

### Server Actions (Mutations)
- `createInterview`, `startInterview`, `submitAnswer`, `completeInterview`
- `uploadAndAnalyzeResume`, `createJobMatch`, `submitCode`
- `generateWeeklyCoachPlan`, `createNote`, `updateProfile`, `updateSettings`

### API Routes (Queries & Streaming)
- `GET /api/interviews/[id]` — Interview details
- `POST /api/ai/interviewer` — AI interviewer response
- `POST /api/ai/stream` — Streaming AI responses (SSE)
- `POST /api/ai/transcribe` — Speech-to-text
- `POST /api/ai/tts` — Text-to-speech
- `GET /api/search` — Global search

## Security

- Clerk middleware protects all dashboard routes
- Server-side auth validation on every action/API call
- Rate limiting via Upstash Redis (30 req/min per user)
- Input validation with Zod on all mutations
- No API keys exposed to client

## Performance

- Server Components for data fetching (dashboard, history, reports)
- Client Components only where interactivity is needed
- TanStack Query for client-side caching
- Streaming responses for AI chat
- Lazy-loaded Monaco editor
- Optimistic UI patterns where applicable

## Future Improvements

- WebRTC for real-time voice interviews
- PDF report generation with charts
- Interview recording playback
- Spaced repetition for weak topics
- Integration with LeetCode/HackerRank APIs
- Multi-language interview support
- Custom AI model fine-tuning on past interviews
