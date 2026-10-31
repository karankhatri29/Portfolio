import { render } from "@testing-library/react";

import { NeuralField } from "@/components/NeuralField";

// jsdom has no canvas, so give it a context that records the calls.
function stubContext() {
  const calls: string[] = [];
  const handler = { get: (_: unknown, name: string) => (name === "canvas" ? undefined : (...args: unknown[]) => { calls.push(`${name}:${args.length}`); }), set: () => true };
  const context = new Proxy({}, handler);
  jest.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as unknown as CanvasRenderingContext2D);
  return calls;
}

afterEach(() => jest.restoreAllMocks());

describe("NeuralField", () => {
  it("is decorative: hidden from assistive technology", () => {
    stubContext();
    const { container } = render(<NeuralField className="field" />);

    const canvas = container.querySelector("canvas");
    expect(canvas).toHaveAttribute("aria-hidden", "true");
    expect(canvas).toHaveClass("field");
  });

  it("renders without error when the browser has no canvas support", () => {
    jest.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);

    expect(() => render(<NeuralField />)).not.toThrow();
  });

  it("supports every mode and cleans up on unmount", () => {
    stubContext();
    for (const mode of ["ambient", "logo", "scroll"] as const) {
      const { unmount } = render(<NeuralField mode={mode} />);
      expect(() => unmount()).not.toThrow();
    }
  });

  it("removes its pointer listeners from the parent when unmounted", () => {
    stubContext();
    const remove = jest.spyOn(HTMLElement.prototype, "removeEventListener");
    const { unmount } = render(<NeuralField />);
    unmount();

    const removed = remove.mock.calls.map(([type]) => type);
    expect(removed).toEqual(expect.arrayContaining(["pointermove", "pointerleave", "pointerdown"]));
  });
});
