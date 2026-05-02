import { useEffect } from "react";

export default function useRealtime(onEvent) {
  useEffect(() => {
    if (typeof window === "undefined" || typeof onEvent !== "function") {
      return undefined;
    }

    const handleRealtimeEvent = (event) => {
      onEvent(event.detail ?? null);
    };

    window.addEventListener("realtime", handleRealtimeEvent);

    return () => {
      window.removeEventListener("realtime", handleRealtimeEvent);
    };
  }, [onEvent]);
}
