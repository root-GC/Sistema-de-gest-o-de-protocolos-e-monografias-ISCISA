import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['.ngrok-free.dev'],
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        xfwd: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, request) => {
            const host = request.headers.host;

            if (host) {
              proxyReq.setHeader('X-Forwarded-Host', host);
            }

            proxyReq.setHeader('X-Forwarded-Proto', 'http');
          });
        },
      },
      '/storage': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        xfwd: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, request) => {
            const host = request.headers.host;

            if (host) {
              proxyReq.setHeader('X-Forwarded-Host', host);
            }

            proxyReq.setHeader('X-Forwarded-Proto', 'http');
          });
        },
      },
    },
  },
})
