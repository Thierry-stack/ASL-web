"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  ApiError,
  completeLesson,
  confirmFlutterwavePayment,
  enrollInCourse,
  getCourseBySlug,
  initiateFlutterwavePayment,
} from "@/lib/api";
import type { CourseDetail, LessonFull, LessonTeaser } from "@/lib/types";

function isLessonFull(l: LessonTeaser | LessonFull): l is LessonFull {
  return "videoUrl" in l && typeof (l as LessonFull).videoUrl === "string";
}

function formatPrice(cents: number | null, currency: string): string {
  if (cents == null || cents <= 0) return "Free";
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency || "NGN",
    }).format(cents / 100);
  } catch {
    return `${cents / 100} ${currency}`;
  }
}

function CourseDetailInner() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const searchParams = useSearchParams();
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [paying, setPaying] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const paymentConfirmKey = useRef<string | null>(null);

  useEffect(() => {
    paymentConfirmKey.current = null;
  }, [slug]);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const r = await getCourseBySlug(slug, token);
      setCourse(r.course);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load course");
      setCourse(null);
    } finally {
      setLoading(false);
    }
  }, [slug, token]);

  useEffect(() => {
    if (!authLoading) {
      void load();
    }
  }, [authLoading, load]);

  useEffect(() => {
    const tx =
      searchParams.get("transaction_id") || searchParams.get("id") || searchParams.get("tx_id");
    if (!tx || !token || slug === "") return;

    const dedupeKey = `${slug}:${tx}`;
    if (paymentConfirmKey.current === dedupeKey) return;
    paymentConfirmKey.current = dedupeKey;

    let cancelled = false;
    setConfirmingPayment(true);
    setActionError(null);
    confirmFlutterwavePayment(token, tx)
      .then(async () => {
        if (cancelled) return;
        router.replace(`/courses/${slug}`);
        const r = await getCourseBySlug(slug, token);
        if (!cancelled) setCourse(r.course);
      })
      .catch((e) => {
        if (!cancelled) {
          setActionError(e instanceof ApiError ? e.message : "Could not confirm payment");
        }
      })
      .finally(() => {
        if (!cancelled) setConfirmingPayment(false);
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams, token, slug, router]);

  async function onEnroll() {
    if (!token || !course) {
      router.push("/login");
      return;
    }
    setActionError(null);
    setEnrolling(true);
    try {
      await enrollInCourse(course.id, token);
      await load();
    } catch (e) {
      if (e instanceof ApiError && e.status === 402) {
        setActionError("This course requires payment before you can enroll.");
      } else {
        setActionError(e instanceof ApiError ? e.message : "Could not enroll");
      }
    } finally {
      setEnrolling(false);
    }
  }

  async function onPayFlutterwave() {
    if (!token || !course) {
      router.push("/login");
      return;
    }
    setActionError(null);
    setPaying(true);
    try {
      const { link } = await initiateFlutterwavePayment(token, course.id);
      window.location.href = link;
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : "Could not start payment");
    } finally {
      setPaying(false);
    }
  }

  async function onCompleteLesson(lessonId: string) {
    if (!token) return;
    setActionError(null);
    try {
      await completeLesson(lessonId, token);
      setCourse((prev) =>
        prev
          ? {
              ...prev,
              completedLessonIds: [...new Set([...prev.completedLessonIds, lessonId])],
            }
          : prev,
      );
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : "Could not save progress");
    }
  }

  if (!slug) {
    return null;
  }

  if (loading || authLoading) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center px-4 py-24">
        <p className="text-lg text-zinc-500">Loading…</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="mx-auto max-w-2xl flex-1 px-4 py-16">
        <p className="text-lg text-red-600" role="alert">
          {error ?? "Not found"}
        </p>
        <p className="mt-4">
          <Link href="/courses" className="underline">
            All courses
          </Link>
        </p>
      </div>
    );
  }

  const showVideos = course.enrolled || user?.role === "ADMIN";
  const isPaidCourse = (course.priceCents ?? 0) > 0;
  const paidForCourse = course.paidForCourse ?? false;
  const needsPayFirst = isPaidCourse && !paidForCourse && !course.enrolled && user?.role !== "ADMIN";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-12">
      <header>
        <p className="text-sm text-zinc-500">
          <Link href="/courses" className="underline">
            Courses
          </Link>
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{course.title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">{course.description}</p>
        <p className="mt-4 text-sm text-zinc-500">
          Instructor: {course.author.name ?? course.author.email} · {formatPrice(course.priceCents, course.currency)}
        </p>
      </header>

      {confirmingPayment ? (
        <p className="text-lg text-zinc-600 dark:text-zinc-400" role="status">
          Confirming payment…
        </p>
      ) : null}

      {!course.enrolled && course.published && user?.role !== "ADMIN" ? (
        <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
          <h2 className="text-lg font-medium">Access lessons</h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            {needsPayFirst
              ? "Complete payment for this course, then enroll to open the lessons."
              : "Enroll to watch videos and download materials. Free courses enroll instantly."}
          </p>
          {actionError ? (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {actionError}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-3">
            {!user ? (
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="min-h-12 min-w-[10rem] rounded-lg bg-zinc-900 px-5 text-lg font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Sign in to continue
              </button>
            ) : needsPayFirst ? (
              <button
                type="button"
                onClick={() => void onPayFlutterwave()}
                disabled={paying}
                className="min-h-12 min-w-[12rem] rounded-lg bg-zinc-900 px-5 text-lg font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {paying ? "Redirecting…" : "Pay with Flutterwave"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void onEnroll()}
                disabled={enrolling}
                className="min-h-12 min-w-[10rem] rounded-lg bg-zinc-900 px-5 text-lg font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {enrolling ? "Enrolling…" : "Enroll"}
              </button>
            )}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="lessons-heading">
        <h2 id="lessons-heading" className="text-xl font-semibold">
          Lessons
        </h2>
        <ol className="mt-4 flex list-decimal flex-col gap-6 pl-6">
          {course.lessons.map((lesson) => {
            const done = course.completedLessonIds.includes(lesson.id);
            const full = isLessonFull(lesson);
            return (
              <li key={lesson.id} className="pl-2">
                <h3 className="text-lg font-medium">{lesson.title}</h3>
                {showVideos && full ? (
                  <div className="mt-3 flex flex-col gap-3">
                    <a
                      href={lesson.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-12 w-fit items-center rounded-lg border border-zinc-300 px-5 text-lg font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-900"
                    >
                      Open video (captions: use the player on YouTube)
                    </a>
                    {lesson.captionUrl ? (
                      <a
                        href={lesson.captionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-base underline"
                      >
                        Caption file
                      </a>
                    ) : null}
                    {token && (course.enrolled || user?.role === "ADMIN") ? (
                      <button
                        type="button"
                        onClick={() => void onCompleteLesson(lesson.id)}
                        disabled={done}
                        className="min-h-12 w-fit rounded-lg bg-zinc-900 px-5 text-lg font-medium text-white hover:bg-zinc-800 disabled:cursor-default disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                      >
                        {done ? "Completed" : "Mark as complete"}
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-2 text-zinc-500">Enroll to view this lesson’s video and resources.</p>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <p>
        <Link href="/courses" className="text-zinc-600 underline dark:text-zinc-400">
          ← All courses
        </Link>
      </p>
    </div>
  );
}

export default function CourseDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full flex-1 items-center justify-center px-4 py-24">
          <p className="text-lg text-zinc-500">Loading…</p>
        </div>
      }
    >
      <CourseDetailInner />
    </Suspense>
  );
}
