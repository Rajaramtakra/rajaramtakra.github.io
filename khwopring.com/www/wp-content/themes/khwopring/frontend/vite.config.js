import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Production build is served by the WP theme's index.php directly from
  // wp-content/themes/khwopring/dist, so asset URLs must be absolute to that path.
  base: '/wp-content/themes/khwopring/dist/',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
})
