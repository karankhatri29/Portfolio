import { fireEvent, render } from "@testing-library/react";

import { Analytics } from "@/components/Analytics";

let mockPathname = "/";
jest.mock("next/navigation", () => ({ usePathname: () => mockPathname }));

const sendBeacon = jest.fn();

function payloads() {
  return sendBeacon.mock.calls.map(([, body]) => JSON.parse(body));
}

beforeEach(() => {
  sendBeacon.mockReset().mockReturnValue(true);
  Object.defineProperty(navigator, "sendBeacon", { value: sendBeacon, configurable: true });
  sessionStorage.clear();
  localStorage.clear();
  mockPathname = "/";
});

describe("Analytics", () => {
  it("sends an entry pageview first, then plain pageviews on later navigations", () => {
    const { rerender } = render(<Analytics />);
    mockPathname = "/blog";
    rerender(<Analytics />);

    const [first, second] = payloads();
    expect(first).toMatchObject({ type: "pageview", path: "/", isEntry: true });
    expect(second).toMatchObject({ type: "pageview", path: "/blog", isEntry: false, referrer: "", ref: "" });
  });

  it("flags a browser as returning only after its first visit", () => {
    const first = render(<Analytics />);
    first.unmount();
    sessionStorage.clear();
    render(<Analytics />);

    const pageviews = payloads().filter((payload) => payload.type === "pageview");
    expect(pageviews.map((payload) => payload.returning)).toEqual([false, true]);
  });

  it("never tracks admin pages", () => {
    mockPathname = "/admin/analytics";
    render(<Analytics />);

    expect(sendBeacon).not.toHaveBeenCalled();
  });

  it("reports clicks on tracked contact links only", () => {
    render(
      <>
        <Analytics />
        <a href="mailto:a@b.co" data-track="email"><span>mail</span></a>
        <a href="https://example.com/other">plain</a>
      </>,
    );
    sendBeacon.mockClear();

    fireEvent.click(document.querySelector("a[data-track] span")!);
    fireEvent.click(document.querySelector("a[href='https://example.com/other']")!);

    expect(payloads()).toEqual([{ type: "click", path: "/", target: "email" }]);
  });

  describe("reading engagement", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-09-23T10:00:00Z"));
    });

    afterEach(() => {
      jest.useRealTimers();
      Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    });

    it("reports visible time once when the route changes", () => {
      const { rerender } = render(<Analytics />);
      jest.advanceTimersByTime(42_000);
      mockPathname = "/blog";
      rerender(<Analytics />);

      const engagement = payloads().filter((payload) => payload.type === "engagement");
      expect(engagement).toEqual([{ type: "engagement", path: "/", duration: 42, scroll: 100 }]);
    });

    it("excludes time spent in a hidden tab and does not report twice", () => {
      const { unmount } = render(<Analytics />);
      jest.advanceTimersByTime(10_000);

      Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
      jest.advanceTimersByTime(60_000);
      unmount();

      const engagement = payloads().filter((payload) => payload.type === "engagement");
      expect(engagement).toHaveLength(1);
      expect(engagement[0].duration).toBe(10);
    });

    it("sends nothing for sub-second visits", () => {
      const { unmount } = render(<Analytics />);
      jest.advanceTimersByTime(300);
      unmount();

      expect(payloads().some((payload) => payload.type === "engagement")).toBe(false);
    });
  });

  it("falls back to fetch when sendBeacon declines", () => {
    const fetchMock = jest.fn().mockResolvedValue({});
    global.fetch = fetchMock as unknown as typeof fetch;
    sendBeacon.mockReturnValue(false);

    render(<Analytics />);

    expect(fetchMock).toHaveBeenCalledWith("/api/track", expect.objectContaining({ method: "POST", keepalive: true }));
  });
});
