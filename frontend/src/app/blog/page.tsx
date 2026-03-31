import Link from "next/link";

export const metadata = {
  title: "Blog | Sign Language LMS",
  description: "Useful tips and ideas for learning American Sign Language (ASL).",
};

const posts = [
  {
    title: "Celebrating ASL Day 🤟",
    excerpt:
      "A historic milestone for Deaf education: on April 15th, 1817, the first American school for the Deaf opened in Hartford, Connecticut. This event marks a foundational step for Deaf education in the United States—and a good moment to reflect on how far access and recognition have come.",
  },
  {
    title: "Introducing Awards & Curiosities: Celebrate Your Learning Progress",
    excerpt:
      "Learning sign languages gets more fun when you can see your progress. Think in terms of small wins: streaks, milestones, and curiosities that reward consistency. Unlock achievements as you learn—and share the journey with friends who are learning too.",
  },
  {
    title: "ASL Emergency Signs: Essential Communication in Critical Moments",
    excerpt:
      "In an emergency, clear communication can make the difference between safety and danger. Learning essential American Sign Language (ASL) signs equips everyone to connect with Deaf and hard-of-hearing people when it matters most—practice these signs until they feel natural.",
  },
] as const;

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[#F9F9F9] dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <Link
          href="/"
          className="text-sm text-[#666666] underline decoration-[#666666]/40 underline-offset-2 transition hover:text-[#4A4340] dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Home
        </Link>

        <header className="mx-auto mt-10 max-w-3xl text-center">
          <h1 className="text-2xl font-semibold leading-snug tracking-tight text-[#4A4340] sm:text-3xl dark:text-zinc-100">
            Blog – useful tips &amp; tricks for learning ASL
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-[#666666] dark:text-zinc-400">
            Short reads to inspire practice, community, and confidence in sign language.
          </p>
        </header>

        <ul className="mt-12 grid list-none grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {posts.map((post) => (
            <li key={post.title}>
              <article className="h-full rounded-lg border border-zinc-200/80 bg-white p-6 shadow-sm transition hover:border-zinc-300/90 hover:shadow-md sm:p-8 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
                <h2 className="text-lg font-semibold leading-snug text-[#4A4340] dark:text-zinc-100">{post.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-[#666666] dark:text-zinc-400">{post.excerpt}</p>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
