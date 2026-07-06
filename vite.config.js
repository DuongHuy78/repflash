import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { reactSourceLocator } from "vite-plugin-react-source-locator";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    reactSourceLocator({ includeComponents: true }),
    react()
  ],
  server: {
    host: true,
    port: 7000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:6000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 7000,
    strictPort: true,
  },
})
