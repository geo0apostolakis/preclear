import { ImageResponse } from "next/og";
import { site, colors } from "@/config";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  const glyph = site.name.trim().charAt(0).toUpperCase();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: colors.bg,
          color: colors.accent,
          fontSize: 40,
          fontWeight: 700,
          borderRadius: 12,
        }}
      >
        {glyph}
      </div>
    ),
    size,
  );
}
