import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' supaya hasil build bisa dibuka dari subfolder GitHub Pages.
export default defineConfig({
  base: './',
  plugins: [react()],
});
