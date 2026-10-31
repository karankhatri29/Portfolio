import { isStaleDeployError, reloadOnceForStaleDeploy } from "@/lib/stale-deploy";

describe("stale deploy recovery", () => {
  const reload = jest.fn();

  beforeEach(() => {
    reload.mockClear();
    window.sessionStorage.clear();
  });

  it("recognises missing-chunk errors by name or message and nothing else", () => {
    expect(isStaleDeployError(Object.assign(new Error("x"), { name: "ChunkLoadError" }))).toBe(true);
    expect(isStaleDeployError(new Error("Loading chunk 42 failed."))).toBe(true);
    expect(isStaleDeployError(new TypeError("Failed to fetch dynamically imported module: /_next/a.js"))).toBe(true);
    expect(isStaleDeployError(new Error("boom"))).toBe(false);
    expect(isStaleDeployError("Loading chunk 1 failed")).toBe(false);
  });

  it("reloads once, then never again in the same session", () => {
    const error = new Error("Loading chunk 7 failed");

    expect(reloadOnceForStaleDeploy(error, reload)).toBe(true);
    expect(reloadOnceForStaleDeploy(error, reload)).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("leaves other errors alone", () => {
    expect(reloadOnceForStaleDeploy(new Error("boom"), reload)).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});
