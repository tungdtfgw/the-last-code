import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { apiPlugin } from "./server/vite-api-plugin";

export default defineConfig({
  plugins: [react(), apiPlugin()],
  worker: { format: "es" },
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  build: { target: "es2022" },
});
