import { ImageResponse } from "next/og";

export const alt = "Syntho | Autonomous AI Trading on ICP";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0A0B0F",
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <svg
            width="56"
            height="56"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="32" height="32" rx="7" fill="#16181D" />
            <path
              d="M16 4.4 27.6 16 16 27.6 4.4 16 16 4.4Z"
              stroke="#00D4C8"
              strokeWidth="1.2"
              strokeOpacity="0.4"
            />
            <path
              d="M16 9.2 22.8 16 16 22.8 9.2 16 16 9.2Z"
              stroke="#00D4C8"
              strokeWidth="1.2"
              strokeOpacity="0.75"
            />
            <path
              d="M16 13.2 18.8 16 16 18.8 13.2 16 16 13.2Z"
              fill="#00D4C8"
            />
          </svg>
          <div
            style={{
              marginLeft: 16,
              fontSize: 28,
              fontWeight: 500,
              letterSpacing: "-0.03em",
              color: "#E8EAED",
            }}
          >
            Syntho
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 56,
              fontWeight: 500,
              letterSpacing: "-0.035em",
              color: "#E8EAED",
              lineHeight: 1.12,
            }}
          >
            Autonomous AI Trading on ICP
          </div>
          <div
            style={{
              marginTop: 20,
              fontSize: 24,
              color: "#9AA0A6",
              lineHeight: 1.4,
              maxWidth: 820,
            }}
          >
            Transparent performance. Predictable compute. Institutional-grade
            risk telemetry.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#00D4C8",
            fontSize: 18,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          <span>syntho.cc</span>
          <span style={{ color: "#9AA0A6" }}>Internet Computer</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
