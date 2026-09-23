/**
 * @jest-environment node
 */
import { auth } from "@/auth";
import { setMessageStatus } from "@/lib/analytics/repository";

import { PATCH } from "./route";

jest.mock("@/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/analytics/repository", () => ({ setMessageStatus: jest.fn(), MESSAGE_STATUSES: ["new", "replied", "archived"] }));

const mockAuth = auth as unknown as jest.Mock;
const mockSet = jest.mocked(setMessageStatus);

function patch(body: unknown) {
  return PATCH(new Request("http://localhost/api/messages", { method: "PATCH", body: JSON.stringify(body) }));
}

describe("/api/messages", () => {
  it("rejects signed-out and Visitor sessions", async () => {
    mockAuth.mockResolvedValue(null);
    expect((await patch({ id: "m1", status: "replied" })).status).toBe(401);

    mockAuth.mockResolvedValue({ role: "Visitor" });
    expect((await patch({ id: "m1", status: "replied" })).status).toBe(403);
    expect(mockSet).not.toHaveBeenCalled();
  });

  it("updates a message status for the Admin", async () => {
    mockAuth.mockResolvedValue({ role: "Admin" });
    mockSet.mockResolvedValue(true);

    const response = await patch({ id: "m1", status: "replied" });

    expect(response.status).toBe(200);
    expect(mockSet).toHaveBeenCalledWith("m1", "replied");
  });

  it("validates input and reports unknown messages", async () => {
    mockAuth.mockResolvedValue({ role: "Admin" });

    expect((await patch({ id: "m1", status: "deleted" })).status).toBe(400);
    expect((await patch({ status: "new" })).status).toBe(400);

    mockSet.mockResolvedValue(false);
    expect((await patch({ id: "missing", status: "new" })).status).toBe(404);
  });
});
