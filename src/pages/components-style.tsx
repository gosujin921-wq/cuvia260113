import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { 
  getTabButtonClassName,
  getPrimaryButtonClassName,
  getSecondaryButtonClassName,
  getIconButtonClassName,
  getCardClassName,
  getInputClassName,
  getCCTVIconClassName,
  getPTZButtonClassName,
  getPTZPresetButtonClassName,
  getCCTVLabelClassName,
  getCCTVBadgeClassName,
  getCCTVViewAngleClassName,
  getTimelineTitleClassName,
  getGradientButtonClassName,
  colorPalette,
  fontSizes,
  fontWeights,
} from '@/components/shared/styles';
import { BasePopup } from '@/components/shared/BasePopup';
import { NotificationPopup } from '@/components/shared/NotificationPopup';
import CCTVIcon from '@/components/common/CCTVIcon';

export default function ComponentsStylePage() {
  const [activeSection, setActiveSection] = useState<string>('popups');
  const [isBasePopupOpen, setIsBasePopupOpen] = useState(false);
  const [isNotificationPopupOpen, setIsNotificationPopupOpen] = useState(false);
  const [notificationPosition, setNotificationPosition] = useState<'bottom-right' | 'center'>('bottom-right');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('코드가 클립보드에 복사되었습니다.');
  };

  const sections = [
    { id: 'popups', name: '팝업', icon: 'mdi:window-open' },
    { id: 'buttons', name: '버튼', icon: 'mdi:button-cursor' },
    { id: 'ptz-buttons', name: 'PTZ 버튼', icon: 'mdi:arrow-all' },
    { id: 'cards', name: '카드/박스', icon: 'mdi:card' },
    { id: 'inputs', name: '입력 필드', icon: 'mdi:text-box' },
    { id: 'cctv-icons', name: 'CCTV 아이콘', icon: 'mdi:cctv' },
    { id: 'colors', name: '컬러 팔레트', icon: 'mdi:palette' },
    { id: 'fonts', name: '폰트', icon: 'mdi:format-font' },
  ];

  return (
    <div className="h-screen overflow-y-auto bg-[#091326] text-white">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">컴포넌트 스타일 가이드</h1>
          <p className="text-gray-400">공통 컴포넌트를 시각적으로 확인할 수 있습니다.</p>
        </div>

        {/* 섹션 네비게이션 */}
        <div className="flex gap-2 mb-8 border-b border-[#31353a] pb-4">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`${getTabButtonClassName(activeSection === section.id)} flex items-center gap-2`}
              style={{ borderWidth: activeSection === section.id ? '0' : '1px' }}
            >
              <Icon icon={section.icon} className="w-4 h-4" />
              {section.name}
            </button>
          ))}
        </div>

        {/* 팝업 섹션 */}
        {activeSection === 'popups' && (
          <div className="space-y-8">
            {/* BasePopup */}
            <div>
              <h2 className="text-xl font-semibold mb-4">BasePopup (기본 팝업)</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <button
                      onClick={() => setIsBasePopupOpen(true)}
                      className={getPrimaryButtonClassName()}
                    >
                      BasePopup 열기
                    </button>
                  </div>
                  <div className={getCardClassName()}>
                    <pre className="text-xs text-gray-300 overflow-x-auto">
                      <code>{`import { BasePopup } from '@/components/shared/BasePopup';

<BasePopup
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="팝업 제목"
  titleIcon={<Icon icon="mdi:star" />}
  maxWidth="max-w-6xl"
  maxHeight="120vh"
>
  <div className="p-4">
    팝업 내용
  </div>
  <div className="p-4 border-t border-[#31353a]">
    푸터 내용
  </div>
</BasePopup>`}</code>
                    </pre>
                    <button
                      onClick={() => copyToClipboard(`import { BasePopup } from '@/components/shared/BasePopup';\n\n<BasePopup\n  isOpen={isOpen}\n  onClose={() => setIsOpen(false)}\n  title="팝업 제목"\n  titleIcon={<Icon icon="mdi:star" />}\n  maxWidth="max-w-6xl"\n  maxHeight="120vh"\n>\n  <div className="p-4">\n    팝업 내용\n  </div>\n  <div className="p-4 border-t border-[#31353a]">\n    푸터 내용\n  </div>\n</BasePopup>`)}
                      className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                    >
                      코드 복사
                    </button>
                  </div>
                </div>
                <div className={getCardClassName()}>
                  <h3 className="text-sm font-semibold mb-4 text-gray-400">특징</h3>
                  <ul className="text-sm text-gray-300 space-y-2">
                    <li>• 중앙 정렬 모달 스타일</li>
                    <li>• 오버레이 배경 (기본: bg-black/70)</li>
                    <li>• ESC 키로 닫기 지원</li>
                    <li>• 오버레이 클릭으로 닫기</li>
                    <li>• 헤더, 컨텐츠, 푸터 구조</li>
                    <li>• maxWidth, maxHeight 커스터마이징 가능</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* NotificationPopup */}
            <div>
              <h2 className="text-xl font-semibold mb-4">NotificationPopup (알림 팝업)</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="mb-4 space-y-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setNotificationPosition('bottom-right');
                          setIsNotificationPopupOpen(true);
                        }}
                        className={getPrimaryButtonClassName()}
                      >
                        우측 하단 알림 열기
                      </button>
                      <button
                        onClick={() => {
                          setNotificationPosition('center');
                          setIsNotificationPopupOpen(true);
                        }}
                        className={getSecondaryButtonClassName()}
                      >
                        중앙 알림 열기
                      </button>
                    </div>
                  </div>
                  <div className={getCardClassName()}>
                    <pre className="text-xs text-gray-300 overflow-x-auto">
                      <code>{`import { NotificationPopup } from '@/components/shared/NotificationPopup';

<NotificationPopup
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="알림 제목"
  titleIcon={<Icon icon="mdi:bell" />}
  position="bottom-right" // 또는 "center"
  width="w-[420px]"
>
  <div className="p-4">
    알림 내용
  </div>
  <div className="p-4 border-t border-[#31353a]">
    버튼 영역
  </div>
</NotificationPopup>`}</code>
                    </pre>
                    <button
                      onClick={() => copyToClipboard(`import { NotificationPopup } from '@/components/shared/NotificationPopup';\n\n<NotificationPopup\n  isOpen={isOpen}\n  onClose={() => setIsOpen(false)}\n  title="알림 제목"\n  titleIcon={<Icon icon="mdi:bell" />}\n  position="bottom-right"\n  width="w-[420px]"\n>\n  <div className="p-4">\n    알림 내용\n  </div>\n  <div className="p-4 border-t border-[#31353a]">\n    버튼 영역\n  </div>\n</NotificationPopup>`)}
                      className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                    >
                      코드 복사
                    </button>
                  </div>
                </div>
                <div className={getCardClassName()}>
                  <h3 className="text-sm font-semibold mb-4 text-gray-400">특징</h3>
                  <ul className="text-sm text-gray-300 space-y-2">
                    <li>• 알림 스타일 팝업</li>
                    <li>• 위치: bottom-right (우측 하단) 또는 center (중앙)</li>
                    <li>• ESC 키로 닫기 지원</li>
                    <li>• 작은 크기 (기본: w-[420px])</li>
                    <li>• 헤더, 컨텐츠, 푸터 구조</li>
                    <li>• rounded-lg 스타일</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 버튼 섹션 */}
        {activeSection === 'buttons' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Primary 버튼</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <button className={getPrimaryButtonClassName()}>
                      Primary 버튼
                    </button>
                  </div>
                  <div className={getCardClassName()}>
                    <pre className="text-xs text-gray-300 overflow-x-auto">
                      <code>{`import { getPrimaryButtonClassName } from '@/components/shared/styles';

<button className={getPrimaryButtonClassName()}>
  버튼 텍스트
</button>`}</code>
                    </pre>
                    <button
                      onClick={() => copyToClipboard(`import { getPrimaryButtonClassName } from '@/components/shared/styles';\n\n<button className={getPrimaryButtonClassName()}>\n  버튼 텍스트\n</button>`)}
                      className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                    >
                      코드 복사
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Secondary 버튼</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <button className={getSecondaryButtonClassName()}>
                      Secondary 버튼
                    </button>
                  </div>
                  <div className={getCardClassName()}>
                    <pre className="text-xs text-gray-300 overflow-x-auto">
                      <code>{`import { getSecondaryButtonClassName } from '@/components/shared/styles';

<button className={getSecondaryButtonClassName()}>
  버튼 텍스트
</button>`}</code>
                    </pre>
                    <button
                      onClick={() => copyToClipboard(`import { getSecondaryButtonClassName } from '@/components/shared/styles';\n\n<button className={getSecondaryButtonClassName()}>\n  버튼 텍스트\n</button>`)}
                      className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                    >
                      코드 복사
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">아이콘 버튼</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <button className={getIconButtonClassName()}>
                      <Icon icon="mdi:plus" className="w-5 h-5" />
                    </button>
                  </div>
                  <div className={getCardClassName()}>
                    <pre className="text-xs text-gray-300 overflow-x-auto">
                      <code>{`import { getIconButtonClassName } from '@/components/shared/styles';

<button className={getIconButtonClassName()}>
  <Icon icon="mdi:plus" />
</button>`}</code>
                    </pre>
                    <button
                      onClick={() => copyToClipboard(`import { getIconButtonClassName } from '@/components/shared/styles';\n\n<button className={getIconButtonClassName()}>\n  <Icon icon="mdi:plus" />\n</button>`)}
                      className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                    >
                      코드 복사
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PTZ 버튼 섹션 */}
        {activeSection === 'ptz-buttons' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">기본 PTZ 버튼</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <button className={`${getPTZButtonClassName()} rounded`}>
                      <Icon icon="mdi:chevron-up" className="w-5 h-5 mx-auto" />
                    </button>
                  </div>
                  <div className={getCardClassName()}>
                    <pre className="text-xs text-gray-300 overflow-x-auto">
                      <code>{`import { getPTZButtonClassName } from '@/components/shared/styles';

<button className={\`\${getPTZButtonClassName()} rounded\`}>
  <Icon icon="mdi:chevron-up" className="w-5 h-5 mx-auto" />
</button>`}</code>
                    </pre>
                    <button
                      onClick={() => copyToClipboard(`import { getPTZButtonClassName } from '@/components/shared/styles';\n\n<button className={\`\${getPTZButtonClassName()} rounded\`}>\n  <Icon icon="mdi:chevron-up" className="w-5 h-5 mx-auto" />\n</button>`)}
                      className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                    >
                      코드 복사
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">활성 PTZ 버튼</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <button className={`${getPTZButtonClassName(true)} rounded`}>
                      <Icon icon="mdi:chevron-up" className="w-5 h-5 mx-auto" />
                    </button>
                  </div>
                  <div className={getCardClassName()}>
                    <pre className="text-xs text-gray-300 overflow-x-auto">
                      <code>{`import { getPTZButtonClassName } from '@/components/shared/styles';

<button className={\`\${getPTZButtonClassName(true)} rounded\`}>
  <Icon icon="mdi:chevron-up" className="w-5 h-5 mx-auto" />
</button>`}</code>
                    </pre>
                    <button
                      onClick={() => copyToClipboard(`import { getPTZButtonClassName } from '@/components/shared/styles';\n\n<button className={\`\${getPTZButtonClassName(true)} rounded\`}>\n  <Icon icon="mdi:chevron-up" className="w-5 h-5 mx-auto" />\n</button>`)}
                      className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                    >
                      코드 복사
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">PTZ 프리셋 버튼</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="mb-4 flex gap-2">
                    <button className={getPTZPresetButtonClassName()}>
                      1
                    </button>
                    <button className={getPTZPresetButtonClassName(true)}>
                      2
                    </button>
                    <button className={getPTZPresetButtonClassName()}>
                      3
                    </button>
                  </div>
                  <div className={getCardClassName()}>
                    <pre className="text-xs text-gray-300 overflow-x-auto">
                      <code>{`import { getPTZPresetButtonClassName } from '@/components/shared/styles';

<button className={getPTZPresetButtonClassName()}>
  1
</button>
<button className={getPTZPresetButtonClassName(true)}>
  2
</button>`}</code>
                    </pre>
                    <button
                      onClick={() => copyToClipboard(`import { getPTZPresetButtonClassName } from '@/components/shared/styles';\n\n<button className={getPTZPresetButtonClassName()}>\n  1\n</button>\n<button className={getPTZPresetButtonClassName(true)}>\n  2\n</button>`)}
                      className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                    >
                      코드 복사
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 카드 섹션 */}
        {activeSection === 'cards' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">기본 카드</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <div className={getCardClassName()}>
                      <h3 className="text-white font-semibold mb-2">카드 제목</h3>
                      <p className="text-gray-400 text-sm">카드 내용입니다.</p>
                    </div>
                  </div>
                  <div className={getCardClassName()}>
                    <pre className="text-xs text-gray-300 overflow-x-auto">
                      <code>{`import { getCardClassName } from '@/components/shared/styles';

<div className={getCardClassName()}>
  카드 내용
</div>`}</code>
                    </pre>
                    <button
                      onClick={() => copyToClipboard(`import { getCardClassName } from '@/components/shared/styles';\n\n<div className={getCardClassName()}>\n  카드 내용\n</div>`)}
                      className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                    >
                      코드 복사
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 입력 필드 섹션 */}
        {activeSection === 'inputs' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">기본 입력 필드</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="입력하세요..."
                      className={getInputClassName()}
                    />
                  </div>
                  <div className={getCardClassName()}>
                    <pre className="text-xs text-gray-300 overflow-x-auto">
                      <code>{`import { getInputClassName } from '@/components/shared/styles';

<input 
  type="text" 
  className={getInputClassName()}
  placeholder="입력하세요..."
/>`}</code>
                    </pre>
                    <button
                      onClick={() => copyToClipboard(`import { getInputClassName } from '@/components/shared/styles';\n\n<input \n  type="text" \n  className={getInputClassName()}\n  placeholder="입력하세요..."\n/>`)}
                      className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                    >
                      코드 복사
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CCTV 아이콘 섹션 */}
        {activeSection === 'cctv-icons' && (
          <div className="space-y-12">
            {/* 구조 설명 */}
            <div className={getCardClassName()}>
              <h2 className="text-xl font-semibold mb-4">CCTV 아이콘 구조</h2>
              <div className="space-y-3 text-sm text-gray-300">
                <p><span className="font-semibold text-white">1. CCTV 아이콘 박스:</span> 아이콘 + 개수 (2개 이상일 때)</p>
                <p><span className="font-semibold text-white">2. CCTV 이름 라벨:</span> showCCTVName이 true일 때 표시 (1개: "CCTV-7", 2개 이상: "CCTV-7-1")</p>
                <p><span className="font-semibold text-white">3. 타임라인 타이틀:</span> 항상 표시 (CCTV 이름 없을 때: mt-1, 있을 때: mt-8)</p>
                <p className="text-xs text-gray-400 mt-2">컬러: default (gray), active (blue), tracking (red), warning (yellow)</p>
              </div>
            </div>

            {/* CCTV 아이콘 기본 스타일 */}
            <div>
              <h2 className="text-xl font-semibold mb-4">CCTV 아이콘 기본 스타일</h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-gray-400">Default (Gray)</h3>
                    <div className="mb-4">
                      <div className={getCCTVIconClassName('default')}>
                        <CCTVIcon className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-gray-400">Active (Blue)</h3>
                    <div className="mb-4">
                      <div className={getCCTVIconClassName('active')}>
                        <CCTVIcon className="w-4 h-4 text-blue-400" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-gray-400">Tracking (Red)</h3>
                    <div className="mb-4">
                      <div className={getCCTVIconClassName('tracking')}>
                        <CCTVIcon className="w-4 h-4 text-red-400" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-gray-400">Warning (Yellow)</h3>
                    <div className="mb-4">
                      <div className={getCCTVIconClassName('warning')}>
                        <CCTVIcon className="w-4 h-4 text-yellow-400" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className={getCardClassName()}>
                  <h3 className="text-sm font-semibold mb-4 text-gray-400">사용 예시</h3>
                  <pre className="text-xs text-gray-300 overflow-x-auto">
                    <code>{`import { getCCTVIconClassName } from '@/components/shared/styles';
import CCTVIcon from '@/components/common/CCTVIcon';

<div className={getCCTVIconClassName('default')}>
  <CCTVIcon className="w-4 h-4 text-gray-400" />
</div>`}</code>
                  </pre>
                </div>
              </div>
            </div>

            {/* CCTV 아이콘 + 라벨 조합 (모든 경우의 수) */}
            <div>
              <h2 className="text-xl font-semibold mb-4">CCTV 아이콘 + 이름 + 상황 라벨 조합 (모든 경우의 수)</h2>
              
              {/* Default (Gray) */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 text-gray-300">Default (Gray) - 일반 CCTV</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {/* 1개 - 이름 없음 */}
                  <div className={getCardClassName()}>
                    <div className="text-xs text-gray-400 mb-3">1개, 이름 숨김</div>
                    <div className="relative inline-block mb-4">
                      <div className={getCCTVIconClassName('default')}>
                        <CCTVIcon className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className={`${getTimelineTitleClassName('default', false)}`} style={{ color: '#9ca3af' }}>
                        유괴범과 아동 함께 이동 포착
                      </div>
                    </div>
                  </div>
                  {/* 1개 - 이름 있음 */}
                  <div className={getCardClassName()}>
                    <div className="text-xs text-gray-400 mb-3">1개, 이름 표시</div>
                    <div className="relative inline-block mb-4">
                      <div className={getCCTVIconClassName('default')}>
                        <CCTVIcon className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className={`${getCCTVLabelClassName('default')} mt-1`}>
                        CCTV-7
                      </div>
                      <div className={`${getTimelineTitleClassName('default', true)}`} style={{ color: '#9ca3af' }}>
                        유괴범과 아동 함께 이동 포착
                      </div>
                    </div>
                  </div>
                  {/* 2개 이상 - 이름 없음 */}
                  <div className={getCardClassName()}>
                    <div className="text-xs text-gray-400 mb-3">2개 이상, 이름 숨김</div>
                    <div className="relative inline-block mb-4">
                      <div className={`${getCCTVIconClassName('default')} flex items-center justify-center w-auto min-w-[28px]`} style={{ paddingLeft: '4px', paddingRight: '4px' }}>
                        <CCTVIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-semibold text-gray-400 ml-1">3</span>
                      </div>
                      <div className={`${getTimelineTitleClassName('default', false)}`} style={{ color: '#9ca3af' }}>
                        유괴범과 아동 함께 이동 포착
                      </div>
                    </div>
                  </div>
                  {/* 2개 이상 - 이름 있음 */}
                  <div className={getCardClassName()}>
                    <div className="text-xs text-gray-400 mb-3">2개 이상, 이름 표시</div>
                    <div className="relative inline-block mb-4">
                      <div className={`${getCCTVIconClassName('default')} flex items-center justify-center w-auto min-w-[28px]`} style={{ paddingLeft: '4px', paddingRight: '4px' }}>
                        <CCTVIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-semibold text-gray-400 ml-1">3</span>
                      </div>
                      <div className={`${getCCTVLabelClassName('default')} mt-1`}>
                        CCTV-7
                      </div>
                      <div className={`${getTimelineTitleClassName('default', true)}`} style={{ color: '#9ca3af' }}>
                        유괴범과 아동 함께 이동 포착
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active (Blue) */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 text-gray-300">Active (Blue) - 과거 동선</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {/* 1개 - 이름 없음 */}
                  <div className={getCardClassName()}>
                    <div className="text-xs text-gray-400 mb-3">1개, 이름 숨김</div>
                    <div className="relative inline-block mb-4">
                      <div className={getCCTVIconClassName('active')}>
                        <CCTVIcon className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className={`${getTimelineTitleClassName('active', false)}`} style={{ color: '#60a5fa' }}>
                        용의자가 차량에 아이 태우는 장면 포착
                      </div>
                    </div>
                  </div>
                  {/* 1개 - 이름 있음 */}
                  <div className={getCardClassName()}>
                    <div className="text-xs text-gray-400 mb-3">1개, 이름 표시</div>
                    <div className="relative inline-block mb-4">
                      <div className={getCCTVIconClassName('active')}>
                        <CCTVIcon className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className={`${getCCTVLabelClassName('active')} mt-1`}>
                        CCTV-15
                      </div>
                      <div className={`${getTimelineTitleClassName('active', true)}`} style={{ color: '#60a5fa' }}>
                        용의자가 차량에 아이 태우는 장면 포착
                      </div>
                    </div>
                  </div>
                  {/* 2개 이상 - 이름 없음 */}
                  <div className={getCardClassName()}>
                    <div className="text-xs text-gray-400 mb-3">2개 이상, 이름 숨김</div>
                    <div className="relative inline-block mb-4">
                      <div className={`${getCCTVIconClassName('active')} flex items-center justify-center w-auto min-w-[28px]`} style={{ paddingLeft: '4px', paddingRight: '4px' }}>
                        <CCTVIcon className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-semibold text-blue-400 ml-1">5</span>
                      </div>
                      <div className={`${getTimelineTitleClassName('active', false)}`} style={{ color: '#60a5fa' }}>
                        용의자가 차량에 아이 태우는 장면 포착
                      </div>
                    </div>
                  </div>
                  {/* 2개 이상 - 이름 있음 */}
                  <div className={getCardClassName()}>
                    <div className="text-xs text-gray-400 mb-3">2개 이상, 이름 표시</div>
                    <div className="relative inline-block mb-4">
                      <div className={`${getCCTVIconClassName('active')} flex items-center justify-center w-auto min-w-[28px]`} style={{ paddingLeft: '4px', paddingRight: '4px' }}>
                        <CCTVIcon className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-semibold text-blue-400 ml-1">5</span>
                      </div>
                      <div className={`${getCCTVLabelClassName('active')} mt-1`}>
                        CCTV-15
                      </div>
                      <div className={`${getTimelineTitleClassName('active', true)}`} style={{ color: '#60a5fa' }}>
                        용의자가 차량에 아이 태우는 장면 포착
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tracking (Red) */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 text-gray-300">Tracking (Red) - 추적 동선</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {/* 1개 - 이름 없음 */}
                  <div className={getCardClassName()}>
                    <div className="text-xs text-gray-400 mb-3">1개, 이름 숨김</div>
                    <div className="relative inline-block mb-4">
                      <div className={getCCTVIconClassName('tracking')}>
                        <CCTVIcon className="w-4 h-4 text-red-400" />
                      </div>
                      <div className={`${getTimelineTitleClassName('tracking', false)}`} style={{ color: '#f87171' }}>
                        차량 도주 추적 중
                      </div>
                    </div>
                  </div>
                  {/* 1개 - 이름 있음 */}
                  <div className={getCardClassName()}>
                    <div className="text-xs text-gray-400 mb-3">1개, 이름 표시</div>
                    <div className="relative inline-block mb-4">
                      <div className={getCCTVIconClassName('tracking')}>
                        <CCTVIcon className="w-4 h-4 text-red-400" />
                      </div>
                      <div className={`${getCCTVLabelClassName('tracking')} mt-1`}>
                        현재 위치
                      </div>
                      <div className={`${getTimelineTitleClassName('tracking', true)}`} style={{ color: '#f87171' }}>
                        차량 도주 추적 중
                      </div>
                    </div>
                  </div>
                  {/* 2개 이상 - 이름 없음 */}
                  <div className={getCardClassName()}>
                    <div className="text-xs text-gray-400 mb-3">2개 이상, 이름 숨김</div>
                    <div className="relative inline-block mb-4">
                      <div className={`${getCCTVIconClassName('tracking')} flex items-center justify-center w-auto min-w-[28px]`} style={{ paddingLeft: '4px', paddingRight: '4px' }}>
                        <CCTVIcon className="w-4 h-4 text-red-400" />
                        <span className="text-xs font-semibold text-red-400 ml-1">999+</span>
                      </div>
                      <div className={`${getTimelineTitleClassName('tracking', false)}`} style={{ color: '#f87171' }}>
                        차량 도주 추적 중
                      </div>
                    </div>
                  </div>
                  {/* 2개 이상 - 이름 있음 */}
                  <div className={getCardClassName()}>
                    <div className="text-xs text-gray-400 mb-3">2개 이상, 이름 표시</div>
                    <div className="relative inline-block mb-4">
                      <div className={`${getCCTVIconClassName('tracking')} flex items-center justify-center w-auto min-w-[28px]`} style={{ paddingLeft: '4px', paddingRight: '4px' }}>
                        <CCTVIcon className="w-4 h-4 text-red-400" />
                        <span className="text-xs font-semibold text-red-400 ml-1">999+</span>
                      </div>
                      <div className={`${getCCTVLabelClassName('tracking')} mt-1`}>
                        현재 위치
                      </div>
                      <div className={`${getTimelineTitleClassName('tracking', true)}`} style={{ color: '#f87171' }}>
                        차량 도주 추적 중
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warning (Yellow) */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 text-gray-300">Warning (Yellow) - 초기 포착</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {/* 1개 - 이름 없음 */}
                  <div className={getCardClassName()}>
                    <div className="text-xs text-gray-400 mb-3">1개, 이름 숨김</div>
                    <div className="relative inline-block mb-4">
                      <div className={getCCTVIconClassName('warning')}>
                        <CCTVIcon className="w-4 h-4 text-yellow-400" />
                      </div>
                      <div className={`${getTimelineTitleClassName('warning', false)}`} style={{ color: '#facc15' }}>
                        유괴범과 아동 함께 이동 포착
                      </div>
                    </div>
                  </div>
                  {/* 1개 - 이름 있음 */}
                  <div className={getCardClassName()}>
                    <div className="text-xs text-gray-400 mb-3">1개, 이름 표시</div>
                    <div className="relative inline-block mb-4">
                      <div className={getCCTVIconClassName('warning')}>
                        <CCTVIcon className="w-4 h-4 text-yellow-400" />
                      </div>
                      <div className={`${getCCTVLabelClassName('warning')} mt-1`}>
                        CCTV-7
                      </div>
                      <div className={`${getTimelineTitleClassName('warning', true)}`} style={{ color: '#facc15' }}>
                        유괴범과 아동 함께 이동 포착
                      </div>
                    </div>
                  </div>
                  {/* 2개 이상 - 이름 없음 */}
                  <div className={getCardClassName()}>
                    <div className="text-xs text-gray-400 mb-3">2개 이상, 이름 숨김</div>
                    <div className="relative inline-block mb-4">
                      <div className={`${getCCTVIconClassName('warning')} flex items-center justify-center w-auto min-w-[28px]`} style={{ paddingLeft: '4px', paddingRight: '4px' }}>
                        <CCTVIcon className="w-4 h-4 text-yellow-400" />
                        <span className="text-xs font-semibold text-yellow-400 ml-1">2</span>
                      </div>
                      <div className={`${getTimelineTitleClassName('warning', false)}`} style={{ color: '#facc15' }}>
                        유괴범과 아동 함께 이동 포착
                      </div>
                    </div>
                  </div>
                  {/* 2개 이상 - 이름 있음 */}
                  <div className={getCardClassName()}>
                    <div className="text-xs text-gray-400 mb-3">2개 이상, 이름 표시</div>
                    <div className="relative inline-block mb-4">
                      <div className={`${getCCTVIconClassName('warning')} flex items-center justify-center w-auto min-w-[28px]`} style={{ paddingLeft: '4px', paddingRight: '4px' }}>
                        <CCTVIcon className="w-4 h-4 text-yellow-400" />
                        <span className="text-xs font-semibold text-yellow-400 ml-1">2</span>
                      </div>
                      <div className={`${getCCTVLabelClassName('warning')} mt-1`}>
                        CCTV-7
                      </div>
                      <div className={`${getTimelineTitleClassName('warning', true)}`} style={{ color: '#facc15' }}>
                        유괴범과 아동 함께 이동 포착
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 확대 모드 - 개별 아이콘 */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-300">확대 모드 - 개별 아이콘 (2개 이상일 때)</h3>
                <div className="grid grid-cols-2 gap-6">
                  {/* Default - 개별 */}
                  <div className={getCardClassName()}>
                    <div className="text-xs text-gray-400 mb-3">Default - CCTV-7-1, CCTV-7-2</div>
                    <div className="relative inline-block mb-4">
                      <div className={getCCTVIconClassName('default')}>
                        <CCTVIcon className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className={`${getCCTVLabelClassName('default')} mt-1`}>
                        CCTV-7-1
                      </div>
                      <div className={`${getTimelineTitleClassName('default', true)}`} style={{ color: '#9ca3af' }}>
                        유괴범과 아동 함께 이동 포착
                      </div>
                    </div>
                  </div>
                  {/* Active - 개별 */}
                  <div className={getCardClassName()}>
                    <div className="text-xs text-gray-400 mb-3">Active - CCTV-15-1, CCTV-15-2</div>
                    <div className="relative inline-block mb-4">
                      <div className={getCCTVIconClassName('active')}>
                        <CCTVIcon className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className={`${getCCTVLabelClassName('active')} mt-1`}>
                        CCTV-15-1
                      </div>
                      <div className={`${getTimelineTitleClassName('active', true)}`} style={{ color: '#60a5fa' }}>
                        용의자가 차량에 아이 태우는 장면 포착
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 컬러 팔레트 섹션 */}
        {activeSection === 'colors' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">배경 컬러</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(colorPalette.background).map(([key, value]) => (
                  <div key={key} className={getCardClassName()}>
                    <div 
                      className="w-full h-20 rounded mb-2"
                      style={{ backgroundColor: value }}
                    />
                    <div className="text-sm">
                      <div className="text-white font-semibold mb-1">{key}</div>
                      <div className="text-gray-400 text-xs font-mono">{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">텍스트 컬러</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(colorPalette.text).map(([key, value]) => {
                  const textColorClass = value === 'white' ? 'text-white' : value === 'gray-300' ? 'text-gray-300' : value === 'gray-400' ? 'text-gray-400' : value === 'gray-500' ? 'text-gray-500' : 'text-gray-600';
                  return (
                    <div key={key} className={getCardClassName()}>
                      <div className="w-full h-20 rounded mb-2 bg-[#1a1a1a] flex items-center justify-center border border-[#31353a]">
                        <span className={`${textColorClass} text-sm font-semibold`}>
                          샘플 텍스트
                        </span>
                      </div>
                      <div className="text-sm">
                        <div className="text-white font-semibold mb-1">{key}</div>
                        <div className="text-gray-400 text-xs font-mono">{value}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 폰트 섹션 */}
        {activeSection === 'fonts' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">폰트 사이즈</h2>
              <div className="space-y-4">
                {Object.entries(fontSizes).map(([key, value]) => (
                  <div key={key} className={getCardClassName()}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-semibold mb-1">{key}</div>
                        <div className="text-gray-400 text-xs font-mono mb-2">{value}</div>
                        <div className={`${value} text-white`}>
                          The quick brown fox jumps over the lazy dog
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">폰트 웨이트</h2>
              <div className="space-y-4">
                {Object.entries(fontWeights).map(([key, value]) => (
                  <div key={key} className={getCardClassName()}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-semibold mb-1">{key}</div>
                        <div className="text-gray-400 text-xs font-mono mb-2">{value}</div>
                        <div className={`${value} text-white text-lg`}>
                          The quick brown fox jumps over the lazy dog
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* BasePopup 데모 */}
        <BasePopup
          isOpen={isBasePopupOpen}
          onClose={() => setIsBasePopupOpen(false)}
          title="BasePopup 예시"
          titleIcon={<Icon icon="mdi:window-open" className="w-5 h-5 text-[#50A1FF]" />}
          maxWidth="max-w-2xl"
        >
          <div className="p-6">
            <p className="text-white mb-4">이것은 BasePopup 컴포넌트의 예시입니다.</p>
            <p className="text-gray-300 text-sm">
              • 중앙 정렬 모달 스타일<br/>
              • ESC 키로 닫기 가능<br/>
              • 오버레이 클릭으로 닫기 가능<br/>
              • 헤더, 컨텐츠, 푸터 구조
            </p>
          </div>
          <div className="p-4 border-t border-[#31353a]">
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsBasePopupOpen(false)}
                className={getSecondaryButtonClassName()}
              >
                닫기
              </button>
              <button
                onClick={() => setIsBasePopupOpen(false)}
                className={getPrimaryButtonClassName()}
              >
                확인
              </button>
            </div>
          </div>
        </BasePopup>

        {/* NotificationPopup 데모 */}
        <NotificationPopup
          isOpen={isNotificationPopupOpen}
          onClose={() => setIsNotificationPopupOpen(false)}
          title="알림 팝업 예시"
          titleIcon={<Icon icon="mdi:bell-alert" className="w-5 h-5 text-yellow-400" />}
          position={notificationPosition}
        >
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Icon icon="mdi:clock-outline" className="w-4 h-4 text-gray-400" />
              <span className="text-gray-300 text-sm">2024-01-15 14:30:00</span>
            </div>
            <div className="bg-[#0f0f0f] border border-[#31353a] rounded p-3">
              <p className="text-gray-300 text-sm">이것은 NotificationPopup 컴포넌트의 예시입니다.</p>
            </div>
          </div>
          <div className="p-4 border-t border-[#31353a]">
            <div className="flex gap-2">
              <button
                onClick={() => setIsNotificationPopupOpen(false)}
                className={`flex-1 ${getSecondaryButtonClassName()}`}
              >
                닫기
              </button>
              <button
                onClick={() => setIsNotificationPopupOpen(false)}
                className={`flex-1 ${getPrimaryButtonClassName()}`}
              >
                확인
              </button>
            </div>
          </div>
        </NotificationPopup>
      </div>
    </div>
  );
}
