import { axiosInstance } from "../axios";

/** 이벤트 시작 */
export const startEvent = () => {
    return axiosInstance.post("/v1/cuvia-was/test/event/start");
};

/** 이벤트 종료 */
export const endEvent = () => {
    return axiosInstance.post("/v1/cuvia-was/test/event/end");
};

/** VLM 분석 시작 */
export const startVlmAnalysis = (filePath?: string) => {
    return axiosInstance.post("/v1/cuvia-was/test/event/vlm", null, {
        params: filePath ? { filePath } : undefined,
    });
};
