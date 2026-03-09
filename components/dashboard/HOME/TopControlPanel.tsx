import React, { useState, useEffect, useRef } from "react";

type Step = "start" | "progress" | "end";

const STEP_CONFIG: Record<Step, { label: string; dot: string; glow: string; pulse: boolean }> = {
    start: { label: "시작", dot: "#3b82f6", glow: "rgba(59,130,246,0.5)", pulse: false },
    progress: { label: "진행중", dot: "#f59e0b", glow: "rgba(245,158,11,0.5)", pulse: true },
    end: { label: "종료", dot: "#10b981", glow: "rgba(16,185,129,0.5)", pulse: false },
};

const formatElapsed = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

interface TopControlPanelProps {
    isVisible: boolean;
    onStop?: () => void;
    cctvCount?: number;
    currentStep?: Step;
}

const TopControlPanel: React.FC<TopControlPanelProps> = ({ isVisible, onStop, cctvCount = 8, currentStep = "start" }) => {
    const [elapsed, setElapsed] = useState(0);
    const startTimeRef = useRef<number | null>(null);
    const frozenElapsedRef = useRef<number | null>(null);

    useEffect(() => {
        if (!isVisible) {
            setElapsed(0);
            startTimeRef.current = null;
            frozenElapsedRef.current = null;
            return;
        }

        if (startTimeRef.current === null) {
            startTimeRef.current = Date.now();
        }

        if (currentStep === "end") {
            if (frozenElapsedRef.current === null) {
                frozenElapsedRef.current = Math.floor((Date.now() - startTimeRef.current) / 1000);
            }
            setElapsed(frozenElapsedRef.current);
            return;
        }

        frozenElapsedRef.current = null;

        const timer = setInterval(() => {
            if (startTimeRef.current !== null) {
                setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [isVisible, currentStep]);

    if (!isVisible) return null;

    const { label, dot, glow, pulse } = STEP_CONFIG[currentStep];

    return (
        <div
            className="absolute top-0 left-0 right-0 w-full z-[1500]"
            style={{
                animation: isVisible ? "fadeInDown 0.5s ease-out" : "none",
                opacity: isVisible ? 1 : 0,
            }}>
            <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-100%); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes statusPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.8); }
        }
      `}</style>
            <div
                className="rounded-lg"
                style={{
                    background: "linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)",
                    backdropFilter: "blur(2px)",
                    WebkitBackdropFilter: "blur(2px)",
                }}>
                <div className="flex items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-2">
                        <h3 className="text-white text-sm font-semibold">투망 감시</h3>
                        <span className="text-gray-500">|</span>
                        <span className="text-gray-300 text-sm">인근 CCTV {cctvCount}대를 모니터링 중입니다.</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2" role="status" aria-label={`현재 단계: ${label}`}>
                            <span className="relative flex items-center justify-center w-2.5 h-2.5">
                                {pulse && (
                                    <span
                                        className="absolute inset-0 rounded-full"
                                        style={{ background: dot, animation: "statusPulse 2s ease-in-out infinite" }}
                                    />
                                )}
                                <span
                                    className="relative block w-2 h-2 rounded-full"
                                    style={{ background: dot, boxShadow: `0 0 6px ${glow}` }}
                                />
                            </span>
                            <span className="text-[13px] font-medium text-white/80">{label}</span>
                        </div>

                        <span className="text-[13px] font-mono tabular-nums text-white/50" aria-label={`경과 시간: ${formatElapsed(elapsed)}`}>
                            {formatElapsed(elapsed)}
                        </span>

                        <span className="w-px h-4 bg-white/10" />

                        {onStop && (
                            <button
                                onClick={onStop}
                                className="px-4 py-1.5 text-sm font-semibold rounded transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-transparent"
                                style={{
                                    background: "rgba(255,255,255,0.08)",
                                    color: "rgba(255,255,255,0.7)",
                                    border: "1px solid rgba(255,255,255,0.12)",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "rgba(255,255,255,0.15)";
                                    e.currentTarget.style.color = "rgba(255,255,255,0.9)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                                    e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                                }}
                                aria-label="투망감시 중지"
                            >
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
