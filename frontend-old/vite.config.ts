import {fileURLToPath, URL} from 'node:url';

import {defineConfig, loadEnv} from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import glslify from 'rollup-plugin-glslify';

const myPlugin = () => {
  return {
    name: 'configure-server',
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        res.setHeader('Content-Security-Policy', "worker-src * 'self' blob:;")
        next()
      })
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        res.setHeader('Content-Security-Policy', "worker-src * 'self' blob:;")
        next()
      })
    },
  };
}
// https://vitejs.dev/config/
export default defineConfig(({mode}) => {
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
    lib: {
      entry: '/src/plugins/deepscatter/deepscatter.ts',
      name: 'Deepscatter',
      formats: ['es', 'umd'],
    },
    plugins: [
      myPlugin(),
      vue({
        template: {
          compilerOptions: {
            // treat all tags with a dash as custom elements
            isCustomElement: (tag) => tag === 'd3fc-canvas',
          },
        },
      }),
      vueJsx(),
      glslify({compress: false}), // for debugging
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
