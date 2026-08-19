import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite dev server on port 5173 (default). The backend runs on port 8000 and
// exposes CORS for this origin, so the dashboard calls it directly.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
})
