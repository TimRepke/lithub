import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [vue()],
    base: env.VITE_LITHUB_BASE,
    rollupOptions: {
      // overwrite default .html entry
      input: "src/main.ts",
    },
    build: {
      manifest: true,
      sourcemap: true,
      minify: "esbuild",
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  };
});
