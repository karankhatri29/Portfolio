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
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText(/3 contact-link clicks/)).toBeInTheDocument();
    expect(screen.getByText("inbox with 0 messages")).toBeInTheDocument();
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
