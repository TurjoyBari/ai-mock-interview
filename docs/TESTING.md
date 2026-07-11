# Testing Guide

## Manual Testing Checklist

### Authentication
- [ ] Sign up with email
- [ ] Sign in with Google
- [ ] Sign in with GitHub
- [ ] Sign out and redirect to landing page
- [ ] Protected routes redirect unauthenticated users

### Dashboard
- [ ] Dashboard loads with empty state (new user)
- [ ] Stats update after completing interviews
- [ ] Progress chart renders with data
- [ ] Weak/strong topics display correctly

### Interview Flow
- [ ] Create interview with all configuration options
- [ ] All 18 interview types selectable
- [ ] Company-specific configuration works
- [ ] Custom company name works
- [ ] Text mode: send answers, receive AI responses
- [ ] Voice mode: record audio, transcription works
- [ ] Coding interview: Monaco editor loads
- [ ] Code submission and evaluation works
- [ ] Interview completion generates feedback
- [ ] Per-answer analysis visible on detail page

### Resume Module
- [ ] Upload PDF resume
- [ ] Upload DOCX resume
- [ ] Upload TXT resume
- [ ] ATS score displays
- [ ] Skills, strengths, weaknesses extracted
- [ ] Suggestions generated

### Job Matching
- [ ] Paste job description
- [ ] Match score calculated
- [ ] Keyword analysis (matched/missing)
- [ ] Interview questions generated
- [ ] ATS improvements listed

### Reports
- [ ] Report auto-generated after interview
- [ ] Score breakdown chart renders
- [ ] Transcript with Q&A visible
- [ ] Detailed feedback displayed

### AI Coach
- [ ] Generate weekly plan
- [ ] Topics, projects, coding problems listed
- [ ] Company roadmap generated
- [ ] Weekly schedule displayed

### Notes & Search
- [ ] Create, view notes
- [ ] Global search finds interviews
- [ ] Search finds reports and notes

### Profile & Settings
- [ ] Update target role and experience
- [ ] Select target companies
- [ ] Add preferred tech stack
- [ ] Theme switching (light/dark/system)
- [ ] Voice settings persist

### Responsive & Accessibility
- [ ] Mobile sidebar navigation works
- [ ] All pages responsive on mobile/tablet
- [ ] Keyboard navigation functional
- [ ] Focus states visible

## API Testing

### Using curl

```bash
# Get interview (requires auth cookie)
curl http://localhost:3000/api/interviews/INTERVIEW_ID \
  -H "Cookie: __session=..."

# Search
curl "http://localhost:3000/api/search?q=google" \
  -H "Cookie: __session=..."
```

### Rate Limiting

Verify rate limiting works when Upstash is configured:
- Send 31+ AI requests within 1 minute
- Expect 429 response on 31st request

## Database Testing

```bash
# Open Prisma Studio
npm run db:studio

# Verify tables created
# Check data after operations
```

## Performance Testing

- Lighthouse audit on landing page (target: 90+ performance)
- Dashboard load time < 2s
- Interview session page interactive < 3s
- AI response streaming starts < 2s

## Future Automated Testing

Recommended test stack for future implementation:

```
- Unit tests: Vitest
- Component tests: React Testing Library
- E2E tests: Playwright
- API tests: Vitest + supertest
```

### Example E2E Test (Playwright)

```typescript
test('complete interview flow', async ({ page }) => {
  await page.goto('/sign-in');
  // ... authenticate
  await page.goto('/interviews/new');
  await page.click('text=Technical Interview');
  await page.click('text=Start Interview');
  await page.fill('textarea', 'My answer...');
  await page.click('[aria-label="Send"]');
  // ... verify AI response
});
```

## Known Limitations

- PDF text extraction is basic (regex-based); consider `pdf-parse` for production
- Voice activity detection is browser-native (no custom VAD)
- Code execution is AI-evaluated, not sandboxed execution
- Rate limiting requires Upstash Redis (gracefully disabled without it)
