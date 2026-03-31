"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { adminCreateCourse, adminCreateLesson, adminListCourses, ApiError } from "@/lib/api";

type AdminCourse = {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  priceCents: number | null;
  currency: string;
  _count: { lessons: number };
};

export default function AdminCoursesPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [published, setPublished] = useState(false);
  const [priceNaira, setPriceNaira] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [lessonCourseId, setLessonCourseId] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonVideoUrl, setLessonVideoUrl] = useState("");
  const [lessonError, setLessonError] = useState<string | null>(null);
  const [lessonSaving, setLessonSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "ADMIN") {
      router.replace("/dashboard");
      return;
    }
    if (!token) return;
    adminListCourses(token)
      .then((r) => setCourses((r.courses as AdminCourse[]) ?? []))
      .catch((e) => setListError(e instanceof ApiError ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [authLoading, user, token, router]);

  async function onCreateCourse(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setCreateError(null);
    setCreating(true);
    try {
      let priceCents: number | null = null;
      if (priceNaira.trim() !== "") {
        const n = Number.parseFloat(priceNaira.replace(",", "."));
        if (Number.isNaN(n) || n < 0) {
          setCreateError("Enter a valid price in NGN or leave empty for a free course.");
          setCreating(false);
          return;
        }
        priceCents = Math.round(n * 100);
      }
      await adminCreateCourse(token, {
        title: title.trim(),
        description: description.trim(),
        published,
        priceCents,
      });
      setTitle("");
      setDescription("");
      setPublished(false);
      setPriceNaira("");
      const r = await adminListCourses(token);
      setCourses((r.courses as AdminCourse[]) ?? []);
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : "Create failed");
    } finally {
      setCreating(false);
    }
  }

  async function onCreateLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !lessonCourseId.trim()) return;
    setLessonError(null);
    setLessonSaving(true);
    try {
      await adminCreateLesson(token, lessonCourseId.trim(), {
        title: lessonTitle.trim(),
        videoUrl: lessonVideoUrl.trim(),
      });
      setLessonTitle("");
      setLessonVideoUrl("");
      const r = await adminListCourses(token);
      setCourses((r.courses as AdminCourse[]) ?? []);
    } catch (err) {
      setLessonError(err instanceof ApiError ? err.message : "Could not add lesson");
    } finally {
      setLessonSaving(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center px-4 py-24">
        <p className="text-lg text-zinc-500">Loading…</p>
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-12 px-4 py-12">
      <header>
        <h1 className="text-3xl font-semibold">Manage courses</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">Create courses and add lessons (YouTube URLs).</p>
        <p className="mt-4 flex flex-wrap gap-4">
          <Link href="/courses" className="underline">
            View public catalog
          </Link>
          <Link href="/dashboard" className="underline">
            Dashboard
          </Link>
        </p>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-medium">New course</h2>
        <form className="mt-4 flex flex-col gap-4" onSubmit={onCreateCourse}>
          <div>
            <label htmlFor="title" className="mb-1 block text-sm font-medium">
              Title
            </label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="min-h-12 w-full rounded-lg border border-zinc-300 px-3 text-lg dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-lg dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div>
            <label htmlFor="price" className="mb-1 block text-sm font-medium">
              Price (NGN) — leave empty for free
            </label>
            <input
              id="price"
              type="text"
              inputMode="decimal"
              value={priceNaira}
              onChange={(e) => setPriceNaira(e.target.value)}
              placeholder="e.g. 2500"
              className="min-h-12 w-full rounded-lg border border-zinc-300 px-3 text-lg dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <label className="flex items-center gap-2 text-lg">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="h-5 w-5"
            />
            Published (visible in catalog)
          </label>
          {createError ? (
            <p className="text-sm text-red-600" role="alert">
              {createError}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={creating}
            className="min-h-12 w-fit rounded-lg bg-zinc-900 px-6 text-lg font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {creating ? "Saving…" : "Create course"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-medium">Add lesson</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Paste the course ID from the table below, or pick from the dropdown.
        </p>
        <form className="mt-4 flex flex-col gap-4" onSubmit={onCreateLesson}>
          <div>
            <label htmlFor="courseId" className="mb-1 block text-sm font-medium">
              Course
            </label>
            <select
              id="courseId"
              value={lessonCourseId}
              onChange={(e) => setLessonCourseId(e.target.value)}
              className="min-h-12 w-full rounded-lg border border-zinc-300 px-3 text-lg dark:border-zinc-700 dark:bg-zinc-900"
              required
            >
              <option value="">Select course…</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c._count.lessons} lessons)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="lessonTitle" className="mb-1 block text-sm font-medium">
              Lesson title
            </label>
            <input
              id="lessonTitle"
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
              required
              className="min-h-12 w-full rounded-lg border border-zinc-300 px-3 text-lg dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div>
            <label htmlFor="videoUrl" className="mb-1 block text-sm font-medium">
              Video URL (YouTube watch or embed link)
            </label>
            <input
              id="videoUrl"
              value={lessonVideoUrl}
              onChange={(e) => setLessonVideoUrl(e.target.value)}
              required
              className="min-h-12 w-full rounded-lg border border-zinc-300 px-3 text-lg dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          {lessonError ? (
            <p className="text-sm text-red-600" role="alert">
              {lessonError}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={lessonSaving}
            className="min-h-12 w-fit rounded-lg bg-zinc-900 px-6 text-lg font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {lessonSaving ? "Adding…" : "Add lesson"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-medium">All courses</h2>
        {listError ? (
          <p className="mt-2 text-red-600">{listError}</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {courses.map((c) => (
              <li
                key={c.id}
                className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{c.title}</p>
                  <p className="text-sm text-zinc-500">
                    {c.published ? "Published" : "Draft"} ·{" "}
                    {c.priceCents != null && c.priceCents > 0
                      ? `${(c.priceCents / 100).toFixed(2)} ${c.currency}`
                      : "Free"}{" "}
                    · {c._count.lessons} lessons · ID: <code className="text-xs">{c.id}</code>
                  </p>
                </div>
                <Link
                  href={`/courses/${c.slug}`}
                  className="min-h-12 inline-flex items-center justify-center rounded-lg border border-zinc-300 px-4 text-lg font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-900"
                >
                  Open
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
