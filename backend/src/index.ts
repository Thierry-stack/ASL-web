import "dotenv/config";
import cors from "cors";
import express from "express";
import { prisma } from "./lib/prisma.js";
import authRouter from "./routes/auth.js";
import catalogRouter from "./routes/catalog.js";
import adminRouter from "./routes/admin.js";
import learningRouter from "./routes/learning.js";
import paymentsMeRouter from "./routes/paymentsMe.js";
import donationsRouter from "./routes/donations.js";
import webhooksRouter from "./routes/webhooks.js";

if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET must be set in backend/.env");
  process.exit(1);
}

const app = express();
const port = Number(process.env.PORT) || 4000;

const corsOrigin = process.env.CORS_ORIGIN ?? true;
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/courses", catalogRouter);
app.use("/api/admin", adminRouter);
app.use("/api/me", learningRouter);
app.use("/api/me/payments", paymentsMeRouter);
app.use("/api/donations", donationsRouter);
app.use("/api/webhooks", webhooksRouter);

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "sign-language-api" });
});

app.get("/health/db", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, database: "connected" });
  } catch (err) {
    console.error(err);
    res.status(503).json({ ok: false, database: "unavailable" });
  }
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  if (err && typeof err === "object" && "code" in err) {
    const code = (err as { code: string }).code;
    if (code === "P2021") {
      res.status(503).json({
        error:
          "Database tables are missing. From the backend folder run: npx prisma db push",
      });
      return;
    }
  }
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
