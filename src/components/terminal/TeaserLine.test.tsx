import { act, render } from "@testing-library/react";

import { TeaserLine } from "@/components/terminal/TeaserLine";

const commands = ["ls ~/a", "cat b"];
const textOf = (container: HTMLElement) => container.textContent ?? "";

beforeEach(() => {
  jest.useFakeTimers();
  window.matchMedia = jest.fn().mockReturnValue({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() }) as unknown as typeof window.matchMedia;
});

afterEach(() => jest.useRealTimers());

describe("TeaserLine", () => {
  it("is decorative: hidden from assistive technology", () => {
    const { container } = render(<TeaserLine commands={commands} prompt="$" />);

    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("starts empty, then types a command after the real ones have finished", () => {
    const { container } = render(<TeaserLine commands={commands} prompt="$" />);
    expect(textOf(container)).toBe("$");

    act(() => { jest.advanceTimersByTime(4200 + 70 * 3); });
    expect(textOf(container)).toBe("$ls ~");

    act(() => { jest.advanceTimersByTime(70 * 3); });
    expect(textOf(container)).toBe("$ls ~/a");
  });

  it("holds the finished command, erases it, then moves on to the next one", () => {
    const { container } = render(<TeaserLine commands={commands} prompt="$" />);

    act(() => { jest.advanceTimersByTime(4200 + 70 * 6 + 1700 + 32 * 6 + 500 + 70 * 5); });
    expect(textOf(container)).toBe("$cat b");
  });

  it("loops back to the first command after the last", () => {
    const { container } = render(<TeaserLine commands={["ab", "cd"]} prompt="$" />);

    act(() => { jest.advanceTimersByTime(4200 + (70 * 2 + 1700 + 32 * 2 + 500) * 2 + 70 * 2); });
    expect(textOf(container)).toBe("$ab");
  });

  it("with reduced motion, shows the first command and never animates", () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: true, addEventListener: jest.fn(), removeEventListener: jest.fn() }) as unknown as typeof window.matchMedia;
    const { container } = render(<TeaserLine commands={commands} prompt="$" />);

    act(() => { jest.advanceTimersByTime(20000); });
    expect(textOf(container)).toBe("$ls ~/a");
  });

  it("stops its timers when it unmounts", () => {
    const { unmount } = render(<TeaserLine commands={commands} prompt="$" />);

    unmount();
    expect(jest.getTimerCount()).toBe(0);
  });
});
