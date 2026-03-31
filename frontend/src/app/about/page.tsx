import Link from "next/link";

export const metadata = {
  title: "About | Sign Language LMS",
  description: "About our sign language learning platform.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Link href="/" className="text-sm text-zinc-600 underline dark:text-zinc-400">
        ← Home
      </Link>
      <h1 className="mt-8 text-3xl font-semibold tracking-tight">About</h1>
      <p className="mt-6 text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
        Sign Language LMS is built for visual learning: video lessons, captions, and an interface designed with accessibility
        in mind. We support educators who teach sign language and learners who want structured, self-paced courses.
      </p>
    </div>
  );
}
