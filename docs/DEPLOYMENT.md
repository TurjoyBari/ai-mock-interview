# Production Deployment Checklist

Use this after deploying the fixed `vercel.json` / Next.js build.

## 1. Confirm env vars on Vercel

Project → Settings → Environment Variables (Production + Preview):

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | Neon **pooled** URL (`-pooler`) + `sslmode=require` |
| `NEXT_PUBLIC_APP_URL` | Exact production URL, e.g. `https://ai-mock-interview-rust-one.vercel.app` (no trailing slash, **not** localhost) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Prefer `pk_live_` in production |
| `CLERK_SECRET_KEY` | Prefer `sk_live_` in production |
| `GEMINI_API_KEY` | Required |
| `UPLOADTHING_TOKEN` | Required |
| `UPLOADTHING_SECRET` | Required |
| `UPLOADTHING_APP_ID` | Required |
| `UPSTASH_REDIS_REST_URL` | Optional |
| `UPSTASH_REDIS_REST_TOKEN` | Optional |
| `CLERK_WEBHOOK_SECRET` | Optional but needed for user sync webhooks |

## 2. Clerk Dashboard

- Add production domain to **Allowed Origins** / **Domains**
- Redirect URLs: `/sign-in`, `/sign-up`, `/dashboard`
- Webhook (optional): `https://YOUR_DOMAIN/api/webhooks/clerk`

## 3. UploadThing Dashboard

- Set app URL / callback to your Vercel domain
- Confirm token matches Vercel env

## 4. Deploy

```bash
cd ai-mock-interview
npm run build
vercel --prod
```

Build should take **1–3+ minutes** (not ~6 seconds). A 6s deploy means Next.js never built.

## 5. Smoke test

1. Open production URL → landing loads
2. Sign up / sign in
3. Create interview
4. Upload resume
5. Job match
6. Dashboard loads
