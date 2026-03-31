import type { CourseDetail, CourseSummary, EnrollmentRow, UserPublic } from "./types";

/** Same-origin on Vercel: leave unset or "". For local API on port 4000, set NEXT_PUBLIC_API_URL=http://localhost:4000 */
function getApiBase(): string {
  const env = process.env.NEXT_PUBLIC_API_URL;
  if (env !== undefined && env !== "") {
    return env.replace(/\/$/, "");
  }
  return "";
}

const API_BASE = getApiBase();

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;
  const h = new Headers(headers);
  if (!(rest.body instanceof FormData)) {
    h.set("Content-Type", "application/json");
  }
  if (token) {
    h.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(`${API_BASE}${path}`, { ...rest, headers: h });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const msg =
      typeof data.error === "string" ? data.error : `Request failed (${res.status})`;
    throw new ApiError(res.status, msg, data);
  }
  return data as T;
}

export type AuthResponse = { user: UserPublic; token: string };

export async function registerRequest(
  email: string,
  password: string,
  name?: string,
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
}

export async function loginRequest(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function meRequest(token: string): Promise<{ user: UserPublic }> {
  return apiFetch<{ user: UserPublic }>("/api/auth/me", { method: "GET", token });
}

export async function listPublishedCourses(): Promise<{ courses: CourseSummary[] }> {
  return apiFetch("/api/courses", { method: "GET" });
}

export async function getCourseBySlug(
  slug: string,
  token?: string | null,
): Promise<{ course: CourseDetail }> {
  return apiFetch(`/api/courses/by-slug/${encodeURIComponent(slug)}`, {
    method: "GET",
    token: token ?? undefined,
  });
}

export async function listMyEnrollments(token: string): Promise<{ enrollments: EnrollmentRow[] }> {
  return apiFetch("/api/me/enrollments", { method: "GET", token });
}

export async function enrollInCourse(courseId: string, token: string): Promise<unknown> {
  return apiFetch(`/api/me/courses/${encodeURIComponent(courseId)}/enroll`, {
    method: "POST",
    token,
  });
}

export async function completeLesson(lessonId: string, token: string): Promise<{ progress: { id: string } }> {
  return apiFetch(`/api/me/lessons/${encodeURIComponent(lessonId)}/complete`, {
    method: "POST",
    token,
  });
}

export async function adminListCourses(token: string): Promise<{ courses: unknown[] }> {
  return apiFetch("/api/admin/courses", { method: "GET", token });
}

export async function adminCreateCourse(
  token: string,
  body: {
    title: string;
    description: string;
    slug?: string;
    priceCents?: number | null;
    published?: boolean;
  },
): Promise<{ course: { id: string; slug: string; title: string } }> {
  return apiFetch("/api/admin/courses", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export async function adminCreateLesson(
  token: string,
  courseId: string,
  body: { title: string; videoUrl: string },
): Promise<{ lesson: { id: string } }> {
  return apiFetch(`/api/admin/courses/${encodeURIComponent(courseId)}/lessons`, {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export async function initiateFlutterwavePayment(
  token: string,
  courseId: string,
): Promise<{ link: string; txRef: string; paymentId: string }> {
  return apiFetch("/api/me/payments/flutterwave/initiate", {
    method: "POST",
    token,
    body: JSON.stringify({ courseId }),
  });
}

export async function confirmFlutterwavePayment(
  token: string,
  transactionId: string,
): Promise<{ ok: boolean; paymentId?: string }> {
  return apiFetch("/api/me/payments/flutterwave/confirm", {
    method: "POST",
    token,
    body: JSON.stringify({ transaction_id: transactionId }),
  });
}

export type DonateMomoInitResponse = {
  ok: boolean;
  txRef: string;
  donationId: string;
  message?: string;
  transactionId?: number;
  authorization?: { mode?: string; redirect?: string; note?: string };
  confirmHint?: string;
};

export async function donateMomoInitiate(body: {
  phoneNumber: string;
  amountRwf?: number;
  email?: string;
  fullName?: string;
}): Promise<DonateMomoInitResponse> {
  return apiFetch("/api/donations/momo/initiate", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function donateMomoConfirm(
  transactionId: string,
): Promise<{ ok: boolean; donationId?: string }> {
  return apiFetch("/api/donations/momo/confirm", {
    method: "POST",
    body: JSON.stringify({ transaction_id: transactionId }),
  });
}
