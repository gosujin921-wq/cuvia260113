import React from "react";
import { Icon } from "@iconify/react";

interface TopControlPanelProps {
    isVisible: boolean;
    onStop?: () => void;
    cctvCount?: number;
}

const TopControlPanel: React.FC<TopControlPanelProps> = ({ isVisible, onStop, cctvCount = 8 }) => {
    if (!isVisible) return null;

    return (
        <div
            className="absolute top-0 left-5 right-5 z-[1500]"
            style={{
                animation: isVisible ? "fadeInDown 0.5s ease-out" : "none",
                opacity: isVisible ? 1 : 0,
            }}>
            <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
            <div
                className="gradient-border-right-bottom"
                style={{
                    background: "linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)",
                    backdropFilter: "blur(2px)",
                    WebkitBackdropFilter: "blur(2px)",
                    borderWidth: "1px",
                }}>
                <div className="flex items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-2">
                        <h3 className="text-white text-sm font-semibold">투망 감시</h3>
                        <span className="text-gray-500">|</span>
                        <span className="text-gray-300 text-sm">인근 CCTV {cctvCount}대를 모니터링 중입니다.</span>
                    </div>

                    <div className="flex items-center gap-4">
                        {onStop && (
                            <button onClick={onStop} className="px-4 py-1.5 bg-red-500/90 hover:bg-red-500 text-white text-sm font-semibold rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2" aria-label="투망감시 중지">
                                투망감시 중지
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TopControlPanel;
