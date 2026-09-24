import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { useTheme } from "next-themes";

import { ThemeToggle } from "@/components/ThemeToggle";

jest.mock("next-themes", () => ({
  useTheme: jest.fn(),
}));

const mockedUseTheme = jest.mocked(useTheme);

describe("ThemeToggle", () => {
  it("switches from dark to light without navigation", async () => {
    const setTheme = jest.fn();
    mockedUseTheme.mockReturnValue({ theme: "dark", setTheme } as never);

    render(<ThemeToggle />);
    await userEvent.click(screen.getByRole("button", { name: /switch to light theme/i }));

    expect(setTheme).toHaveBeenCalledWith("light");
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("switches back from light to dark", async () => {
    const setTheme = jest.fn();
    mockedUseTheme.mockReturnValue({ theme: "light", setTheme } as never);

    render(<ThemeToggle />);
    await userEvent.click(screen.getByRole("button", { name: /switch to dark theme/i }));

    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("renders the same neutral toggle on the server whatever theme the visitor saved", () => {
    mockedUseTheme.mockReturnValue({ theme: "light", setTheme: jest.fn() } as never);

    const html = renderToString(<ThemeToggle />);

    expect(html).toContain('aria-label="Toggle theme"');
    expect(html).not.toContain("aria-pressed");
  });

  it("hydrates a saved light theme without a mismatch, then shows the real state", async () => {
    mockedUseTheme.mockReturnValue({ theme: "light", setTheme: jest.fn() } as never);
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    const container = document.createElement("div");
    container.innerHTML = renderToString(<ThemeToggle />);
    document.body.appendChild(container);

    await act(async () => {
      hydrateRoot(container, <ThemeToggle />);
    });

    expect(consoleError).not.toHaveBeenCalled();
    const button = container.querySelector("button")!;
    expect(button).toHaveAttribute("aria-label", "Switch to dark theme");
    expect(button).toHaveAttribute("aria-pressed", "true");
    consoleError.mockRestore();
    container.remove();
  });
});
