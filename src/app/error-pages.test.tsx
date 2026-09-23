import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ErrorPage from "@/app/error";
import GlobalError from "@/app/global-error";
import NotFound from "@/app/not-found";
import { ClientErrors } from "@/components/ClientErrors";
import { reportClientError } from "@/lib/client-error";

jest.mock("@/lib/client-error", () => ({ reportClientError: jest.fn() }));

const mockReport = jest.mocked(reportClientError);

describe("error page", () => {
  it("reports the error once, explains it kindly and offers a retry", async () => {
    const user = userEvent.setup();
    const retry = jest.fn();
    const error = Object.assign(new Error("boom"), { digest: "abc" });
    render(<ErrorPage error={error} retry={retry} />);

    expect(mockReport).toHaveBeenCalledWith(error, "abc");
    expect(screen.getByRole("heading", { name: "This page hit a snag." })).toBeInTheDocument();
    expect(screen.queryByText("boom")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("falls back to reset and hides the button when neither is provided", async () => {
    const user = userEvent.setup();
    const reset = jest.fn();
    const { rerender } = render(<ErrorPage error={new Error("x")} reset={reset} />);
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalled();

    rerender(<ErrorPage error={new Error("x")} />);
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/");
  });
});

describe("global error page", () => {
  it("renders a full document with its own message and reports the error", () => {
    const error = new Error("root failed");
    render(<GlobalError error={error} retry={() => {}} />, { container: document });

    expect(mockReport).toHaveBeenCalledWith(error, undefined);
    expect(screen.getByRole("heading", { name: "The site hit an unexpected error." })).toBeInTheDocument();
  });
});

describe("not found page", () => {
  it("offers useful ways back into the site", () => {
    render(<NotFound />);

    expect(screen.getByRole("heading", { name: "That page does not exist." })).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Helpful links" });
    expect([...nav.querySelectorAll("a")].map((link) => link.getAttribute("href"))).toEqual(["/", "/#projects", "/blog", "/#contact"]);
  });
});

describe("ClientErrors", () => {
  it("reports uncaught errors and rejections, once per message and at most five", () => {
    mockReport.mockClear();
    render(<ClientErrors />);

    window.dispatchEvent(new ErrorEvent("error", { message: "first", error: new Error("first") }));
    window.dispatchEvent(new ErrorEvent("error", { message: "first", error: new Error("first") }));
    for (let i = 0; i < 8; i++) window.dispatchEvent(new ErrorEvent("error", { message: `other ${i}`, error: new Error(`other ${i}`) }));

    expect(mockReport).toHaveBeenCalledTimes(5);
    expect(mockReport.mock.calls[0][0]).toMatchObject({ message: "first" });
  });
});
