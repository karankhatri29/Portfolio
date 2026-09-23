import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { BarList } from "@/components/analytics/BarList";
import { MessageInbox } from "@/components/analytics/MessageInbox";
import { StatCard } from "@/components/analytics/StatCard";
import { TrafficChart } from "@/components/analytics/TrafficChart";
import type { ContactMessage } from "@/lib/analytics/repository";

describe("StatCard", () => {
  it("shows the value and growth against the previous period", () => {
    render(<StatCard label="Page views" value={1200} previous={1000} days={30} />);

    expect(screen.getByText("Page views")).toBeInTheDocument();
    expect(screen.getByText("1,200")).toBeInTheDocument();
    expect(screen.getByText(/▲ 20%/)).toBeInTheDocument();
    expect(screen.getByText(/vs previous 30 days/)).toBeInTheDocument();
  });

  it("shows decline, no change and new activity", () => {
    const { rerender } = render(<StatCard label="Views" value={50} previous={100} days={7} />);
    expect(screen.getByText(/▼ 50%/)).toBeInTheDocument();

    rerender(<StatCard label="Views" value={0} previous={0} days={7} />);
    expect(screen.getByText(/No change/)).toBeInTheDocument();

    rerender(<StatCard label="Views" value={4} previous={0} days={7} />);
    expect(screen.getByText(/New/)).toBeInTheDocument();
  });
});

describe("BarList", () => {
  it("renders labelled rows and an empty state", () => {
    const { rerender } = render(<BarList unit="views" emptyText="Nothing yet." items={[{ label: "Home", value: 10, detail: "4 visitors" }, { label: "/blog", value: 5 }]} />);

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText(/10 views · 4 visitors/)).toBeInTheDocument();

    rerender(<BarList unit="views" emptyText="Nothing yet." items={[]} />);
    expect(screen.getByText("Nothing yet.")).toBeInTheDocument();
  });
});

describe("TrafficChart", () => {
  const data = [
    { day: "2026-09-21", views: 2, visitors: 1 },
    { day: "2026-09-22", views: 8, visitors: 5 },
    { day: "2026-09-23", views: 4, visitors: 3 },
  ];

  it("draws an accessible chart with a data table fallback", () => {
    render(<TrafficChart data={data} />);

    expect(screen.getByRole("img", { name: /Sep 21 to Sep 23/ })).toBeInTheDocument();
    const table = screen.getByRole("table", { name: "Daily traffic" });
    expect(within(table).getAllByRole("row")).toHaveLength(4);
  });

  it("explains when there is no traffic yet", () => {
    render(<TrafficChart data={data.map((point) => ({ ...point, views: 0, visitors: 0 }))} />);

    expect(screen.getByText(/No page views recorded/)).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});

describe("MessageInbox", () => {
  const messages: ContactMessage[] = [
    { id: "m1", createdAt: "2026-09-23T10:00:00Z", name: "Ada", email: "ada@example.com", message: "Hello there, lets talk.", status: "new" },
    { id: "m2", createdAt: "2026-09-22T10:00:00Z", name: "Grace", email: "grace@example.com", message: "Older message here.", status: "archived" },
  ];
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("lists messages with counts and filters by status", async () => {
    const user = userEvent.setup();
    render(<MessageInbox initialMessages={messages} />);

    expect(screen.getByRole("button", { name: "All (2)" })).toBeInTheDocument();
    expect(screen.getByText("Hello there, lets talk.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Archived (1)" }));

    expect(screen.queryByText("Hello there, lets talk.")).not.toBeInTheDocument();
    expect(screen.getByText("Older message here.")).toBeInTheDocument();
  });

  it("updates a status through the API and reflects it", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true }) });
    render(<MessageInbox initialMessages={messages} />);

    await user.click(screen.getByRole("button", { name: "Mark replied for Ada" }));

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ id: "m1", status: "replied" });
    expect(await screen.findByRole("button", { name: "Replied (1)" })).toBeInTheDocument();
  });

  it("shows an error and keeps the status when the update fails", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    render(<MessageInbox initialMessages={messages} />);

    await user.click(screen.getByRole("button", { name: "Mark replied for Ada" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not update");
    expect(screen.getByRole("button", { name: "New (1)" })).toBeInTheDocument();
  });

  it("shows an empty state", () => {
    render(<MessageInbox initialMessages={[]} />);

    expect(screen.getByText("No messages here yet.")).toBeInTheDocument();
  });
});
