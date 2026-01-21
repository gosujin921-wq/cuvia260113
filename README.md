# CUVIA Pro - 통합 관제 시스템

React + Vite 기반의 통합 관제 시스템 대시보드입니다.

## 기술 스택

- **React** 19.2.0
- **Vite** 6.0.5
- **React Router Dom** 7.1.3
- **TypeScript** 5.x
- **Tailwind CSS** 4.x
- **Iconify React** - 아이콘 라이브러리

## 프로젝트 구조

```
cuvia3/
├── src/                          # React 소스 코드
│   ├── App.tsx                   # 라우팅 설정
│   ├── main.tsx                  # 엔트리 포인트
│   ├── vite-env.d.ts            # Vite 타입 정의
│   └── pages/                    # 페이지 컴포넌트
│       ├── Home.tsx              # 메인 대시보드
│       ├── event-detail.tsx      # 이벤트 상세 페이지
│       └── components-style.tsx  # 스타일 관리 페이지
│
├── components/                   # 컴포넌트
│   ├── common/                   # 공통 컴포넌트
│   │   ├── CCTVIcon.tsx         # CCTV 아이콘 컴포넌트
│   │   └── BroadcastControls.tsx # 전파 제어 컴포넌트
│   ├── dashboard/                # 대시보드 컴포넌트
│   │   ├── Score.tsx             # 스코어 (이벤트 통계 그래프)
│   │   ├── SituationSummary.tsx  # 상황요약 팝업
│   │   ├── AIDetectionPopup.tsx  # AI 탐지 팝업
│   │   ├── EventList.tsx         # 이벤트 목록
│   │   ├── MapView.tsx           # 지도 뷰
│   │   └── LeftPanel.tsx         # 좌측 패널 (CCTV 상태)
│   ├── event-detail/             # 이벤트 상세 컴포넌트
│   │   ├── EventLeftPanel.tsx   # 좌측 패널 (이벤트 정보, AI 인사이트)
│   │   ├── EventCenterColumn1.tsx # 중앙 1열: 지도 뷰 (위치 및 동선)
│   │   ├── EventCenterColumn2.tsx # 중앙 2열: CCTV 섹션 (모니터링 CCTV, 포착 클립, 행동 요약)
│   │   ├── AgentPanel.tsx        # 우측 패널: AI Agent 채팅
│   │   ├── PlaybackControls.tsx  # 재생 제어
│   │   ├── DetectedCCTVClipPopup.tsx # 포착된 CCTV 클립 팝업
│   │   ├── MapCCTVPopup.tsx      # 지도 CCTV 팝업
│   │   ├── CombinedCCTVPopup.tsx # 통합 CCTV 팝업
│   │   ├── BroadcastDraftPopup.tsx # 전파 초안 팝업
│   │   ├── AdditionalDataNotificationPopup.tsx # 추가 자료 알림 팝업
│   │   ├── EventCompletionNotificationPopup.tsx # 사건 종료 알림 팝업
│   │   ├── constants.ts          # 상수 정의
│   │   └── types.ts             # 타입 정의
│   ├── layouts/                  # 레이아웃
│   │   └── ScaledLayout.tsx
│   └── shared/                   # 공유 컴포넌트 및 리소스
│       ├── BasePopup.tsx         # 기본 팝업 컴포넌트 (중앙 모달)
│       ├── NotificationPopup.tsx  # 알림 팝업 컴포넌트 (우측 하단/중앙)
│       └── styles.ts             # 공통 스타일 정의
│
├── lib/                          # 라이브러리/유틸리티
│   ├── events-data.ts            # 이벤트 데이터 관리 (📡 API 연동 필요)
│   └── mock-data/                # 🧪 더미 데이터 (개발용)
│       └── events.ts
│
├── types/                        # TypeScript 타입 정의
│   └── index.ts
│
├── app/                          # 정적 리소스
│   ├── globals.css               # 전역 CSS
│   └── favicon.ico
│
├── public/                       # 공개 정적 파일
│   ├── logo.svg
│   ├── icon_cctv.svg
│   └── map_anyang.png
│
├── index.html                    # HTML 엔트리
├── vite.config.ts               # Vite 설정
├── tsconfig.json                # TypeScript 설정
└── package.json                 # 의존성 관리
```

## 시작하기

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

개발 서버가 [http://localhost:3000](http://localhost:3000)에서 실행됩니다.

### 빌드

```bash
npm run build
```

빌드된 파일은 `dist/` 디렉토리에 생성됩니다.

### 미리보기

```bash
npm run preview
```

빌드된 프로덕션 버전을 미리볼 수 있습니다.

## 주요 기능

### 1. 메인 대시보드 (`/`)
- 이벤트 목록 및 요약
- 지도 기반 이벤트 시각화
- CCTV 운영 현황 모니터링
- 환경 센서 데이터 실시간 표시

#### 대시보드 동작 방식
- **초기 화면**: 이벤트가 기본적으로 표시되지 않음 (깔끔한 대시보드)
- **키보드 단축키**:
  - `1` 키: 김도연 실종 사건으로 이동 및 상황요약 팝업 표시
  - `2` 키: 유괴 의심 사건으로 이동 및 AI탐지 팝업 표시
  - `ESC` 키: 선택 해제 및 줌아웃
- **애니메이션 시퀀스**:
  1. 이벤트 표시 및 하이라이트 (즉시)
  2. 지도 줌인 시작 (300ms 후)
  3. 선택된 이벤트 핀을 지도 중앙으로 이동 (줌인과 동시)
  4. 팝업 자동 표시 (줌인 완료 후 800ms)
- **지도 줌 기능**:
  - `+/-` 버튼으로 줌 인/아웃
  - 줌인 시 선택된 이벤트가 자동으로 지도 중앙에 배치됨
  - CSS transform을 사용한 부드러운 애니메이션

### 2. 이벤트 상세 페이지 (`/event/:eventId`)
- 이벤트 상세 정보 및 타임라인
- CCTV 영상 재생 및 PTZ 제어
- AI 에이전트 채팅
- 전파 초안 작성 및 전송
- 이벤트 완료 처리

### 3. 스타일 관리 페이지 (`/components-style`)
- 공통 컴포넌트 시각적 확인 및 관리
- BasePopup, NotificationPopup, CCTV 아이콘 등 컴포넌트 스타일 가이드

## API 연동 가이드

현재 프로젝트는 더미 데이터를 사용하고 있으며, 모든 API 연동 포인트는 `📡 API 연동 필요` 주석으로 명확히 표시되어 있습니다.

### 주요 API 연동 포인트

#### 이벤트 관련
- `GET /api/events` - 이벤트 목록 조회
- `GET /api/events/:eventId` - 이벤트 상세 조회
- `GET /api/events?domain=:domain` - 도메인별 필터링
- `GET /api/events?status=:status` - 상태별 필터링

#### CCTV 관련
- `GET /api/cctv/status` - CCTV 운영 현황
- `GET /api/cctv/:cctvId/clip/metadata` - 클립 메타데이터
- `POST /api/cctv/:cctvId/ptz/:direction` - PTZ 제어
- `POST /api/cctv/:cctvId/monitoring/start` - 모니터링 시작
- `POST /api/cctv/:cctvId/monitoring/stop` - 모니터링 중단

#### AI 관련
- `POST /api/events/:eventId/chat` - AI 채팅 메시지 전송
- `POST /api/events/:eventId/insight` - AI 인사이트 생성

#### 전파 관련
- `POST /api/broadcast/send` - 전파 전송
- `POST /api/broadcast/draft` - 전파 초안 저장
- `POST /api/broadcast/clip` - 클립 전파

#### 센서 및 인프라
- `GET /api/sensors/realtime` - 환경 센서 데이터
- `GET /api/weather/current` - 날씨 데이터
- `GET /api/infrastructure/status` - 도시 기반시설 상태

각 API 연동 포인트에는 예시 코드가 주석으로 포함되어 있어, 실제 API 연동 시 주석을 해제하고 수정하면 됩니다.

## 개발 가이드

### 코드 스타일

- **컴포넌트**: 함수형 컴포넌트 사용 (`const Component = () => {}`)
- **이벤트 핸들러**: `handle` 접두사 사용 (예: `handleClick`, `handleSubmit`)
- **스타일링**: Tailwind CSS 클래스 사용
- **타입**: TypeScript 타입 정의 필수

### 최근 개선 사항

#### 대시보드 최적화 (2025-01-14)
- **초기 화면 개선**: 이벤트가 기본적으로 표시되지 않아 깔끔한 대시보드 제공
- **키보드 단축키 지원**: 숫자 키로 빠른 이벤트 탐색
- **애니메이션 개선**: 줌인 애니메이션 완료 후 팝업 자동 표시로 자연스러운 UX
- **지도 줌 기능**: 줌인 시 선택된 이벤트 핀을 정확히 중앙에 배치하는 알고리즘 개선
  - CSS transform의 `scale`과 `translate`를 정확히 계산하여 중앙 정렬 구현
- **코드 리팩토링**:
  - 중복된 이벤트 핸들러 통합 (`handleEventAction`)
  - 이벤트 찾기 로직 헬퍼 함수화 (`findEventByCriteria`)
  - 선택 해제 로직 통합 (`clearSelection`)
  - 불필요한 변수명 및 주석 정리

### 공통 컴포넌트

프로젝트는 일관된 디자인 시스템을 위해 공통 팝업 컴포넌트를 사용합니다:

- **BasePopup**: 중앙에 표시되는 모달 스타일 팝업 (예: CCTV 모니터링, 클립 상세)
- **NotificationPopup**: 우측 하단 또는 중앙에 표시되는 알림 스타일 팝업 (예: 추가 자료 알림, 사건 종료 알림)

모든 팝업 컴포넌트는 이 공통 컴포넌트를 기반으로 구현되어 일관된 디자인과 동작을 제공합니다.

### 프로토타입 기능

일부 프로토타입/데모용 기능은 `🧪 프로토타입 기능` 주석으로 표시되어 있습니다. 실제 운영 시 제거하거나 실제 기능으로 대체해야 합니다.

### 더미 데이터

개발용 더미 데이터는 `lib/mock-data/events.ts`에 있습니다. API 연동 후 이 파일은 삭제하거나 실제 API 호출로 대체할 수 있습니다.

## 환경 변수

현재 환경 변수는 사용하지 않지만, API 연동 시 필요할 수 있습니다:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

## 라이선스

Private