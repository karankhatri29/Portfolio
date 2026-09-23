import { browserName, clampInt, deviceType, groupSources, isBot, normalizePath, normalizeRefTag, percentChange, referrerHost, sourceLabel, visitorHash } from "@/lib/analytics/tracking";

describe("isBot", () => {
  it.each(["Googlebot/2.1", "Mozilla/5.0 (compatible; bingbot/2.0)", "curl/8.0", "HeadlessChrome/120", "Slackbot-LinkExpanding", ""])("flags %p", (agent) => {
    expect(isBot(agent)).toBe(true);
  });

  it("treats a real browser as human and a missing agent as a bot", () => {
    expect(isBot("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36")).toBe(false);
    expect(isBot(null)).toBe(true);
  });
});

describe("normalizePath", () => {
  it("strips query, hash and trailing slash", () => {
    expect(normalizePath("/blog/my-post/?ref=x#top")).toBe("/blog/my-post");
    expect(normalizePath("/")).toBe("/");
  });

  it.each(["", "blog", "//evil.com", "/admin", "/admin/analytics", "/api/track", 42, null, `/${"a".repeat(250)}`])("rejects %p", (value) => {
    expect(normalizePath(value)).toBeNull();
  });
});

describe("referrerHost", () => {
  it("returns the external host without www", () => {
    expect(referrerHost("https://www.linkedin.com/feed/", "mysite.com")).toBe("linkedin.com");
  });

  it("ignores same-site, empty and invalid referrers", () => {
    expect(referrerHost("https://mysite.com/blog", "mysite.com")).toBe("");
    expect(referrerHost("https://www.mysite.com/blog", "mysite.com:3000")).toBe("");
    expect(referrerHost("", "mysite.com")).toBe("");
    expect(referrerHost("not a url", "mysite.com")).toBe("");
  });
});

describe("normalizeRefTag", () => {
  it("accepts short slugs and rejects anything else", () => {
    expect(normalizeRefTag("LinkedIn-June")).toBe("linkedin-june");
    expect(normalizeRefTag("<script>")).toBe("");
    expect(normalizeRefTag(undefined)).toBe("");
  });
});

describe("deviceType", () => {
  it("classifies mobile, tablet and desktop", () => {
    expect(deviceType("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Mobile/15E148")).toBe("mobile");
    expect(deviceType("Mozilla/5.0 (iPad; CPU OS 17_0)")).toBe("tablet");
    expect(deviceType("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe("desktop");
  });
});

describe("visitorHash", () => {
  const day = new Date("2026-09-23T10:00:00Z");

  it("is stable within a day and changes across days and visitors", () => {
    const base = visitorHash("1.2.3.4", "agent", "secret", day);
    expect(visitorHash("1.2.3.4", "agent", "secret", new Date("2026-09-23T23:00:00Z"))).toBe(base);
    expect(visitorHash("1.2.3.4", "agent", "secret", new Date("2026-09-24T01:00:00Z"))).not.toBe(base);
    expect(visitorHash("5.6.7.8", "agent", "secret", day)).not.toBe(base);
  });

  it("never contains the raw ip", () => {
    expect(visitorHash("1.2.3.4", "agent", "secret", day)).not.toContain("1.2.3.4");
  });
});

describe("sourceLabel", () => {
  it("labels known hosts, direct traffic and campaign tags", () => {
    expect(sourceLabel("linkedin.com")).toBe("LinkedIn");
    expect(sourceLabel("lnkd.in")).toBe("LinkedIn");
    expect(sourceLabel("www.google.co.in".replace("www.", ""))).toBe("Google");
    expect(sourceLabel("direct")).toBe("Direct / unknown");
    expect(sourceLabel("resume-june")).toBe("Campaign: resume-june");
    expect(sourceLabel("someblog.dev")).toBe("someblog.dev");
  });
});

describe("percentChange", () => {
  it("handles growth, decline, zero baselines", () => {
    expect(percentChange(150, 100)).toBe(50);
    expect(percentChange(50, 100)).toBe(-50);
    expect(percentChange(0, 0)).toBe(0);
    expect(percentChange(5, 0)).toBeNull();
  });
});

describe("groupSources", () => {
  it("merges hosts that share a label and sorts by visits", () => {
    const rows = [
      { source: "google.com", visits: 2, visitors: 2 },
      { source: "direct", visits: 5, visitors: 4 },
      { source: "google.co.in", visits: 1, visitors: 1 },
    ];

    expect(groupSources(rows)).toEqual([
      { label: "Direct / unknown", visits: 5, visitors: 4 },
      { label: "Google", visits: 3, visitors: 3 },
    ]);
  });
});

describe("browserName", () => {
  it.each([
    ["Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/120.0 Safari/537.36 Edg/120.0", "Edge"],
    ["Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/120.0 Safari/537.36 OPR/106.0", "Opera"],
    ["Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 SamsungBrowser/23.0 Mobile Safari/537.36", "Samsung Internet"],
    ["Mozilla/5.0 (Windows NT 10.0; rv:121.0) Gecko/20100101 Firefox/121.0", "Firefox"],
    ["Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/120.0 Safari/537.36", "Chrome"],
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1", "Safari"],
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15 CriOS/120.0 Mobile/15E148 Safari/604.1", "Chrome"],
    ["SomethingElse/1.0", "Other"],
  ])("classifies %#", (agent, expected) => {
    expect(browserName(agent)).toBe(expected);
  });
});

describe("clampInt", () => {
  it("rounds in-range numbers and rejects everything else", () => {
    expect(clampInt(12.6, 1, 1800)).toBe(13);
    expect(clampInt(0, 1, 1800)).toBeNull();
    expect(clampInt(5000, 1, 1800)).toBeNull();
    expect(clampInt("12", 1, 1800)).toBeNull();
    expect(clampInt(NaN, 1, 1800)).toBeNull();
  });
});
