import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          'sql-js': ['sql.js'],
          'pdf': ['jspdf', 'jspdf-autotable'],
          'excel': ['xlsx'],
          'qr': ['html5-qrcode']
        }
      }
    }
  }
})
