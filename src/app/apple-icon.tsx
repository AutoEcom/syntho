import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A0B0F",
          borderRadius: 36,
        }}
      >
        <svg
          width="132"
          height="132"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
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
      </div>
    ),
    { ...size }
  );
}
