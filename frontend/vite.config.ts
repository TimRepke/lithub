import {fileURLToPath, URL} from 'node:url';

import {defineConfig, loadEnv} from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
// import glsl from 'vite-plugin-glsl';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    build: {
      manifest: true,
      sourcemap: true,
    },
    base: env.VITE_LANDSCAPE_BASE,
    rollupOptions: {
      // overwrite default .html entry
      input: 'src/main.ts',
    },
    plugins: [
      vue({
        template: {
          compilerOptions: {
            // treat all tags with a dash as custom elements
            isCustomElement: (tag) => tag === 'd3fc-canvas',
          },
        },
      }),
      vueJsx(),
      // glsl()
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      }
    },
    define: {
      __APP_ENV__: env.APP_ENV,
    },
  }
});
