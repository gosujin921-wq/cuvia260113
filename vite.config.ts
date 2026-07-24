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
        host: true, // 0.0.0.0 바인딩 → 내 IP:3001으로 접속 가능
        open: true,
        hmr: {
            overlay: true, // HMR 에러 발생 시 오버레이 표시 (문제 진단용)
        },
        watch: {
            usePolling: true, // macOS 등에서 파일 변경 감지 안 될 때 강제 폴링
        },
        proxy: {
            "/api": {
                target: "http://192.168.102.103:9090",
                changeOrigin: true,
                secure: false,
            },
            "/v1": {
                target: "http://192.168.102.103:16000/v1",
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/v1/, ""),
            },
            "/wms-proxy": {
                target: "https://topisgeo.eseoul.go.kr:8443",
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/wms-proxy/, ""),
            },
            "/its-proxy": {
                target: "https://its.go.kr:9443",
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/its-proxy/, ""),
                timeout: 5000,
                configure: (proxy) => {
                    proxy.on("error", (err, _req, res) => {
                        console.warn("[ITS Proxy] 연결 에러:", err.message);
                        if (res && "writeHead" in res) {
                            res.writeHead(504, { "Content-Type": "text/plain" });
                            res.end("ITS Gateway Timeout");
                        }
                    });
                },
            },
            "/gitsmap-proxy": {
                target: "https://gitsmap.gg.go.kr",
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/gitsmap-proxy/, ""),
            },
            "/utic-wms-proxy": {
                target: "https://gis.utic.go.kr",
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/utic-wms-proxy/, ""),
                timeout: 20000,
                configure: (proxy) => {
                    proxy.on("error", (err, _req, res) => {
                        console.warn("[UTIC WMS Proxy] 연결 실패:", err.message);
                        if (res && "writeHead" in res) {
                            res.writeHead(504, { "Content-Type": "text/plain" });
                            res.end("UTIC WMS Gateway Timeout");
                        }
                    });
                },
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
