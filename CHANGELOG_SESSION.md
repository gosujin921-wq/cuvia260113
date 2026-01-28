# 변경사항 요약

## 📝 수정사항

### 1. FastSearchListPanel 컴포넌트 최신 버전 복원
- **위치**: `components/dashboard/HOME-v2/FastSearchListPanel.tsx`
- **변경 내용**:
  - 듀얼 핸들 시간 범위 슬라이더 구현 (최소 1시간 간격, 00:00~23:59)
  - 2depth 구역 선택 기능 (원미구/소사구/오정구 → 동 단위)
  - 반경/시간/구역 필터 팝오버 (캡슐 스타일, rounded-lg)
  - 구역 호버 툴팁 (선택된 구역 인라인 표시)
  - 패널 너비 900px, grid-cols-5 레이아웃
  - 카드 배경색 #393a42 적용
  - 좌측 배치 (`left-0`, `-translate-x-full`)

### 2. 키보드 단축키 동작 수정
- **위치**: `src/pages/Home-v2.tsx`
- **변경 내용**:
  - **키 '2'**: 고속검색 시작
    - 좌우 패널 닫기 (`panelsSlidOut: true`)
    - CCTV 화면 숨기기 (`showCCTV: false`)
    - 컨트롤 숨기기 (`hideControls: true`)
    - FastSearchProgress 표시 (`showFastSearch: true`)
    - 딤 레이어 표시 (`hideDimForFastSearch: false`)
  
  - **키 '3'**: FastSearchListPanel 직접 열기
    - 좌우 패널 닫기 (`panelsSlidOut: true`)
    - CCTV 화면 숨기기 (`showCCTV: false`)
    - 컨트롤 숨기기 (`hideControls: true`)
    - FastSearchListPanel 직접 표시 (`showFastSearchList: true`)
    - 지도 중심 조정 (`pinOffset: { x: 0, y: 0 }`)

### 3. 고속검색 관련 State 및 컴포넌트 재통합
- **위치**: `src/pages/Home-v2.tsx`
- **추가된 State**:
  - `panelsSlidOut`: 좌우 패널 슬라이드 아웃 상태
  - `showFastSearch`: FastSearchProgress 표시 여부
  - `showFastSearchList`: FastSearchListPanel 표시 여부
  - `pinOffset`: 지도 핀 오프셋
  - `hideDimForFastSearch`: 딤 레이어 숨김 여부
  - `showCCTV`: CCTV 화면 표시 여부
  - `windowWidth`: 윈도우 너비
  - CCTV 관련 refs (`cctvScrollContainerRef`, `autoScrollIntervalRef`, `isUserScrollingRef`, `userScrollTimeoutRef`)

- **재통합된 컴포넌트**:
  - `ReportPopup`: 이벤트 선택 시 표시되는 신고 팝업
  - `FastSearchProgress`: 고속검색 진행 상태 표시
  - `FastSearchListPanel`: 고속검색 결과 리스트
  - `BottomPanel`: CCTV 화면 패널

### 4. 패널 애니메이션 추가
- **위치**: `src/pages/Home-v2.tsx`
- **변경 내용**:
  - 좌측 패널: `panelsSlidOut` 상태에 따라 `-translate-x-full opacity-0` 적용
  - 우측 패널: `panelsSlidOut` 상태에 따라 `translate-x-full opacity-0` 적용
  - 트랜지션: `duration-300 ease-out`

### 5. MapView Props 추가
- **위치**: `components/dashboard/MapView.tsx`, `src/pages/Home-v2.tsx`
- **변경 내용**:
  - `focusTargetXPercent` prop 추가 (기본값: 50, 고속검색 시: 66.67)
  - 고속검색 모드에서 지도 화면을 우측으로 이동하여 FastSearchListPanel과 겹치지 않도록 조정
  - `pinOffset` prop 전달

### 6. ReportPopup 타입 에러 수정
- **위치**: `components/dashboard/ReportPopup.tsx`
- **변경 내용**:
  - `finalPosition` 변수에 명시적 타입 지정
  - TypeScript 타입 에러 해결

## ➕ 추가사항

### 1. TopControlPanel 컴포넌트 생성
- **위치**: `components/dashboard/HOME-v2/TopControlPanel.tsx`
- **기능**:
  - 고속검색 모드에서 상단에 표시되는 컨트롤 패널
  - "고속 검색" 타이틀 및 "인근 CCTV 8대를 모니터링 중입니다." 메시지
  - `fadeInDown` 애니메이션 적용
  - 그라데이션 배경 및 backdrop-filter 스타일

### 2. clearSelection 함수 확장
- **위치**: `src/pages/Home-v2.tsx`
- **변경 내용**:
  - 고속검색 관련 state 초기화 추가
  - `pinOffset`, `showFastSearchList`, `panelsSlidOut`, `showCCTV`, `showFastSearch` 리셋

## 🔧 기술적 세부사항

### 듀얼 핸들 시간 슬라이더
- 커스텀 div 기반 구현 (네이티브 range input 대체)
- 최소 1시간 간격 강제
- 핸들 개별 드래그 및 범위 전체 드래그 지원
- 00:00~23:59 범위 제한
- 15분 단위 스냅

### 2depth 구역 선택
- 부천시 행정구역 데이터 (원미구, 소사구, 오정구 및 각 동)
- "전체" 옵션 지원
- 최대 4개까지 표시, 초과 시 "+{count}" 형식
- 구(Gu) 확장/축소 기능
- 동(Dong) 다중 선택

### 필터 팝오버
- 반경: 100m~3000m 슬라이더
- 시간: 듀얼 핸들 범위 선택
- 구역: 2depth 계층 구조
- 외부 클릭 시 자동 닫힘
- z-index 관리로 리스트 위에 표시

## 🐛 버그 수정

1. **FastSearchListPanel import 경로 오류**
   - `dashboard/FastSearchListPanel` → `dashboard/HOME-v2/FastSearchListPanel`로 수정

2. **TopControlPanel 누락**
   - `HOME-v2` 폴더에 TopControlPanel 컴포넌트 생성

3. **ReportPopup 타입 에러**
   - `finalPosition` 변수에 명시적 타입 지정으로 해결

4. **지도 컨테이너 위치 문제**
   - translate만 사용하도록 확인 (컨테이너 위치 변경 없음)

## 📋 테스트 체크리스트

- [x] 키 '2' 입력 시 FastSearchProgress 표시
- [x] 키 '3' 입력 시 FastSearchListPanel 직접 표시
- [x] 좌우 패널 슬라이드 아웃 애니메이션
- [x] CCTV 화면 숨김/표시
- [x] 지도 화면 우측 이동 (고속검색 모드)
- [x] 듀얼 핸들 시간 슬라이더 동작
- [x] 2depth 구역 선택 기능
- [x] 필터 팝오버 표시/숨김
- [x] Escape 키로 모든 상태 초기화
