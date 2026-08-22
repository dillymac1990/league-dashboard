import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#020617",
          color: "#e2e8f0",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 22,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#fbbf24",
            fontWeight: 700,
            marginBottom: 24,
          }}
        >
          Late Round Legends · 12-Team PPR
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 88,
            fontWeight: 900,
            color: "#f8fafc",
            letterSpacing: -2,
            lineHeight: 1.05,
          }}
        >
          League of Integrity
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 30,
            color: "#94a3b8",
            marginTop: 28,
          }}
        >
          League Command Center
        </div>
      </div>
    ),
    { ...size }
  );
}
