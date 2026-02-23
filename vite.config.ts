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
      usePolling: true, // macOS 등에서 파일 변경 감지 안 될 때 강제 폴링
    },
  },
  css: {
    devSourcemap: false, // CSS 소스맵 비활성화로 분석 오류 방지
  },
  build: {
    outDir: 'dist',
  },
});
