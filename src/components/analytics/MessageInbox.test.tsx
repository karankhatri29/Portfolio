import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MessageInbox } from "@/components/analytics/MessageInbox";

const messages = [
  { id: "1", createdAt: "2026-09-23T10:00:00Z", name: "Ada", email: "ada@example.com", message: "Hello Karan", status: "new" as const },
  { id: "2", createdAt: "2026-09-22T10:00:00Z", name: "Grace", email: "grace@example.com", message: "Old note", status: "archived" as const },
];

describe("MessageInbox", () => {
  it("shows every message that was created, with sender, email and text", () => {
    render(<MessageInbox initialMessages={messages} />);
    expect(screen.getByText("Hello Karan")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ada@example.com" })).toHaveAttribute("href", "mailto:ada@example.com");
    expect(screen.getByText("Old note")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^All \(2\)/ })).toBeInTheDocument();
  });

  it("shows a new message when the dashboard refreshes with fresh data", () => {
    const { rerender } = render(<MessageInbox initialMessages={messages} />);
    const fresh = { id: "3", createdAt: "2026-09-24T09:00:00Z", name: "Linus", email: "linus@example.com", message: "Just arrived", status: "new" as const };
    rerender(<MessageInbox initialMessages={[fresh, ...messages]} />);
    expect(screen.getByText("Just arrived")).toBeInTheDocument();
  });

  it("filters by status and explains an empty inbox", async () => {
    render(<MessageInbox initialMessages={messages} />);
    await userEvent.click(screen.getByRole("button", { name: /^Replied/ }));
    expect(screen.getByText("No messages here yet.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /^New/ }));
    expect(screen.getByText("Hello Karan")).toBeInTheDocument();
    expect(screen.queryByText("Old note")).not.toBeInTheDocument();
  });
});
