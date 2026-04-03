"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "sans-serif" }}>
          <div style={{ textAlign: "center" }}>
            <h2 style={{ color: "#1e3a5f", fontSize: "24px", marginBottom: "8px" }}>Something went wrong</h2>
            <p style={{ color: "#666", marginBottom: "24px" }}>{error.message || "An unexpected error occurred"}</p>
            <button
              onClick={reset}
              style={{ background: "#1e3a5f", color: "white", padding: "8px 24px", borderRadius: "8px", border: "none", cursor: "pointer" }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
