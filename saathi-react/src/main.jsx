import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import { registerSW } from "virtual:pwa-register";
import "./index.css";
import App from "./App.jsx";

if (import.meta.env.PROD && !Capacitor.isNativePlatform()) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      window.location.reload();
    },
    onRegisterError(error) {
      console.error("Service worker registration failed:", error);
    }
  });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
