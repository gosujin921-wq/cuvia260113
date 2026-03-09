# CUVIA3 프로젝트 파일 연결 구조

## 라우트 개요

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` | → redirect | `/home`으로 리다이렉트 |
| `/home` | Home.tsx | 기본 대시보드 |
| `/v2` | Home-v2.tsx | v2 대시보드 |
| `/v4` | Home-v4.tsx | v4 대시보드 (최신) |
| `/event/:eventId` | event-detail.tsx | 이벤트 상세 (**사실상 미사용**) |
| `/components-style` | components-style.tsx | 스타일 가이드 페이지 |
| `/agent-chat` | agent-chat.tsx | AI 에이전트 채팅 |
| `/cuvia-link` | cuvia-link.tsx | CUVIA 링크 검색 |

---

## 1. 페이지별 컴포넌트 연결

### Home.tsx (메인 홈)
```
Home
├── HOME/EventList
├── HOME/MapView
├── HOME/unity/UnityMapView (Unity 모드)
├── HOME/LeftPanel
├── HeatmapPanel (공통)
├── HOME/CCTVStatusPanel
├── HOME/AIAgentPopup
├── HOME/TopControlPanel
└── lib: events-data
```

### Home-v4.tsx (최신 버전)
```
Home-v4
├── HOME/EventList
├── HOME-v4/MapView
├── HOME-v4/ObjectTrackingMapView
├── HOME-v4/LeftPanel
├── HOME-v4/LeftMenuPanel
├── HeatmapPanel (공통)
├── BottomPanel (공통)
├── HOME-v4/ReportPopup
├── HOME-v4/FastSearchListPanel
│   └── HOME-v4/FastSearchCandidateDetailPopup
├── HOME-v4/PredictedCCTVListPanel
│   └── HOME-v4/PredictedCCTVDetailPopup
├── HOME-v4/CaptureListPanel
├── HOME-v4/PropagationListPanel
│   └── HOME-v4/PropagationPackagePopup
├── HOME-v4/AIAgentPopup
├── HOME-v4/ConfirmDialog
└── lib: events-data, fast-search-attribute-utils
```

### Home-v2.tsx
```
Home-v2
├── HOME/EventList
├── HOME-v2/MapView
├── HOME-v2/ObjectTrackingMapView
├── HOME-v2/LeftPanel
├── HOME-v2/LeftMenuPanel
├── HeatmapPanel, BottomPanel
├── HOME/ReportPopup
├── HOME-v2/FastSearchListPanel
│   ├── HOME-v2/FastSearchProgress
│   └── HOME-v2/FastSearchCandidateDetailPopup
├── HOME-v2/PredictedCCTVListPanel, PredictedCCTVDetailPopup
├── HOME-v2/CaptureListPanel
├── HOME-v2/PropagationListPanel, PropagationPackagePopup
├── HOME-v2/AIAgentPopup, ConfirmDialog
├── HOME-v2/MouseGuide
└── useMouseGuide
```

### cuvia-link.tsx
```
cuvia-link
├── layouts/ScaledLayout
├── shared/BasePopup
└── navigate → /agent-chat
```

### agent-chat.tsx
```
agent-chat
├── layouts/ScaledLayout
├── shared/BasePopup
├── common/CCTVIcon
├── event-detail/types (ChatMessage)
└── event-detail/constants (chatBlocks)
```

### components-style.tsx
```
components-style
├── shared/styles
├── shared/BasePopup
├── shared/NotificationPopup
└── common/CCTVIcon
```

### event-detail.tsx (미사용)
```
event-detail
├── layouts/ScaledLayout
├── event-detail/EventLeftPanel
│   └── common/BroadcastControls
│       └── event-detail/BroadcastDraftPopup
├── event-detail/EventCenterColumn1
├── event-detail/EventCenterColumn2
├── event-detail/AgentPanel
├── event-detail/DetectedCCTVClipPopup
├── event-detail/MapCCTVPopup
├── event-detail/CombinedCCTVPopup
├── event-detail/EventCompletionNotificationPopup
├── event-detail/AdditionalDataNotificationPopup
├── event-detail/types, constants
└── lib: events-data
```

---

## 2. 공통 vs 버전별 컴포넌트

| 컴포넌트 | 사용처 |
|----------|--------|
| **shared/styles** | MapView(v2,v4,HOME), event-detail 전부, components-style |
| **shared/BasePopup** | cuvia-link, agent-chat, components-style, event-detail 팝업들 |
| **shared/NotificationPopup** | components-style, event-detail (AdditionalData, EventCompletion) |
| **common/CCTVIcon** | MapView, agent-chat, components-style, event-detail |
| **layouts/ScaledLayout** | cuvia-link, agent-chat, event-detail |
| **common/BroadcastControls** | event-detail/EventLeftPanel 만 사용 |
| **HeatmapPanel** | Home, Home-v2, Home-v4 |
| **BottomPanel** | Home-v2, Home-v4 |
| **HOME/EventList** | Home, Home-v2, Home-v4 |

---

## 3. lib 사용처

| lib | 사용처 |
|-----|--------|
| **events-data** | Home*, event-detail, HOME/EventList |
| **cctv-video-utils** | LeftPanel, BottomPanel, PredictedCCTVDetailPopup, FastSearchCandidateDetailPopup, event-detail 팝업들 |
| **cctv-view-angle-utils** | MapView (HOME, v2, v4) |
| **dashboard-cctv-layout** | MapView (v2, v4) |
| **fast-search-image-attributes** | FastSearchListPanel (v2, v4) |
| **fast-search-candidate-detail** | FastSearchCandidateDetailPopup (v2, v4) |
| **fast-search-attribute-utils** | Home-v4 |
| **predicted-cctv-details** | PredictedCCTVDetailPopup (v2, v4) |
| **unity/unityBridge, types** | Home (Unity 모드) |
| **weather/hooks** | HOME/LeftPanel |

---

## 4. 삭제 후보 (event-detail 블록)

```
event-detail.tsx
components/event-detail/
├── EventLeftPanel, EventCenterColumn1, EventCenterColumn2
├── EventCenterPanel
├── AgentPanel
├── DetectedCCTVClipPopup, MapCCTVPopup, CombinedCCTVPopup
├── EventCompletionNotificationPopup, AdditionalDataNotificationPopup
├── BroadcastDraftPopup, PlaybackControls
├── types.ts, constants.ts  ← agent-chat에서 ChatMessage, chatBlocks 사용
└── common/BroadcastControls  ← EventLeftPanel만 사용
```

**삭제 시 주의:** `agent-chat.tsx`가 `types.ts`(ChatMessage), `constants.ts`(chatBlocks)를 사용함. 삭제 전 이 부분을 agent-chat으로 옮기거나 agent-chat에서 제거 필요.
