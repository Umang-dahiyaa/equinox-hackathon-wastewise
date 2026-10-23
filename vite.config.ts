import path from "node:path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        // "/" — the Skyprompt hero (plain HTML/CSS/JS in hero/)
        main: path.resolve(__dirname, "index.html"),
        // "/app.html" — the WasteWise React app
        app: path.resolve(__dirname, "app.html"),
      },
    },
  },
})
