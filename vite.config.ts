import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  const supabaseUrl = env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    console.warn('Warning: VITE_SUPABASE_URL is not defined in .env file');
  }

  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    define: {
      'process.env': {},
      global: {},
    },
    server: {
      host: true,
      port: 5173,
      strictPort: true,
      proxy: {
        '/functions/v1': {
          target: supabaseUrl,
          changeOrigin: true,
          secure: false,
          ws: false,
          rewrite: (path) => path,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.error('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              if (env.VITE_SUPABASE_ANON_KEY) {
                proxyReq.setHeader('apikey', env.VITE_SUPABASE_ANON_KEY);
                if (!req.headers.authorization) {
                  proxyReq.setHeader('Authorization', `Bearer ${env.VITE_SUPABASE_ANON_KEY}`);
                }
              }
              if (req.headers.authorization) {
                proxyReq.setHeader('Authorization', req.headers.authorization);
              }
            });
          },
        },
      },
    },
    preview: {
      host: true,
      port: 5173,
      strictPort: true,
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'dnd-vendor': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          }
        }
      },
      chunkSizeWarningLimit: 1000,
      cssCodeSplit: true,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      }
    }
  };
});