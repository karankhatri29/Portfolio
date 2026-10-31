// The K³ logo's own graph (same coordinates as public/brand/k3/logo-k3.svg), used to let the hero field form the logo.
export type LogoEdge = readonly [number, number, number, number];

export const LOGO_EDGES: readonly LogoEdge[] = [
  [115, 190, 115, 700], [115, 190, 293, 97], [293, 97, 293, 352], [115, 700, 293, 800], [425, 198, 647, 198], [647, 198, 440, 437],
  [440, 437, 665, 715], [665, 715, 440, 705], [207, 437, 425, 198], [115, 190, 205, 252], [205, 252, 293, 97], [205, 252, 205, 640],
  [207, 437, 115, 700], [205, 640, 115, 700], [205, 640, 293, 800], [207, 437, 468, 270], [468, 270, 647, 198], [425, 198, 468, 270],
  [335, 437, 468, 270], [207, 437, 440, 437], [335, 437, 488, 630], [207, 437, 488, 630], [488, 630, 665, 715], [488, 630, 440, 705],
  [293, 520, 293, 800], [293, 520, 440, 705], [585, 440, 684, 376], [585, 440, 681, 513], [585, 440, 574, 585], [585, 440, 568, 304],
];

// The seven large hub nodes drawn in the logo.
export const LOGO_HUBS: readonly (readonly [number, number])[] = [[205, 252], [207, 437], [205, 640], [468, 270], [488, 630], [335, 437], [585, 440]];

// Bounding box of the edges above, so callers can fit the logo into a canvas.
export const LOGO_BOUNDS = { x: 115, y: 97, width: 570, height: 703 } as const;

export type LogoPoint = { x: number; y: number; hub: boolean };

/** Splits every logo edge into roughly `spacing`-long pieces, sharing points where edges meet. */
export function logoGraph(spacing = 75): { points: LogoPoint[]; links: [number, number][] } {
  const points: LogoPoint[] = [];
  const links: [number, number][] = [];
  const index = new Map<string, number>();
  const isHub = (x: number, y: number) => LOGO_HUBS.some(([hx, hy]) => hx === x && hy === y);

  const point = (x: number, y: number) => {
    const key = `${Math.round(x)},${Math.round(y)}`;
    let at = index.get(key);
    if (at === undefined) {
      at = points.length;
      index.set(key, at);
      points.push({ x, y, hub: isHub(x, y) });
    }
    return at;
  };

  for (const [x1, y1, x2, y2] of LOGO_EDGES) {
    const pieces = Math.max(1, Math.round(Math.hypot(x2 - x1, y2 - y1) / spacing));
    let previous = point(x1, y1);
    for (let step = 1; step <= pieces; step += 1) {
      const current = point(x1 + ((x2 - x1) * step) / pieces, y1 + ((y2 - y1) * step) / pieces);
      links.push([previous, current]);
      previous = current;
    }
  }
  return { points, links };
}

/** Fewer dots on small screens: the field must stay smooth on a mid-range phone and easy on the battery. */
export function fieldNodeCount(width: number, height: number): number {
  const ceiling = width < 500 ? 38 : 64;
  return Math.min(ceiling, Math.max(24, Math.round((width * height) / 14000)));
}
