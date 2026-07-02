export default function AdminLoading() {
  return (
    <div
      aria-hidden="true"
      style={{
        background: "transparent",
        height: 3,
        left: 0,
        overflow: "hidden",
        pointerEvents: "none",
        position: "fixed",
        top: 0,
        width: "100%",
        zIndex: 100,
      }}
    >
      <style>
        {`
          @keyframes admin-loading-line {
            0% {
              transform: translateX(-100%);
              width: 34%;
            }

            50% {
              width: 58%;
            }

            100% {
              transform: translateX(260%);
              width: 34%;
            }
          }
        `}
      </style>
      <div
        style={{
          animation: "admin-loading-line 1.15s ease-in-out infinite",
          background: "#2563eb",
          borderRadius: 999,
          boxShadow: "0 0 18px rgba(37, 99, 235, 0.72)",
          height: "100%",
          transform: "translateX(-100%)",
          width: "40%",
        }}
      />
    </div>
  );
}
