import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const lincolnPortrait = await readFile(join(process.cwd(), "assets/lincoln.png"));
const lincolnDataUrl = `data:image/png;base64,${Buffer.from(lincolnPortrait).toString("base64")}`;

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "80px",
          background: "#020617",
          color: "#e2e8f0",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
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
              fontSize: 80,
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
        <div
          style={{
            display: "flex",
            marginLeft: 48,
            padding: 10,
            borderRadius: 16,
            border: "3px solid #fbbf24",
            background: "#0f172a",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lincolnDataUrl}
            width={280}
            height={301}
            style={{ borderRadius: 8, objectFit: "cover" }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
