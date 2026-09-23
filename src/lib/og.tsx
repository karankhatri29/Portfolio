import { ImageResponse } from "next/og";

import { SITE_NAME } from "@/lib/site";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_TYPE = "image/png";

function clamp(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export function renderOgImage({ kicker, title, subtitle }: { kicker: string; title: string; subtitle?: string }) {
  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", height: "100%", padding: 72, background: "#131918", color: "#ecece8" }}>
        <div style={{ display: "flex", fontSize: 28, letterSpacing: 6, textTransform: "uppercase", color: "#f6b84c" }}>{clamp(kicker, 60)}</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: title.length > 60 ? 56 : 72, fontWeight: 700, lineHeight: 1.1 }}>{clamp(title, 110)}</div>
          {subtitle ? <div style={{ display: "flex", marginTop: 28, fontSize: 30, lineHeight: 1.4, color: "#a6aea8" }}>{clamp(subtitle, 150)}</div> : null}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 28, color: "#a6aea8" }}>
          <span>{SITE_NAME}</span>
          <span style={{ display: "flex", width: 120, height: 6, background: "#f6b84c" }} />
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
