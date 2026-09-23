import { portfolioContent } from "@/data/portfolio";
import { OG_SIZE, OG_TYPE, renderOgImage } from "@/lib/og";

export const alt = `${portfolioContent.name} - portfolio`;
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export default function Image() {
  return renderOgImage({ kicker: portfolioContent.eyebrow, title: portfolioContent.name, subtitle: portfolioContent.headline });
}
