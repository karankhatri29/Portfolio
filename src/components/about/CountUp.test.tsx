import { act, render, screen } from "@testing-library/react";

import { CountUp, formatStat } from "@/components/about/CountUp";

type Callback = (entries: { isIntersecting: boolean }[]) => void;
let trigger: Callback | undefined;

class FakeObserver {
  constructor(callback: Callback) {
    trigger = callback;
  }
  observe() {}
  disconnect() {}
}

describe("formatStat", () => {
  it("applies decimals and a suffix", () => {
    expect(formatStat(9.42, 2)).toBe("9.42");
    expect(formatStat(45, 0, "%")).toBe("45%");
    expect(formatStat(3)).toBe("3");
  });
});

describe("CountUp", () => {
  const originalObserver = globalThis.IntersectionObserver;

  beforeEach(() => {
    jest.useFakeTimers();
    trigger = undefined;
  });

  afterEach(() => {
    jest.useRealTimers();
    globalThis.IntersectionObserver = originalObserver;
  });

  it("renders the final value with no observer available", () => {
    // @ts-expect-error jsdom has no IntersectionObserver; make that explicit for the test
    delete globalThis.IntersectionObserver;
    render(<CountUp value={55} suffix="%" />);

    expect(screen.getAllByText("55%")).toHaveLength(2); // visually hidden copy plus the visible one
  });

  it("counts up from zero when scrolled into view and ends on the exact value", () => {
    globalThis.IntersectionObserver = FakeObserver as unknown as typeof IntersectionObserver;
    const { container } = render(<CountUp value={9.42} decimals={2} />);
    const visible = container.querySelector<HTMLElement>("[aria-hidden=true]")!;

    expect(visible.textContent).toBe("0.00");

    act(() => trigger?.([{ isIntersecting: true }]));
    act(() => { jest.advanceTimersByTime(600); });
    const midway = parseFloat(visible.textContent ?? "0");
    expect(midway).toBeGreaterThan(0);
    expect(midway).toBeLessThan(9.42);

    act(() => { jest.advanceTimersByTime(1500); });
    expect(visible.textContent).toBe("9.42");
  });

  it("keeps the real value available to screen readers throughout", () => {
    globalThis.IntersectionObserver = FakeObserver as unknown as typeof IntersectionObserver;
    const { container } = render(<CountUp value={45} suffix="%" />);

    expect(container.querySelector(".sr-only")?.textContent).toBe("45%");
  });

  it("does not animate when the user prefers reduced motion", () => {
    globalThis.IntersectionObserver = FakeObserver as unknown as typeof IntersectionObserver;
    const matchMedia = window.matchMedia;
    window.matchMedia = ((query: string) => ({ matches: query.includes("reduce"), media: query, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;

    const { container } = render(<CountUp value={45} suffix="%" />);

    expect(container.querySelector<HTMLElement>("[aria-hidden=true]")?.textContent).toBe("45%");
    expect(trigger).toBeUndefined();
    window.matchMedia = matchMedia;
  });
});
