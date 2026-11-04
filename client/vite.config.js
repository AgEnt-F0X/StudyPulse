import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

// Single React instance — the root cause of "Cannot read properties of
// null (reading 'useMemo')". Resolve each react-ish dep to the REAL
// hoisted package directory (npm workspaces put them at the root), so
// Vite can never split React across duplicate copies.
function pkgDir(name) {
  try {
    return path.dirname(require.resolve(`${name}/package.json`))
  } catch {
    return null
  }
}

function aliases(names) {
  const out = {}
  for (const name of names) {
    const dir = pkgDir(name)
    if (dir) {
      out[name] = dir
      if (name === 'react') out['react/jsx-runtime'] = path.join(dir, 'jsx-runtime')
    }
  }
  return out
}

const reactAliases = aliases([
  'react',
  'react-dom',
  'react-router-dom',
])

export default defineConfig({
  plugins: [react()],
  resolve: {
    // NOTE: React core is aliased/deduped to the single hoisted instance.
    // zustand is deliberately NOT aliased/deduped — @react-three/fiber
    // depends on zustand v3's default export and breaks against workspace
    // v5 (verified build failure). lucide-react IS deduped + prebundled so
    // Vite never hangs re-transforming 1,400+ icon modules mid-session.
    dedupe: ['react', 'react-dom', 'react-router-dom', 'lucide-react'],
    alias: reactAliases,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime', 'react-router-dom', 'lucide-react', 'framer-motion', 'motion'],
    force: true,
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
