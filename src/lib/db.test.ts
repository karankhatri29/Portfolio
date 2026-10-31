/**
 * @jest-environment node
 */
import { retryRead } from "@/lib/db";

const networkError = () => new Error("Error connecting to database: TypeError: fetch failed");

describe("retryRead", () => {
  it("returns the first result without retrying", async () => {
    const read = jest.fn().mockResolvedValue("rows");

    expect(await retryRead(read)).toBe("rows");
    expect(read).toHaveBeenCalledTimes(1);
  });

  it("retries once when the database could not be reached", async () => {
    const read = jest.fn().mockRejectedValueOnce(networkError()).mockResolvedValue("rows");

    expect(await retryRead(read)).toBe("rows");
    expect(read).toHaveBeenCalledTimes(2);
  });

  it("gives up after a single retry", async () => {
    const read = jest.fn().mockRejectedValue(networkError());

    await expect(retryRead(read)).rejects.toThrow("fetch failed");
    expect(read).toHaveBeenCalledTimes(2);
  });

  it("does not retry real query errors", async () => {
    const read = jest.fn().mockRejectedValue(new Error('relation "projects" does not exist'));

    await expect(retryRead(read)).rejects.toThrow("does not exist");
    expect(read).toHaveBeenCalledTimes(1);
  });
});
