import { fireEvent, render, screen } from "@testing-library/react";

import { IconButton, dangerButton } from "@/components/IconButton";

describe("IconButton", () => {
  it("is found by its full action name and shows only an icon", () => {
    render(<IconButton kind="edit" label="Edit AI and NLP" onClick={() => {}} />);

    const button = screen.getByRole("button", { name: "Edit AI and NLP" });
    expect(button).toHaveAttribute("title", "Edit AI and NLP");
    expect(button).not.toHaveTextContent(/\S/);
    expect(button.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("calls its handler when pressed and not when disabled", () => {
    const onClick = jest.fn();
    const { rerender } = render(<IconButton kind="delete" label="Delete X" onClick={onClick} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete X" }));
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(<IconButton kind="delete" label="Delete X" onClick={onClick} disabled />);
    fireEvent.click(screen.getByRole("button", { name: "Delete X" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("keeps a 44px touch target, and only the bin turns red", () => {
    const { rerender } = render(<IconButton kind="edit" label="Edit X" onClick={() => {}} />);
    expect(screen.getByRole("button")).toHaveClass("h-11", "w-11");
    expect(screen.getByRole("button").className).not.toContain("ff6b6b");

    rerender(<IconButton kind="delete" label="Delete X" onClick={() => {}} />);
    expect(screen.getByRole("button")).toHaveClass("h-11", "w-11");
    expect(screen.getByRole("button").className).toContain("hover:text-[#ff8a80]");
  });

  it("draws a different icon for each action", () => {
    const { container, rerender } = render(<IconButton kind="edit" label="a" onClick={() => {}} />);
    const pen = container.querySelector("svg")!.innerHTML;
    rerender(<IconButton kind="delete" label="a" onClick={() => {}} />);

    expect(container.querySelector("svg")!.innerHTML).not.toBe(pen);
  });

  it("exports the explicit confirm style as words, not an icon", () => {
    expect(dangerButton).toContain("ff6b6b");
  });
});
