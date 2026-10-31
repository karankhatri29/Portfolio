import "@testing-library/jest-dom";

// jsdom has no canvas. Decorative canvases (the hero network) treat a missing context as "nothing to draw", so say so quietly instead of logging an error.
if (typeof HTMLCanvasElement !== "undefined") HTMLCanvasElement.prototype.getContext = () => null;

// Outside a Next.js request there is no cache to read or invalidate: reads run through and invalidation is observable.
jest.mock("next/cache", () => ({ unstable_cache: (read: unknown) => read, revalidateTag: jest.fn() }));
