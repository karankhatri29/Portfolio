// Small building blocks for riding out short outages of the services the site depends on (Neon, GitHub, Gemini,
// Resend, Vercel Blob). Only failures that a retry can plausibly fix are retried; a wrong key or a bug is not.

const TRANSIENT_PATTERN = /fetch failed|ECONNRESET|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|ENOTFOUND|socket hang up|network|timed out|timeout|AbortError|TimeoutError|Error connecting to database/i;

export function isTimeoutError(error: unknown): boolean {
  return error instanceof Error && /^(AbortError|TimeoutError)$/.test(error.name);
}

/** True for failures that usually clear up on their own: network errors, timeouts, 429 and 5xx. */
export function isTransientError(error: unknown): boolean {
  if (!(error instanceof Error) || error instanceof CircuitOpenError) return false;

  const status = (error as { status?: unknown }).status;
  if (typeof status === "number") return status === 429 || status >= 500;

  const code = (error as { cause?: { code?: unknown } }).cause?.code;
  return TRANSIENT_PATTERN.test(`${error.name} ${error.message} ${typeof code === "string" ? code : ""}`);
}

/** An HTTP failure that keeps its status so isTransientError can tell a 503 from a 401. */
export class HttpError extends Error {
  constructor(readonly status: number, message = `HTTP ${status}`) {
    super(message);
    this.name = "HttpError";
  }
}

export type RetryOptions = {
  /** Wait before each retry; its length is the number of retries. */
  delaysMs?: number[];
  shouldRetry?: (error: unknown) => boolean;
  /** Called once when an attempt succeeded only after earlier ones failed. */
  onRecovered?: (retries: number) => void;
  sleep?: (ms: number) => Promise<void>;
};

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function retry<T>(operation: () => Promise<T>, { delaysMs = [300, 1000], shouldRetry = isTransientError, onRecovered, sleep = defaultSleep }: RetryOptions = {}): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      const value = await operation();
      if (attempt > 0) onRecovered?.(attempt);
      return value;
    } catch (error) {
      if (attempt >= delaysMs.length || !shouldRetry(error)) throw error;
      await sleep(delaysMs[attempt]);
    }
  }
}

export class CircuitOpenError extends Error {
  constructor(readonly dependency: string) {
    super(`${dependency} is temporarily unavailable`);
    this.name = "CircuitOpenError";
  }
}

/**
 * After `failureThreshold` transient failures in a row the circuit opens for `cooldownMs`: calls fail at once instead
 * of each waiting on a timeout. After the cooldown one call is let through; success closes the circuit again.
 */
export class CircuitBreaker {
  private failures = 0;
  private openedAt = 0;

  constructor(
    readonly name: string,
    private readonly options: { failureThreshold: number; cooldownMs: number; now?: () => number },
  ) {}

  private now() {
    return (this.options.now ?? Date.now)();
  }

  get isOpen(): boolean {
    return this.failures >= this.options.failureThreshold && this.now() - this.openedAt < this.options.cooldownMs;
  }

  reset() {
    this.failures = 0;
    this.openedAt = 0;
  }

  async run<T>(operation: () => Promise<T>): Promise<T> {
    if (this.isOpen) throw new CircuitOpenError(this.name);

    try {
      const value = await operation();
      this.failures = 0;
      return value;
    } catch (error) {
      if (isTransientError(error)) {
        this.failures++;
        if (this.failures >= this.options.failureThreshold) this.openedAt = this.now();
      }
      throw error;
    }
  }
}
