/**
 * @jest-environment node
 */
import { recordHealEvent } from "@/lib/analytics/repository";
import { recordHeal } from "@/lib/heal";

jest.mock("@/lib/analytics/repository", () => ({ recordHealEvent: jest.fn() }));

const mockRecord = jest.mocked(recordHealEvent);
const env = process.env as Record<string, string | undefined>;
const original = env.DATABASE_URL;

beforeEach(() => {
  env.DATABASE_URL = "postgres://example";
  mockRecord.mockResolvedValue(undefined);
  jest.spyOn(console, "info").mockImplementation(() => undefined);
});

afterEach(() => jest.restoreAllMocks());

afterAll(() => {
  env.DATABASE_URL = original;
});

describe("recordHeal", () => {
  it("stores the recovery so the weekly digest can count it", async () => {
    await recordHeal("database", "retried");

    expect(mockRecord).toHaveBeenCalledWith("database", "retried");
  });

  it("does nothing without a database and never throws when storing fails", async () => {
    mockRecord.mockRejectedValue(new Error("db down"));
    await expect(recordHeal("database", "served-last-good")).resolves.toBeUndefined();

    delete env.DATABASE_URL;
    mockRecord.mockClear();
    await recordHeal("database", "retried");
    expect(mockRecord).not.toHaveBeenCalled();
  });
});
