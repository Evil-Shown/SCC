import toast from "react-hot-toast";

export const notifySuccess = (message) => toast.success(message);
export const notifyError = (message) => toast.error(message);
export const notifyInfo = (message) => toast(message);

export const confirmAction = (
  message,
  {
    confirmText = "Confirm",
    cancelText = "Cancel",
  } = {}
) => {
  return new Promise((resolve) => {
    const isLightTheme = document.documentElement.getAttribute("data-theme") === "light";

    const toastId = toast.custom(
      (toastItem) => (
        <div
          style={{
            background: isLightTheme ? "#ffffff" : "#0f172a",
            color: isLightTheme ? "#0f172a" : "#f8fafc",
            border: isLightTheme ? "1px solid rgba(100,116,139,0.3)" : "1px solid rgba(148,163,184,0.35)",
            borderRadius: "10px",
            padding: "12px",
            width: "min(92vw, 360px)",
            boxShadow: isLightTheme ? "0 12px 28px rgba(15,23,42,0.18)" : "0 12px 28px rgba(2,6,23,0.45)",
          }}
        >
          <p style={{ margin: 0, marginBottom: "10px", fontSize: "0.9rem", lineHeight: 1.45 }}>
            {message}
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <button
              type="button"
              onClick={() => {
                toast.dismiss(toastItem.id);
                resolve(false);
              }}
              style={{
                border: isLightTheme ? "1px solid rgba(100,116,139,0.3)" : "1px solid rgba(148,163,184,0.35)",
                background: isLightTheme ? "#f8fafc" : "rgba(30,41,59,0.9)",
                color: isLightTheme ? "#334155" : "#cbd5e1",
                borderRadius: "8px",
                padding: "6px 10px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={() => {
                toast.dismiss(toastItem.id);
                resolve(true);
              }}
              style={{
                border: "1px solid rgba(16,185,129,0.45)",
                background: isLightTheme ? "rgba(16,185,129,0.14)" : "rgba(16,185,129,0.2)",
                color: isLightTheme ? "#065f46" : "#d1fae5",
                borderRadius: "8px",
                padding: "6px 10px",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      ),
      {
        id: `confirm-${Date.now()}`,
        duration: Infinity,
        position: "top-center",
      }
    );

    return toastId;
  });
};
