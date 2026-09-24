import { recordError } from "@/lib/analytics/repository";
import { reportServerError } from "@/lib/analytics/report";

jest.mock("@/lib/analytics/repository", () => ({ recordError: jest.fn() }));

const mockRecord = recordError as jest.Mock;

describe("reportServerError", () => {
  const original = process.env.DATABASE_URL;

  beforeEach(() => {
    mockRecord.mockReset();
    process.env.DATABASE_URL = "postgres://example";
  });

  afterAll(() => {
    process.env.DATABASE_URL = original;
  });

  it("records a real error so it appears in the admin Errors list", async () => {
    await reportServerError(new Error('column "images" does not exist'), "/");
    expect(mockRecord).toHaveBeenCalledWith(expect.objectContaining({ source: "server", message: 'column "images" does not exist', path: "/" }));
  });

  it("skips known noise", async () => {
    await reportServerError(new Error("The destination stream closed early."), "/");
    expect(mockRecord).not.toHaveBeenCalled();
  });

  it("never throws when recording fails", async () => {
    mockRecord.mockRejectedValue(new Error("db down"));
    await expect(reportServerError(new Error("boom"), "/")).resolves.toBeUndefined();
  });
});
