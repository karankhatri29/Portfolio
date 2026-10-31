/**
 * @jest-environment node
 */
import { neonBreaker, retryRead } from "@/lib/db";

const networkError = () => new Error("Error connecting to database: TypeError: fetch failed");
const sleep = jest.fn().mockResolvedValue(undefined);

beforeEach(() => {
  neonBreaker.reset();
  sleep.mockClear();
});

describe("retryRead", () => {
  it("returns the first result without retrying", async () => {
    const read = jest.fn().mockResolvedValue("rows");

    expect(await retryRead(read, { sleep })).toBe("rows");
    expect(read).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("waits a little longer each time, so a database waking from suspension has time to start", async () => {
    const read = jest.fn().mockRejectedValueOnce(networkError()).mockRejectedValueOnce(networkError()).mockResolvedValue("rows");
    const onRecovered = jest.fn();

    expect(await retryRead(read, { sleep, onRecovered })).toBe("rows");

    expect(read).toHaveBeenCalledTimes(3);
    expect(sleep.mock.calls).toEqual([[300], [1000]]);
    expect(onRecovered).toHaveBeenCalledWith(2);
  });

  it("gives up after three attempts", async () => {
    const read = jest.fn().mockRejectedValue(networkError());

    await expect(retryRead(read, { sleep })).rejects.toThrow("fetch failed");
    expect(read).toHaveBeenCalledTimes(3);
  });

  it("does not retry real query errors", async () => {
    const read = jest.fn().mockRejectedValue(new Error('relation "projects" does not exist'));

    await expect(retryRead(read, { sleep })).rejects.toThrow("does not exist");
    expect(read).toHaveBeenCalledTimes(1);
  });

  it("opens the circuit after a request's worth of failures, so a real outage fails fast", async () => {
    const down = jest.fn().mockRejectedValue(networkError());
    await expect(retryRead(down, { sleep })).rejects.toThrow("fetch failed");
    // The fourth failed attempt in a row opens the circuit, so the next request's retries are cut short.
    await expect(retryRead(down, { sleep })).rejects.toThrow("temporarily unavailable");

    const callsSoFar = down.mock.calls.length;
    expect(callsSoFar).toBe(4);
    await expect(retryRead(down, { sleep })).rejects.toThrow("temporarily unavailable");
    expect(down.mock.calls.length).toBe(callsSoFar);
  });
});
