import { render, screen } from "@testing-library/react";

import AdminBlogPage from "@/app/admin/blog/page";
import { auth } from "@/auth";
import { listPostsForAdmin } from "@/lib/content/blog";

jest.mock("@/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/content/blog", () => ({ listPostsForAdmin: jest.fn() }));
jest.mock("@/components/MarkdownContent", () => ({ MarkdownContent: ({ children }: { children: string }) => <div>{children}</div> }));

const mockAuth = auth as unknown as jest.Mock;
const mockList = jest.mocked(listPostsForAdmin);

describe("admin blog page", () => {
  it("shows the editor with every post, drafts included, for the Admin", async () => {
    mockAuth.mockResolvedValue({ role: "Admin", user: {} });
    mockList.mockResolvedValue([{ slug: "wip", title: "Work In Progress", date: "2026-06-01", summary: "s", content: "c", tags: [], status: "draft" }]);

    render(await AdminBlogPage());

    expect(screen.getByRole("heading", { level: 1, name: "Blog" })).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "New post" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit Work In Progress" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Manage content" })).toHaveAttribute("href", "/admin");
  });

  it.each([["a Visitor", { role: "Visitor", user: {} }], ["a signed-out user", null]])("neither queries nor shows the editor for %s", async (_label, session) => {
    mockList.mockClear();
    mockAuth.mockResolvedValue(session);

    render(await AdminBlogPage());

    expect(mockList).not.toHaveBeenCalled();
    expect(screen.queryByRole("form", { name: "New post" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
