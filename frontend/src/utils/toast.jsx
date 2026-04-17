import toast from "react-hot-toast";

export const notifySuccess = (message) => toast.success(message);
export const notifyError = (message) => toast.error(message);
export const notifyInfo = (message) => toast(message);
export const notifyLoading = (message = "Loading...") => toast.loading(message);

export const notifyPromise = (
  promise,
  {
    loading = "Loading...",
    success = "Done",
    error = "Something went wrong",
  } = {}
) => {
  return toast.promise(
    promise,
    {
      loading,
      success,
      error,
    },
    {
      style: {
        borderRadius: "16px",
      },
    }
  );
};

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
            background: isLightTheme
              ? "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(242, 248, 245, 0.95))"
              : "linear-gradient(135deg, rgba(9, 18, 13, 0.98), rgba(15, 31, 22, 0.94))",
            color: isLightTheme ? "#0f2618" : "#e8f7ee",
            border: isLightTheme ? "1px solid rgba(22,101,52,0.18)" : "1px solid rgba(52,211,153,0.26)",
            borderRadius: "16px",
            padding: "14px",
            width: "min(92vw, 360px)",
            boxShadow: isLightTheme
              ? "0 18px 34px rgba(15, 89, 47, 0.14)"
              : "0 18px 34px rgba(2, 24, 12, 0.46)",
            backdropFilter: "blur(16px)",
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
                border: isLightTheme ? "1px solid rgba(22,101,52,0.22)" : "1px solid rgba(52,211,153,0.3)",
                background: isLightTheme ? "#f3f8f4" : "rgba(20, 45, 32, 0.92)",
                color: isLightTheme ? "#355a43" : "#b9e5cb",
                borderRadius: "9999px",
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
                borderRadius: "9999px",
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
