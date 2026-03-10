import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import type { ChartStreamData, TableStreamData } from "@/types/streamJson.types";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from "chart.js";
import { ChartLine } from "@/components/chart/ChartLine";
import { ChartBar } from "@/components/chart/ChartBar";
import { ChartPie } from "@/components/chart/ChartPie";
import { ChartDoughnut } from "@/components/chart/ChartDoughnut";
import { stripHtmlTags } from "./TableMessage";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

const CARD_STYLE: React.CSSProperties = {
    background: "linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)",
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
};

type ChartViewType = "line" | "pie" | "bar" | "doughnut";

const CHART_VIEW_BUTTONS: { type: ChartViewType; label: string }[] = [
    { type: "line", label: "선" },
    { type: "pie", label: "파이" },
    { type: "bar", label: "막대" },
    { type: "doughnut", label: "도넛" },
];

const getNormalizedChartType = (type: string | undefined): ChartViewType => {
    const initial = (type || "bar").toLowerCase();
    return initial === "line" || initial === "pie" || initial === "bar" || initial === "doughnut" ? initial : "bar";
};

const ChartContent: React.FC<{ data: ChartStreamData }> = ({ data }) => {
    const [viewType, setViewType] = useState<ChartViewType>(() => getNormalizedChartType(data.type));

    useEffect(() => {
        const nextType = getNormalizedChartType(data.type);
        const id = requestAnimationFrame(() => setViewType(nextType));
        return () => cancelAnimationFrame(id);
    }, [data.type]);

    const handleViewTypeClick = (type: ChartViewType) => {
        if (type === viewType) return;
        setViewType(type);
    };

    const renderChart = useCallback(() => {
        if (viewType === "line") {
            return <ChartLine data={data} fill />;
        }
        if (viewType === "pie") {
            return <ChartPie data={data} fill />;
        }
        if (viewType === "doughnut") {
            return <ChartDoughnut data={data} fill />;
        }
        return <ChartBar data={data} fill />;
    }, [viewType, data]);

    return (
        <div className="h-full flex flex-col min-h-0 gap-2">
            <div className="flex items-center justify-start gap-2 flex-shrink-0">
                <div className="flex rounded-lg overflow-hidden border border-[#40424a] bg-[#393a42] p-0.5">
                    {CHART_VIEW_BUTTONS.map(({ type, label }) => (
                        <button key={type} type="button" onClick={() => handleViewTypeClick(type)} className={`px-3 py-1.5 text-xs font-medium transition-colors rounded-md ${viewType === type ? "bg-[#4b5563] text-white" : "text-gray-400 hover:text-gray-200"}`} aria-label={`${label} 차트로 보기`} aria-pressed={viewType === type}>
                            {label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="min-h-0 flex-1 flex items-center justify-center">
                <div className="w-full h-full flex items-center justify-center">{renderChart()}</div>
            </div>
        </div>
    );
};

const TableContent: React.FC<{ data: TableStreamData; isLatest?: boolean; onMapLocationRequest?: (lat: number, lng: number) => void; flyToLocation?: [number, number] | null; isMapMoving?: boolean }> = ({ data, isLatest = true, onMapLocationRequest, flyToLocation, isMapMoving }) => {
    const columns = data.columns ?? [];
    const rows = data.data ?? [];

    const handleCellClick = (row: Record<string, string | number | boolean>) => {
        if (row.type === "map" && onMapLocationRequest) {
            const lat = typeof row.lat === "number" ? row.lat : Number(row.lat);
            const lng = typeof row.lng === "number" ? row.lng : Number(row.lng);
            if (Number.isFinite(lat) && Number.isFinite(lng)) {
                onMapLocationRequest(lat, lng);
            }
        }
    };

    return (
        <div className={`flex flex-col flex-1 min-h-0${!isLatest ? " select-none" : ""}`}>
            <div className="flex-1 min-h-0 flex flex-col rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr style={{ background: "rgb(40,40,48)" }}>
                            {columns.map((col, i) => (
                                <th key={i} className="px-3 py-2.5 text-left text-white font-semibold">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                </table>
                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <tbody>
                            {rows.map((row, ri) => {
                                const isClickable = isLatest && !isMapMoving && data.extension?.[ri]?.type !== "text" && data.extension?.[ri]?.clickable;
                                const ext = data.extension?.[ri];
                                const isHighlighted = (() => {
                                    if (!flyToLocation || !ext || !isLatest) return false;
                                    const extLat = typeof ext.lat === "number" ? ext.lat : Number(ext.lat);
                                    const extLng = typeof ext.lng === "number" ? ext.lng : Number(ext.lng);
                                    if (!Number.isFinite(extLat) || !Number.isFinite(extLng)) return false;
                                    return Math.abs(flyToLocation[0] - extLng) < 0.0001 && Math.abs(flyToLocation[1] - extLat) < 0.0001;
                                })();
                                const rowBg = isHighlighted ? "rgba(239, 68, 68, 0.15)" : ri % 2 === 0 ? "rgb(35,35,42)" : "rgb(40,40,48)";
                                return (
                                    <tr
                                        key={ri}
                                        className={`transition-colors duration-200 ${isClickable ? "cursor-pointer hover:bg-[#393a42]!" : "cursor-default"}`}
                                        style={{
                                            background: rowBg,
                                            borderLeft: isHighlighted ? "2px solid #ef4444" : "2px solid transparent",
                                        }}>
                                        {row.map((cell, cellIdx) => {
                                            const cellStr = String(cell);
                                            const text = stripHtmlTags(cellStr);
                                            const extension = data.extension?.[ri];
                                            return (
                                                <td
                                                    key={cellIdx}
                                                    className={`px-3 py-2 font-medium ${isHighlighted ? "text-white" : "text-gray-300"}`}
                                                    onClick={isClickable && extension ? () => handleCellClick(extension) : undefined}
                                                    role={isClickable ? "button" : undefined}
                                                    tabIndex={isClickable ? 0 : undefined}
                                                    onKeyDown={isClickable && extension ? (e) => e.key === "Enter" && handleCellClick(extension) : undefined}
                                                    aria-label={isClickable ? `위치 보기: ${text}` : undefined}>
                                                    {text}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            {data.meta && (
                <div
                    className="flex-shrink-0 rounded-lg px-3 py-2.5 mt-3"
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
    /** 가장 최근 메시지 여부 (false이면 hover/click 비활성화) */
    isLatest?: boolean;
    /** 카드 제거 시 호출 (있으면 X 버튼 표시) */
    onRemove?: () => void;
    /** 카드 루트에 적용할 클래스 */
    className?: string;
    /** 카드 루트에 적용할 스타일 */
    style?: React.CSSProperties;
    /** 차트 메시지 표에서 위치 클릭 시 지도 이동 (lat, lng) */
    onMapLocationRequest?: (lat: number, lng: number) => void;
    flyToLocation?: [number, number] | null;
    isMapMoving?: boolean;
}

export const AgentCard: React.FC<AgentCardProps> = ({ data, isLatest = true, onRemove, className = "", style, onMapLocationRequest, flyToLocation, isMapMoving }) => {
    return (
        <div className={`rounded-lg flex flex-col border border-[#31353a] overflow-hidden min-h-0 ${className} max-w-[700px]`} style={{ ...CARD_STYLE, ...style }}>
            {onRemove && (
                <div className="absolute top-3 right-3 z-10">
                    <button type="button" onClick={onRemove} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0 focus:outline-none" aria-label="카드 제거">
                        <Icon icon="mdi:close" className="w-5 h-5" />
                    </button>
                </div>
            )}
            <div className={`flex-1 min-h-0 p-4 pt-12 ${data.type === "chart" ? "overflow-auto" : "overflow-hidden flex flex-col"}`}>
                <div className={`rounded-lg w-full ${data.type === "chart" ? "h-full overflow-hidden" : "flex-1 min-h-0 flex flex-col"}`}>{data.type === "chart" ? <ChartContent data={data.chartData} /> : <TableContent data={data.tableData} isLatest={isLatest} onMapLocationRequest={onMapLocationRequest} flyToLocation={flyToLocation} isMapMoving={isMapMoving} />}</div>
            </div>
        </div>
    );
};
