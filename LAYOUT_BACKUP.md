# 레이아웃 구조 백업 (원복용)

## 현재 구조 (변경 전)

### app/page.tsx
```tsx
<div className="flex flex-col h-screen bg-[#161719] overflow-hidden">
  <Header />  // 전체 상단 바 (로고 + 우측 메뉴)
  <div className="flex flex-1 overflow-hidden">
    <div className="flex flex-1 flex-col overflow-hidden">
      <EventSummary summary={eventSummary} />  // 이벤트 요약
      <div className="flex flex-1 overflow-hidden relative">
        <EventList />  // 좌측 이벤트 리스트
        <MapView />    // 중앙 지도
        <RightPanel /> // 우측 패널
      </div>
    </div>
  </div>
</div>
```

### components/Header.tsx
- 전체 너비 상단 바
- 좌측: 로고
- 우측: Agent Hub 버튼, 위치/날씨, 알림, 프로필/시간

### components/RightPanel.tsx
- 우측 고정 패널 (w-96)
- border-l로 왼쪽 테두리

## 변경할 구조

1. Header 제거
2. 로고를 좌측 상단에 absolute/fixed로 배치
3. Header의 우측 내용을 RightPanel 상단으로 이동 (LNB)
4. EventSummary는 그대로 유지

