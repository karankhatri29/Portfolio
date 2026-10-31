import { act, fireEvent, render, screen } from "@testing-library/react";

import { CopyButton } from "@/components/CopyButton";

afterEach(() => jest.useRealTimers());

describe("CopyButton", () => {
  it("copies the value, says so, and goes back to its label", async () => {
    jest.useFakeTimers();
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<CopyButton value="https://x.dev/feed.xml" label="Copy address" />);

    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Copy address" })); });

    expect(writeText).toHaveBeenCalledWith("https://x.dev/feed.xml");
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Copied to the clipboard");

    act(() => { jest.advanceTimersByTime(2300); });
    expect(screen.getByRole("button", { name: "Copy address" })).toBeInTheDocument();
  });

  it("tells the visitor to copy it themselves if the browser blocks copying", async () => {
    Object.assign(navigator, { clipboard: { writeText: jest.fn().mockRejectedValue(new Error("denied")) } });
    render(<CopyButton value="v" />);

    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Copy" })); });

    expect(screen.getByRole("status")).toHaveTextContent("Could not copy");
  });
});
