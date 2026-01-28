# 커밋 메시지

```
feat: 고속검색 기능 재통합 및 키보드 단축키 수정

## 주요 변경사항

### 수정
- FastSearchListPanel 최신 버전 복원 (듀얼 핸들 슬라이더, 2depth 구역 선택)
- 키보드 단축키 '2', '3' 동작 변경
  - '2': 고속검색 시작 (FastSearchProgress 표시)
  - '3': FastSearchListPanel 직접 열기
- 고속검색 관련 state 및 컴포넌트 재통합
- 좌우 패널 슬라이드 아웃 애니메이션 추가
- MapView에 focusTargetXPercent prop 추가 (고속검색 시 지도 우측 이동)
- ReportPopup 타입 에러 수정

### 추가
- TopControlPanel 컴포넌트 생성 (HOME-v2)
- clearSelection 함수에 고속검색 state 초기화 추가

## 기술적 세부사항
- 듀얼 핸들 시간 슬라이더: 최소 1시간 간격, 커스텀 div 구현
- 2depth 구역 선택: 부천시 행정구역 데이터, 최대 4개 표시
- 필터 팝오버: 반경/시간/구역, 외부 클릭 시 자동 닫힘
```
