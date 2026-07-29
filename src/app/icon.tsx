import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#171717",
          borderRadius: 14,
          color: "#fafafa",
          display: "flex",
          fontSize: 27,
          fontWeight: 700,
          height: "100%",
          justifyContent: "center",
          letterSpacing: "-2px",
          width: "100%",
        }}
      >
        2A
      </div>
    ),
    size,
  );
}
