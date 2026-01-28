/**
 * Unity WebGL - React 브릿지 (React/TypeScript 프로젝트에서 사용)
 * - subscribeUnityToReact: Unity -> React 이벤트 구독 (여러 컴포넌트에서 동시 사용 가능)
 * - unsubscribeUnityToReact: Unity -> React 이벤트 구독 해제
 * - sendToUnity: React -> Unity 이벤트 전달
 *
 * 사용 전: Unity WebGL 빌드 시 unityInstance가 window에 노출되어 있어야 함.
 */

declare global {
  interface Window {
    unityInstance?: { SendMessage: (obj: string, method: string, value: string) => void };
    __onUnityToReact?: (eventName: string, eventData: string) => void;
    __unityToReactListeners?: Set<UnityToReactCallback>;
  }
}

/** Unity -> React 수신 시 사용할 GameObject 이름 (Unity 씬의 WebGLInterop가 붙은 오브젝트 이름과 일치) */
export const UNITY_RECEIVER_OBJECT_NAME = 'WebGLBridge';

/** React -> Unity 호출 시 메서드 이름 */
export const ON_REACT_EVENT_METHOD = 'OnReactEvent';

export type UnityToReactCallback = (eventName: string, eventData: string) => void;

// 이벤트 리스너들을 저장하는 Set (중복 방지)
const initializeListeners = () => {
  if (typeof window === 'undefined') return;
  
  if (!window.__unityToReactListeners) {
    window.__unityToReactListeners = new Set<UnityToReactCallback>();
    
    // Unity에서 호출할 전역 함수 설정 (한 번만)
    window.__onUnityToReact = (eventName: string, eventData: string) => {
      console.log(`[unityBridge] Unity 이벤트 수신: ${eventName}`, eventData);
      console.log(`[unityBridge] 등록된 리스너 수: ${window.__unityToReactListeners?.size}`);
      
      // 모든 등록된 리스너에게 이벤트 전달
      window.__unityToReactListeners?.forEach((callback) => {
        try {
          callback(eventName, eventData);
        } catch (error) {
          console.error('[unityBridge] 리스너 실행 중 에러:', error);
        }
      });
    };
    
    console.log('[unityBridge] 초기화 완료');
  }
};

/**
 * Unity -> React 이벤트 구독.
 * 여러 컴포넌트에서 동시에 사용 가능.
 * Unity에서 WebGLInterop.SendToReactEvent(name, data) 호출 시 callback(name, data) 실행.
 * 
 * @param callback - 이벤트 수신 시 실행될 콜백 함수
 * @returns unsubscribe 함수 (cleanup 용)
 */
export const subscribeUnityToReact = (callback: UnityToReactCallback): (() => void) => {
  if (typeof callback !== 'function') {
    console.warn('[unityBridge] callback은 함수여야 합니다.');
    return () => {};
  }
  
  initializeListeners();
  
  if (window.__unityToReactListeners) {
    window.__unityToReactListeners.add(callback);
    console.log(`[unityBridge] 리스너 등록됨. 현재 총 ${window.__unityToReactListeners.size}개`);
  }
  
  // unsubscribe 함수 반환
  return () => {
    if (window.__unityToReactListeners) {
      window.__unityToReactListeners.delete(callback);
      console.log(`[unityBridge] 리스너 해제됨. 현재 총 ${window.__unityToReactListeners.size}개`);
    }
  };
};

/**
 * Unity -> React 이벤트 구독 해제.
 * 
 * @param callback - 해제할 콜백 함수
 */
export const unsubscribeUnityToReact = (callback: UnityToReactCallback): void => {
  if (window.__unityToReactListeners) {
    window.__unityToReactListeners.delete(callback);
    console.log(`[unityBridge] 리스너 해제됨. 현재 총 ${window.__unityToReactListeners.size}개`);
  }
};

/**
 * React -> Unity 이벤트 전달.
 * Unity의 WebGLInterop.OnReactEvent(string)가 호출됨.
 */
export const sendToUnity = (
  data: string | object = '',
  objectName: string = UNITY_RECEIVER_OBJECT_NAME,
  methodName: string = ON_REACT_EVENT_METHOD
): void => {
  // globalThis와 window에서 unityInstance 찾기
  let instance: Window['unityInstance'] | undefined;
  
  if (typeof globalThis !== 'undefined' && (globalThis as unknown as Window).unityInstance) {
    instance = (globalThis as unknown as Window).unityInstance;
  } else if (typeof window !== 'undefined' && window.unityInstance) {
    instance = window.unityInstance;
  }
  
  if (!instance || !instance.SendMessage) {
    console.warn('[unityBridge] unityInstance.SendMessage not available. Is Unity WebGL loaded?');
    return;
  }
  
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  instance.SendMessage(objectName, methodName, payload);
};
