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

  it("falls back to fetch when sendBeacon declines", () => {
    const fetchMock = jest.fn().mockResolvedValue({});
    global.fetch = fetchMock as unknown as typeof fetch;
    sendBeacon.mockReturnValue(false);

    render(<Analytics />);

    expect(fetchMock).toHaveBeenCalledWith("/api/track", expect.objectContaining({ method: "POST", keepalive: true }));
  });
});
