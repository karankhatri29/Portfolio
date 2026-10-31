import type { DailyPoint } from "@/lib/analytics/repository";

const WIDTH = 640;
const HEIGHT = 220;
const PAD = { top: 12, right: 12, bottom: 28, left: 36 };

// Picks an even axis maximum so the three tick labels (0, half, max) are always whole numbers.
function niceMax(value: number) {
  if (value <= 10) return Math.max(4, Math.ceil(value / 2) * 2);
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1.2, 1.6, 2, 3, 4, 5, 6, 8, 10].find((candidate) => Math.round(candidate * magnitude) >= value) ?? 10;
  return Math.round(step * magnitude);
}

function shortDate(day: string) {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

// A smooth line through the points: each step curves with level tangents, so it never swings past a real value.
function smooth(points: { x: number; y: number }[]) {
  return points
    .map((point, index) => {
      if (index === 0) return `M${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
      const before = points[index - 1];
      const middle = ((before.x + point.x) / 2).toFixed(1);
      return `C${middle} ${before.y.toFixed(1)} ${middle} ${point.y.toFixed(1)} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
    })
    .join(" ");
}

export function TrafficChart({ data }: { data: DailyPoint[] }) {
  const total = data.reduce((sum, point) => sum + point.views, 0);
  if (data.length === 0 || total === 0) {
    return <p className="mt-4 text-sm text-muted">No page views recorded in this period yet.</p>;
  }

  const max = niceMax(Math.max(...data.map((point) => point.views)));
  const innerWidth = WIDTH - PAD.left - PAD.right;
  const innerHeight = HEIGHT - PAD.top - PAD.bottom;
  const x = (index: number) => PAD.left + (data.length === 1 ? innerWidth / 2 : (index / (data.length - 1)) * innerWidth);
  const y = (value: number) => PAD.top + innerHeight - (value / max) * innerHeight;
  const line = (key: "views" | "visitors") => smooth(data.map((point, index) => ({ x: x(index), y: y(point[key]) })));
  const area = `${line("views")} L${x(data.length - 1).toFixed(1)} ${y(0)} L${x(0).toFixed(1)} ${y(0)} Z`;
  const ticks = [0, max / 2, max];
  const labelIndexes = [...new Set([0, Math.floor((data.length - 1) / 2), data.length - 1])];

  return (
    <figure className="mt-4">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`Daily page views and unique visitors, ${shortDate(data[0].day)} to ${shortDate(data[data.length - 1].day)}`} className="h-auto w-full text-accent">
        <defs>
          <linearGradient id="traffic-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.35" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(tick)} y2={y(tick)} stroke="currentColor" strokeOpacity="0.14" strokeDasharray="2 5" />
            <text x={PAD.left - 6} y={y(tick) + 4} textAnchor="end" fontSize="11" fill="currentColor" fillOpacity="0.7">{tick}</text>
          </g>
        ))}
        <path d={area} fill="url(#traffic-fill)" />
        <path d={line("views")} fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinejoin="round" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 6px currentColor)" }} />
        <path d={line("visitors")} fill="none" stroke="currentColor" strokeOpacity="0.55" strokeWidth="2" strokeDasharray="5 4" strokeLinejoin="round" />
        <circle cx={x(data.length - 1)} cy={y(data[data.length - 1].views)} r="4" fill="currentColor" style={{ filter: "drop-shadow(0 0 6px currentColor)" }} />
        {labelIndexes.map((index) => (
          <text key={index} x={x(index)} y={HEIGHT - 8} textAnchor={index === 0 ? "start" : index === data.length - 1 ? "end" : "middle"} fontSize="11" fill="currentColor" fillOpacity="0.7">{shortDate(data[index].day)}</text>
        ))}
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
        <span><span aria-hidden="true" className="mr-2 inline-block h-0.5 w-5 bg-accent align-middle" />Page views</span>
        <span><span aria-hidden="true" className="mr-2 inline-block h-0.5 w-5 border-t-2 border-dashed border-accent/60 align-middle" />Unique visitors</span>
      </figcaption>
      <table className="sr-only">
        <caption>Daily traffic</caption>
        <thead><tr><th>Date</th><th>Views</th><th>Visitors</th></tr></thead>
        <tbody>{data.map((point) => <tr key={point.day}><td>{point.day}</td><td>{point.views}</td><td>{point.visitors}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}
