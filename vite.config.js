import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  root: "src/",
  publicDir: "./public",
  build: {
    outDir: "../dist",    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/index.html"),
        
      },
    },// Ensure static assets are copied to dist
    assetsInclude: ["**/*.json", "**/*.svg"],
    copyPublicDir: true,
  },
});
