import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// import fs from 'fs';

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  server: {
    // https: {
    //   key: fs.readFileSync(path.resolve(__dirname, 'home.pixelpro.pl-key.pem')),
    //   cert: fs.readFileSync(path.resolve(__dirname, 'home.pixelpro.pl.pem')),
    // },
    host: true,
    port: 80,
    hmr: {
      host: 'home.pixelpro.pl',
      port: 80,
      protocol: 'ws',
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@assets': path.resolve(__dirname, 'src/assets'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@store': path.resolve(__dirname, 'src/store'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
    },
  },
});
