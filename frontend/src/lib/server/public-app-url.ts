export function publicAppUrl(): string {
  const u = process.env.PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL;
  if (u) {
    if (!u.startsWith("http")) {
      return `https://${u.replace(/\/$/, "")}`;
    }
    return u.replace(/\/$/, "");
  }
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }
  throw new Error("Set PUBLIC_APP_URL or NEXT_PUBLIC_APP_URL (e.g. https://your-app.vercel.app)");
}
