import { useEffect, useRef } from "react";
import { clearSessionTokens } from "../api/axios.js";

export default function useRealtime(onMessage) {
  const wsRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const apiHost = import.meta.env.VITE_API_URL || "http://localhost:8000";
    const apiPrefix = import.meta.env.VITE_API_PREFIX || "/api/v1";
    const base = `${apiHost.replace(/\/$/, "")}${apiPrefix}`;
    const wsProto = base.startsWith("https") ? "wss" : "ws";
    const wsUrl = `${wsProto}://${apiHost.replace(/https?:\/\//, '').replace(/\/$/, '')}${apiPrefix}/realtime/ws?token=Bearer%20${encodeURIComponent(token)}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // optional ping
      };

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          onMessage && onMessage(data);
        } catch (e) {
          // ignore
        }
      };

      ws.onclose = (ev) => {
        // if unauthorized close, clear tokens
        if (ev && ev.code === 4401) {
          clearSessionTokens();
          window.location.replace('/login');
        }
      };

      ws.onerror = () => {
        // ignore
      };

      return () => {
        try {
          ws.close();
        } catch (e) {}
      };
    } catch (err) {
      // fail silently
    }
  }, [onMessage]);
}
