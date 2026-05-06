# /tutorial 다국어(i18n) 가이드

`/tutorial` 페이지에 한국어/영어 다국어 기능을 적용했다. 시작 안내 모달 우측 상단의 KR/EN 토글로 언제든 전환 가능하며, 선택한 언어는 `localStorage`(`cuvia.tutorial.language`)에 저장돼 다음 방문에서도 유지된다.

## 1. 설치

`package.json`에 추가된 의존성:

```json
"i18next": "^23.x",
"i18next-browser-languagedetector": "^8.x",
"react-i18next": "^15.x"
```

설치:

```bash
npm install
```

## 2. 파일 구조

| 파일 | 역할 |
| --- | --- |
| `src/i18n/index.ts` | i18next 초기화 (LanguageDetector + react-i18next 바인딩) |
| `src/i18n/locales/ko.json` | 한국어 리소스 (275개 키) |
| `src/i18n/locales/en.json` | 영어 리소스 (275개 키) |
| `src/main.tsx` | `import "./i18n"` 한 줄로 i18n 부트스트랩 |

## 3. 사용 패턴

```tsx
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  return <button aria-label={t('common.confirm')}>{t('common.confirm')}</button>;
};
```

치환 변수 / 배열 / `defaultValue`:

```tsx
t('home.objectTrackingConfirm.message', { count: 7 })
t('captureList.routeRationale.items', { returnObjects: true }) as string[]
t('propagation.defaultPropagationContent', { defaultValue: koFallback })
```

`useCallback` 의존성에 `t` 추가 (lint 경고 방지):
```tsx
useCallback(() => { t('...'); }, [t]);
```

## 4. 적용 완료 (이번 작업으로 영문 전환됨)

### 핵심 인프라
- `src/i18n/index.ts` + ko/en JSON 리소스 (총 275개 키)
- 시작 안내 모달의 KR/EN 토글 (헤더 우측 상단)
- `LanguageSelectModal.tsx` (참고용으로 남겨둠 — 현재 마운트 안 됨)

### 페이지 / 페이지 hooks
- `src/pages/Home-v2.tsx` — 시작/종료 다이얼로그, 안내 다이얼로그(ConfirmDialog 2개), 포착 알림, 사이드바 라벨, 시작 메시지창 전체
- `src/pages/useMouseGuide.ts` — 튜토리얼 가이드 메시지 10단계 전체 (intro / review-candidates / candidate-detail / route-analysis / predicted-cctv / predicted-cctv-detail / capture-list-review / propagation / report-download / report-result). 언어 전환 시 현재 스텝 메시지가 즉시 갱신됨.

### 컴포넌트 (`components/dashboard/HOME-v2/`)
- `LeftMenuPanel.tsx` — 좌측 메뉴 5개 + CUVIA Link
- `MouseGuide.tsx` — 가이드 헤더 툴팁/aria-label
- `ConfirmDialog.tsx` — 기본 OK/Cancel 텍스트
- `SharedVideoPlayer.tsx` — "Loading video", aria-label
- `TopControlPanel.tsx` — Fast Search 모니터링 헤더 + 중지 버튼
- `ReportDownloadPopup.tsx` — 미리보기 타이틀, 페이지 네비게이션, 저장 형식 4개 (HWP/JPG/DOCX/PDF), 파일명
- `TrackingBoxController.tsx` — 추적 박스 컨트롤 전체 (위치/크기/방향)
- `PredictedCCTVListPanel.tsx` — 반경/정렬 칩
- `CaptureListPanel.tsx` — 포착 상세 모달 전체 (예측 정보, 경로 예측 6개 항목, 분석 결과 3개 섹션, 빈 상태)
- `FastSearchCandidateDetailPopup.tsx` — 다이얼로그 헤더, 비디오 컨트롤, 탭, 메타 정보 5개, 유사도 비교 테이블, 대상 포착 버튼
- `PredictedCCTVDetailPopup.tsx` — 동일하게 다이얼로그 전체 + 경로 예측 상세 5개 항목
- `FastSearchListPanel.tsx` — 반경/시간/정렬 팝오버, 정렬 옵션 4종, 필터 초기화, 결과 재검색, 카드의 맞음/틀림/유사후보/선택됨 라벨
- `AIAgentPopup.tsx` — Welcome 메시지, 고속검색/재검색/객체추적 progress 5/3/5단계, 분석 결과 카드(결론/요약/근거/대응 추천), 입력 placeholder, 도구/전송/취소/축소·확장 버튼, 알림/추천/footer disclaimer
- `PropagationListPanel.tsx` — 헤더 칩(전파 건수/상태), 메시지 영역(신고기관/담당자), 보고서 다운로드 버튼, 입력 placeholder, 채팅 안내, 신고 접수문/전파문/112 회신문 본문 (KR↔EN 전환됨)
- `PropagationPackagePopup.tsx` — 다이얼로그 헤더, 비디오 컨트롤, 탭(미리보기/상세 보기), AI 안내, 텍스트영역 placeholder, 취소/전파 패키지 전송 버튼

## 5. 부분 적용 / 잔존 한국어

다음은 현재 KR로 남아있는 부분입니다. 사용자 경험에 큰 지장은 없지만 추후 확장 가능.

| 파일 | 잔존 부분 | 비고 |
| --- | --- | --- |
| `src/pages/Home-v2.tsx` (~80줄) | `virtualEvents` 목 데이터 (type, title, priority, processingStage, location.name) | EventList/ReportPopup에서 표시될 수 있음. 데이터 키화가 필요 |
| `PropagationListPanel.tsx` (~91줄) | 한국어 fallback 변수(`defaultReportContentKO` 등) — JSON에 없을 때만 사용됨, 실제로는 EN 모드에서 영어 본문이 표시됨 | 안전한 graceful degradation 용 |
| `PropagationPackagePopup.tsx` (~138줄) | 동일 fallback + "상세 보기" 탭의 8개 카드 (3.대상자 정보, 4.추적 판단 요약 등) | 카드 내 한국어가 EN 모드에서도 그대로 보임. 추가 i18n 적용 권장 |
| `MapView.tsx` (~93줄), `ObjectTrackingMapView.tsx` (~34줄) | CCTV 이름(`별빛A-583`), 한국어 주소(`달빛로301번길 28`), 방향(`북동쪽`) 등 mock 데이터 | 도메인 데이터(고유명사) — 그대로 두는 게 자연스러움 |

## 6. 언어 전환 방법

**튜토리얼 시작 모달 → 우측 상단 KR/EN 토글 클릭** (가장 간단)

또는 브라우저 콘솔에서:
```js
localStorage.setItem('cuvia.tutorial.language', 'en'); // 또는 'ko'
location.reload();
```

## 7. 키 정의·사용 검증

```bash
node -e "
const ko = require('./src/i18n/locales/ko.json');
const en = require('./src/i18n/locales/en.json');
function flat(o, p='') { /* ... */ }
const koKeys = flat(ko).sort();
const enKeys = flat(en).sort();
console.log('ko:', koKeys.length, 'en:', enKeys.length);
"
```

현재 ko/en 모두 275개 키 — 100% 매칭. `t('...')` 호출 검사 결과 정의되지 않은 키 0건.

## 8. 빌드 검증

```bash
npm install
npm run build
```

`✓ 1216 modules transformed` 확인 (트랜스파일 정상). 사전 존재하는 타입 에러 2건(`PropagationListPanel.tsx:212` Timeout 타입, `Home-v2.tsx:1326` CaptureItem 타입)은 i18n 작업과 무관한 별개 이슈.
