import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ContactForm } from "@/components/ContactForm";

const fetchMock = jest.fn();

function reply(status: number, body: unknown) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status, json: async () => body });
}

async function fill(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Your name"), "Ada");
  await user.type(screen.getByLabelText("Your email"), "ada@example.com");
  await user.type(screen.getByLabelText("Message"), "Hello, I would like to talk about a role.");
}

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

describe("ContactForm", () => {
  it("shows pending then success, posts the fields and clears the form", async () => {
    const user = userEvent.setup();
    let resolve: (value: unknown) => void = () => {};
    fetchMock.mockReturnValue(new Promise((r) => { resolve = r; }));
    render(<ContactForm />);

    await fill(user);
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(await screen.findByText("Sending...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();

    resolve({ ok: true, status: 201, json: async () => ({ ok: true }) });

    expect(await screen.findByText("Thanks, your message was sent.")).toBeInTheDocument();
    expect(screen.getByLabelText("Your name")).toHaveValue("");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/contact");
    expect(JSON.parse(init.body)).toMatchObject({ name: "Ada", email: "ada@example.com", website: "" });
  });

  it("lists validation errors and keeps what the visitor typed", async () => {
    const user = userEvent.setup();
    fetchMock.mockReturnValue(reply(400, { errors: ["email must be a valid address"] }));
    render(<ContactForm />);

    await fill(user);
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("email must be a valid address");
    expect(screen.getByLabelText("Your name")).toHaveValue("Ada");
  });

  it("shows the server's message for rate limits and a friendly one for network failures", async () => {
    const user = userEvent.setup();
    fetchMock.mockReturnValueOnce(reply(429, { error: "Too many messages. Please try again in a few minutes." }));
    render(<ContactForm />);

    await fill(user);
    await user.click(screen.getByRole("button", { name: "Send message" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Too many messages");

    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await user.click(screen.getByRole("button", { name: "Send message" }));
    expect(await screen.findByText(/Could not reach the server/)).toBeInTheDocument();
  });

  it("keeps the honeypot field out of the tab order and away from assistive tech", () => {
    render(<ContactForm />);

    const honeypot = screen.getByLabelText("Leave this empty", { selector: "input" });
    expect(honeypot).toHaveAttribute("tabindex", "-1");
    expect(honeypot.closest("[aria-hidden='true']")).not.toBeNull();
  });
});
