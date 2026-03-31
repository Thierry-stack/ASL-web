"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { ApiError, listMyEnrollments } from "@/lib/api";
import type { EnrollmentRow } from "@/lib/types";

export default function DashboardPage() {
  const { user, token, loading, logout } = useAuth();
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [enrollErr, setEnrollErr] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!token || !user) return;
    listMyEnrollments(token)
      .then((r) => setEnrollments(r.enrollments))
      .catch((e) => setEnrollErr(e instanceof ApiError ? e.message : "Could not load enrollments"));
  }, [token, user]);

  if (loading || !user) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center px-4 py-24">
        <p className="text-lg text-zinc-600 dark:text-zinc-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-16">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Signed in as <span className="font-medium text-zinc-900 dark:text-zinc-100">{user.email}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            logout();
            router.push("/");
            router.refresh();
          }}
          className="min-h-12 min-w-[8rem] rounded-lg border border-zinc-300 px-4 text-lg font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-900"
        >
          Sign out
        </button>
      </header>
      <section
        className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
        aria-labelledby="account-heading"
      >
        <h2 id="account-heading" className="text-lg font-medium">
          Account
        </h2>
        <dl className="mt-4 grid gap-3 text-base">
          <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
            <dt className="text-zinc-500 sm:w-28">Name</dt>
            <dd>{user.name ?? "—"}</dd>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
            <dt className="text-zinc-500 sm:w-28">Role</dt>
            <dd>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium dark:bg-zinc-800">
                {user.role}
              </span>
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-medium">Learning</h2>
        <ul className="mt-4 flex flex-col gap-3 text-lg">
          <li>
            <Link href="/courses" className="font-medium text-zinc-900 underline dark:text-zinc-100">
              Browse courses
            </Link>
          </li>
          {user.role === "ADMIN" ? (
            <li>
              <Link href="/admin/courses" className="font-medium text-zinc-900 underline dark:text-zinc-100">
                Admin: manage courses
              </Link>
            </li>
          ) : null}
        </ul>
        <h3 className="mt-6 text-base font-medium">My enrollments</h3>
        {enrollErr ? (
          <p className="mt-2 text-sm text-red-600">{enrollErr}</p>
        ) : enrollments.length === 0 ? (
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">No enrollments yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {enrollments.map((e) => (
              <li key={e.id}>
                <Link href={`/courses/${e.course.slug}`} className="underline">
                  {e.course.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p>
        <Link href="/" className="text-zinc-600 underline dark:text-zinc-400">
          ← Home
        </Link>
      </p>
    </div>
  );
}
