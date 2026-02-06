export interface EventFromUnity {
    objectName: string; // 클릭된 대상
    action: string; // 발생된 이벤트
    source: string; // 이벤트 이름
}

export interface EventToUnity {
    methodName: string; // 이벤트 타입
    payload: unknown;
}
