import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: ".",
  publicDir: "public",
  build: {
    outDir: "dist",
  },
  // Electron 渲染进程需要的配置
  base: './',
  server: {
    port: 5173,
    strictPort: true,
  },
});
