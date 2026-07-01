import { Capacitor } from "@capacitor/core";

/**
 * Web dev: empty string → Vite proxy to localhost:3000
 * Web prod: same origin (Express serves API + static)
 * Native (Capacitor): must set VITE_API_BASE to your public HTTPS URL at build time
 */
export function getApiBase() {
  const fromEnv = String(import.meta.env.VITE_API_BASE || "").trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }

  if (import.meta.env.DEV) {
    return "";
  }

  if (Capacitor.isNativePlatform()) {
    console.error(
      "[Saathi] VITE_API_BASE is missing. Rebuild with your live server URL, e.g. VITE_API_BASE=https://your-app.onrender.com npm run build:mobile"
    );
    return "";
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "http://localhost:3000";
}
