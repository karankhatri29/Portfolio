import "@testing-library/jest-dom";

// jsdom has no canvas. Decorative canvases (the hero network) treat a missing context as "nothing to draw", so say so quietly instead of logging an error.
if (typeof HTMLCanvasElement !== "undefined") HTMLCanvasElement.prototype.getContext = () => null;
