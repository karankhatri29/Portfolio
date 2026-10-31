/**
 * @jest-environment node
 */
import { getGithubActivity, githubUsername } from "@/lib/github";

const fetchMock = jest.fn();
const ok = (body: unknown) => Promise.resolve({ ok: true, json: async () => body });

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

describe("githubUsername", () => {
  it("finds the profile link and ignores repo links and other sites", () => {
    expect(githubUsername([{ href: "mailto:a@b.co" }, { href: "https://github.com/karankhatri29" }])).toBe("karankhatri29");
    expect(githubUsername([{ href: "https://github.com/karankhatri29/" }])).toBe("karankhatri29");
    expect(githubUsername([{ href: "https://github.com/me/repo" }, { href: "https://linkedin.com/in/me" }])).toBeNull();
  });
});

describe("getGithubActivity", () => {
  const now = new Date("2026-10-31T12:00:00Z");
  const repos = [
    { name: "small", html_url: "https://github.com/me/small", description: "Small", language: "Python", stargazers_count: 2, fork: false, archived: false, pushed_at: "2026-10-05T00:00:00Z" },
    { name: "big", html_url: "https://github.com/me/big", description: null, language: null, stargazers_count: 40, fork: false, archived: false, pushed_at: "2026-10-30T00:00:00Z" },
    { name: "forked", html_url: "https://github.com/me/forked", stargazers_count: 999, fork: true, pushed_at: "2026-10-31T00:00:00Z" },
    { name: "old", html_url: "https://github.com/me/old", stargazers_count: 500, archived: true, pushed_at: "2026-10-31T00:00:00Z" },
    { name: "mid", html_url: "https://github.com/me/mid", description: "Mid", language: "Go", stargazers_count: 10, pushed_at: "2026-05-01T00:00:00Z" },
    { name: "extra", html_url: "https://github.com/me/extra", stargazers_count: 1, pushed_at: "2025-01-01T00:00:00Z" },
  ];
  const route = (commits: () => Promise<unknown>) => (url: string) => {
    if (url.includes("/search/commits")) return commits();
    return url.includes("/repos?") ? ok(repos) : ok({ public_repos: 12 });
  };

  it("summarises own repositories, recent activity and the 30-day commit count", async () => {
    fetchMock.mockImplementation(route(() => ok({ total_count: 87 })));

    const activity = await getGithubActivity("me", now);

    expect(activity).toMatchObject({ username: "me", publicRepos: 12, totalStars: 53, activeRepoCount: 2, commitsLast30Days: 87 });
    expect(activity?.recentRepos.map((repo) => repo.name)).toEqual(["big", "small"]);
    expect(activity?.recentRepos[0]).toMatchObject({ description: "", language: "", stars: 40, pushedAt: "2026-10-30T00:00:00Z" });
    expect(fetchMock.mock.calls.map(([url]) => url).find((url: string) => url.includes("/search/commits"))).toContain("author:me+committer-date:>=2026-10-01");
  });

  it("still renders when commit search fails or is rate limited", async () => {
    fetchMock.mockImplementation(route(() => Promise.resolve({ ok: false, json: async () => ({}) })));
    expect((await getGithubActivity("me", now))?.commitsLast30Days).toBeNull();

    fetchMock.mockImplementation(route(() => Promise.reject(new Error("offline"))));
    expect((await getGithubActivity("me", now))?.activeRepoCount).toBe(2);
  });

  it("includes organisation repos from recent pushes and skips stale or failing ones", async () => {
    const events = [
      { type: "PushEvent", created_at: "2026-10-29T00:00:00Z", repo: { name: "acme/platform" } },
      { type: "PushEvent", created_at: "2026-10-28T00:00:00Z", repo: { name: "acme/platform" } },
      { type: "PushEvent", created_at: "2026-10-27T00:00:00Z", repo: { name: "me/big" } },
      { type: "PushEvent", created_at: "2026-08-01T00:00:00Z", repo: { name: "acme/stale" } },
      { type: "WatchEvent", created_at: "2026-10-30T00:00:00Z", repo: { name: "acme/starred" } },
      { type: "PushEvent", created_at: "2026-10-26T00:00:00Z", repo: { name: "acme/gone" } },
    ];
    const platform = { name: "platform", html_url: "https://github.com/acme/platform", description: "Org repo", language: "Go", stargazers_count: 3, pushed_at: "2026-10-31T09:00:00Z", owner: { login: "acme" } };
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/search/commits")) return ok({ total_count: 5 });
      if (url.includes("/events/public")) return ok(events);
      if (url.endsWith("/repos/acme/platform")) return ok(platform);
      if (url.includes("/repos/acme/")) return Promise.resolve({ ok: false, json: async () => ({}) });
      return url.includes("/repos?") ? ok(repos) : ok({ public_repos: 12 });
    });

    const activity = await getGithubActivity("me", now);

    expect(activity?.activeRepoCount).toBe(3);
    expect(activity?.recentRepos.map((repo) => `${repo.owner}/${repo.name}`)).toEqual(["acme/platform", "me/big", "me/small"]);
    const lookups = fetchMock.mock.calls.map(([url]) => url as string).filter((url) => url.includes("/repos/acme/"));
    expect(lookups.sort()).toEqual(["https://api.github.com/repos/acme/gone", "https://api.github.com/repos/acme/platform"]);
  });

  it("reads pinned repositories, organisation ones included, only when a token is configured", async () => {
    const env = process.env as Record<string, string | undefined>;
    const nodes = [
      { name: "platform", url: "https://github.com/acme/platform", description: "Org", stargazerCount: 9, pushedAt: "2026-10-20T00:00:00Z", primaryLanguage: { name: "Go" }, owner: { login: "acme" } },
      { name: "mine", url: "https://github.com/me/mine", description: null, stargazerCount: 0, pushedAt: "2026-10-01T00:00:00Z", primaryLanguage: null, owner: { login: "me" } },
    ];
    fetchMock.mockImplementation((url: string) => {
      if (url.endsWith("/graphql")) return ok({ data: { user: { pinnedItems: { nodes } } } });
      return url.includes("/search/commits") ? ok({ total_count: 1 }) : url.includes("/repos?") ? ok([]) : ok({});
    });

    delete env.GITHUB_TOKEN;
    expect((await getGithubActivity("me", now))?.pinnedRepos).toEqual([]);
    expect(fetchMock.mock.calls.some(([url]) => (url as string).endsWith("/graphql"))).toBe(false);

    env.GITHUB_TOKEN = "t0ken";
    const activity = await getGithubActivity("me", now);
    delete env.GITHUB_TOKEN;

    expect(activity?.pinnedRepos.map((repo) => `${repo.owner}/${repo.name}`)).toEqual(["acme/platform", "me/mine"]);
    expect(activity?.pinnedRepos[0]).toMatchObject({ language: "Go", stars: 9, description: "Org" });
  });

  it("asks for public data with a token only when one is configured", async () => {
    fetchMock.mockImplementation(() => ok([]));
    const env = process.env as Record<string, string | undefined>;
    delete env.GITHUB_TOKEN;

    await getGithubActivity("me");
    expect(fetchMock.mock.calls[0][1].headers.authorization).toBeUndefined();

    env.GITHUB_TOKEN = "t0ken";
    await getGithubActivity("me");
    expect(fetchMock.mock.calls[4][1].headers.authorization).toBe("Bearer t0ken");
    delete env.GITHUB_TOKEN;
  });

  it("returns null instead of throwing on rate limits, bad shapes and network errors", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) });
    expect(await getGithubActivity("me")).toBeNull();

    fetchMock.mockImplementation((url: string) => (url.includes("/repos") ? ok({ message: "not a list" }) : ok({})));
    expect(await getGithubActivity("me")).toBeNull();

    fetchMock.mockRejectedValue(new Error("offline"));
    expect(await getGithubActivity("me")).toBeNull();
  });
});
