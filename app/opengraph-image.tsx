import { ImageResponse } from "next/og";
import { site, chain, colors, isReal } from "@/config";

export const alt = `${site.name} on ${chain.name}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const line = isReal(site.positioning) ? site.positioning : `${chain.name} · chain id ${chain.id}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: colors.bg,
          padding: 80,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, color: colors.muted, fontSize: 26 }}>
          <div style={{ width: 12, height: 12, borderRadius: 999, background: colors.accent }} />
          {chain.name} · {chain.id}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ color: colors.text, fontSize: 92, fontWeight: 800, letterSpacing: -3 }}>
            {site.name}
          </div>
          <div style={{ color: colors.muted, fontSize: 34, marginTop: 20, maxWidth: 900 }}>{line}</div>
        </div>
        <div style={{ display: "flex", height: 10, width: 220, background: colors.accent }} />
      </div>
    ),
    size,
  );
}
