import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        fontSize: 100,
        background: "#0d1117",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#00ff41",
        fontFamily: "monospace",
        fontWeight: "bold",
        borderRadius: 32,
      }}
    >
      {">_"}
    </div>,
    {
      ...size,
    }
  );
}
