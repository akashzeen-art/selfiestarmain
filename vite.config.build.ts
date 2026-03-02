/**
 * Build-only config: no server/Express plugin, so Railway and other CI never resolve ./server.
 * Used by: pnpm run build:client (and thus pnpm build).
 * Dev still uses vite.config.ts which wires Express.
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  build: {
    outDir: "dist/spa",
    chunkSizeWarningLimit: 800,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
});
