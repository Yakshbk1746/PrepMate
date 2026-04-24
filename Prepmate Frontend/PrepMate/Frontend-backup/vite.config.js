import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Critical for v4

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // This replaces the need for tailwind.config.js
  ],
})