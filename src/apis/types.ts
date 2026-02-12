/** API 공통 응답 뼈대 */
export interface BaseResponse<T = unknown> {
    error: number;
    message: string;
    data?: T;
}

