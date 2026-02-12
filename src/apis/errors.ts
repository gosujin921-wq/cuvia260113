/**
 * API 에러 클래스 (statusCode, code, data 포함)
 */
export class ApiError extends Error {
    readonly statusCode?: number;
    readonly code?: number;
    readonly data?: unknown;

    constructor(
        message: string,
        statusCode?: number,
        code?: number,
        data?: unknown
    ) {
        super(message);
        this.name = "ApiError";
        this.statusCode = statusCode;
        this.code = code;
        this.data = data;
        Object.setPrototypeOf(this, ApiError.prototype);
    }
}
