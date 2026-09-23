import { render, screen, within } from "@testing-library/react";

import { auth } from "@/auth";
import { getDashboardData } from "@/lib/analytics/repository";
import type { DashboardData } from "@/lib/analytics/repository";

import AnalyticsPage from "./page";

jest.mock("@/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/analytics/repository", () => ({ getDashboardData: jest.fn() }));
jest.mock("@/lib/content/blog", () => ({
  listBlogPosts: () => [
    { slug: "quiet-post", title: "Quiet Post", date: "2026-01-01", summary: "" },
    { slug: "popular-post", title: "Popular Post", date: "2026-02-01", summary: "" },
  ],
}));
jest.mock("@/components/analytics/MessageInbox", () => ({ MessageInbox: ({ initialMessages }: { initialMessages: unknown[] }) => <div>inbox with {initialMessages.length} messages</div> }));

const mockAuth = auth as unknown as jest.Mock;
const mockData = jest.mocked(getDashboardData);

const data: DashboardData = {
  days: 30,
  summary: { views: 120, visitors: 45, contactClicks: 3, messages: 2, unreadMessages: 1, previous: { views: 100, visitors: 50, contactClicks: 0, messages: 2 } },
  daily: [{ day: "2026-09-22", views: 60, visitors: 20 }, { day: "2026-09-23", views: 60, visitors: 25 }],
  topPages: [{ path: "/", views: 80, visitors: 40 }, { path: "/blog/popular-post", views: 40, visitors: 20 }],
  blog: [{ path: "/blog/popular-post", views: 40, visitors: 20, previousViews: 10 }],
  sources: [{ source: "linkedin.com", visits: 10, visitors: 9 }, { source: "direct", visits: 5, visitors: 5 }],
  contactClicks: [{ target: "email", clicks: 3, visitors: 2 }],
  messages: [],
  funnel: { visitors: 45, viewedProject: 18, reachedOut: 4 },
  campaigns: [{ tag: "resume-june", visits: 6, visitors: 5, viewedProject: 3, reachedOut: 1 }],
  countries: [{ country: "IN", views: 70, visitors: 30 }, { country: "US", views: 20, visitors: 10 }],
  cities: [{ city: "Pune", country: "IN", views: 50, visitors: 20 }],
  devices: [{ label: "desktop", views: 90 }, { label: "mobile", views: 30 }],
  browsers: [{ label: "Chrome", views: 100 }, { label: "Safari", views: 20 }],
  engagement: [{ path: "/blog/popular-post", avgSeconds: 95, avgScroll: 72, samples: 12 }],
  behavior: {
    entryPages: [{ path: "/", count: 30 }, { path: "/blog/popular-post", count: 10 }],
    exitPages: [{ path: "/projects/alpha", count: 12 }],
    bounce: { total: 45, single: 18 },
    audience: { newVisitors: 32, returningVisitors: 8 },
  },
  recent: [
    { at: "2026-09-23T11:55:00Z", kind: "message", path: "", country: "", city: "", device: "", detail: "Ada" },
    { at: "2026-09-23T11:50:00Z", kind: "pageview", path: "/blog/popular-post", country: "IN", city: "Pune", device: "desktop", detail: "" },
  ],
};

async function renderPage(days?: string) {
  render(await AnalyticsPage({ searchParams: Promise.resolve({ days }) }));
}

beforeEach(() => {
  mockData.mockResolvedValue(data);
});

describe("analytics dashboard page", () => {
  it("shows the summary, sources, blog performance and outreach for the Admin", async () => {
    mockAuth.mockResolvedValue({ role: "Admin", user: {} });

    await renderPage();

    expect(mockData).toHaveBeenCalledWith(30);
    const summary = screen.getByRole("region", { name: "Summary" });
    expect(within(summary).getByText("120")).toBeInTheDocument();
    expect(within(summary).getByText("45")).toBeInTheDocument();
    expect(screen.getByText("LinkedIn")).toBeInTheDocument();
    expect(screen.getByText("Direct / unknown")).toBeInTheDocument();
    expect(within(screen.getByRole("heading", { name: "Top pages" }).closest("section")!).getByText("Home")).toBeInTheDocument();
    expect(screen.getByText(/3 contact-link clicks/)).toBeInTheDocument();
    expect(screen.getByText("inbox with 0 messages")).toBeInTheDocument();
  });

  it("shows the visitor journey, campaign results and audience breakdowns", async () => {
    mockAuth.mockResolvedValue({ role: "Admin", user: {} });

    await renderPage();

    expect(screen.getByText(/40% of visitors/)).toBeInTheDocument();
    expect(screen.getByText(/Opened a project/, { selector: "span" })).toBeInTheDocument();
    const campaigns = screen.getByRole("heading", { name: "Campaign links" }).closest("section")!;
    expect(within(campaigns).getByRole("row", { name: /resume-june 6 5 3 1/ })).toBeInTheDocument();
    expect(screen.getByText("India")).toBeInTheDocument();
    expect(screen.getByText("United States")).toBeInTheDocument();
    expect(screen.getByText("Pune, India")).toBeInTheDocument();
    expect(screen.getByText("Desktop")).toBeInTheDocument();
    expect(screen.getByText("Safari")).toBeInTheDocument();
  });

  it("shows entry and exit pages, bounce rate and new versus returning visitors", async () => {
    mockAuth.mockResolvedValue({ role: "Admin", user: {} });

    await renderPage();

    const behavior = screen.getByRole("heading", { name: "How people move through the site" }).closest("section")!;
    expect(within(behavior).getByText("/projects/alpha")).toBeInTheDocument();
    expect(within(behavior).getByText(/30 visits/)).toBeInTheDocument();
    expect(within(behavior).getByText("40%")).toBeInTheDocument();
    expect(within(behavior).getByText("18 of 45 visitors looked at one page and left.")).toBeInTheDocument();
    expect(within(behavior).getByText("Returning browsers")).toBeInTheDocument();
    expect(within(behavior).getByText(/8 visitors/)).toBeInTheDocument();
  });

  it("offers CSV downloads scoped to the selected range", async () => {
    mockAuth.mockResolvedValue({ role: "Admin", user: {} });

    await renderPage("90");

    expect(screen.getByRole("link", { name: "Download events (CSV)" })).toHaveAttribute("href", "/api/export?type=events&days=90");
    expect(screen.getByRole("link", { name: "Download messages (CSV)" })).toHaveAttribute("href", "/api/export?type=messages");
  });

  it("shows reading time and scroll depth per post, and the recent activity feed", async () => {
    mockAuth.mockResolvedValue({ role: "Admin", user: {} });

    await renderPage();

    const blogSection = screen.getByRole("heading", { name: "Blog performance" }).closest("section")!;
    const popular = within(blogSection).getByRole("row", { name: /Popular Post/ });
    expect(popular).toHaveTextContent("1m 35s");
    expect(popular).toHaveTextContent("72%");
    expect(within(blogSection).getByRole("row", { name: /Quiet Post/ })).toHaveTextContent("-");

    const feed = screen.getByRole("heading", { name: "Recent activity" }).closest("section")!;
    expect(within(feed).getByText("Ada sent a message")).toBeInTheDocument();
    expect(within(feed).getByText("Viewed /blog/popular-post")).toBeInTheDocument();
  });

  it("lists every blog post, including ones with no views, most viewed first", async () => {
    mockAuth.mockResolvedValue({ role: "Admin", user: {} });

    await renderPage();

    const blogSection = screen.getByRole("heading", { name: "Blog performance" }).closest("section")!;
    const rows = within(blogSection).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("Popular Post");
    expect(rows[0]).toHaveTextContent("40");
    expect(rows[1]).toHaveTextContent("Quiet Post");
    expect(rows[1]).toHaveTextContent("0");
  });

  it("honors a valid range and falls back to 30 days for anything else", async () => {
    mockAuth.mockResolvedValue({ role: "Admin", user: {} });

    await renderPage("7");
    expect(mockData).toHaveBeenLastCalledWith(7);

    await renderPage("9999");
    expect(mockData).toHaveBeenLastCalledWith(30);
  });

  it.each([["a Visitor", { role: "Visitor", user: {} }], ["a signed-out user", null]])("does not query or show data for %s", async (_label, session) => {
    mockAuth.mockResolvedValue(session);

    await renderPage();

    expect(mockData).not.toHaveBeenCalled();
    expect(screen.queryByRole("region", { name: "Summary" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
