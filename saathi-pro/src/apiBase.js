import { Capacitor } from "@capacitor/core";

export function getApiBase() {
  const fromEnv = String(import.meta.env.VITE_API_BASE || "").trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (import.meta.env.DEV) return "http://localhost:3000";
  if (Capacitor.isNativePlatform()) return "";
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:3000";
}
