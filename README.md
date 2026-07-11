# AI Mock Interview

> An AI-powered mock interview platform that helps software engineers prepare for real technical, behavioral, HR, and coding interviews — with voice conversations, ATS resume analysis, and detailed feedback.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](./LICENSE)

---

## Introduction

**AI Mock Interview** is a full interview preparation platform — not just a question generator.

It combines adaptive AI interviews, voice conversations, coding practice, ATS resume scoring, and performance analytics into one product so candidates can practice the way real interviews work: think, speak, code, iterate, and improve.

Built for software engineers targeting FAANG-style and startup interviews.

---

## Features

### AI Interview

| Feature | Description |
|--------|-------------|
| Technical Interviews | Role-aware technical questions with depth and follow-ups |
| HR Interviews | Soft-skill and motivation-focused sessions |
| Behavioral Interviews | STAR-style behavioral practice |
| Coding Interviews | Problem solving with AI review |
| Custom Interviews | Configure role, company, difficulty, and stack |
| Topic-Based Interviews | Select topics, difficulty, and question counts |
| AI Follow-up Questions | Adaptive probing based on your answers |
| AI Evaluation | Per-answer scoring and coaching |
| AI Feedback | Strengths, weaknesses, and action items |
| Interview Reports | End-to-end session reports with topic performance |

### Voice Interview

- Speech-to-Text answer capture
- Text-to-Speech interviewer prompts
- AI voice questions
- Voice answers with continuous conversation flow
- Text-mode fallback when voice is unavailable

### Resume Module

- PDF / DOCX resume upload
- ATS resume score (0–100) with score breakdown
- Parsed resume preview (skills, experience, projects, education)
- Section-by-section feedback and keyword analysis
- Improvement suggestions with ATS rationale
- Resume vs Job Description match
- AI rewrite suggestions (truthful, no invented experience)
- Downloadable ATS report

### Coding Practice

- Coding questions in a Monaco-powered editor
- AI code review and feedback
- Complexity / approach analysis
- Alternative solution guidance

### Dashboard

- Interview history
- Resume history and primary resume management
- Performance analytics and charts
- Progress tracking
- Topic-wise performance
- Detailed interview reports

### Authentication

- Clerk authentication
- Secure sign-in / sign-up
- User profile and settings

---

## Screenshots

> Replace the placeholders below with real captures in `docs/screenshots/`.

| Screen | Preview |
|--------|---------|
| Landing Page | ![Landing Page](docs/screenshots/landing.png) |
| Dashboard | ![Dashboard](docs/screenshots/dashboard.png) |
| Interview Page | ![Interview Page](docs/screenshots/interview.png) |
| Voice Interview | ![Voice Interview](docs/screenshots/voice-interview.png) |
| Resume Analyzer | ![Resume Analyzer](docs/screenshots/resume-analyzer.png) |
| ATS Report | ![ATS Report](docs/screenshots/ats-report.png) |
| Interview Report | ![Interview Report](docs/screenshots/interview-report.png) |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS, shadcn/ui |
| **Backend** | Next.js App Router, Server Actions, Route Handlers |
| **ORM** | Prisma 7 |
| **Database** | PostgreSQL (Neon recommended) |
| **Auth** | Clerk |
| **AI** | Google Gemini (`gemini-2.5-flash`, TTS model) |
| **Storage** | UploadThing |
| **Rate Limiting** | Upstash Redis |
| **Charts / Editor** | Recharts, Monaco Editor |
| **Deployment** | Vercel |

---

## Project Structure

```text
ai-mock-interview/
├── prisma/
│   └── schema.prisma          # Database schema
├── public/                    # Static assets
├── docs/
│   └── screenshots/           # README screenshots
├── src/
│   ├── app/
│   │   ├── (dashboard)/       # Authenticated app routes
│   │   │   ├── dashboard/
│   │   │   ├── interviews/
│   │   │   ├── interview-session/
│   │   │   ├── resume/
│   │   │   ├── job-match/
│   │   │   ├── reports/
│   │   │   └── ...
│   │   ├── api/               # REST / UploadThing / process routes
│   │   ├── sign-in/
│   │   ├── sign-up/
│   │   ├── layout.tsx
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   ├── interview/         # Session, topics, evaluation UI
│   │   ├── resume/            # ATS scores, feedback panels
│   │   ├── coding/
│   │   ├── dashboard/
│   │   ├── charts/
│   │   ├── layout/
│   │   └── ui/                # shadcn/ui primitives
│   ├── lib/
│   │   ├── actions/           # Server Actions
│   │   ├── ai/                # Gemini services, fallbacks, validation
│   │   ├── resume/            # Extract, normalize, report download
│   │   ├── prompts/           # Interview & ATS prompts
│   │   ├── queries/           # Data access
│   │   ├── voice/             # Speech helpers
│   │   └── ...
│   ├── hooks/
│   ├── types/
│   └── middleware.ts          # Clerk middleware
├── .env.example
├── package.json
└── README.md
```

---

## Installation

### Prerequisites

- Node.js **20+**
- npm **10+**
- PostgreSQL database (e.g. [Neon](https://neon.tech))
- Accounts for: Clerk, Google AI Studio (Gemini), UploadThing
- Optional: Upstash Redis (rate limiting)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/ai-mock-interview.git
cd ai-mock-interview
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in the values described in [Environment Variables](#environment-variables).

### 4. Set up the database

```bash
npx prisma generate
npx prisma db push
```

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (`sslmode=require` for Neon) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key |
| `CLERK_WEBHOOK_SECRET` | Recommended | Clerk webhook signing secret |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Yes | Sign-in path (default `/sign-in`) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Yes | Sign-up path (default `/sign-up`) |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Yes | Post sign-in redirect (default `/dashboard`) |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Yes | Post sign-up redirect (default `/dashboard`) |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `GEMINI_MODEL` | Optional | Chat model (default `gemini-2.5-flash`) |
| `GEMINI_TTS_MODEL` | Optional | TTS model for voice interviews |
| `UPLOADTHING_TOKEN` | Yes | UploadThing token (resume uploads) |
| `UPLOADTHING_SECRET` | Yes | UploadThing secret |
| `UPLOADTHING_APP_ID` | Yes | UploadThing app id |
| `UPSTASH_REDIS_REST_URL` | Optional | Upstash Redis URL for rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Optional | Upstash Redis token |
| `NEXT_PUBLIC_APP_URL` | Yes | App base URL (`http://localhost:3000` locally) |

> Never commit real secrets. Use `.env` locally and Vercel Environment Variables in production.

---

## Usage Guide

### Create an interview

1. Sign in and open **Interviews → New**.
2. Choose interview type, role, difficulty, and (optionally) company.
3. For topic-based sessions, select topics and per-topic question counts.
4. Create the interview — questions are generated by Gemini.

### Start a text interview

1. Open an interview and enter the session.
2. Read each question and type your answer.
3. Submit to receive live evaluation / coaching signals.
4. Complete the session to generate a full report.

### Start a voice interview

1. Enable voice mode when creating or starting a session.
2. Allow microphone permissions.
3. Listen to AI questions (TTS) and answer by speaking (STT).
4. Continue the conversation turn by turn until completion.

### Upload & analyze a resume

1. Go to **Resume**.
2. Upload a PDF or DOCX (text-based files work best).
3. Wait for: Upload → Save → Extract → ATS Analysis → Suggestions.
4. Review scores, section feedback, keywords, and improvement tips.

### Resume vs job description

1. Upload a primary resume first.
2. Open **Job Match**.
3. Paste a job description and run analysis.
4. Review match score, missing skills, and section recommendations.

### View reports

1. Open **Reports** (or an interview’s detail page).
2. Review overall score, topic performance, and answer coaching.
3. Download or share insights as needed.

---

## AI Workflow

```text
┌──────────────────┐     ┌────────────────────┐     ┌──────────────────┐
│  User Config     │────▶│  Gemini Generation │────▶│  Session Store   │
│  (type/topics)   │     │  (questions JSON)  │     │  (Prisma)        │
└──────────────────┘     └────────────────────┘     └────────┬─────────┘
                                                             │
                                                             ▼
┌──────────────────┐     ┌────────────────────┐     ┌──────────────────┐
│  Answer / Voice  │────▶│  Evaluation / TTS  │────▶│  Coaching Cards  │
└──────────────────┘     └────────────────────┘     └────────┬─────────┘
                                                             │
                                                             ▼
                                                    ┌──────────────────┐
                                                    │ Feedback Report  │
                                                    └──────────────────┘
```

| Pipeline | How it works |
|----------|----------------|
| **Interview generation** | Config + topic quotas → Gemini JSON questions → quota validation / repair → save |
| **Voice conversation** | STT captures answer → model evaluates → TTS speaks next question |
| **Resume analysis** | UploadThing stores file → extract text (PDF/DOCX) → Gemini ATS JSON → normalize + save |
| **Feedback generation** | Transcript + scores → Gemini report → fallbacks if quota/errors → dashboard charts |

Resilient fallbacks keep the product usable when AI quota or latency issues occur.

---

## Features Roadmap

- [ ] Company-specific interview packs (deeper company signals)
- [ ] Live collaborative coding interviews
- [ ] Expanded AI Career Coach / weekly learning paths
- [ ] Mock interview scheduling & reminders
- [ ] Personalized AI learning paths from weak topics
- [ ] Multi-language interview support
- [ ] Browser OCR for scanned resume PDFs
- [ ] Team / coach dashboards

---

## Deployment

### Deploy on Vercel

1. Push the repository to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Add all environment variables from the table above.
4. Set `NEXT_PUBLIC_APP_URL` to your production domain.
5. Deploy.

```bash
# Or via Vercel CLI
npm i -g vercel
vercel
```

### Post-deploy checklist

- [ ] Clerk production keys + allowed redirect URLs
- [ ] Neon / Postgres connection string
- [ ] Gemini API key with sufficient quota
- [ ] UploadThing production app credentials
- [ ] `npx prisma db push` (or migrate) against production DB
- [ ] Clerk webhook endpoint (if used)

---

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit with a clear message: `git commit -m "feat: add topic performance chart"`
4. Push the branch: `git push origin feature/your-feature`
5. Open a Pull Request

### Guidelines

- Keep PRs focused and small when possible
- Match existing TypeScript / UI patterns
- Do not commit secrets or `.env` files
- Prefer meaningful error handling over silent failures
- Update docs when behavior changes

---

## License

This project is licensed under the **MIT License**.

```text
MIT License

Copyright (c) 2026 AI Mock Interview

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

See [`LICENSE`](./LICENSE) for the full text.

---

## Contact

Built for engineers who want interview practice that feels real.

| | |
|--|--|
| Portfolio | [your-portfolio.com](https://your-portfolio.com) |
| LinkedIn | [linkedin.com/in/your-handle](https://linkedin.com/in/your-handle) |
| GitHub | [github.com/your-username](https://github.com/your-username) |
| Email | `you@example.com` |

---

<div align="center">

**Star this repo if it helps your interview prep.**

Made with Next.js · Gemini · Clerk · Prisma

</div>
