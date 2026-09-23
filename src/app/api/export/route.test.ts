/**
 * @jest-environment node
 */
import { auth } from "@/auth";
import { exportEvents, exportMessages } from "@/lib/analytics/repository";

import { GET } from "./route";

jest.mock("@/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/analytics/repository", () => ({
  EVENT_EXPORT_COLUMNS: ["time_utc", "type"],
  MESSAGE_EXPORT_COLUMNS: ["time_utc", "name", "message"],
  exportEvents: jest.fn(),
  exportMessages: jest.fn(),
}));

const mockAuth = auth as unknown as jest.Mock;
const mockEvents = jest.mocked(exportEvents);
const mockMessages = jest.mocked(exportMessages);

const get = (query: string) => GET(new Request(`http://localhost/api/export${query}`));

describe("/api/export", () => {
  it("rejects signed-out and Visitor sessions without touching the data", async () => {
    mockAuth.mockResolvedValue(null);
    expect((await get("?type=events")).status).toBe(401);

    mockAuth.mockResolvedValue({ role: "Visitor" });
    expect((await get("?type=events")).status).toBe(403);
    expect(mockEvents).not.toHaveBeenCalled();
    expect(mockMessages).not.toHaveBeenCalled();
  });

  describe("as Admin", () => {
    beforeEach(() => mockAuth.mockResolvedValue({ role: "Admin" }));

    it("downloads events as a CSV attachment for the requested range", async () => {
      mockEvents.mockResolvedValue([["2026-09-23T10:00:00Z", "pageview"]]);

      const response = await get("?type=events&days=30");

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
      expect(response.headers.get("content-disposition")).toMatch(/^attachment; filename="portfolio-events-\d{4}-\d{2}-\d{2}\.csv"$/);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(await response.text()).toBe("time_utc,type\r\n2026-09-23T10:00:00Z,pageview\r\n");
      expect(mockEvents).toHaveBeenCalledWith(30);
    });

    it("clamps the range and falls back to 90 days for junk", async () => {
      mockEvents.mockResolvedValue([]);

      await get("?type=events&days=99999");
      await get("?type=events&days=abc");

      expect(mockEvents.mock.calls.map(([days]) => days)).toEqual([365, 90]);
    });

    it("downloads messages and neutralises spreadsheet formulas", async () => {
      mockMessages.mockResolvedValue([["2026-09-23T10:00:00Z", "Ada", "=1+1"]]);

      const text = await (await get("?type=messages")).text();

      expect(text).toContain("Ada,'=1+1");
    });

    it("rejects an unknown type and hides internal errors", async () => {
      expect((await get("?type=secrets")).status).toBe(400);

      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
      mockEvents.mockRejectedValue(new Error("postgres://secret"));
      const response = await get("?type=events");
      expect(response.status).toBe(500);
      expect(await response.text()).not.toContain("secret");
      consoleError.mockRestore();
    });
  });
});
