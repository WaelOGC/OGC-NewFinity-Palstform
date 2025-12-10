import { useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

function SystemStatusBadge() {
  const [status, setStatus] = useState("checking");
  const [details, setDetails] = useState(null);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch(`${API_BASE_URL}/system/db-check`);
        if (!res.ok) {
          throw new Error("Non-OK response");
        }
        const data = await res.json();
        if (data.status === "OK" && data.db === "connected") {
          setStatus("ok");
          setDetails(data.details);
        } else {
          setStatus("error");
          setDetails(data);
        }
      } catch (err) {
        console.error("System status check failed:", err);
        setStatus("error");
        setDetails({ error: err.message });
      }
    }

    fetchStatus();
  }, []);

  let label = "Checking system...";
  let className =
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium";

  if (status === "ok") {
    label = "Backend + DB: ONLINE";
    className += " bg-green-700/30 text-green-300 border border-green-500/60";
  } else if (status === "error") {
    label = "Backend + DB: OFFLINE";
    className += " bg-red-700/30 text-red-300 border border-red-500/60";
  } else {
    className += " bg-slate-700/40 text-slate-200 border border-slate-500/50";
  }

  return (
    <div className="mt-2">
      <span className={className}>{label}</span>
      {/* Optional: show debug info in console only; keep UI clean */}
    </div>
  );
}

export default SystemStatusBadge;

