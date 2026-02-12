import axios, { type InternalAxiosRequestConfig } from "axios";
import type { BaseResponse } from "./types";
import { ApiError } from "./errors";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export const axiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 15_000,
    headers: {
        "Content-Type": "application/json",
    },
});

/** 요청 인터셉터: 토큰/공통 헤더 */
axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        return config;
    },
    (error) => Promise.reject(error)
);

/** 응답 인터셉터: API 에러 시 ApiError로 통일 */
axiosInstance.interceptors.response.use(
    (response) => {
        const body = response.data as BaseResponse<unknown> | undefined;
        if (body && "error" in body && body.error !== 0) {
            return Promise.reject(new ApiError(body.message, response.status, body.error, body.data));
        }
        return response;
    },
    (error) => {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const data = error.response?.data as { message?: string; error?: number } | undefined;
            const message = data?.message ?? error.message ?? "요청을 처리할 수 없습니다.";
            return Promise.reject(new ApiError(message, status, data?.error, error.response?.data));
        }
        return Promise.reject(error);
    }
);
