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
    port: 3001,
    open: true,
    hmr: {
      overlay: true, // HMR 에러 발생 시 오버레이 표시 (문제 진단용)
    },
    watch: {
      usePolling: false, // 필요 시 true로 변경 (Docker/WSL 등에서 파일 감지 안 될 때)
    },
  },
  css: {
    devSourcemap: false, // CSS 소스맵 비활성화로 분석 오류 방지
  },
  build: {
    outDir: 'dist',
  },
});
