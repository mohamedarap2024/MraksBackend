# Vercel environment variables — MraksBackend

## Ma import-garee `.env` file-ka tooska ah

Vercel **ma akhrinayo** `.env` GitHub-ka (waa la xidhay security darteed).  
Markaad **Import .env** isticmaasho, waxyaabahan ayaa inta badan qaldan:

| Qalad | Sax |
|-------|-----|
| `ADMIN_TOKEN=admin-secret-token` | Token **32+ xaraf** random |
| `STUDENT_TOKEN=student-secret-token` | Token kale oo dheer |
| `CORS_ORIGIN=http://localhost:3000` | URL-ka **Result** Vercel |
| `DATABASE_URL` leh `channel_binding=require` | Ka saar `&channel_binding=require` |
| Qiimaha leh quotes `"..."` | Vercel: qiime **aan** quotes lahayn |

---

## Ku dar gacanta (Production + Preview)

1. Vercel → **mraks-backend** → **Settings** → **Environment Variables**

2. Mid mid ku dar:

```
DATABASE_URL
postgresql://USER:PASSWORD@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
```

```
ADMIN_USERNAME
Studentportal
```

```
ADMIN_EMAIL
Studentportal@gmail.com
```

```
ADMIN_PASSWORD
(your strong password)
```

```
ADMIN_TOKEN
(run: npm run secrets:generate — paste 64-char hex)
```

```
STUDENT_TOKEN
(second line from secrets:generate)
```

```
CORS_ORIGIN
https://YOUR-RESULT-APP.vercel.app
```

```
CORS_ALLOW_VERCEL
true
```

3. **Deployments** → ugu dambeeyay → **⋯** → **Redeploy**

---

## Tijaabo

Fur: `https://mraks-backend.vercel.app/api/health`

Wanaagsan:
```json
{ "status": "ok", "database": "connected" }
```

Qalad tokens:
```json
{ "error": "ADMIN_TOKEN must be a long random secret..." }
```
→ `npm run secrets:generate` oo Vercel ku cusbooneysii.
