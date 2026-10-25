import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Expone el frontend en la red local Wi-Fi para acceder desde el celular
    port: 5173,
  }
})
