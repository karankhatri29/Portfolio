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
  const repos = [
    { name: "small", html_url: "https://github.com/me/small", description: "Small", language: "Python", stargazers_count: 2, fork: false, archived: false },
    { name: "big", html_url: "https://github.com/me/big", description: null, language: null, stargazers_count: 40, fork: false, archived: false },
    { name: "forked", html_url: "https://github.com/me/forked", stargazers_count: 999, fork: true },
    { name: "old", html_url: "https://github.com/me/old", stargazers_count: 500, archived: true },
    { name: "mid", html_url: "https://github.com/me/mid", description: "Mid", language: "Go", stargazers_count: 10 },
    { name: "extra", html_url: "https://github.com/me/extra", stargazers_count: 1 },
  ];

  it("summarises own, active repositories and ranks the top three by stars", async () => {
    fetchMock.mockImplementation((url: string) => (url.endsWith("/repos?per_page=100&sort=updated") ? ok(repos) : ok({ public_repos: 12, followers: 7 })));

    const activity = await getGithubActivity("me");

    expect(activity).toMatchObject({ username: "me", publicRepos: 12, followers: 7, totalStars: 53 });
    expect(activity?.topRepos.map((repo) => repo.name)).toEqual(["big", "mid", "small"]);
    expect(activity?.topRepos[0]).toMatchObject({ description: "", language: "", stars: 40 });
  });

  it("asks for public data with a token only when one is configured", async () => {
    fetchMock.mockImplementation(() => ok([]));
    const env = process.env as Record<string, string | undefined>;
    delete env.GITHUB_TOKEN;

    await getGithubActivity("me");
    expect(fetchMock.mock.calls[0][1].headers.authorization).toBeUndefined();

    env.GITHUB_TOKEN = "t0ken";
    await getGithubActivity("me");
    expect(fetchMock.mock.calls[2][1].headers.authorization).toBe("Bearer t0ken");
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
