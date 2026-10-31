/**
 * @jest-environment node
 */
import { CircuitBreaker, CircuitOpenError, HttpError, isTimeoutError, isTransientError, retry } from "@/lib/resilience";

const networkError = () => new Error("Error connecting to database: TypeError: fetch failed");
const noWait = { sleep: async () => undefined };

describe("isTransientError", () => {
  it("treats network failures, timeouts, 429 and 5xx as worth retrying", () => {
    expect(isTransientError(networkError())).toBe(true);
    expect(isTransientError(Object.assign(new Error("x"), { name: "TimeoutError" }))).toBe(true);
    expect(isTransientError(Object.assign(new Error("connect"), { cause: { code: "ECONNRESET" } }))).toBe(true);
    for (const status of [429, 500, 502, 503]) expect(isTransientError(new HttpError(status))).toBe(true);
  });

  it("does not retry client errors, bugs or an open circuit", () => {
    for (const status of [400, 401, 403, 404]) expect(isTransientError(new HttpError(status))).toBe(false);
    expect(isTransientError(new Error('relation "projects" does not exist'))).toBe(false);
    expect(isTransientError(new CircuitOpenError("neon"))).toBe(false);
    expect(isTransientError("fetch failed")).toBe(false);
  });

  it("tells timeouts apart so slow calls are not doubled", () => {
    expect(isTimeoutError(Object.assign(new Error("x"), { name: "AbortError" }))).toBe(true);
    expect(isTimeoutError(networkError())).toBe(false);
  });
});

describe("retry", () => {
  it("returns the first success without waiting or reporting a recovery", async () => {
    const onRecovered = jest.fn();
    const sleep = jest.fn();

    expect(await retry(async () => "ok", { sleep, onRecovered })).toBe("ok");
    expect(sleep).not.toHaveBeenCalled();
    expect(onRecovered).not.toHaveBeenCalled();
  });

  it("retries with the given delays and reports how many retries it took", async () => {
    const operation = jest.fn().mockRejectedValueOnce(networkError()).mockRejectedValueOnce(networkError()).mockResolvedValue("ok");
    const sleep = jest.fn().mockResolvedValue(undefined);
    const onRecovered = jest.fn();

    expect(await retry(operation, { delaysMs: [300, 1000], sleep, onRecovered })).toBe("ok");

    expect(operation).toHaveBeenCalledTimes(3);
    expect(sleep.mock.calls).toEqual([[300], [1000]]);
    expect(onRecovered).toHaveBeenCalledWith(2);
  });

  it("gives up after the last delay and rethrows the final error", async () => {
    const operation = jest.fn().mockRejectedValue(networkError());

    await expect(retry(operation, { delaysMs: [1, 1], ...noWait })).rejects.toThrow("fetch failed");
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it("does not retry errors that retrying cannot fix", async () => {
    const operation = jest.fn().mockRejectedValue(new HttpError(401));

    await expect(retry(operation, noWait)).rejects.toBeInstanceOf(HttpError);
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("honours a custom shouldRetry", async () => {
    const operation = jest.fn().mockRejectedValue(Object.assign(new Error("x"), { name: "TimeoutError" }));

    await expect(retry(operation, { ...noWait, shouldRetry: (error) => !isTimeoutError(error) })).rejects.toThrow();
    expect(operation).toHaveBeenCalledTimes(1);
  });
});

describe("CircuitBreaker", () => {
  const make = () => {
    let now = 0;
    const breaker = new CircuitBreaker("neon", { failureThreshold: 3, cooldownMs: 1000, now: () => now });
    return { breaker, advance: (ms: number) => (now += ms) };
  };
  const fail = (breaker: CircuitBreaker) => breaker.run(async () => Promise.reject(networkError())).catch(() => undefined);

  it("opens after consecutive transient failures and then fails fast", async () => {
    const { breaker } = make();
    for (let i = 0; i < 3; i++) await fail(breaker);

    const operation = jest.fn();
    await expect(breaker.run(operation)).rejects.toBeInstanceOf(CircuitOpenError);
    expect(operation).not.toHaveBeenCalled();
  });

  it("lets one call through after the cooldown and closes again on success", async () => {
    const { breaker, advance } = make();
    for (let i = 0; i < 3; i++) await fail(breaker);
    advance(1001);

    expect(await breaker.run(async () => "back")).toBe("back");
    expect(breaker.isOpen).toBe(false);
    await expect(breaker.run(async () => "again")).resolves.toBe("again");
  });

  it("reopens straight away when the trial call after the cooldown fails", async () => {
    const { breaker, advance } = make();
    for (let i = 0; i < 3; i++) await fail(breaker);
    advance(1001);
    await fail(breaker);

    expect(breaker.isOpen).toBe(true);
  });

  it("ignores non-transient errors and resets the count on success", async () => {
    const { breaker } = make();
    for (let i = 0; i < 5; i++) await breaker.run(async () => Promise.reject(new HttpError(404))).catch(() => undefined);
    expect(breaker.isOpen).toBe(false);

    await fail(breaker);
    await fail(breaker);
    await breaker.run(async () => "ok");
    await fail(breaker);
    await fail(breaker);
    expect(breaker.isOpen).toBe(false);
  });
});
