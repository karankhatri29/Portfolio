import { GitHubIcon } from "@/components/GitHubIcon";
import type { GithubActivity } from "@/lib/github";

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
        <h2 id="open-source-title" className="font-display text-3xl font-semibold">Open source on GitHub</h2>
        <a href={`https://github.com/${activity.username}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-accent underline underline-offset-4">
          <GitHubIcon className="h-5 w-5" />@{activity.username}
        </a>
      </div>
      <dl className="mt-8 grid grid-cols-3 gap-4 text-center sm:max-w-xl">
        {stats.map((stat) => (
          <div key={stat.label} className="border border-ink/10 p-4">
            <dd className="font-display text-3xl font-semibold tabular-nums">{stat.value.toLocaleString("en-US")}</dd>
            <dt className="mt-1 text-xs uppercase tracking-[0.12em] text-muted">{stat.label}</dt>
          </div>
        ))}
      </dl>
      {activity.topRepos.length > 0 ? (
        <ul aria-label="Top repositories" className="mt-8 grid gap-4 md:grid-cols-3">
          {activity.topRepos.map((repo) => (
            <li key={repo.name} className="flex flex-col border border-ink/10 p-5">
              <a href={repo.url} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4 hover:text-accent">{repo.name}</a>
              {repo.description ? <p className="mt-2 flex-1 text-sm leading-6 text-muted">{repo.description}</p> : <span className="flex-1" />}
              <p className="mt-4 text-xs text-muted">{[repo.language, `${repo.stars} ${repo.stars === 1 ? "star" : "stars"}`].filter(Boolean).join(" · ")}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
