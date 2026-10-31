import "@testing-library/jest-dom";

// Outside a Next.js request there is no cache to read or invalidate: reads run through and invalidation is observable.
jest.mock("next/cache", () => ({ unstable_cache: (read: unknown) => read, revalidateTag: jest.fn() }));
