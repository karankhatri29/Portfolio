import type { DashboardData } from "@/lib/analytics/repository";
import { buildDigest } from "@/lib/notify/digest";

function data(overrides: Partial<DashboardData> = {}): DashboardData {
  return {
    days: 7,
    summary: { views: 120, visitors: 45, contactClicks: 3, messages: 2, unreadMessages: 1, previous: { views: 100, visitors: 50, contactClicks: 0, messages: 2 } },
    daily: [],
    topPages: [{ path: "/", views: 80, visitors: 40 }, { path: "/blog/a", views: 40, visitors: 20 }],
    blog: [{ path: "/blog/a", views: 40, visitors: 20, previousViews: 10 }],
    sources: [{ source: "linkedin.com", visits: 10, visitors: 9 }, { source: "direct", visits: 5, visitors: 5 }],
    contactClicks: [],
    messages: [],
    funnel: { visitors: 45, viewedProject: 10, reachedOut: 2 },
    campaigns: [],
    countries: [],
    cities: [],
    devices: [],
    browsers: [],
    engagement: [],
    recent: [],
    behavior: { entryPages: [], exitPages: [], bounce: { total: 0, single: 0 }, audience: { newVisitors: 0, returningVisitors: 0 } },
    errors: { total: 0, groups: [] },
    ...overrides,
  };
}

describe("buildDigest", () => {
  it("summarises traffic, trends, top pages, source and best post", () => {
    const { subject, text } = buildDigest(data(), "https://me.example/", { "/blog/a": "Systems That Breathe" });

    expect(subject).toBe("Portfolio weekly digest: 120 views, 2 messages");
    expect(text).toContain("Page views: 120 (up 20% from the previous 7 days)");
    expect(text).toContain("Unique visitors: 45 (down 10% from the previous 7 days)");
    expect(text).toContain("Messages: 2 (1 unread in total)");
    expect(text).toContain("1. Home - 80 views");
    expect(text).toContain("Biggest source: LinkedIn (10 visits)");
    expect(text).toContain("Most read post: Systems That Breathe (40 views)");
    expect(text).toContain("Open the dashboard: https://me.example/admin/analytics");
  });

  it("flags logged errors and stays silent when there are none", () => {
    expect(buildDigest(data({ errors: { total: 4, groups: [] } }), "https://me.example").text).toContain("Errors: 4 logged");
    expect(buildDigest(data(), "https://me.example").text).not.toContain("Errors:");
  });

  it("handles a quiet week without optional sections", () => {
    const quiet = data({
      summary: { views: 0, visitors: 0, contactClicks: 0, messages: 1, unreadMessages: 0, previous: { views: 0, visitors: 0, contactClicks: 0, messages: 0 } },
      topPages: [],
      blog: [],
      sources: [],
    });

    const { subject, text } = buildDigest(quiet, "https://me.example");

    expect(subject).toBe("Portfolio weekly digest: 0 views, 1 message");
    expect(text).toContain("Page views: 0 (unchanged from the previous 7 days)");
    expect(text).not.toContain("Top pages");
    expect(text).not.toContain("Biggest source");
    expect(text).not.toContain("Most read post");
  });
});
