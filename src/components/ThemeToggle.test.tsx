import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
});
