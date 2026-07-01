import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/pro/",
  server: {
    port: 5174,
    proxy: {
      "^/(auth|support|push|whatsapp|health|config|admin|peer|presence|guide)": {
        target: "http://localhost:3000",
        changeOrigin: true
      },
      "^/pro/(status|templates)$": {
        target: "http://localhost:3000",
        changeOrigin: true
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",
      registerType: "autoUpdate",
      manifest: {
        name: "Saathi Partner",
        short_name: "Saathi Partner",
        description: "Professional dashboard for Saathi Partner",
        start_url: "./",
        display: "standalone",
        background_color: "#1b4332",
        theme_color: "#1b4332",
        icons: [
          {
            src: "./pro-icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any"
          }
        ]
      }
    })
  ]
});
