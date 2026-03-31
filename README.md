# Sign Language LMS

A web platform for teaching and learning sign language online. It includes a **Next.js** marketing and learning UI, an **Express** REST API, **PostgreSQL** (e.g. Supabase) via **Prisma**, **JWT** authentication, **Flutterwave** for course payments and optional **MTN Mobile Money (Rwanda)** donations, and a **Chatling** chatbot embed on all pages.

This document is meant for **developers or teammates** who need to run the project locally or deploy it.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript (ESM), Zod |
| Database | PostgreSQL, Prisma ORM |
| Auth | JWT (bcrypt-hashed passwords) |
| Payments | Flutterwave (hosted checkout for courses; MoMo charge API for donations) |

---

## Repository layout

| Path | Role |
|------|------|
| `frontend/` | Next.js app — deploy on **Vercel** or any Node host |
| `backend/` | Express API — deploy on **Railway**, **Render**, VPS, etc. |
| `backend/prisma/schema.prisma` | Database models (users, courses, lessons, enrollments, progress, payments, donations, blog posts, …) |
| Root `package.json` | Shortcuts: `dev:frontend`, `dev:backend`, `db:*` |

---

## Prerequisites

- **Node.js 20+** (LTS recommended) and **npm**
- A **PostgreSQL** database (e.g. [Supabase](https://supabase.com) free tier)
- Optional: **Flutterwave** test keys for payments and donations
- Optional: **ngrok** (or similar) if you need Flutterwave **webhooks** to hit your laptop

---

## Quick start (local)

1. **Clone** the repository and install dependencies:

   ```bash
   cd sign-language-web
   npm install --prefix frontend
   npm install --prefix backend
   ```

2. **Backend environment** — copy `backend/.env.example` to `backend/.env` and fill in:

   - `DATABASE_URL` and `DIRECT_URL` (see [Database](#database-prisma--supabase))
   - `JWT_SECRET` (long random string)
   - `CORS_ORIGIN` (e.g. `http://localhost:3000`)
   - `PUBLIC_APP_URL` (e.g. `http://localhost:3000`)
   - Flutterwave keys if you use payments or donations

3. **Database** — from the repo root:

   ```bash
   npm run db:generate
   npm run db:push
   ```

   Or from `backend/`: `npx prisma generate` then `npx prisma db push`.

4. **Frontend environment** — copy `frontend/.env.example` to `frontend/.env.local`:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:4000
   ```

   Optionally set `NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY` if the client needs the public key for checkout UIs.

5. **Run two terminals:**

   ```bash
   npm run dev:backend
   ```

   ```bash
   npm run dev:frontend
   ```

6. Open **http://localhost:3000** — API health: **http://localhost:4000/health** and **http://localhost:4000/health/db**.

---

## Environment variables

Secrets belong in **gitignored** files only (`.env`, `.env.local`). **Never commit** real passwords or API keys.

### Backend — `backend/.env`

Copy from `backend/.env.example`. Important variables:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | App connections — prefer Supabase **transaction pooler** (often port `6543`, IPv4-friendly). |
| `DIRECT_URL` | Prisma migrations — prefer **session pooler** (often port `5432` on pooler host). |
| `PORT` | API port (default `4000`). |
| `CORS_ORIGIN` | Browser origin allowed to call the API (e.g. `http://localhost:3000`). |
| `JWT_SECRET` | Required — signs JWT access tokens. |
| `JWT_EXPIRES_IN` | Optional (default e.g. `7d`). |
| `PUBLIC_APP_URL` | Public URL of the Next.js app — used for Flutterwave redirects. |
| `FLUTTERWAVE_PUBLIC_KEY` | Flutterwave public key. |
| `FLUTTERWAVE_SECRET_KEY` | Server-only — charges, verify, webhooks. |
| `FLUTTERWAVE_ENCRYPTION_KEY` | Flutterwave encryption key where required. |
| `FLUTTERWAVE_SECRET_HASH` | Optional — must match Flutterwave webhook `verif-hash` if you verify signatures. |
| `DONATION_DEFAULT_AMOUNT_RWF` | Optional — default donation amount in RWF for `/api/donations/momo/initiate`. |

### Frontend — `frontend/.env.local`

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | Base URL of the API (e.g. `http://localhost:4000`). |
| `NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY` | Public key only — safe in the browser. |

Do **not** put secret keys in any `NEXT_PUBLIC_*` variable.

### Networking (Supabase and IPv4)

If **direct** `db.<project>.supabase.co` fails (common on IPv4-only networks), use the **pooler** connection strings from the Supabase dashboard (**Connect**). See [Supabase: Connecting to Postgres](https://supabase.com/docs/guides/database/connecting-to-postgres).

---

## Database (Prisma)

```bash
npm run db:generate   # prisma generate
npm run db:push       # push schema (dev)
npm run db:studio     # Prisma Studio GUI
npm run db:check      # connectivity script
```

If the API returns **503** mentioning missing tables, run `npm run db:push` again from a machine that can reach the database.

On **Windows**, if `npx prisma generate` fails with **EPERM** renaming the query engine DLL, close programs locking `node_modules` (IDE, antivirus) and retry.

---

## What’s in the app (overview)

### Public marketing / content

- **Home** — hero, navigation (Courses, About, Blog, Donate, Sign in), footer.
- **About**, **Blog** (static article cards), **Donate** — Flutterwave **Rwanda MTN Mobile Money** test flow (phone + amount; optional confirm by transaction id).

### Chatbot

- **Chatling** is embedded in `frontend/src/app/layout.tsx` (config + script). To change the bot, update the `CHATLING_BOT_ID` constant there.

### Learning (authenticated)

- **Register / Login / Dashboard** — JWT stored in `localStorage` (`slms_access_token`).
- **Courses** — catalog, course detail, enroll, lesson progress, paid courses via Flutterwave checkout.

### Admin

- **Admin courses** — create courses and lessons (requires first user registered as `ADMIN`, or adjust roles in the database).

### Payments

- **Courses** — `POST /api/me/payments/flutterwave/initiate` (auth), hosted link, then confirm or webhook.
- **Donations** — `POST /api/donations/momo/initiate` (no auth): Rwanda MoMo charge; `POST /api/donations/momo/confirm` with `transaction_id`; webhooks complete donations when `tx_ref` matches a `Donation` record.

---

## API summary (Express)

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/register` | — | `{ email, password, name? }` → `{ user, token }` |
| `POST` | `/api/auth/login` | — | `{ email, password }` → `{ user, token }` |
| `GET` | `/api/auth/me` | Bearer | `{ user }` |

### Courses & learning

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/api/courses` | Published courses |
| `GET` | `/api/courses/by-slug/:slug` | Optional Bearer for enrollment/progress hints |
| `POST` | `/api/me/courses/:courseId/enroll` | Bearer |
| `POST` | `/api/me/lessons/:lessonId/complete` | Bearer |

### Payments (courses)

| Method | Path | Notes |
|--------|------|--------|
| `POST` | `/api/me/payments/flutterwave/initiate` | Bearer, `{ courseId }` |
| `POST` | `/api/me/payments/flutterwave/confirm` | Bearer, `{ transaction_id }` |

### Donations

| Method | Path | Notes |
|--------|------|--------|
| `POST` | `/api/donations/momo/initiate` | `{ phoneNumber, amountRwf?, email?, fullName? }` — Rwanda MTN format |
| `POST` | `/api/donations/momo/confirm` | `{ transaction_id }` |

### Webhooks

| Method | Path | Notes |
|--------|------|--------|
| `POST` | `/api/webhooks/flutterwave` | Completes **course** payment or **donation** by Flutterwave transaction id |

### Admin (Bearer + `ADMIN` role)

- `GET/POST/PATCH/DELETE` under `/api/admin/courses` and related lesson routes — see codebase for exact paths.

---

## Flutterwave tips

- Set **`PUBLIC_APP_URL`** to your real site URL in production.
- Webhook URL: `https://<your-api-host>/api/webhooks/flutterwave`. For local dev, use a tunnel if you need server-to-server webhooks; the **confirm** endpoints also work after redirect.
- Set **`FLUTTERWAVE_SECRET_HASH`** when you enforce webhook signature verification in production.

---

## Production checklist (short)

- Strong `JWT_SECRET`, HTTPS everywhere, CORS locked to your frontend origin.
- `PUBLIC_APP_URL` and `NEXT_PUBLIC_API_URL` point to production URLs.
- Database credentials rotated if they were ever exposed.
- Flutterwave live keys only on the server; never in frontend except the **public** key.

---

## Scripts (from repository root)

| Script | Action |
|--------|--------|
| `npm run dev:frontend` | Next.js dev server |
| `npm run dev:backend` | API with hot reload (`tsx watch`) |
| `npm run db:generate` | `prisma generate` in `backend/` |
| `npm run db:push` | `prisma db push` |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:studio` | Prisma Studio |
| `npm run db:check` | DB connectivity check |

**Production build:** `npm run build --prefix frontend` and `npm run build --prefix backend`; start API with `npm run start --prefix backend` (runs `node dist/index.js`).

---

## License

Private / internal unless you add an explicit open-source license.
