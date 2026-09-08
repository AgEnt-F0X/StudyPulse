import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },
  optimizeDeps: {
    exclude: ['@mlc-ai/web-llm'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          three3d: ['three', '@react-three/fiber', '@react-three/drei'],
          motion: ['framer-motion', 'motion'],
          ui: ['lucide-react'],
          pdf: ['jspdf', 'pdfjs-dist'],
          supabase: ['@supabase/supabase-js'],
          state: ['zustand'],
        }
      }
    }
  }
})
