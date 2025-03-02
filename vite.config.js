import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/auth/v1': {
        target: process.env.VITE_SUPABASE_URL,
        changeOrigin: true,
        secure: false
      },
      '/rest/v1': {
        target: process.env.VITE_SUPABASE_URL,
        changeOrigin: true,
        secure: false
      },
      '/storage/v1': {
        target: process.env.VITE_SUPABASE_URL,
        changeOrigin: true,
        secure: false
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      // External packages that shouldn't be bundled
      external: [
        // Add Brevo to external packages to prevent bundling issues
        '@getbrevo/brevo'
      ]
    }
  },
  define: {
    'process.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL),
    'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
    'process.env.VITE_GOOGLE_MAPS_API_KEY': JSON.stringify(process.env.VITE_GOOGLE_MAPS_API_KEY),
    'process.env.VITE_BREVO_API_KEY': JSON.stringify(process.env.VITE_BREVO_API_KEY)
  }
});