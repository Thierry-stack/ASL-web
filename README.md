# Sign Language LMS

**Next.js** (App Router) for UI **and** API (`src/app/api/*`), **PostgreSQL** (Supabase) via **Prisma** (`frontend/prisma`), **JWT** auth, **Flutterwave** payments, **Chatling** widget. Deploy the **`frontend`** folder on **Vercel** (free tier).

The legacy **`backend/`** Express app is optional; the live API is in Next.js Route Handlers.

---

## Quick start

```bash
cd sign-language-web
npm install --prefix frontend
```

Copy **`frontend/.env.example`** → **`frontend/.env.local`**. Set at least:

- `DATABASE_URL`, `DIRECT_URL` (Supabase pooler URIs)
- `JWT_SECRET`
- `PUBLIC_APP_URL` / `NEXT_PUBLIC_APP_URL` (e.g. `http://localhost:3000` locally)
- Flutterwave keys if you use payments
- Leave **`NEXT_PUBLIC_API_URL` empty** so the browser calls `/api` on the same origin.

```bash
cd frontend
npm run db:push
npm run dev
```

Open **http://localhost:3000** — API: **http://localhost:3000/api/health** and **http://localhost:3000/api/health/db**.

Root scripts: `npm run dev`, `npm run build`, `npm run db:push` (all run inside `frontend/`).

---

## Vercel

1. Import the repo; set **Root Directory** to **`frontend`**.
2. Commit **`frontend/package-lock.json`** so installs match local Prisma **6.x** (Prisma 7 removed `directUrl` from `schema.prisma` until you migrate to `prisma.config.ts`).
3. Add the same env vars as `.env.local` (Supabase URLs, `JWT_SECRET`, Flutterwave, `NEXT_PUBLIC_APP_URL` = your Vercel URL, `PUBLIC_APP_URL` = same).
4. Webhook URL for Flutterwave: `https://<your-domain>/api/webhooks/flutterwave`.

---

## Repo layout

| Path | Role |
|------|------|
| `frontend/` | Next.js app + Prisma + all `/api` routes |
| `frontend/prisma/schema.prisma` | Database schema |
| `backend/` | Legacy Express (not required for Vercel deploy) |

---

## License

Private / internal unless you add an open-source license.
