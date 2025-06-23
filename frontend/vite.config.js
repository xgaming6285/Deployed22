import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0', // Allow external access for ngrok
    open: false, // Don't auto-open browser for ngrok deployment
    // Allow ngrok hosts
    allowedHosts: [
      '.ngrok.io',
      '.ngrok-free.app',
      'localhost',
      '127.0.0.1'
    ],
    // Alternative: Disable host checking entirely for development
    // Remove proxy for ngrok deployment - use environment variable for API URL instead
    // proxy: process.env.NODE_ENV !== 'production' ? {
    //   '/api': {
    //     target: 'http://localhost:5000',
    //     changeOrigin: true,
    //     secure: false,
    //     ws: true,
    //     configure: (proxy, _options) => {
    //       proxy.on('error', (err, _req, _res) => {
    //         console.log('proxy error', err);
    //       });
    //       proxy.on('proxyReq', (proxyReq, req, _res) => {
    //         console.log('Sending Request to the Target:', req.method, req.url);
    //       });
    //       proxy.on('proxyRes', (proxyRes, req, _res) => {
    //         console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
    //       });
    //     }
    //   }
    // } : undefined
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          redux: ['@reduxjs/toolkit', 'react-redux', 'redux-persist']
        }
      }
    }
  },
  // Define environment variables for API URL
  define: {
    __API_URL__: JSON.stringify(process.env.VITE_API_URL || 'https://ftd-backend.onrender.com/api')
  }
}) 