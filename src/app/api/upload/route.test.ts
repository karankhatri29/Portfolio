/**
 * @jest-environment node
 */
import { put } from "@vercel/blob";

import { auth } from "@/auth";

import { POST } from "./route";

jest.mock("@/auth", () => ({ auth: jest.fn() }));
jest.mock("@vercel/blob", () => ({ put: jest.fn() }));

const mockAuth = auth as unknown as jest.Mock;
const mockPut = jest.mocked(put);
const env = process.env as Record<string, string | undefined>;
const original = env.BLOB_READ_WRITE_TOKEN;

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0];

function upload(content?: BlobPart, name = "shot.png") {
  const form = new FormData();
  if (content !== undefined) form.append("file", new File([content], name));
  return POST(new Request("http://localhost/api/upload", { method: "POST", body: form }));
}

beforeEach(() => {
  mockAuth.mockResolvedValue({ role: "Admin" });
  env.BLOB_READ_WRITE_TOKEN = "blob_test";
  mockPut.mockResolvedValue({ url: "https://store.public.blob.vercel-storage.com/uploads/shot-abc.png" } as never);
});

afterAll(() => {
  env.BLOB_READ_WRITE_TOKEN = original;
});

describe("/api/upload", () => {
  it("rejects signed-out and Visitor sessions before reading the file", async () => {
    mockAuth.mockResolvedValue(null);
    expect((await upload(new Uint8Array(PNG))).status).toBe(401);

    mockAuth.mockResolvedValue({ role: "Visitor" });
    expect((await upload(new Uint8Array(PNG))).status).toBe(403);
    expect(mockPut).not.toHaveBeenCalled();
  });

  it("explains clearly when Blob storage is not configured", async () => {
    delete env.BLOB_READ_WRITE_TOKEN;

    const response = await upload(new Uint8Array(PNG));

    expect(response.status).toBe(501);
    expect((await response.json()).error).toMatch(/not set up/);
  });

  it("stores a real image publicly with the detected type and returns its URL", async () => {
    const response = await upload(new Uint8Array(PNG), "My Shot.jpg");

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ url: "https://store.public.blob.vercel-storage.com/uploads/shot-abc.png" });
    expect(mockPut).toHaveBeenCalledWith("uploads/my-shot.png", expect.any(File), { access: "public", contentType: "image/png", addRandomSuffix: true });
  });

  it("refuses non-images even when named like one, plus empty, oversized and missing files", async () => {
    expect((await upload('<svg><script>alert(1)</script></svg>', "evil.png")).status).toBe(415);
    expect((await upload("", "empty.png")).status).toBe(400);
    expect((await upload(new Uint8Array(4 * 1024 * 1024 + 1))).status).toBe(413);
    expect((await upload()).status).toBe(400);
    expect(mockPut).not.toHaveBeenCalled();
  });

  it("hides storage errors", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    mockPut.mockRejectedValue(new Error("token blob_secret rejected"));

    const response = await upload(new Uint8Array(PNG));

    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("blob_secret");
    consoleError.mockRestore();
  });
});
