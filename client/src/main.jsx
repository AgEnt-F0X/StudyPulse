import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/index.css'
import 'katex/dist/katex.min.css'
// NOTE: Service Worker registration REMOVED — the old cache-first worker
// served stale React chunks that crashed the app. The no-op worker in
// public/sw.js only unregisters itself; the head script in index.html
// purges every registration + cache bucket on load.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
