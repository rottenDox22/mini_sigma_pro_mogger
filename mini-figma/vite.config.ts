import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/mini_sigma_pro_mogger/',
  plugins: [react(), tailwindcss()],
});