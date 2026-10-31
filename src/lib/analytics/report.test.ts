import { countRecentServerErrorGroups, recordError } from "@/lib/analytics/repository";
import { recordAndAlert, reportServerError, withReportedFallback } from "@/lib/analytics/report";
import { sendEmail } from "@/lib/notify/email";

jest.mock("@/lib/analytics/repository", () => ({ recordError: jest.fn(), countRecentServerErrorGroups: jest.fn() }));
jest.mock("@/lib/notify/email", () => ({ sendEmail: jest.fn() }));

const mockRecord = recordError as jest.Mock;
const mockGroups = countRecentServerErrorGroups as jest.Mock;
const mockEmail = sendEmail as jest.Mock;

const report = { source: "server" as const, message: "boom", stack: "", path: "/blog", digest: "" };

beforeEach(() => {
  mockRecord.mockReset().mockResolvedValue(false);
  mockGroups.mockReset().mockResolvedValue(1);
  mockEmail.mockReset().mockResolvedValue("sent");
});

describe("reportServerError", () => {
  const original = process.env.DATABASE_URL;

  beforeEach(() => {
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

describe("recordAndAlert", () => {
  it("emails the owner about the first server error of its kind, with the page and a dashboard link", async () => {
    mockRecord.mockResolvedValue(true);

    await recordAndAlert(report);

    expect(mockEmail).toHaveBeenCalledTimes(1);
    const { subject, text } = mockEmail.mock.calls[0][0];
    expect(subject).toBe("Portfolio error: boom");
    expect(text).toContain("/blog");
    expect(text).toContain("/admin/analytics");
    expect(text).not.toContain("stack");
  });

  it("stays quiet for an error already seen in the last 24 hours", async () => {
    await recordAndAlert(report);

    expect(mockRecord).toHaveBeenCalledTimes(1);
    expect(mockEmail).not.toHaveBeenCalled();
  });

  it("never alerts on browser-reported errors, which anyone can fake", async () => {
    mockRecord.mockResolvedValue(true);

    await recordAndAlert({ ...report, source: "client" });

    expect(mockEmail).not.toHaveBeenCalled();
  });

  it("caps alerts during an incident so the email quota is not used up", async () => {
    mockRecord.mockResolvedValue(true);
    mockGroups.mockResolvedValue(3);
    await recordAndAlert(report);
    expect(mockEmail).toHaveBeenCalledTimes(1);

    mockGroups.mockResolvedValue(4);
    await recordAndAlert(report);
    expect(mockEmail).toHaveBeenCalledTimes(1);
  });
});

describe("withReportedFallback", () => {
  const original = process.env.DATABASE_URL;

  afterAll(() => {
    process.env.DATABASE_URL = original;
  });

  it("returns the rows when the query works and records nothing", async () => {
    expect(await withReportedFallback(Promise.resolve([1, 2]), "/")).toEqual([1, 2]);
    expect(mockRecord).not.toHaveBeenCalled();
  });

  it("returns an empty list but records the failure when the query fails", async () => {
    process.env.DATABASE_URL = "postgres://example";
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(await withReportedFallback(Promise.reject(new Error("fetch failed")), "/resume")).toEqual([]);

    expect(mockRecord).toHaveBeenCalledWith(expect.objectContaining({ message: "fetch failed", path: "/resume", source: "server" }));
    consoleError.mockRestore();
  });
});
