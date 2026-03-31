"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError, listPublishedCourses } from "@/lib/api";
import type { CourseSummary } from "@/lib/types";

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

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPublishedCourses()
      .then((r) => setCourses(r.courses))
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-12">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Courses</h1>
        <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
          Browse published sign language courses.
        </p>
        <p className="mt-4">
          <Link href="/" className="text-zinc-600 underline dark:text-zinc-400">
            ← Home
          </Link>
        </p>
      </header>

      {loading ? (
        <p className="text-lg text-zinc-500">Loading…</p>
      ) : error ? (
        <p className="text-lg text-red-600" role="alert">
          {error}
        </p>
      ) : courses.length === 0 ? (
        <p className="text-lg text-zinc-600">No published courses yet.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {courses.map((c) => (
            <li key={c.id}>
              <Link
                href={`/courses/${c.slug}`}
                className="block rounded-2xl border border-zinc-200 bg-white p-6 transition hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{c.title}</h2>
                    <p className="mt-2 line-clamp-2 text-zinc-600 dark:text-zinc-400">{c.description}</p>
                    <p className="mt-3 text-sm text-zinc-500">
                      {c.lessonCount} lesson{c.lessonCount === 1 ? "" : "s"} ·{" "}
                      {c.author.name ?? c.author.email}
                    </p>
                  </div>
                  <span className="mt-2 inline-flex min-h-10 shrink-0 items-center rounded-full bg-zinc-100 px-4 text-sm font-medium dark:bg-zinc-800">
                    {formatPrice(c.priceCents, c.currency)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
