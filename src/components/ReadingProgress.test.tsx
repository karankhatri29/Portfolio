import { act, fireEvent, render, screen } from "@testing-library/react";

import { ReadingProgress } from "@/components/ReadingProgress";

const page = document.documentElement;

function setScroll({ top, height, view }: { top: number; height: number; view: number }) {
  Object.defineProperty(page, "scrollHeight", { value: height, configurable: true });
  Object.defineProperty(page, "clientHeight", { value: view, configurable: true });
  page.scrollTop = top;
}

beforeEach(() => {
  // Runs the frame at once. It returns 0 (no pending frame), as a real one has finished by the time anything asks again.
  jest.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => { callback(0); return 0; });
});
afterEach(() => jest.restoreAllMocks());

describe("ReadingProgress", () => {
  it("is decorative: hidden from assistive technology", () => {
    setScroll({ top: 0, height: 3000, view: 1000 });
    const { container } = render(<ReadingProgress />);

    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("starts empty, fills as the page scrolls, and is full at the bottom", () => {
    setScroll({ top: 0, height: 3000, view: 1000 });
    render(<ReadingProgress />);
    const bar = screen.getByTestId("reading-progress");
    expect(bar.style.getPropertyValue("--progress")).toBe("0");

    act(() => { setScroll({ top: 1000, height: 3000, view: 1000 }); fireEvent.scroll(window); });
    expect(bar.style.getPropertyValue("--progress")).toBe("0.5");

    act(() => { setScroll({ top: 2000, height: 3000, view: 1000 }); fireEvent.scroll(window); });
    expect(bar.style.getPropertyValue("--progress")).toBe("1");
  });

  it("stays empty on a page too short to scroll", () => {
    setScroll({ top: 0, height: 800, view: 1000 });
    render(<ReadingProgress />);

    expect(screen.getByTestId("reading-progress").style.getPropertyValue("--progress")).toBe("0");
  });
});
