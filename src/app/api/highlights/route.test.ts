/**
 * @jest-environment node
 */
import { auth } from "@/auth";
import * as repository from "@/lib/content/repository";

import { DELETE, GET, PATCH, POST } from "./route";

jest.mock("@/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/content/repository", () => ({
  HIGHLIGHT_KINDS: ["testimonial", "publication"],
  listHighlights: jest.fn(),
  createHighlight: jest.fn(),
  updateHighlight: jest.fn(),
  deleteHighlight: jest.fn(),
}));

const mockAuth = auth as unknown as jest.Mock;
const repo = jest.mocked(repository);

const quote = { kind: "testimonial", title: "Ada Lovelace", subtitle: "Engineering manager, Analytical Co", body: "Karan shipped it early." };
const request = (method: string, body?: unknown) => new Request("http://localhost/api/highlights", { method, body: body === undefined ? undefined : JSON.stringify(body) });

describe("/api/highlights authorization", () => {
  it("rejects signed-out and Visitor sessions on every method", async () => {
    mockAuth.mockResolvedValue(null);
    expect((await Promise.all([GET(), POST(request("POST", quote)), PATCH(request("PATCH", quote)), DELETE(request("DELETE", { id: "1" }))])).map((r) => r.status)).toEqual([401, 401, 401, 401]);

    mockAuth.mockResolvedValue({ role: "Visitor" });
    expect((await Promise.all([GET(), POST(request("POST", quote)), PATCH(request("PATCH", quote)), DELETE(request("DELETE", { id: "1" }))])).map((r) => r.status)).toEqual([403, 403, 403, 403]);
    expect(repo.createHighlight).not.toHaveBeenCalled();
    expect(repo.deleteHighlight).not.toHaveBeenCalled();
  });
});

describe("/api/highlights as Admin", () => {
  beforeEach(() => mockAuth.mockResolvedValue({ role: "Admin" }));

  it("lists, creates and returns 201", async () => {
    repo.listHighlights.mockResolvedValue([{ id: "1", ...quote, kind: "testimonial" } as never]);
    expect(await (await GET()).json()).toEqual({ highlights: [expect.objectContaining({ id: "1" })] });

    repo.createHighlight.mockResolvedValue({ id: "2", ...quote, kind: "testimonial" } as never);
    const response = await POST(request("POST", quote));
    expect(response.status).toBe(201);
    expect(repo.createHighlight).toHaveBeenCalledWith(quote);
  });

  it("validates input: needs a kind, a title, and a quote for testimonials", async () => {
    const response = await POST(request("POST", { kind: "testimonial", title: "", body: "" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.errors).toEqual(expect.arrayContaining(["title is required", "a testimonial needs the quote text"]));
    expect((await POST(request("POST", { ...quote, kind: "poem" }))).status).toBe(400);
    expect((await POST(request("POST", { ...quote, url: "javascript:alert(1)" }))).status).toBe(400);
    expect(repo.createHighlight).not.toHaveBeenCalled();
  });

  it("allows a publication without a body", async () => {
    repo.createHighlight.mockResolvedValue({ id: "3" } as never);

    const response = await POST(request("POST", { kind: "publication", title: "Multimodal Fake News Detection", subtitle: "Conference 2026" }));

    expect(response.status).toBe(201);
  });

  it("updates and deletes by id and reports unknown ids", async () => {
    repo.updateHighlight.mockResolvedValue({ id: "1" } as never);
    expect((await PATCH(request("PATCH", { id: "1", ...quote }))).status).toBe(200);
    expect((await PATCH(request("PATCH", quote))).status).toBe(400);

    repo.updateHighlight.mockResolvedValue(undefined);
    expect((await PATCH(request("PATCH", { id: "x", ...quote }))).status).toBe(404);

    repo.deleteHighlight.mockResolvedValue(true);
    expect((await DELETE(request("DELETE", { id: "1" }))).status).toBe(200);
    repo.deleteHighlight.mockResolvedValue(false);
    expect((await DELETE(request("DELETE", { id: "x" }))).status).toBe(404);
    expect((await DELETE(request("DELETE", {}))).status).toBe(400);
  });

  it("hides internal errors", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    repo.listHighlights.mockRejectedValue(new Error("postgres://secret"));

    const response = await GET();

    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("secret");
    consoleError.mockRestore();
  });
});
