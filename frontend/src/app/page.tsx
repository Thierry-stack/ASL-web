import Link from "next/link";
import { HeroGeometric } from "@/components/ui/shape-landing-hero";
import { SiteFooter } from "@/components/layout/site-footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="text-sm font-medium uppercase tracking-wide text-white/90">
            Sign Language LMS
          </Link>
          <nav className="flex flex-wrap items-center gap-2 sm:justify-end sm:gap-1" aria-label="Main">
            <Link
              href="/courses"
              className="inline-flex min-h-12 items-center justify-center rounded-lg px-4 text-lg font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
            >
              Courses
            </Link>
            <Link
              href="/about"
              className="inline-flex min-h-12 items-center justify-center rounded-lg px-4 text-lg font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
            >
              About
            </Link>
            <Link
              href="/blog"
              className="inline-flex min-h-12 items-center justify-center rounded-lg px-4 text-lg font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
            >
              Blog
            </Link>
            <Link
              href="/donate"
              className="inline-flex min-h-12 items-center justify-center rounded-lg px-4 text-lg font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
            >
              Donate
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-12 min-w-[7rem] items-center justify-center rounded-lg border border-white/25 px-5 text-lg font-medium text-white transition hover:bg-white/10"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Dark hero — background stays only in this section */}
        <HeroGeometric
          className="min-h-[calc(100dvh-4rem)]"
          badge="Sign Language LMS"
          title1="Learn Visually"
          title2="Teach With Clarity"
          description="Video-based sign language courses with captions, simple navigation, and large touch targets — designed for learners and educators who rely on visual communication."
        />

        {/* Light sections — distinct backgrounds as you scroll */}
        <section className="bg-zinc-50 py-20 text-zinc-900 dark:bg-zinc-100 dark:text-zinc-900">
          <div className="mx-auto max-w-5xl px-4 md:px-6">
            <h2 className="text-center text-3xl font-semibold tracking-tight md:text-4xl">Why this platform</h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-zinc-600">
              Built for visual learning: clear structure, readable typography, and room to grow into live classes and
              payments.
            </p>
            <ul className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <li className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-200 dark:bg-white">
                <h3 className="text-xl font-semibold">Captioned video</h3>
                <p className="mt-3 text-zinc-600">
                  Lessons use hosted video with support for captions and downloadable materials so learners can follow at
                  their own pace.
                </p>
              </li>
              <li className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-200 dark:bg-white">
                <h3 className="text-xl font-semibold">Large, simple controls</h3>
                <p className="mt-3 text-zinc-600">
                  Buttons and navigation are sized for clarity — fewer distractions, faster paths to courses and progress.
                </p>
              </li>
              <li className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:col-span-2 lg:col-span-1 dark:border-zinc-200 dark:bg-white">
                <h3 className="text-xl font-semibold">Roles & access</h3>
                <p className="mt-3 text-zinc-600">
                  Students enroll and track lesson completion; admins publish courses and manage content from a dedicated
                  dashboard.
                </p>
              </li>
            </ul>
          </div>
        </section>

        <section className="bg-white py-20 dark:bg-white">
          <div className="mx-auto max-w-5xl px-4 md:px-6">
            <div className="grid gap-12 md:grid-cols-2 md:items-center">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 md:text-4xl">For educators</h2>
                <p className="mt-4 text-lg leading-relaxed text-zinc-600">
                  Create courses, add YouTube-based lessons, set free or paid access, and see enrollments in one place.
                  Perfect for schools, nonprofits, and independent instructors.
                </p>
              </div>
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 md:text-4xl">For learners</h2>
                <p className="mt-4 text-lg leading-relaxed text-zinc-600">
                  Browse the catalog, enroll in courses that match your goals, and mark lessons complete as you go — with
                  your dashboard showing what you have started.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-zinc-100 py-20 dark:bg-zinc-100">
          <div className="mx-auto max-w-3xl px-4 text-center md:px-6">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 md:text-4xl">Ready to start?</h2>
            <p className="mt-4 text-lg text-zinc-600">
              Create a free account to save progress, or jump into the course catalog.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex min-h-14 min-w-[10rem] items-center justify-center rounded-xl bg-zinc-900 px-8 text-lg font-medium text-white transition hover:bg-zinc-800"
              >
                Get started
              </Link>
              <Link
                href="/courses"
                className="inline-flex min-h-14 min-w-[10rem] items-center justify-center rounded-xl border-2 border-zinc-900 px-8 text-lg font-medium text-zinc-900 transition hover:bg-zinc-200/50"
              >
                Browse courses
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
