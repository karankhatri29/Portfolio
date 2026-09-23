import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { BlogEditor } from "@/components/BlogEditor";
import type { BlogPost } from "@/lib/content/blog";

jest.mock("@/components/MarkdownContent", () => ({ MarkdownContent: ({ children }: { children: string }) => <div data-testid="rendered">{children}</div> }));

const fetchMock = jest.fn();
const reply = (status: number, body: unknown) => Promise.resolve({ ok: status >= 200 && status < 300, status, json: async () => body });

const published: BlogPost = { slug: "live-post", title: "Live Post", date: "2026-05-01", summary: "Live.", content: "Some body text.", tags: ["ai"], status: "published" };
const draft: BlogPost = { slug: "wip", title: "Work In Progress", date: "2026-06-01", summary: "Not yet.", content: "Draft text.", tags: [], status: "draft" };

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

describe("post list", () => {
  it("shows status, date and the right link for published posts and drafts", () => {
    render(<BlogEditor initialPosts={[published, draft]} />);

    expect(screen.getByText("published")).toBeInTheDocument();
    expect(screen.getByText("draft")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View Live Post" })).toHaveAttribute("href", "/blog/live-post");
    expect(screen.getByRole("link", { name: "Preview Work In Progress" })).toHaveAttribute("href", "/blog/wip");
  });

  it("has an empty state", () => {
    render(<BlogEditor initialPosts={[]} />);

    expect(screen.getByText("No posts yet.")).toBeInTheDocument();
  });
});

describe("writing a post", () => {
  it("suggests a slug from the title until it is edited by hand", async () => {
    const user = userEvent.setup();
    render(<BlogEditor initialPosts={[]} />);

    await user.type(screen.getByLabelText("Title"), "My First Post!");
    expect(screen.getByLabelText(/Slug/)).toHaveValue("my-first-post");

    await user.clear(screen.getByLabelText(/Slug/));
    await user.type(screen.getByLabelText(/Slug/), "custom-slug");
    await user.type(screen.getByLabelText("Title"), " More");
    expect(screen.getByLabelText(/Slug/)).toHaveValue("custom-slug");
  });

  it("saves a draft with tags split into a list and adds it to the top of the list", async () => {
    const user = userEvent.setup();
    const saved: BlogPost = { ...draft, slug: "hello", title: "Hello", tags: ["ai", "nlp"] };
    fetchMock.mockReturnValue(reply(201, { post: saved }));
    render(<BlogEditor initialPosts={[published]} />);

    await user.type(screen.getByLabelText("Title"), "Hello");
    await user.type(screen.getByLabelText(/Summary/), "A summary.");
    await user.type(screen.getByLabelText("Tags (comma separated)"), "ai, nlp, ");
    fireEvent.change(screen.getByLabelText(/Content/), { target: { value: "## Body" } });
    await user.click(screen.getByRole("button", { name: "Save draft" }));

    expect(await screen.findByText("Draft saved.")).toBeInTheDocument();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/posts");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toMatchObject({ slug: "hello", title: "Hello", tags: ["ai", "nlp"], status: "draft", content: "## Body" });
    const titles = screen.getAllByRole("listitem").map((item) => item.textContent);
    expect(titles[0]).toContain("Hello");
  });

  it("labels the button Publish for published posts and confirms publishing", async () => {
    const user = userEvent.setup();
    fetchMock.mockReturnValue(reply(201, { post: { ...published, slug: "x" } }));
    render(<BlogEditor initialPosts={[]} />);

    await user.selectOptions(screen.getByLabelText("Status"), "published");
    await user.click(screen.getByRole("button", { name: "Publish post" }));

    expect(await screen.findByText("Post saved and published.")).toBeInTheDocument();
  });

  it("shows validation errors and keeps what was typed", async () => {
    const user = userEvent.setup();
    fetchMock.mockReturnValue(reply(400, { errors: ["summary is required"] }));
    render(<BlogEditor initialPosts={[]} />);

    await user.type(screen.getByLabelText("Title"), "Hello");
    await user.click(screen.getByRole("button", { name: "Save draft" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("summary is required");
    expect(screen.getByLabelText("Title")).toHaveValue("Hello");
  });

  it("toggles a live preview of the Markdown and shows reading time", async () => {
    const user = userEvent.setup();
    render(<BlogEditor initialPosts={[]} />);

    fireEvent.change(screen.getByLabelText(/Content/), { target: { value: "## Hello preview" } });
    expect(screen.queryByTestId("rendered")).not.toBeInTheDocument();
    expect(screen.getByText("1 min read")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show preview" }));
    expect(screen.getByTestId("rendered")).toHaveTextContent("## Hello preview");

    await user.click(screen.getByRole("button", { name: "Hide preview" }));
    expect(screen.queryByTestId("rendered")).not.toBeInTheDocument();
  });

  it("appends an uploaded image to the content as Markdown", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({ ok: true, status: 201, json: async () => ({ url: "https://cdn.example.com/diagram.png" }) });
    render(<BlogEditor initialPosts={[]} />);
    fireEvent.change(screen.getByLabelText(/Content/), { target: { value: "Intro." } });

    await user.upload(screen.getByLabelText("Upload image", { selector: "input" }), new File(["x"], "diagram.png", { type: "image/png" }));

    await waitFor(() => expect(screen.getByLabelText(/Content/)).toHaveValue("Intro.\n\n![diagram](https://cdn.example.com/diagram.png)\n"));
  });
});

describe("editing and deleting", () => {
  it("loads a post, locks the slug and updates with PATCH", async () => {
    const user = userEvent.setup();
    fetchMock.mockReturnValue(reply(200, { post: { ...draft, status: "published" } }));
    render(<BlogEditor initialPosts={[draft]} />);

    await user.click(screen.getByRole("button", { name: "Edit Work In Progress" }));
    expect(screen.getByLabelText(/Slug/)).toBeDisabled();
    expect(screen.getByLabelText(/Content/)).toHaveValue("Draft text.");

    await user.selectOptions(screen.getByLabelText("Status"), "published");
    await user.click(screen.getByRole("button", { name: "Save post" }));

    expect(await screen.findByText("Post saved and published.")).toBeInTheDocument();
    expect(fetchMock.mock.calls[0][1].method).toBe("PATCH");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ slug: "wip", status: "published" });
    expect(screen.getByText("published")).toBeInTheDocument();
  });

  it("deletes only after a second confirming click", async () => {
    const user = userEvent.setup();
    fetchMock.mockReturnValue(reply(200, { ok: true }));
    render(<BlogEditor initialPosts={[published]} />);

    await user.click(screen.getByRole("button", { name: "Delete Live Post" }));
    expect(fetchMock).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Confirm delete Live Post" }));

    expect(await screen.findByText("Post deleted.")).toBeInTheDocument();
    expect(screen.getByText("No posts yet.")).toBeInTheDocument();
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ slug: "live-post" });
  });
});
