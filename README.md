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

1. Import the GitHub repo. **Root Directory:** leave **empty** (repository root). The root **`package.json`** uses **`workspaces: ["frontend"]`**, so **`npm install`** installs all dependencies (not a 0.5s empty install).
2. **Build Command:** default **`npm run build`** (runs `npm run build --prefix frontend`).
3. **Output:** Next.js — Vercel usually auto-detects; if asked, Framework Preset **Next.js**.
4. Deploy the **latest `main`** — older commits may miss Prisma 7 / workspace fixes.
5. **Env vars:** same as `frontend/.env.local` — **`DATABASE_URL`**, **`DIRECT_URL`**, **`JWT_SECRET`**, **`NEXT_PUBLIC_APP_URL`**, **`PUBLIC_APP_URL`**, Flutterwave keys if used.

**Optional:** instead of workspace root, set Root Directory to **`frontend`** and use **`npm run build`** / **`npm run start`** there (you can keep **`frontend/package-lock.json`** in that mode). The current repo is set up for **root** install + build.

Flutterwave webhook: `https://<your-domain>/api/webhooks/flutterwave`.

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
