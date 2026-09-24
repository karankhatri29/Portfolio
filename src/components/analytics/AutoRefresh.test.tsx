import { act, render, screen } from "@testing-library/react";

import { AutoRefresh } from "@/components/analytics/AutoRefresh";

const refresh = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

describe("AutoRefresh", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    refresh.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("refreshes the dashboard on every interval while the tab is visible", () => {
    render(<AutoRefresh intervalMs={30_000} />);
    expect(screen.getByText("Updates automatically every 30 seconds.")).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(60_000);
    });
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("does not refresh while the tab is hidden", () => {
    const spy = jest.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    render(<AutoRefresh intervalMs={30_000} />);
    act(() => {
      jest.advanceTimersByTime(60_000);
    });
    expect(refresh).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("stops refreshing after unmount", () => {
    const { unmount } = render(<AutoRefresh intervalMs={30_000} />);
    unmount();
    act(() => {
      jest.advanceTimersByTime(60_000);
    });
    expect(refresh).not.toHaveBeenCalled();
  });
});
