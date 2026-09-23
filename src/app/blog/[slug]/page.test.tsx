import { render, screen } from "@testing-library/react";

jest.mock("react-markdown", () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => <div>{children}</div>,
}));

import BlogPostPage from "@/app/blog/[slug]/page";

describe("blog detail route", () => {
  it("renders a parsed post body", async () => {
    render(await BlogPostPage({ params: Promise.resolve({ slug: "systems-that-breathe" }) }));

    expect(screen.getByRole("heading", { name: "Systems That Breathe" })).toBeInTheDocument();
    expect(screen.getByText("Good systems leave room for people to think.", { exact: false })).toBeInTheDocument();
  });
});
