# Deploy STD Marks — GitHub + Vercel (2 repos)

**Somali summary:** Backend hal repo + Vercel, Frontend hal repo + Vercel. Labaduba waa in ay isku xiraan env vars (`NEXT_PUBLIC_API_URL` iyo `CORS_ORIGIN`). Database waa Neon PostgreSQL.

---

## Architecture

```
┌─────────────────────────┐         HTTPS          ┌─────────────────────────┐
│  Frontend (Vercel)      │  ───────────────────►  │  Backend (Vercel)       │
│  stdmarks-frontend      │   NEXT_PUBLIC_API_URL  │  stdmarks-backend       │
│  Next.js UI             │                        │  Next.js API /api/*     │
└─────────────────────────┘                        └───────────┬─────────────┘
                                                               │
                                                               ▼
                                                   ┌─────────────────────────┐
                                                   │  Neon PostgreSQL        │
                                                   │  (pooled connection)    │
                                                   └─────────────────────────┘
```

---

## Step 0 — Neon database

1. Create a project at [neon.tech](https://neon.tech).
2. Copy the **pooled** connection string (`-pooler` in hostname).
3. Keep it secret — only set on **backend** Vercel project.

---

## Step 1 — Backend repo + Vercel

### GitHub

1. Create repo: `stdmarks-backend` (empty).
2. Copy **only** the `backend/` folder contents to the repo root:

   ```
   stdmarks-backend/
   ├── package.json
   ├── src/
   ├── scripts/
   ├── .env.example
   └── vercel.json
   ```

3. Commit and push. Do **not** commit `.env`.

### Generate secrets (local)

```bash
cd backend
npm install
npm run secrets:generate
```

Copy `ADMIN_TOKEN` and `STUDENT_TOKEN` output.

### Vercel — backend project

1. [vercel.com](https://vercel.com) → **Add New Project** → import `stdmarks-backend`.
2. Framework: **Next.js** (auto).
3. **Environment Variables** (Production + Preview):

| Variable | Example / notes |
|----------|-----------------|
| `DATABASE_URL` | Neon **pooled** URL with `?sslmode=require` |
| `ADMIN_USERNAME` | `Studentportal` |
| `ADMIN_EMAIL` | your email |
| `ADMIN_PASSWORD` | strong password |
| `ADMIN_TOKEN` | from `secrets:generate` (32+ chars) |
| `STUDENT_TOKEN` | from `secrets:generate` (32+ chars) |
| `CORS_ORIGIN` | `https://YOUR-FRONTEND.vercel.app` (no trailing `/`) |
| `CORS_ALLOW_VERCEL` | `true` (optional, for preview URLs) |

4. Deploy. Note the URL, e.g. `https://stdmarks-backend.vercel.app`.

### Initialize database

**Option A — from your PC (recommended once):**

```bash
cd backend
# Create .env with production DATABASE_URL + admin vars
npm run db:setup
```

**Option B — hit health after deploy:**

Open `https://YOUR-BACKEND.vercel.app/api/health`  
Should return `"status":"ok"` and `"database":"connected"`.

---

## Step 2 — Frontend repo + Vercel

### GitHub

1. Create repo: `stdmarks-frontend` (empty).
2. Copy **only** the `frontend/` folder to repo root.
3. Commit `.env.example`, not `.env.local`.

### Vercel — frontend project

1. Import `stdmarks-frontend`.
2. Environment variable:

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_API_URL` | `https://YOUR-BACKEND.vercel.app/api` |

3. **Redeploy** after setting env (required for Next.js public vars).

---

## Step 3 — Connect frontend ↔ backend

1. Copy **frontend** production URL from Vercel.
2. Backend Vercel → **Settings → Environment Variables** → set:

   ```
   CORS_ORIGIN=https://YOUR-FRONTEND.vercel.app
   ```

3. **Redeploy backend** so CORS picks up the new origin.

4. Test:
   - `https://YOUR-BACKEND.vercel.app/api/health`
   - Open frontend → search a student ID
   - Admin login at `/admin/login`

---

## Checklist

- [ ] Backend deploys without error
- [ ] `/api/health` → `"status":"ok"`
- [ ] `NEXT_PUBLIC_API_URL` ends with `/api`
- [ ] `CORS_ORIGIN` matches frontend URL exactly (https, no trailing slash)
- [ ] Tokens are long random strings (not `change-me`)
- [ ] Neon uses **pooler** connection string
- [ ] Admin password changed from default for production

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| CORS error in browser | Update `CORS_ORIGIN` on backend; redeploy backend |
| API calls go to localhost | Set `NEXT_PUBLIC_API_URL` on frontend; **redeploy** frontend |
| `503` on health | Check `DATABASE_URL`, Neon IP allow, pooler URL |
| Login works locally, not prod | Run `db:setup` with prod `DATABASE_URL`; check admin env vars |
| `ADMIN_TOKEN` / weak token error | Run `npm run secrets:generate`; update Vercel env |

---

## Local development (unchanged)

```bash
# Terminal 1
cd backend && npm run dev    # :5228

# Terminal 2
cd frontend && npm run dev   # :3000
```

`frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:5228/api
```

`backend/.env`:

```
CORS_ORIGIN=http://localhost:3000
```
