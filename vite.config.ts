import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./"),
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
        proxy: {
            "/v1": {
                target: "http://192.168.102.102:16000/v1",
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/v1/, ""),
            },
        },
    },
    css: {
        devSourcemap: false, // CSS 소스맵 비활성화로 분석 오류 방지
    },
    optimizeDeps: {
        esbuildOptions: {
            target: "es2022",
        },
    },
    build: {
        target: "es2022",
        outDir: "dist",
    },
});
