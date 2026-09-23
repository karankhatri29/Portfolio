import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { HeroTerminal } from "@/components/terminal/HeroTerminal";
import type { TerminalContext } from "@/lib/ask/commands";

const context: TerminalContext = {
  name: "Karan Kaushik Khatri",
  focus: [{ command: "whoami", output: "backend · data · applied AI" }],
  skills: [{ name: "AI and NLP", tools: ["spaCy"] }],
  projects: [{ title: "Email Triage", year: "2026", href: "/projects/triage" }],
  contacts: [{ label: "Email", text: "me@example.com", href: "mailto:me@example.com" }],
};

// jsdom does not implement the dialog methods; mimic what a browser does.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

const renderTerminal = () => render(<HeroTerminal context={context}><div data-testid="card">terminal card</div></HeroTerminal>);
const openButton = () => screen.getByRole("button", { name: /open the interactive terminal/i });
const box = () => screen.getByRole("textbox", { name: /type a command or ask a question/i });
const log = () => within(screen.getByRole("log", { name: "Terminal output" }));

function type(value: string) {
  fireEvent.change(box(), { target: { value } });
  fireEvent.submit(box().closest("form")!);
}

function mockFetch(impl: (...args: unknown[]) => Promise<unknown>) {
  const fetchMock = jest.fn(impl);
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}
const reply = (body: unknown, ok = true) => Promise.resolve({ ok, json: async () => body });

afterEach(() => {
  jest.useRealTimers();
  document.documentElement.classList.remove("terminal-open");
});

describe("HeroTerminal", () => {
  it("shows the card and keeps the dialog closed until asked", () => {
    renderTerminal();

    expect(screen.getByTestId("card")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens from the Ask button or by tapping the card, with a welcome and the cursor in the input", () => {
    const { unmount } = renderTerminal();
    fireEvent.click(openButton());
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(log().getByText(/I'm Karan's terminal/)).toBeInTheDocument();
    expect(box()).toHaveFocus();
    unmount();

    renderTerminal();
    fireEvent.click(screen.getByTestId("card"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("locks page scroll while open and releases it on close", async () => {
    renderTerminal();
    fireEvent.click(openButton());
    expect(document.documentElement).toHaveClass("terminal-open");

    fireEvent.click(screen.getByRole("button", { name: "Close terminal" }));
    await waitFor(() => expect(document.documentElement).not.toHaveClass("terminal-open"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on the exit command, on the browser's own close event (Esc), and on a backdrop click", () => {
    renderTerminal();
    fireEvent.click(openButton());
    type("exit");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(openButton());
    fireEvent(screen.getByRole("dialog"), new Event("close"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(openButton());
    fireEvent.click(screen.getByRole("dialog")); // target is the dialog element itself, i.e. the backdrop
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("answers built-in commands instantly without calling the assistant", () => {
    const fetchMock = mockFetch(() => reply({}));
    renderTerminal();
    fireEvent.click(openButton());

    type("help");
    expect(log().getByText(/whoami/)).toBeInTheDocument();
    type("skills");
    expect(log().getByText("AI and NLP: spaCy")).toBeInTheDocument();
    type("contact");
    expect(log().getByRole("link", { name: "Email: me@example.com" })).toHaveAttribute("href", "mailto:me@example.com");

    expect(fetchMock).not.toHaveBeenCalled();
    expect(box()).toHaveValue("");
  });

  it("links projects to their pages and closes the terminal when one is followed", () => {
    renderTerminal();
    fireEvent.click(openButton());
    type("projects");

    const link = log().getByRole("link", { name: "Email Triage (2026)" });
    expect(link).toHaveAttribute("href", "/projects/triage");
    fireEvent.click(link);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("clears the screen", () => {
    renderTerminal();
    fireEvent.click(openButton());
    type("help");
    type("clear");

    expect(log().queryByText(/Commands:/)).not.toBeInTheDocument();
    expect(log().queryByText(/whoami/)).not.toBeInTheDocument();
  });

  it("sends other input to the assistant and shows the answer under the question", async () => {
    const fetchMock = mockFetch(() => reply({ answer: "He built Email Triage." }));
    renderTerminal();
    fireEvent.click(openButton());

    type("What has Karan built?");

    await waitFor(() => expect(log().getByText("He built Email Triage.")).toBeInTheDocument());
    expect(log().getByText("What has Karan built?")).toBeInTheDocument();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/ask");
    expect(JSON.parse(init.body as string)).toEqual({ question: "What has Karan built?" });
    expect(box()).not.toBeDisabled();
  });

  it("strips an explicit ask prefix before sending", async () => {
    const fetchMock = mockFetch(() => reply({ answer: "ok" }));
    renderTerminal();
    fireEvent.click(openButton());

    type("ask what is his CGPA?");

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)).toEqual({ question: "what is his CGPA?" });
  });

  it("plays the loading jokes in order while waiting, then shows the answer", async () => {
    jest.useFakeTimers();
    let resolve!: (value: unknown) => void;
    mockFetch(() => new Promise((r) => { resolve = r; }));
    renderTerminal();
    fireEvent.click(openButton());

    type("Is he open to work?");
    expect(box()).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Googling the answer…");
    expect(screen.getByRole("status")).toHaveTextContent("Working on an answer"); // hidden from sighted users, read by screen readers

    act(() => { jest.advanceTimersByTime(2000); });
    expect(screen.getByRole("status")).toHaveTextContent("…jk, I don't need Google for this.");

    act(() => { jest.advanceTimersByTime(2000); });
    expect(screen.getByRole("status")).toHaveTextContent("Consulting my very expensive crystal ball…");

    act(() => { jest.advanceTimersByTime(4000); });
    expect(screen.getByRole("status")).toHaveTextContent("Double-checking that Karan really did all that. (He did.)");

    await act(async () => { resolve({ ok: true, json: async () => ({ answer: "Yes, open to roles." }) }); });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(log().getByText("Yes, open to roles.")).toBeInTheDocument();
  });

  it("ignores further submissions while an answer is pending", () => {
    jest.useFakeTimers();
    const fetchMock = mockFetch(() => new Promise(() => undefined));
    renderTerminal();
    fireEvent.click(openButton());

    type("First question here");
    type("Second question here");
    fireEvent.click(screen.getByRole("button", { name: "How can I contact him?" }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shows the server's friendly message when the assistant refuses or is limited", async () => {
    mockFetch(() => reply({ error: "That's a lot of questions! Please try again in a little while." }, false));
    renderTerminal();
    fireEvent.click(openButton());

    type("What has Karan built?");

    await waitFor(() => expect(log().getByText(/That's a lot of questions/)).toBeInTheDocument());
    expect(box()).not.toBeDisabled();
  });

  it("recovers from a network failure with a generic message", async () => {
    mockFetch(() => Promise.reject(new Error("offline")));
    renderTerminal();
    fireEvent.click(openButton());

    type("What has Karan built?");

    await waitFor(() => expect(log().getByText(/Something went wrong/)).toBeInTheDocument());
    expect(box()).not.toBeDisabled();
  });

  it("rejects an over-long question locally instead of calling the assistant", () => {
    const fetchMock = mockFetch(() => reply({}));
    renderTerminal();
    fireEvent.click(openButton());

    type("a".repeat(205));

    expect(log().getByText(/under 200 characters/)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends a suggestion when it is clicked", async () => {
    const fetchMock = mockFetch(() => reply({ answer: "Yes." }));
    renderTerminal();
    fireEvent.click(openButton());

    fireEvent.click(within(screen.getByRole("list", { name: "Suggested questions" })).getByRole("button", { name: "Is he open to work?" }));

    await waitFor(() => expect(log().getByText("Yes.")).toBeInTheDocument());
    expect(JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)).toEqual({ question: "Is he open to work?" });
  });

  it("recalls earlier lines with the arrow keys", async () => {
    const user = userEvent.setup();
    renderTerminal();
    fireEvent.click(openButton());
    type("help");
    type("skills");

    box().focus();
    await user.keyboard("{ArrowUp}");
    expect(box()).toHaveValue("skills");
    await user.keyboard("{ArrowUp}");
    expect(box()).toHaveValue("help");
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(box()).toHaveValue("");
  });

  it("tells visitors what the assistant covers and that answers come from Gemini", () => {
    renderTerminal();
    fireEvent.click(openButton());

    expect(screen.getByText(/Answers come from Gemini and only cover Karan's work/)).toBeInTheDocument();
  });
});
