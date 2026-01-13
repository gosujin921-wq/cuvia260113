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
│   │   ├── EventSummary.tsx      # 이벤트 요약
│   │   ├── EventList.tsx         # 이벤트 목록
│   │   ├── MapView.tsx           # 지도 뷰
│   │   └── RightPanel.tsx        # 우측 패널 (CCTV 상태)
│   ├── event-detail/             # 이벤트 상세 컴포넌트
│   │   ├── EventLeftPanel.tsx
│   │   ├── EventCenterPanel.tsx
│   │   ├── EventCenterColumn1.tsx
│   │   ├── EventCenterColumn2.tsx
│   │   ├── DetectedCCTVClipPopup.tsx
│   │   ├── MapCCTVPopup.tsx
│   │   ├── CombinedCCTVPopup.tsx
│   │   └── ...
│   ├── layouts/                  # 레이아웃
│   │   └── ScaledLayout.tsx
│   └── shared/                   # 공유 리소스
│       └── styles.ts
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

### 2. 이벤트 상세 페이지 (`/event/:eventId`)
- 이벤트 상세 정보 및 타임라인
- CCTV 영상 재생 및 PTZ 제어
- AI 에이전트 채팅
- 전파 초안 작성 및 전송
- 이벤트 완료 처리

### 3. 스타일 관리 페이지 (`/components-style`)
- 컴포넌트 스타일 관리 및 수정

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