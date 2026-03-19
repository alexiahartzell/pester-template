import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/tasks": "http://localhost:8742",
      "/standup": "http://localhost:8742",
      "/reprioritize": "http://localhost:8742",
      "/review": "http://localhost:8742",
      "/plan": "http://localhost:8742",
      "/health": "http://localhost:8742",
    },
  },
});
