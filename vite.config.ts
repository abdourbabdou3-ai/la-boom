import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  const isVercel = process.env.VERCEL === '1';

  return {
    base: isVercel ? '/' : process.env.VITE_BASE_PATH || '/la-boom/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: {
        overlay: false,
      },
      watch: null,
    },
  };
});
