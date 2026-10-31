/**
 * @jest-environment node
 */
import { neon } from "@neondatabase/serverless";

import { pruneOldAnalytics, recordEvent } from "@/lib/analytics/repository";
import type { EventInput } from "@/lib/analytics/repository";

jest.mock("@neondatabase/serverless", () => ({ neon: jest.fn() }));

const sqlMock = jest.fn();
const env = process.env as Record<string, string | undefined>;
const original = env.DATABASE_URL;

const event: EventInput = { type: "pageview", path: "/", referrer: "", refTag: "", isEntry: true, isReturning: false, country: "IN", city: "Pune", device: "desktop", browser: "Chrome", durationSeconds: 0, scrollPercent: 0, visitorHash: "abc", target: "" };
const text = (call: unknown[]) => (call[0] as string[]).join("?");

beforeEach(() => {
  sqlMock.mockReset();
  jest.mocked(neon).mockReturnValue(sqlMock as unknown as ReturnType<typeof neon>);
  env.DATABASE_URL = "postgres://test";
});

afterAll(() => {
  env.DATABASE_URL = original;
});

describe("recordEvent", () => {
  it("checks the per-minute cap and inserts in a single statement", async () => {
    sqlMock.mockResolvedValue([{ id: "1" }]);

    expect(await recordEvent(event, 60)).toBe(true);

    expect(sqlMock).toHaveBeenCalledTimes(1);
    expect(text(sqlMock.mock.calls[0])).toMatch(/INSERT INTO events[\s\S]*WHERE \(SELECT COUNT\(\*\) FROM events WHERE visitor_hash = \?[\s\S]*\) < \?::int/);
    expect(sqlMock.mock.calls[0].slice(1)).toContain(60);
  });

  it("reports an event over the cap as not stored", async () => {
    sqlMock.mockResolvedValue([]);

    expect(await recordEvent(event, 60)).toBe(false);
  });
});

describe("pruneOldAnalytics", () => {
  it("deletes old events with the given window and old errors after 90 days", async () => {
    sqlMock.mockResolvedValue([]);

    await pruneOldAnalytics(365);

    expect(text(sqlMock.mock.calls[0])).toContain("DELETE FROM events");
    expect(sqlMock.mock.calls[0].slice(1)).toEqual([365]);
    expect(text(sqlMock.mock.calls[1])).toContain("DELETE FROM error_logs");
    expect(sqlMock.mock.calls[1].slice(1)).toEqual([90]);
  });
});
