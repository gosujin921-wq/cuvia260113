import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "../app/globals.css";

window.addEventListener("unhandledrejection", (event) => {
    // react-unity-webgl 관련 에러인 경우에만 로깅 (undefined 에러 방지)
    if (event.reason === undefined || event.reason === null) {
        console.warn("[Global] 처리되지 않은 Promise rejection (undefined):", event.promise);
        event.preventDefault(); // 기본 에러 로깅 방지
    } else {
        console.error("[Global] 처리되지 않은 Promise rejection:", event.reason);
    }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>
);
