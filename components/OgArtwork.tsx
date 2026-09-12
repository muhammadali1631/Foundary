const CHIPS = ["AI writes the code", "Live preview", "React + Tailwind"];

export default function OgArtwork({
  width = 1200,
  height = 630,
}: {
  width?: number;
  height?: number;
}) {
  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        background:
          "linear-gradient(135deg, #0b0f0d 0%, #0e1f1a 55%, #0b3929 100%)",
        fontFamily:
          "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(16,185,129,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.07) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "-220px",
          right: "-140px",
          width: 640,
          height: 640,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(16,185,129,0.45) 0%, transparent 65%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-280px",
          left: "-160px",
          width: 560,
          height: 560,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(45,212,191,0.28) 0%, transparent 65%)",
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "68px 72px",
          height: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 15,
              background: "linear-gradient(135deg, #10b981, #0d9488)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: 26,
            }}
          >
            F
          </div>
          <div
            style={{
              color: "#a7b3ad",
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
            }}
          >
            AI App Builder
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: "#f1f5f4",
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
            }}
          >
            Turn a prompt
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              backgroundImage:
                "linear-gradient(90deg, #5eead4, #10b981, #22d3ee)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            into a living app
          </div>
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          {CHIPS.map((chip) => (
            <div
              key={chip}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 22px",
                borderRadius: 999,
                border: "1px solid rgba(16,185,129,0.35)",
                background: "rgba(16,185,129,0.10)",
                color: "#a7f3d0",
                fontSize: 21,
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "#10b981",
                }}
              />
              {chip}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}