import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import type { ChartStreamData, TableStreamData } from "@/types/streamJson.types";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, type ChartOptions } from "chart.js";
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

const CHART_COLORS = ["rgba(255, 99, 132, 0.85)", "rgba(54, 162, 235, 0.85)", "rgba(255, 206, 86, 0.85)", "rgba(75, 192, 192, 0.85)", "rgba(153, 102, 255, 0.85)"];

/** 선형 그래프용 색상 (선·포인트가 잘 보이도록 채도·명도 높음) */
const LINE_CHART_COLORS = ["rgba(255, 107, 107, 1)", "rgba(78, 205, 255, 1)", "rgba(255, 230, 109, 1)", "rgba(82, 255, 213, 1)", "rgba(197, 148, 255, 1)"];

const CARD_STYLE: React.CSSProperties = {
    background: "linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)",
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
};

const LEGEND_AND_TITLE_COLOR = "rgba(229, 231, 235, 0.95)";

const getChartOptions = (title: string, type: ChartViewType): ChartOptions<"bar" | "line" | "pie" | "doughnut"> => ({
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
        legend: {
            position: "top" as const,
            labels: {
                color: LEGEND_AND_TITLE_COLOR,
                font: { size: 12 },
                usePointStyle: true,
                pointStyle: "circle",
                padding: 16,
            },
        },
        title: {
            display: !!title,
            text: title,
            color: LEGEND_AND_TITLE_COLOR,
            font: { size: 14 },
        },
    },
    ...(type === "line" || type === "bar"
        ? {
              scales: {
                  x: {
                      ticks: { color: LEGEND_AND_TITLE_COLOR, maxRotation: 45 },
                      grid: { color: "rgba(229, 231, 235, 0.2)" },
                  },
                  y: {
                      ticks: { color: LEGEND_AND_TITLE_COLOR },
                      grid: { color: "rgba(229, 231, 235, 0.2)" },
                  },
              },
          }
        : {}),
});

type ChartViewType = "line" | "pie" | "bar" | "doughnut";

const CHART_VIEW_BUTTONS: { type: ChartViewType; label: string; icon: string }[] = [
    { type: "line", label: "선", icon: "mdi:chart-line" },
    { type: "pie", label: "파이", icon: "mdi:chart-pie" },
    { type: "bar", label: "막대", icon: "mdi:chart-bar" },
    { type: "doughnut", label: "도넛", icon: "mdi:chart-doughnut" },
];

type TransitionPhase = "idle" | "out" | "in";

const ChartContent: React.FC<{ data: ChartStreamData }> = ({ data }) => {
    const initialType = (data.type || "bar").toLowerCase();
    const normalizedInitial: ChartViewType = initialType === "line" || initialType === "pie" || initialType === "bar" || initialType === "doughnut" ? initialType : "bar";
    const [viewType, setViewType] = useState<ChartViewType>(normalizedInitial);
    const [displayType, setDisplayType] = useState<ChartViewType>(normalizedInitial);
    const [phase, setPhase] = useState<TransitionPhase>("idle");
    const [hasAnimatedIn, setHasAnimatedIn] = useState(true);

    const chartType = displayType;
    const labels = data.labels ?? [];
    const baseColor = (i: number) => CHART_COLORS[i % CHART_COLORS.length];
    const lineColor = (i: number) => LINE_CHART_COLORS[i % LINE_CHART_COLORS.length];
    const datasets = (data.datasets ?? []).map((ds, i) => {
        const isLine = chartType === "line";
        const color = isLine ? lineColor(i) : baseColor(i);
        return {
            label: ds.label ?? `데이터 ${i + 1}`,
            data: ds.data ?? [],
            backgroundColor: ds.backgroundColor ?? color,
            ...(isLine && {
                borderColor: (ds as { borderColor?: string }).borderColor ?? color,
                borderWidth: 2,
                pointBackgroundColor: (ds as { pointBackgroundColor?: string }).pointBackgroundColor ?? color,
                pointBorderColor: "rgba(229, 231, 235, 0.9)",
                pointBorderWidth: 1,
                pointRadius: 4,
                pointHoverRadius: 6,
                tension: 0.2,
            }),
        };
    });
    const chartData = { labels, datasets };
    const options = getChartOptions(data.title ?? "", displayType);

    const handleViewTypeClick = (type: ChartViewType) => {
        if (type === displayType) return;
        setViewType(type);
        setPhase("out");
    };

    // fade-out 완료 후 차트 전환 → fade-in
    useEffect(() => {
        if (phase !== "out") return;
        const t = setTimeout(() => {
            setDisplayType(viewType);
            setPhase("in");
            setHasAnimatedIn(false);
        }, 500);
        return () => clearTimeout(t);
    }, [phase, viewType]);

    // fade-in 시작 (opacity 0 → 1 트리거)
    useEffect(() => {
        if (phase !== "in") return;
        const id = requestAnimationFrame(() => setHasAnimatedIn(true));
        return () => cancelAnimationFrame(id);
    }, [phase]);

    // fade-in 완료 후 idle
    useEffect(() => {
        if (phase !== "in" || !hasAnimatedIn) return;
        const t = setTimeout(() => setPhase("idle"), 150);
        return () => clearTimeout(t);
    }, [phase, hasAnimatedIn]);

    const chartOpacity = phase === "out" ? 0 : phase === "in" ? (hasAnimatedIn ? 1 : 0) : 1;

    const renderChart = () => {
        if (chartType === "line") {
            return <Line data={chartData} options={options as ChartOptions<"line">} />;
        }
        if (chartType === "pie") {
            return <Pie data={chartData} options={options as ChartOptions<"pie">} />;
        }
        if (chartType === "doughnut") {
            return <Doughnut data={chartData} options={options as ChartOptions<"doughnut">} />;
        }
        return <Bar data={chartData} options={options as ChartOptions<"bar">} />;
    };

    return (
        <div className="w-full h-full flex flex-col gap-2">
            <div className="flex items-center gap-1 shrink-0">
                {CHART_VIEW_BUTTONS.map(({ type, label, icon }) => (
                    <button
                        key={type}
                        type="button"
                        onClick={() => handleViewTypeClick(type)}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-white/30 ${viewType === type ? "bg-white/20 text-white" : "text-gray-400 hover:text-white hover:bg-white/10"}`}
                        aria-label={`${label} 차트로 보기`}
                        aria-pressed={viewType === type}>
                        <Icon icon={icon} className="w-4 h-4" />
                        {label}
                    </button>
                ))}
            </div>
            <div className="min-h-0 flex-1 flex items-center justify-center">
                <div className="w-full h-full flex items-center justify-center transition-opacity duration-150 ease-out" style={{ opacity: chartOpacity }}>
                    {renderChart()}
                </div>
            </div>
        </div>
    );
};

const TableContent: React.FC<{ data: TableStreamData }> = ({ data }) => {
    const columns = data.columns ?? [];
    const rows = data.data ?? [];
    return (
        <div className="flex flex-col h-full min-h-0 gap-3">
            <div className="flex-1 min-h-0 flex flex-col rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead className="sticky top-0 z-10">
                            <tr style={{ background: "rgb(40,40,48)" }}>
                                {columns.map((col, i) => (
                                    <th key={i} className="px-3 py-2.5 text-left text-white font-semibold">
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, ri) => (
                                <tr key={ri} style={{ background: ri % 2 === 0 ? "rgb(35,35,42)" : "rgb(40,40,48)" }}>
                                    {row.map((cell, ci) => (
                                        <td key={ci} className="px-3 py-2 text-gray-200" dangerouslySetInnerHTML={{ __html: String(cell) }} />
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {data.meta && (
                <div
                    className="flex-shrink-0 rounded-lg px-3 py-2.5"
                    style={{
                        background: "rgba(40,40,48,0.6)",
                        border: "1px solid rgba(255,255,255,0.08)",
                    }}>
                    <p className="text-sm text-white font-medium">{data.meta.criteria}</p>
                    <p className="text-sm text-gray-300 mt-1">{data.meta.guide}</p>
                </div>
            )}
        </div>
    );
};

export type AgentCardData = { type: "chart"; title: string; chartData: ChartStreamData } | { type: "table"; title: string; tableData: TableStreamData };

interface AgentCardProps {
    /** 차트 또는 테이블 데이터 */
    data: AgentCardData;
    /** 카드 제거 시 호출 (있으면 X 버튼 표시) */
    onRemove?: () => void;
    /** 카드 루트에 적용할 클래스 */
    className?: string;
    /** 카드 루트에 적용할 스타일 */
    style?: React.CSSProperties;
}

export const AgentCard: React.FC<AgentCardProps> = ({ data, onRemove, className = "", style }) => {
    return (
        <div className={`rounded-lg flex flex-col border border-[#31353a] overflow-hidden gradient-border-left-top min-h-0 ${className} max-w-[700px]`} style={{ ...CARD_STYLE, ...style }}>
            {onRemove && (
                <div className="absolute top-3 right-3 z-10">
                    <button type="button" onClick={onRemove} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0 focus:outline-none" aria-label="카드 제거">
                        <Icon icon="mdi:close" className="w-5 h-5" />
                    </button>
                </div>
            )}
            <div className="flex-1 min-h-0 p-4 pt-12 overflow-auto">
                <div className={`h-full rounded-lg w-full ${data.type === "chart" ? "overflow-hidden" : "overflow-auto"}`}>{data.type === "chart" ? <ChartContent data={data.chartData} /> : <TableContent data={data.tableData} />}</div>
            </div>
        </div>
    );
};
