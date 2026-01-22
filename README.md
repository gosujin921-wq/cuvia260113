# CUVIA Pro - 통합 관제 시스템

React + Vite 기반의 통합 관제 시스템 대시보드입니다.

## 기술 스택

- **React** 19.2.0
- **Vite** 6.0.5
- **React Router Dom** 7.1.3
- **TypeScript** 5.x
- **Tailwind CSS** 4.x
- **Iconify React** - 아이콘 라이브러리
- **MapLibre GL** 5.16.0 - 지도 라이브러리
- **Recharts** 3.6.0 - 차트 라이브러리

## 프로젝트 구조

```
cuvia3/
├── src/                          # React 소스 코드
│   ├── App.tsx                   # 라우팅 설정
│   ├── main.tsx                  # 엔트리 포인트
│   ├── vite-env.d.ts            # Vite 타입 정의
│   └── pages/                    # 페이지 컴포넌트
│       ├── Home.tsx              # 메인 대시보드 (surveillance 시나리오)
│       ├── prototype/            # 프로토타입 페이지
│       │   └── demo.tsx          # 데모 페이지 (surveillance 시나리오)
│       ├── event-detail.tsx      # 이벤트 상세 페이지
│       ├── agent-chat.tsx        # Agent Chat 페이지
│       ├── agent-hub.tsx         # Agent Hub 페이지
│       └── components-style.tsx  # 스타일 관리 페이지
│
├── components/                   # 컴포넌트
│   ├── common/                   # 공통 컴포넌트
│   │   ├── CCTVIcon.tsx         # CCTV 아이콘 컴포넌트
│   │   └── BroadcastControls.tsx # 전파 제어 컴포넌트
│   ├── dashboard/                # 대시보드 컴포넌트
│   │   ├── Dashboard.tsx         # 메인 대시보드 컴포넌트
│   │   ├── MapView.tsx           # 지도 뷰 (백그라운드)
│   │   ├── MapCCTVControls.tsx  # 맵 컨트롤 및 CCTV 컨트롤 버튼
│   │   ├── CCTVVideoPanel.tsx   # 하단 CCTV 비디오 플레이어
│   │   ├── LeftPanel.tsx         # 좌측 패널 (운영 현황)
│   │   ├── EventList.tsx         # 우측 패널 (이벤트 목록)
│   │   ├── SituationSummary.tsx # 상황요약 팝업
│   │   ├── AIDetectionPopup.tsx  # AI 탐지 팝업
│   │   ├── MainDriftnetPopup.tsx # 메인 투망 팝업
│   │   └── EventDetailPopup.tsx  # 이벤트 상세 팝업 (공통)
│   ├── event-detail/             # 이벤트 상세 컴포넌트
│   │   ├── EventLeftPanel.tsx   # 좌측 패널 (이벤트 정보, AI 인사이트)
│   │   ├── EventCenterColumn1.tsx # 중앙 1열: 지도 뷰 (위치 및 동선)
│   │   ├── EventCenterColumn2.tsx # 중앙 2열: CCTV 섹션
│   │   ├── EventCenterPanel.tsx   # 중앙 패널 통합 컴포넌트
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
│   │   └── ScaledLayout.tsx      # 스케일 조정 레이아웃
│   └── shared/                   # 공유 컴포넌트 및 리소스
│       ├── BasePopup.tsx         # 기본 팝업 컴포넌트 (중앙 모달)
│       ├── NotificationPopup.tsx  # 알림 팝업 컴포넌트 (우측 하단/중앙)
│       └── styles.ts             # 공통 스타일 정의
│
├── lib/                          # 라이브러리/유틸리티
│   ├── events-data.ts            # 이벤트 데이터 관리
│   ├── cctv-video-utils.ts       # CCTV 비디오 유틸리티
│   ├── cctv-view-angle-utils.ts  # CCTV 시야각 유틸리티
│   ├── dashboard/                # 대시보드 관련 설정
│   │   ├── scenarios.ts          # 시나리오 설정 (surveillance, demo)
│   │   ├── keyboard-shortcuts.ts # 키보드 단축키 매핑
│   │   └── keyboard-handler.ts   # 키보드 이벤트 처리 로직
│   └── mock-data/                # 더미 데이터
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
│   ├── simbol.svg
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

개발 서버가 [http://localhost:5173](http://localhost:5173)에서 실행됩니다.

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

## 페이지 설명

### 1. 메인 대시보드 (`/`)

**Home.tsx** - 통합 관제 시스템의 메인 화면입니다. `surveillance` 시나리오를 사용합니다.

#### 주요 기능
- **이벤트 목록 및 통계**: 우측 패널에 이벤트 목록과 통계 카드 (전체, 대기, 진행중, 종결)
- **지도 기반 이벤트 시각화**: MapLibre GL을 사용한 인터랙티브 지도
- **CCTV 운영 현황 모니터링**: 좌측 패널에서 CCTV 상태 및 센서 데이터 실시간 표시
- **키보드 단축키 지원**: 숫자 키로 빠른 이벤트 탐색
- **맵 컨트롤**: 확대/축소, 2D/3D 모드 전환, 회전 버튼
- **CCTV 컨트롤**: CCTV 토글, CCTV 이름 표시, CCTV 화각 표시 버튼
- **하단 CCTV 비디오 플레이어**: CCTV 영상 자동 롤링 재생

#### 레이아웃 구조
- **좌측 패널 (LeftPanel)**: CCTV 운영 현황, 환경 센서 데이터
- **중앙 영역 (MapView)**: 지도 뷰 (백그라운드), 맵 컨트롤 버튼, CCTV 컨트롤 버튼
- **우측 패널**: 이벤트 통계 카드 (2x2 그리드), 이벤트 목록
- **하단**: CCTV 비디오 플레이어

#### 키보드 단축키
- `1` 키: 김도연 실종 사건으로 이동 및 상황요약 팝업 표시
- `2` 키: 유괴 의심 사건으로 이동 및 메인투망 팝업 표시 (패널 사라지는 애니메이션 포함)
- `3` 키: 폭행 사건으로 이동
- `ESC` 키: 선택 해제 및 줌아웃

#### 애니메이션 시퀀스
1. 이벤트 표시 및 하이라이트 (즉시)
2. 지도 줌인 시작 (300ms 후)
3. 선택된 이벤트 핀을 지도 중앙으로 이동 (줌인과 동시)
4. 펄스 애니메이션 실행
5. 팝업 자동 표시 (줌인 완료 후 800ms)

#### 컴포넌트 구성
- **Dashboard**: 메인 레이아웃 및 상태 관리
- **MapView**: 지도 뷰 (백그라운드 레이어)
- **MapCCTVControls**: 맵 컨트롤 및 CCTV 컨트롤 버튼
- **CCTVVideoPanel**: 하단 CCTV 비디오 플레이어
- **LeftPanel**: CCTV 운영 현황, 센서 데이터, 모니터링 스팟, 시간대 이벤트 차트, 지역별 이벤트 히트맵
- **EventList**: 이벤트 목록 및 필터링 (전체, 긴급, 경계, 주의, 일반)
- **SituationSummary**: 상황요약 팝업
- **AIDetectionPopup**: AI 탐지 팝업
- **MainDriftnetPopup**: 메인 투망 팝업 (EventDetailPopup 기반)

### 2. 프로토타입 데모 페이지 (`/prototype/demo`)

**demo.tsx** - `surveillance` 시나리오를 사용하는 데모 페이지입니다.

### 3. 이벤트 상세 페이지 (`/event/:eventId`)

**event-detail.tsx** - 특정 이벤트의 상세 정보를 확인하고 관리하는 페이지입니다.

#### 주요 기능
- **이벤트 상세 정보**: 좌측 패널에 이벤트 기본 정보, AI 인사이트, 처리 단계 표시
- **위치 및 동선**: 중앙 1열에서 지도 기반 위치 추적 및 동선 시각화
- **CCTV 모니터링**: 중앙 2열에서 CCTV 영상 재생, 포착 클립, 행동 요약
- **AI 에이전트 채팅**: 우측 패널에서 AI와 대화하며 사건 분석 및 대응 전략 수립
- **전파 초안 작성**: 클립 영상을 포함한 전파 초안 작성 및 전송
- **이벤트 완료 처리**: 사건 종료 시 알림 팝업 및 보고서 생성

#### 레이아웃 구조
- **좌측 패널 (EventLeftPanel)**: 이벤트 정보, AI 인사이트, 전파 제어
- **중앙 1열 (EventCenterColumn1)**: 지도 뷰, 위치 핀, 동선, CCTV 클러스터
- **중앙 2열 (EventCenterColumn2)**: CCTV 섹션, 포착 클립, 행동 요약, 이동 타임라인
- **우측 패널 (AgentPanel)**: AI Agent 채팅 인터페이스 (접기/펼치기 가능)

#### 주요 컴포넌트
- **EventLeftPanel**: 이벤트 기본 정보, AI 인사이트, 전파 초안 버튼
- **EventCenterColumn1**: 지도 뷰, CCTV 토글, 위치 핀, 동선 표시
- **EventCenterColumn2**: CCTV 섹션 (드래그로 높이 조절 가능), 포착 클립, 행동 요약
- **AgentPanel**: AI 채팅 인터페이스, 저장된 클립 관리
- **DetectedCCTVClipPopup**: 포착된 CCTV 클립 상세 보기 및 재생
- **MapCCTVPopup**: 지도에서 CCTV 클릭 시 모니터링 팝업
- **CombinedCCTVPopup**: 과거 포착 아이콘 클릭 시 통합 CCTV 팝업
- **BroadcastDraftPopup**: 전파 초안 작성 및 전송
- **AdditionalDataNotificationPopup**: 추가 자료 알림 팝업
- **EventCompletionNotificationPopup**: 사건 종료 알림 팝업

#### 키보드 단축키
- `q`: 유괴범과 아동 함께 이동 포착 시나리오
- `w`: 추가 자료 알림 팝업 표시
- `e`: 차량 탑승 지점 포착 시나리오
- `r`: 현재 위치 추적 중 시나리오

### 4. Agent Chat 페이지 (`/agent-chat`)

**agent-chat.tsx** - AI Agent와의 대화형 인터페이스입니다.

#### 주요 기능
- **채팅 세션 관리**: 프로젝트 및 채팅 세션 생성 및 관리
- **자연어 질의응답**: CUVIA Link와 자연어로 대화
- **파일 업로드**: 도구 팝업을 통한 파일 업로드
- **CCTV 추천**: AI가 추천하는 CCTV 목록 표시
- **쿼리 파라미터 지원**: URL 쿼리 파라미터로 초기 메시지 전달 (`?q=질문내용`)

#### 레이아웃 구조
- **좌측 패널**: 프로젝트 및 채팅 세션 목록, 접기/펼치기 가능
- **중앙 영역**: 채팅 메시지 표시, AI 블록, CCTV 추천
- **하단 입력 영역**: 메시지 입력 및 전송

### 5. Agent Hub 페이지 (`/agent-hub`)

**agent-hub.tsx** - Agent Chat의 진입점이 되는 홈 화면입니다.

#### 주요 기능
- **자연어 검색**: 중앙 입력창에서 자연어로 질문 입력
- **추천 검색어**: 자주 사용하는 검색어 빠른 선택
- **지원 기능 소개**: 통계 조회, 지도 이동, 메뉴 이동, 이벤트 이력 등 기능 안내
- **파일 업로드**: 도구 팝업을 통한 파일 업로드

#### 레이아웃 구조
- **상단**: 로고 및 네비게이션
- **중앙**: 검색 입력창 및 지원 기능 카드
- **하단**: 추천 검색어

### 6. 컴포넌트 스타일 가이드 (`/components-style`)

**components-style.tsx** - 공통 컴포넌트의 시각적 가이드 및 스타일 확인 페이지입니다.

#### 주요 기능
- **팝업 컴포넌트**: BasePopup, NotificationPopup 예시 및 사용법
- **버튼 스타일**: Primary, Secondary, Icon 버튼
- **PTZ 버튼**: CCTV PTZ 제어 버튼 스타일
- **카드/박스**: 기본 카드 스타일
- **입력 필드**: 기본 입력 필드 스타일
- **CCTV 아이콘**: 다양한 CCTV 아이콘 타입 (default, light, active, tracking, warning)
- **컬러 팔레트**: 배경 및 텍스트 컬러 가이드
- **폰트**: 폰트 사이즈 및 웨이트 가이드

## 컴포넌트 설명

### 대시보드 컴포넌트 (`components/dashboard/`)

#### Dashboard.tsx
메인 대시보드 컴포넌트입니다. 전체 레이아웃과 상태를 관리합니다.
- 시나리오 기반 설정 지원 (`surveillance`, `demo`)
- 키보드 단축키 처리
- 이벤트 애니메이션 관리
- 팝업 상태 관리

#### MapView.tsx
지도 뷰 컴포넌트입니다. MapLibre GL을 사용하여 이벤트와 CCTV를 시각화합니다.
- 이벤트 핀 표시 및 하이라이트
- CCTV 아이콘 및 시야각 표시
- 줌 인/아웃 기능
- 이벤트 클릭 시 상세 페이지 이동
- 상태를 부모 컴포넌트에 노출 (`onStateChange` prop)

#### MapCCTVControls.tsx
맵 컨트롤 및 CCTV 컨트롤 버튼 컴포넌트입니다.
- 맵 확대/축소 버튼
- 2D/3D 모드 전환 버튼
- 회전 버튼 (3D 모드일 때)
- CCTV 토글 버튼
- CCTV 이름 표시 토글
- CCTV 화각 표시 토글

#### CCTVVideoPanel.tsx
하단 CCTV 비디오 플레이어 컴포넌트입니다.
- CCTV 영상 자동 롤링 재생
- 1줄에 4개 표시, 무한 스크롤

#### LeftPanel.tsx
좌측 운영 패널입니다. CCTV 운영 현황, 센서 데이터, 모니터링 스팟을 표시합니다.
- CCTV 상태 통계 (정상/지연/오류)
- 지역별 CCTV 현황 카드 (2x2 그리드)
- 환경 센서 데이터 (PM2.5, PM10, 온도, 습도, 강수량, 풍속)
- 시간대 이벤트 차트 (Recharts AreaChart)
- 지역별 이벤트 발생 건수 히트맵

#### EventList.tsx
이벤트 목록 컴포넌트입니다. 이벤트 목록을 표시하고 필터링 기능을 제공합니다.
- 우선순위별 필터링 (전체, 긴급, 경계, 주의, 일반)
- 우선순위 라벨 표시 (캡슐 형태)
- 이벤트 카드 호버 효과
- 증거 이벤트 그룹화

#### SituationSummary.tsx
상황요약 팝업 컴포넌트입니다. 이벤트의 상황 요약 정보를 표시합니다.

#### AIDetectionPopup.tsx
AI 탐지 팝업 컴포넌트입니다. AI가 탐지한 이벤트 정보를 표시합니다.

#### MainDriftnetPopup.tsx
메인 투망 팝업 컴포넌트입니다. `EventDetailPopup`을 기반으로 구현되었습니다.

#### EventDetailPopup.tsx
이벤트 상세 팝업 컴포넌트입니다. 공통 팝업 컴포넌트로 여러 팝업에서 재사용됩니다.
- CCTV 영상 재생
- AI 분석 정보 표시
- 모니터링화면 이동 버튼
- 바로 전파 버튼

### 공통 컴포넌트 (`components/common/`)

#### CCTVIcon.tsx
CCTV 아이콘 SVG 컴포넌트입니다. 다양한 크기와 색상으로 사용 가능합니다.

#### BroadcastControls.tsx
전파 제어 컴포넌트입니다. 전파 초안 작성 및 전송 기능을 제공합니다.

### 이벤트 상세 컴포넌트 (`components/event-detail/`)

#### EventLeftPanel.tsx
이벤트 상세 페이지의 좌측 패널입니다. 이벤트 기본 정보, AI 인사이트, 전파 제어를 표시합니다.

#### EventCenterColumn1.tsx
이벤트 상세 페이지의 중앙 1열입니다. 지도 뷰, 위치 핀, 동선, CCTV 클러스터를 표시합니다.

#### EventCenterColumn2.tsx
이벤트 상세 페이지의 중앙 2열입니다. CCTV 섹션, 포착 클립, 행동 요약, 이동 타임라인을 표시합니다.

#### AgentPanel.tsx
AI Agent 채팅 패널입니다. AI와의 대화 인터페이스와 저장된 클립 관리를 제공합니다.

#### PlaybackControls.tsx
비디오 재생 제어 컴포넌트입니다. 재생, 일시정지, 시간 이동 기능을 제공합니다.

#### DetectedCCTVClipPopup.tsx
포착된 CCTV 클립 상세 팝업입니다. 클립 재생 및 추적대상 재선택 기능을 제공합니다.

#### MapCCTVPopup.tsx
지도 CCTV 모니터링 팝업입니다. CCTV 영상 재생 및 PTZ 제어 기능을 제공합니다.

#### CombinedCCTVPopup.tsx
통합 CCTV 팝업입니다. 같은 위치의 여러 CCTV를 순환하며 볼 수 있습니다.

#### BroadcastDraftPopup.tsx
전파 초안 팝업입니다. 클립 영상을 포함한 전파 초안을 작성하고 전송할 수 있습니다.

#### AdditionalDataNotificationPopup.tsx
추가 자료 알림 팝업입니다. 추가 자료가 도착했을 때 알림을 표시합니다.

#### EventCompletionNotificationPopup.tsx
사건 종료 알림 팝업입니다. 사건이 종료되었을 때 알림을 표시하고 보고서 생성을 제공합니다.

### 공유 컴포넌트 (`components/shared/`)

#### BasePopup.tsx
기본 팝업 컴포넌트입니다. 중앙 정렬 모달 스타일의 팝업을 제공합니다.
- ESC 키로 닫기
- 오버레이 클릭으로 닫기
- 헤더, 컨텐츠, 푸터 구조
- maxWidth, maxHeight 커스터마이징 가능

#### NotificationPopup.tsx
알림 팝업 컴포넌트입니다. 우측 하단 또는 중앙에 표시되는 알림 스타일 팝업을 제공합니다.
- 위치: bottom-right (우측 하단) 또는 center (중앙)
- 작은 크기 (기본: w-[420px])
- rounded-lg 스타일

#### styles.ts
공통 스타일 정의 파일입니다. 버튼, 카드, 입력 필드 등의 스타일 함수를 제공합니다.

### 레이아웃 컴포넌트 (`components/layouts/`)

#### ScaledLayout.tsx
스케일 조정 레이아웃 컴포넌트입니다. 화면 크기에 따라 레이아웃을 조정합니다.

## 라이브러리 및 유틸리티

### 대시보드 설정 (`lib/dashboard/`)

#### scenarios.ts
시나리오 설정 파일입니다. 각 시나리오별 기능 설정을 관리합니다.
- `surveillance`: 투망감시 시나리오
- `demo`: 데모 시나리오

#### keyboard-shortcuts.ts
키보드 단축키 매핑 설정 파일입니다. 시나리오별로 다른 키보드 단축키를 정의할 수 있습니다.
- 키보드 단축키 액션 타입 정의
- 시나리오별 키보드 단축키 매핑
- 공통 키보드 단축키 설정

#### keyboard-handler.ts
키보드 이벤트 처리 로직 파일입니다. 키보드 단축키를 눌렀을 때 실행되는 애니메이션과 상태 변경 로직을 관리합니다.
- 키보드 이벤트 핸들러 생성 함수
- 이벤트 애니메이션 처리
- 특수 키 처리 (2번 키: 메인투망 팝업, Escape: 선택 해제)

### 유틸리티 (`lib/`)

#### events-data.ts
이벤트 데이터 관리 파일입니다. 이벤트 데이터 변환 및 조회 함수를 제공합니다.

#### cctv-video-utils.ts
CCTV 비디오 유틸리티 파일입니다. CCTV 비디오 URL 생성 함수를 제공합니다.

#### cctv-view-angle-utils.ts
CCTV 시야각 유틸리티 파일입니다. CCTV 시야각 계산 및 시각화 함수를 제공합니다.

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
- **Early Return**: 가능한 경우 early return 사용

### 공통 컴포넌트 사용

프로젝트는 일관된 디자인 시스템을 위해 공통 팝업 컴포넌트를 사용합니다:

- **BasePopup**: 중앙에 표시되는 모달 스타일 팝업 (예: CCTV 모니터링, 클립 상세)
- **NotificationPopup**: 우측 하단 또는 중앙에 표시되는 알림 스타일 팝업 (예: 추가 자료 알림, 사건 종료 알림)
- **EventDetailPopup**: 이벤트 상세 팝업 (공통 컴포넌트, 여러 팝업에서 재사용)

모든 팝업 컴포넌트는 이 공통 컴포넌트를 기반으로 구현되어 일관된 디자인과 동작을 제공합니다.

### 키보드 단축키 관리

키보드 단축키는 별도 파일로 관리됩니다:

- **keyboard-shortcuts.ts**: 키보드 단축키 매핑 설정
- **keyboard-handler.ts**: 키보드 이벤트 처리 로직

시나리오별로 다른 키보드 단축키를 정의할 수 있으며, 키보드 이벤트 처리 로직은 재사용 가능한 함수로 분리되어 있습니다.

### 더미 데이터

개발용 더미 데이터는 `lib/mock-data/events.ts`에 있습니다. API 연동 후 이 파일은 삭제하거나 실제 API 호출로 대체할 수 있습니다.

### 가상 이벤트

메인 대시보드의 이벤트 리스트에는 레이아웃 확인용 가상 이벤트 10개가 포함되어 있습니다. 이는 `Dashboard.tsx`의 `mockEvents`에서 관리되며, 실제 API 연동 시 제거하거나 실제 데이터로 대체할 수 있습니다.

## 환경 변수

현재 환경 변수는 사용하지 않지만, API 연동 시 필요할 수 있습니다:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

## 라이선스

Private
