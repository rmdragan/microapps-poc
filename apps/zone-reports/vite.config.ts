import { zoneByApp } from "@micro/routing";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const zone = zoneByApp("zone-reports");

export default defineConfig({
  base: `${zone.path}/`,
  plugins: [react(), tailwindcss()],
  define: {
    __BUILD_INFO__: JSON.stringify(process.env.BUILD_INFO ?? "dev"),
  },
  server: {
    strictPort: true,
    host: true,
  },
  preview: {
    strictPort: true,
    host: true,
  },
  optimizeDeps: {
    exclude: ["@micro/ui", "@micro/auth", "@micro/api", "@micro/routing"],
  },
});
