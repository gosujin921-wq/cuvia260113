import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  server: {
    port: 3000,
    open: true,
    hmr: {
      port: 3001,
      overlay: false, // HMR 에러 오버레이 비활성화
    },
  },
  css: {
    devSourcemap: false, // CSS 소스맵 비활성화로 분석 오류 방지
  },
  build: {
    outDir: 'dist',
  },
});
