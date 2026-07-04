import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  server: {
    proxy: {
      "^/(auth|chat|support|admin|whatsapp|push|health|config|r|peer|presence|guide)": {
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
      includeAssets: ["pwa.svg"],
      manifest: {
        name: "Saathi",
        short_name: "Saathi",
        description: "Your Friend, Your Guide",
        start_url: "./",
        display: "standalone",
        background_color: "#f4fafa",
        theme_color: "#2ec4b6",
        icons: [
          {
            src: "./pwa.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any"
          },
          {
            src: "./pwa.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "maskable"
          }
        ]
      }
    })
  ]
});
