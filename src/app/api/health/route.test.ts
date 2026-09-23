/**
 * @jest-environment node
 */
import { neon } from "@neondatabase/serverless";

import { GET } from "./route";

jest.mock("@neondatabase/serverless", () => ({ neon: jest.fn() }));

const mockNeon = jest.mocked(neon);
const env = process.env as Record<string, string | undefined>;
const original = env.DATABASE_URL;

afterAll(() => {
  env.DATABASE_URL = original;
});

describe("/api/health", () => {
  beforeEach(() => {
    env.DATABASE_URL = "postgres://user:secret@host/db";
  });

  it("reports ok when the database answers", async () => {
    mockNeon.mockReturnValue((async () => [{ "?column?": 1 }]) as unknown as ReturnType<typeof neon>);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ status: "ok", database: "ok" });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("reports 503 without leaking details when the database fails or is unconfigured", async () => {
    mockNeon.mockReturnValue((async () => {
      throw new Error("connect ECONNREFUSED postgres://user:secret@host/db");
    }) as unknown as ReturnType<typeof neon>);

    const failed = await GET();
    const text = JSON.stringify(await failed.json());
    expect(failed.status).toBe(503);
    expect(text).not.toContain("secret");

    delete env.DATABASE_URL;
    expect((await GET()).status).toBe(503);
  });
});
