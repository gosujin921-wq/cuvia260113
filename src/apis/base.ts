import type { BaseResponse } from "./types";

/**
 * 공통 응답에서 data만 추출. error !== 0 이면 에러 throw (인터셉터에서 이미 처리된 경우는 드물게 사용)
 */
export const normalizeResponse = <T>(response: BaseResponse<T>): T => {
    if (response.error !== 0) {
        throw new Error(response.message);
    }
    return response.data as T;
};
