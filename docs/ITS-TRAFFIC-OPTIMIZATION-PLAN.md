# ITS 교통정보 타일 요청 최적화 플랜

## 문제 상황
- 같은 망에서 여러 PC(4~5대)가 ITS 교통정보 레이어를 동시 사용 시 500 에러 발생
- 원인: ITS 서버(its.go.kr:9443)의 IP/대역당 요청 수 제한 또는 동시 연결 제한

## 요청 흐름
```
[PC 1~5 브라우저] → [우리 nginx /its-proxy] → [its.go.kr:9443]
                                              ↑
                              같은 공인 IP에서 요청 집중 → 제한 발생
```

---

## 개선 방안 (우선순위순)

### 1순위: nginx 캐시 제대로 활성화 ⭐
**효과**: 같은 타일 요청 90% 이상 감소  
**난이도**: 낮음

현재 `proxy_cache_valid` 등 설정은 있지만 `proxy_cache_path`가 없어서 캐시가 실제로 동작하지 않음.

**수정 내용:**
1. `http` 블록에 `proxy_cache_path` 정의 추가
2. `location /its-proxy/` 블록에 `proxy_cache` 지시어 추가

```nginx
# http 블록 최상단에 추가
proxy_cache_path /var/cache/nginx/its_cache 
    levels=1:2 
    keys_zone=its_cache:10m 
    max_size=100m 
    inactive=10m 
    use_temp_path=off;

# location /its-proxy/ 블록 내부에 추가
proxy_cache its_cache;
proxy_cache_key $uri$is_args$args;
```

---

### 2순위: 캐시 TTL 늘리기
**효과**: 요청 빈도 절반 이하로  
**난이도**: 낮음

현재 30초 → 60~120초로 변경 (실시간성 약간 희생)

```nginx
proxy_cache_valid 200 120s;  # 30s → 120s
```

클라이언트 캐시도 조정:
```nginx
add_header Cache-Control "public, max-age=120, stale-while-revalidate=180" always;
```

---

### 3순위: 줌 레벨 제한
**효과**: 저줌에서 불필요한 요청 제거  
**난이도**: 낮음

MapView.tsx에서 ITS 레이어 소스에 `minzoom` 설정:
```typescript
map.addSource("its-traffic-source", {
    type: "raster",
    tiles: [...],
    tileSize: 256,
    minzoom: 10,  // 줌 10 이상에서만 타일 요청
    maxzoom: 18,
});
```

---

### 4순위: 에러 시 레이어 자동 비활성화
**효과**: 500 폭주 방지  
**난이도**: 중간

연속 에러 발생 시 레이어를 일시적으로 비활성화하고 사용자에게 알림:
```typescript
let itsErrorCount = 0;
const ITS_ERROR_THRESHOLD = 5;
const ITS_COOLDOWN_MS = 60000;

// 에러 핸들러에서
if (e.error?.message?.includes("ITS tile")) {
    itsErrorCount++;
    if (itsErrorCount >= ITS_ERROR_THRESHOLD) {
        map.setLayoutProperty("its-traffic-layer", "visibility", "none");
        toast.warning("ITS 교통정보 서버 응답 지연으로 일시 비활성화됩니다.");
        setTimeout(() => {
            itsErrorCount = 0;
            // 필요시 자동 재활성화
        }, ITS_COOLDOWN_MS);
    }
}
```

---

### 5순위: 요청 큐잉/동시 요청 제한
**효과**: 피크 요청 분산  
**난이도**: 중간

**방법 A: nginx에서 제한**
```nginx
# http 블록에 추가
limit_req_zone $binary_remote_addr zone=its_limit:10m rate=10r/s;

# location /its-proxy/ 블록에 추가
limit_req zone=its_limit burst=20 nodelay;
```

**방법 B: 클라이언트에서 제한**
MapLibre의 `maxParallelImageRequests` 옵션 조정 또는 커스텀 프로토콜에서 큐잉 구현.

---

### 6순위: 대체 레이어/폴백
**효과**: ITS 장애 시에도 서비스 유지  
**난이도**: 중간~높음

- UTIC WMS 레이어로 폴백 (이미 `/utic-wms-proxy/` 설정 있음)
- 다른 공공 교통정보 API 검토

---

## 체크리스트

- [x] 1순위: nginx 캐시 활성화 (`proxy_cache_path`, `proxy_cache`) ✅ 완료
- [x] 2순위: 캐시 TTL 120초로 증가 ✅ 완료
- [x] 3순위: ITS 레이어 minzoom 설정 (7→10) ✅ 완료
- [ ] 4순위: 에러 임계치 초과 시 레이어 비활성화 (이미 기본 구현됨)
- [x] 5순위: 요청 속도 제한 ✅ 완료
- [ ] 6순위: 대체 레이어 구현 (필요시)

---

## 적용된 변경사항

### 2026-03-12: 1순위 + 2순위 + 3순위 + 5순위 적용

**수정된 파일:**
- `nginx-main.conf` (신규): http 블록에 `proxy_cache_path` 정의 + `limit_req_zone` 추가
- `nginx.conf`: `/its-proxy/` location에 `proxy_cache`, `proxy_cache_key`, `limit_req` 추가, TTL 120초로 증가
- `Dockerfile`: `nginx-main.conf` 복사 및 캐시 디렉토리 생성 추가
- `components/dashboard/WithLink/MapView.tsx`: 
  - minzoom 7→10 변경 (3순위)
  - 요청 큐잉 시스템 추가 - 동시 4개 제한 (5순위)
- `components/dashboard/HOME-v2/MapView.tsx`:
  - minzoom 7→10 변경 (3순위)
  - 요청 큐잉 시스템 추가 - 동시 4개 제한 (5순위)
  - Image 기반 → fetch/프록시 기반으로 변경 (CORS 안정성 향상)

**배포 후 확인 방법:**
```bash
# 캐시 상태 확인 (응답 헤더)
curl -I http://your-server/its-proxy/geoserver/gwc/service/wmts/...

# X-Cache-Status 헤더 확인:
# - MISS: 캐시 없음, ITS에서 직접 가져옴
# - HIT: 캐시에서 응답
# - STALE: 만료된 캐시 사용 (백그라운드 갱신 중)
# - UPDATING: 캐시 갱신 중
```

**요청 제한 동작:**
- nginx: 초당 20개 요청, burst 30개까지 허용
- 클라이언트: 동시 4개 요청만 ITS로 전송, 나머지는 큐에서 대기

---

## 참고
- ITS 국가교통정보센터: https://its.go.kr
- 현재 프록시 경로: `/its-proxy/` → `https://its.go.kr:9443/`
- 관련 파일: `nginx.conf`, `components/dashboard/WithLink/MapView.tsx`
