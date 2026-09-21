import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  base: "./",
  publicDir: "public",
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  define: {
    "import.meta.env.VITE_APK": JSON.stringify("1"),
  },
  build: {
    outDir: "apk-www",
    emptyOutDir: true,
    rollupOptions: {
      input: fileURLToPath(new URL("./apk/index.html", import.meta.url)),
    },
  },
});
