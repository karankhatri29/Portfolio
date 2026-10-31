import { recordHeal } from "@/lib/heal";
import { HttpError, isTimeoutError, isTransientError, retry } from "@/lib/resilience";

export type GithubRepo = { name: string; url: string; description: string; language: string; stars: number; pushedAt: string; owner: string };
export type GithubActivity = {
  username: string;
  publicRepos: number;
  totalStars: number;
  activeRepoCount: number;
  commitsLast30Days: number | null;
  recentRepos: GithubRepo[];
  pinnedRepos: GithubRepo[];
};

const ACTIVE_WINDOW_DAYS = 30;

export function githubUsername(links: { href: string }[]): string | null {
  for (const link of links) {
    const match = /^https:\/\/github\.com\/([\w-]+)\/?$/.exec(link.href);
    if (match) return match[1];
  }
  return null;
}

type RawRepo = { name?: unknown; html_url?: unknown; description?: unknown; language?: unknown; stargazers_count?: unknown; fork?: unknown; archived?: unknown; pushed_at?: unknown; owner?: { login?: unknown } };
type RawEvent = { type?: unknown; created_at?: unknown; repo?: { name?: unknown } };

function headers(): Record<string, string> {
  const base: Record<string, string> = { accept: "application/vnd.github+json", "user-agent": "portfolio-site" };
  return process.env.GITHUB_TOKEN ? { ...base, authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : base;
}

function toRepo(repo: RawRepo, fallbackOwner: string): GithubRepo {
  return {
    name: repo.name as string,
    url: repo.html_url as string,
    description: typeof repo.description === "string" ? repo.description : "",
    language: typeof repo.language === "string" ? repo.language : "",
    stars: typeof repo.stargazers_count === "number" ? repo.stargazers_count : 0,
    pushedAt: typeof repo.pushed_at === "string" ? repo.pushed_at : "",
    owner: typeof repo.owner?.login === "string" ? repo.owner.login : fallbackOwner,
  };
}

// Repos (including organisation repos) the user pushed to recently, from public events. Best effort: [] on any failure.
async function eventRepoNames(username: string, init: RequestInit, since: number): Promise<string[]> {
  try {
    const response = await fetch(`https://api.github.com/users/${username}/events/public?per_page=100`, init);
    if (!response.ok) return [];
    const events = (await response.json()) as RawEvent[];
    if (!Array.isArray(events)) return [];
    const names = events
      .filter((event) => event.type === "PushEvent" && typeof event.repo?.name === "string" && Date.parse(String(event.created_at)) >= since)
      .map((event) => event.repo?.name as string);
    return [...new Set(names)];
  } catch {
    return [];
  }
}

// Pinned items (organisation repos included) exist only in the GraphQL API, which requires a token. Best effort: [] without one.
async function pinnedRepos(username: string, init: RequestInit): Promise<GithubRepo[]> {
  if (!process.env.GITHUB_TOKEN) return [];
  try {
    const query = `query($login:String!){user(login:$login){pinnedItems(first:6,types:REPOSITORY){nodes{... on Repository{name url description stargazerCount pushedAt isArchived primaryLanguage{name} owner{login}}}}}}`;
    const response = await fetch("https://api.github.com/graphql", { ...init, method: "POST", headers: { ...(init.headers as Record<string, string>), "content-type": "application/json" }, body: JSON.stringify({ query, variables: { login: username } }) });
    if (!response.ok) return [];
    const body = (await response.json()) as { data?: { user?: { pinnedItems?: { nodes?: Record<string, any>[] } } } };
    const nodes = body.data?.user?.pinnedItems?.nodes;
    if (!Array.isArray(nodes)) return [];
    return nodes
      .filter((node) => typeof node?.name === "string" && typeof node?.url === "string")
      .map((node) => toRepo({ name: node.name, html_url: node.url, description: node.description, language: node.primaryLanguage?.name, stargazers_count: node.stargazerCount, pushed_at: node.pushedAt, owner: node.owner }, username));
  } catch {
    return [];
  }
}

// Public data, cached for 15 minutes. Commit counts come from commit search (default branches only) and are optional:
// if that call fails the rest still renders.
async function loadGithubActivity(username: string, now: Date): Promise<GithubActivity> {
  const since = new Date(now.getTime() - ACTIVE_WINDOW_DAYS * 86_400_000);
  const init = { headers: headers(), next: { revalidate: 900 }, signal: AbortSignal.timeout(4000) } as RequestInit;
  const [userResponse, reposResponse, commitsResponse, eventNames, pinned] = await Promise.all([
    fetch(`https://api.github.com/users/${username}`, init),
    fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=pushed`, init),
    fetch(`https://api.github.com/search/commits?q=author:${username}+committer-date:>=${since.toISOString().slice(0, 10)}&per_page=1`, init).catch(() => null),
    eventRepoNames(username, init, since.getTime()),
    pinnedRepos(username, init),
  ]);
  // A failed response is an error, so a transient one (5xx, 429) is retried and a rate limit or 404 is not.
  for (const response of [userResponse, reposResponse]) if (!response.ok) throw new HttpError(response.status);

  const user = (await userResponse.json()) as { public_repos?: unknown };
  const repos = (await reposResponse.json()) as RawRepo[];
  if (!Array.isArray(repos)) throw new Error("unexpected GitHub response");

  let commitsLast30Days: number | null = null;
  if (commitsResponse?.ok) {
    const search = (await commitsResponse.json().catch(() => null)) as { total_count?: unknown } | null;
    if (typeof search?.total_count === "number") commitsLast30Days = search.total_count;
  }

  const own = repos.filter((repo) => repo.fork !== true && repo.archived !== true && typeof repo.name === "string" && typeof repo.html_url === "string");
  const stars = (repo: RawRepo) => (typeof repo.stargazers_count === "number" ? repo.stargazers_count : 0);
  const pushed = (repo: RawRepo) => (typeof repo.pushed_at === "string" ? Date.parse(repo.pushed_at) || 0 : 0);
  // Organisation repos the user pushed to are not in their own repo list, so look each one up (capped).
  const ownNames = new Set(own.map((repo) => `${username}/${repo.name}`.toLowerCase()));
  const orgLookups = await Promise.all(
    eventNames
      .filter((name) => !ownNames.has(name.toLowerCase()))
      .slice(0, 5)
      .map(async (name) => {
        try {
          const response = await fetch(`https://api.github.com/repos/${name}`, init);
          if (!response.ok) return null;
          const repo = (await response.json()) as RawRepo;
          return typeof repo.name === "string" && typeof repo.html_url === "string" && repo.archived !== true ? repo : null;
        } catch {
          return null;
        }
      }),
  );
  // A repo found through a recent push event is active by definition.
  const eventRepos = orgLookups.filter((repo): repo is RawRepo => repo !== null);
  const active = [...own, ...eventRepos].filter((repo) => pushed(repo) >= since.getTime() || eventRepos.includes(repo));
  const byRecentPush = [...active].sort((a, b) => pushed(b) - pushed(a));

  return {
    username,
    publicRepos: typeof user.public_repos === "number" ? user.public_repos : own.length,
    totalStars: own.reduce((sum, repo) => sum + stars(repo), 0),
    activeRepoCount: active.length,
    commitsLast30Days,
    recentRepos: byRecentPush.slice(0, 3).map((repo) => toRepo(repo, username)),
    pinnedRepos: pinned,
  };
}

// The last good result per user. If GitHub is down or rate limiting, showing slightly old stats beats hiding the section.
const lastGood = new Map<string, GithubActivity>();

export function clearGithubLastGood(): void {
  lastGood.clear();
}

/**
 * Retries quick failures once (a timeout is not retried: this runs while the home page renders). If GitHub still
 * cannot be reached the last good stats are shown, and only when there are none does the section hide.
 */
export async function getGithubActivity(username: string, now: Date = new Date()): Promise<GithubActivity | null> {
  try {
    const activity = await retry(() => loadGithubActivity(username, now), {
      delaysMs: [300],
      shouldRetry: (error) => isTransientError(error) && !isTimeoutError(error),
      onRecovered: () => void recordHeal("github", "retried"),
    });
    lastGood.set(username, activity);
    return activity;
  } catch {
    const stale = lastGood.get(username);
    if (stale) void recordHeal("github", "served-last-good");
    return stale ?? null;
  }
}
