# MraksBackend

Next.js API for the **SJEC Student Result Portal** (STD Marks). Deploy on Vercel with Neon PostgreSQL.

## Local dev

```bash
npm install
cp .env.example .env   # then edit DATABASE_URL and secrets
npm run db:check
npm run db:setup       # once
npm run dev            # http://localhost:5228
```

Health: http://localhost:5228/api/health

## Deploy (Vercel + GitHub)

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for full steps (Neon, env vars, CORS, frontend URL).

Required Vercel env:

- `DATABASE_URL` — Neon **pooled** URL
- `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- `ADMIN_TOKEN`, `STUDENT_TOKEN` — run `npm run secrets:generate`
- `CORS_ORIGIN` — your frontend URL, e.g. `https://your-app.vercel.app`
- `CORS_ALLOW_VERCEL` — `true` (optional)

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Dev server port 5228 |
| `npm run build` | Production build |
| `npm run db:setup` | Create tables + admin user |
| `npm run db:check` | Test DB connection |
| `npm run secrets:generate` | Random API tokens |

## API routes

| Route | Auth |
|-------|------|
| `GET /api/health` | Public |
| `POST /api/admin/login` | Public |
| `GET/POST /api/admin/students` | Admin Bearer |
| `POST /api/admin/students/csv` | Admin Bearer |
| `GET /api/students/search/:id` | Public |
| `POST /api/students/login` | Public |
