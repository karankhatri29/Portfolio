import { CountUp } from "@/components/about/CountUp";
import { GitHubIcon } from "@/components/GitHubIcon";
import type { GithubActivity } from "@/lib/github";

const glass = "border border-accent/20 bg-ink/[0.035] backdrop-blur-xl";

export function OpenSource({ activity }: { activity: GithubActivity | null }) {
  if (!activity) return null;

  const stats = [
    { label: "Public repositories", value: activity.publicRepos },
    { label: "Stars earned", value: activity.totalStars },
    { label: "Followers", value: activity.followers },
  ];

  return (
    <section id="open-source" aria-labelledby="open-source-title" className="border-b border-ink/10 py-16 lg:py-24">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 id="open-source-title" className="font-display text-3xl font-semibold lg:text-4xl">Open source on GitHub</h2>
        <a href={`https://github.com/${activity.username}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-accent underline underline-offset-4 transition hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          <GitHubIcon className="h-5 w-5" />@{activity.username}
        </a>
      </div>
      <dl className="mt-8 grid grid-cols-3 gap-3 text-center sm:max-w-xl sm:gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`${glass} p-4`}>
            <dd className="font-display text-3xl font-semibold tabular-nums text-accent sm:text-4xl"><CountUp value={stat.value} group /></dd>
            <dt className="mt-1 text-xs text-muted sm:text-sm">{stat.label}</dt>
          </div>
        ))}
      </dl>
      {activity.topRepos.length > 0 ? (
        <ul aria-label="Top repositories" className="mt-8 grid gap-4 md:grid-cols-3">
          {activity.topRepos.map((repo) => (
            <li key={repo.name} className={`${glass} group relative flex flex-col p-6 transition duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-[0_0_44px_-12px_rgb(var(--color-accent)/0.5)] motion-reduce:transition-none motion-reduce:hover:translate-y-0`}>
              <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-60" />
              <a href={repo.url} target="_blank" rel="noopener noreferrer" className="font-display text-lg font-semibold underline-offset-4 after:absolute after:inset-0 hover:text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">{repo.name}</a>
              {repo.description ? <p className="mt-2 flex-1 text-sm leading-6 text-muted">{repo.description}</p> : <span className="flex-1" />}
              <div className="mt-5 flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-xs text-muted">
                  {repo.language ? <span aria-hidden="true" className="h-2 w-2 rounded-full bg-accent" /> : null}
                  {[repo.language, `${repo.stars} ${repo.stars === 1 ? "star" : "stars"}`].filter(Boolean).join(" · ")}
                </p>
                {repo.stars > 0 ? (
                  <svg aria-hidden="true" viewBox="-12 -12 24 24" className="h-5 w-5 shrink-0 drop-shadow-[0_0_6px_rgb(var(--color-accent)/0.9)]">
                    <path d="M0 -10 L2.4 -2.4 L10 0 L2.4 2.4 L0 10 L-2.4 2.4 L-10 0 L-2.4 -2.4Z" className="fill-accent" />
                  </svg>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
