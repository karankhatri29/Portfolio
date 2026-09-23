export type GithubRepo = { name: string; url: string; description: string; language: string; stars: number };
export type GithubActivity = { username: string; publicRepos: number; followers: number; totalStars: number; topRepos: GithubRepo[] };

export function githubUsername(links: { href: string }[]): string | null {
  for (const link of links) {
    const match = /^https:\/\/github\.com\/([\w-]+)\/?$/.exec(link.href);
    if (match) return match[1];
  }
  return null;
}

type RawRepo = { name?: unknown; html_url?: unknown; description?: unknown; language?: unknown; stargazers_count?: unknown; fork?: unknown; archived?: unknown };

function headers(): Record<string, string> {
  const base: Record<string, string> = { accept: "application/vnd.github+json", "user-agent": "portfolio-site" };
  return process.env.GITHUB_TOKEN ? { ...base, authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : base;
}

// Public data, cached for an hour. Any failure hides the section instead of breaking the page.
export async function getGithubActivity(username: string): Promise<GithubActivity | null> {
  try {
    const init = { headers: headers(), next: { revalidate: 3600 }, signal: AbortSignal.timeout(4000) } as RequestInit;
    const [userResponse, reposResponse] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`, init),
      fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, init),
    ]);
    if (!userResponse.ok || !reposResponse.ok) return null;

    const user = (await userResponse.json()) as { public_repos?: unknown; followers?: unknown };
    const repos = (await reposResponse.json()) as RawRepo[];
    if (!Array.isArray(repos)) return null;

    const own = repos.filter((repo) => repo.fork !== true && repo.archived !== true && typeof repo.name === "string" && typeof repo.html_url === "string");
    const stars = (repo: RawRepo) => (typeof repo.stargazers_count === "number" ? repo.stargazers_count : 0);

    return {
      username,
      publicRepos: typeof user.public_repos === "number" ? user.public_repos : own.length,
      followers: typeof user.followers === "number" ? user.followers : 0,
      totalStars: own.reduce((sum, repo) => sum + stars(repo), 0),
      topRepos: [...own]
        .sort((a, b) => stars(b) - stars(a))
        .slice(0, 3)
        .map((repo) => ({
          name: repo.name as string,
          url: repo.html_url as string,
          description: typeof repo.description === "string" ? repo.description : "",
          language: typeof repo.language === "string" ? repo.language : "",
          stars: stars(repo),
        })),
    };
  } catch {
    return null;
  }
}
