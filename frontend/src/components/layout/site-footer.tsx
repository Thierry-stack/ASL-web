import Link from "next/link";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-black text-zinc-400">
      {/* Monochrome spotlight beams from bottom center (black theme, no blue) */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {/* Soft origin glow — neutral gray / hint of warmth, not blue */}
        <div className="absolute bottom-0 left-1/2 h-[45%] w-[120%] -translate-x-1/2 bg-[radial-gradient(ellipse_80%_100%_at_50%_100%,rgba(255,255,255,0.1),rgba(255,255,255,0.03)_40%,transparent_68%)]" />
        {/* Sharp beam wedges */}
        <div
          className="absolute bottom-0 left-[8%] h-[85%] w-[18%] origin-bottom bg-gradient-to-t from-white/[0.14] via-white/[0.04] to-transparent opacity-90"
          style={{ transform: "rotate(-22deg)", clipPath: "polygon(20% 100%, 50% 0%, 80% 100%)" }}
        />
        <div
          className="absolute bottom-0 left-[22%] h-[80%] w-[16%] origin-bottom bg-gradient-to-t from-white/[0.1] via-white/[0.03] to-transparent opacity-80"
          style={{ transform: "rotate(-10deg)", clipPath: "polygon(15% 100%, 50% 0%, 85% 100%)" }}
        />
        <div
          className="absolute bottom-0 left-1/2 h-[90%] w-[14%] -translate-x-1/2 origin-bottom bg-gradient-to-t from-white/[0.12] via-white/[0.035] to-transparent opacity-85"
          style={{ clipPath: "polygon(10% 100%, 50% 0%, 90% 100%)" }}
        />
        <div
          className="absolute bottom-0 right-[22%] h-[80%] w-[16%] origin-bottom bg-gradient-to-t from-white/[0.1] via-white/[0.03] to-transparent opacity-80"
          style={{ transform: "rotate(10deg)", clipPath: "polygon(15% 100%, 50% 0%, 85% 100%)" }}
        />
        <div
          className="absolute bottom-0 right-[8%] h-[85%] w-[18%] origin-bottom bg-gradient-to-t from-white/[0.14] via-white/[0.04] to-transparent opacity-90"
          style={{ transform: "rotate(22deg)", clipPath: "polygon(20% 100%, 50% 0%, 80% 100%)" }}
        />
        {/* Vignette so edges stay deep black */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_100%,transparent_30%,rgba(0,0,0,0.75)_100%)]" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black to-transparent" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
        {/* Top: link columns — right-weighted like reference */}
        <div className="flex flex-col gap-12 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <p className="text-sm font-semibold uppercase tracking-wide text-white">Sign Language LMS</p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500">
              Visual-first learning for sign language — online courses, captions, and clear navigation.
            </p>
          </div>

          <nav
            className="flex flex-col gap-10 sm:flex-row sm:gap-16 md:gap-20 md:text-right"
            aria-label="Footer"
          >
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Explore</p>
              <ul className="mt-4 flex flex-col gap-3 text-sm text-zinc-300">
                <li>
                  <Link href="/about" className="inline-flex min-h-10 items-center transition hover:text-white md:justify-end">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="inline-flex min-h-10 items-center transition hover:text-white md:justify-end">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/donate" className="inline-flex min-h-10 items-center transition hover:text-white md:justify-end">
                    Donate
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Learn</p>
              <ul className="mt-4 flex flex-col gap-3 text-sm text-zinc-300">
                <li>
                  <Link href="/courses" className="inline-flex min-h-10 items-center transition hover:text-white md:justify-end">
                    Courses
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="inline-flex min-h-10 items-center transition hover:text-white md:justify-end">
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="inline-flex min-h-10 items-center transition hover:text-white md:justify-end">
                    Register
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        <hr className="mt-14 border-white/[0.08]" />

        <div className="mt-8 flex flex-col items-start justify-between gap-4 text-sm text-zinc-500 sm:flex-row sm:items-center">
          <p>© {year} Sign Language LMS. All rights reserved.</p>
          <p className="text-zinc-400">Sign Language LMS</p>
        </div>
      </div>
    </footer>
  );
}
