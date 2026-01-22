# CCTV 화각 관리 가이드

이 가이드는 코드에서 CCTV 화각(부채꼴의 각도)을 쉽게 수정하는 방법을 설명합니다.

## 용어 정리

- **화각 (View Angle)**: 부채꼴의 각도, 시야각의 넓이 (0-180도)
- **방향 (Direction)**: 부채꼴 끝이 가리키는 방향 (0-360도)

## 파일 위치

- **유틸리티 파일**: `lib/cctv-view-angle-utils.ts`
- **사용 위치**: `components/dashboard/MapView.tsx`

## 기본 사용법

### 1. 개별 CCTV 화각 설정

`lib/cctv-view-angle-utils.ts` 파일을 열고 `cctvConfigs` 배열의 `viewAngle` 값을 수정하세요:

```typescript
export const cctvConfigs: CCTVConfig[] = [
  { cctvId: 'cctv-0', direction: 45, viewAngle: 90 },  // 화각 90도
  { cctvId: 'cctv-1', direction: 90, viewAngle: 120 }, // 화각 120도로 변경
  { cctvId: 'cctv-2', direction: 135, viewAngle: 60 },  // 화각 60도로 변경
  // ...
];
```

**화각 값 참고:**
- `30`: 매우 좁은 화각
- `45`: 좁은 화각
- `60`: 중간 좁은 화각
- `90`: 기본 화각 (현재)
- `120`: 넓은 화각
- `150`: 매우 넓은 화각
- `180`: 반원 (최대)

### 2. 브라우저 콘솔에서 jQuery 스타일로 조절

브라우저 개발자 도구 콘솔에서 직접 실행 가능:

```javascript
// 유틸리티 함수 import (모듈 시스템 사용)
import { $setAllCCTVViewAngles, $setCCTVViewAngles, setCCTVViewAngleById } from '@/lib/cctv-view-angle-utils';

// 모든 CCTV 화각을 120도로 설정
$setAllCCTVViewAngles(120);

// 특정 CCTV 그룹의 화각을 60도로 설정
$setCCTVViewAngles(['cctv-0', 'cctv-1', 'cctv-2'], 60);

// 개별 CCTV 화각 설정
setCCTVViewAngleById('cctv-0', 120);
```

### 3. 코드에서 직접 사용

```typescript
import { 
  setCCTVViewAngle, 
  setCCTVViewAngles, 
  adjustAllCCTVViewAngles 
} from '@/lib/cctv-view-angle-utils';

// 개별 CCTV 화각 설정
setCCTVViewAngle('cctv-0', 120);

// 여러 CCTV 화각 일괄 설정
setCCTVViewAngles([
  { cctvId: 'cctv-0', viewAngle: 120 },
  { cctvId: 'cctv-1', viewAngle: 60 },
  { cctvId: 'cctv-2', viewAngle: 150 },
]);

// 모든 CCTV 화각을 10도씩 넓히기
adjustAllCCTVViewAngles(10);
```

### 4. SVG Path 자동 생성

화각에 따라 SVG path가 자동으로 생성됩니다:

```typescript
import { generateViewAnglePath } from '@/lib/cctv-view-angle-utils';

// 90도 화각의 SVG path 생성
const path90 = generateViewAnglePath(90); 
// "M 60 60 L 60 10 A 50 50 0 0 1 110 60 Z"

// 120도 화각의 SVG path 생성
const path120 = generateViewAnglePath(120);
// 더 넓은 부채꼴 path

// 60도 화각의 SVG path 생성
const path60 = generateViewAnglePath(60);
// 더 좁은 부채꼴 path
```

## 예시: 모든 CCTV 화각을 120도로 설정

```typescript
import { $setAllCCTVViewAngles } from '@/lib/cctv-view-angle-utils';

// 모든 CCTV의 화각을 120도로 설정
$setAllCCTVViewAngles(120);
```

## 예시: 특정 지역 CCTV만 화각 조정

```typescript
import { $setCCTVViewAngles } from '@/lib/cctv-view-angle-utils';

// 상단 지역 CCTV들 (cctv-0 ~ cctv-5)의 화각을 60도로 설정
const topAreaCCTVs = ['cctv-0', 'cctv-1', 'cctv-2', 'cctv-3', 'cctv-4', 'cctv-5'];
$setCCTVViewAngles(topAreaCCTVs, 60);
```

## 예시: 화각을 점진적으로 넓히기

```typescript
import { adjustAllCCTVViewAngles } from '@/lib/cctv-view-angle-utils';

// 모든 CCTV 화각을 10도씩 넓히기
adjustAllCCTVViewAngles(10);

// 모든 CCTV 화각을 5도씩 좁히기
adjustAllCCTVViewAngles(-5);
```

## 주의사항

1. 화각은 0-180도 범위로 제한됩니다.
2. 변경사항은 localStorage에 자동 저장됩니다.
3. 유틸리티 파일을 수정한 후에는 앱을 재시작해야 합니다.
4. 브라우저 콘솔에서 함수를 호출하면 즉시 반영됩니다 (이벤트 기반).

## 기술적 세부사항

- SVG path는 `generateViewAnglePath()` 함수로 동적으로 생성됩니다.
- 화각 변경 시 `cctv-view-angle-changed` 커스텀 이벤트가 발생합니다.
- React 컴포넌트는 이 이벤트를 감지하여 자동으로 리렌더링합니다.
