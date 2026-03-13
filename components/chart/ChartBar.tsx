import { ChartStreamData } from "@/types/streamJson.types";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const BAR_COLORS = ["#0066FF", "#3b82f6", "#8A2BE2", "#ff8566", "#10b981"];
const BAR_HOVER_COLORS = ["#3399FF", "#60a5fa", "#A855F7", "#ffa080", "#34d399"];

interface Props {
    data: ChartStreamData;
    fill?: boolean;
}

const BAR_DIM_OPACITY = 0.3;
const LEGEND_DIM_OPACITY = 0.2;
const ANIM_BEGIN = 400;
const ANIM_DURATION = 1500;
const ANIM_TOTAL = ANIM_BEGIN + ANIM_DURATION + 200;

export function ChartBar({ data, fill }: Props) {
    const [isRenderEnd, setIsRenderEnd] = useState(false);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [hoveredSeriesIndex, setHoveredSeriesIndex] = useState<number | null>(null);
    const isRenderEndRef = useRef(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const labels = useMemo(() => data.labels ?? [], [data.labels]);
    const datasets = useMemo(() => data.datasets ?? [], [data.datasets]);

    const rechartsData = useMemo(
        () =>
            labels.map((label, i) => {
                const point: Record<string, string | number> = { name: label };
                datasets.forEach((ds, dsIdx) => {
                    point[ds.label ?? `series_${dsIdx}`] = ds.data?.[i] ?? 0;
                });
                return point;
            }),
        [labels, datasets]
    );

    const dataKeys = useMemo(() => datasets.map((ds, i) => ds.label ?? `series_${i}`), [datasets]);

    const legendItems = useMemo(() => dataKeys.map((label, i) => ({ label, color: BAR_COLORS[i % BAR_COLORS.length] })), [dataKeys]);

    useEffect(() => {
        isRenderEndRef.current = false;

        const resetId = requestAnimationFrame(() => {
            setIsRenderEnd(false);
            setHoveredIndex(null);
            setHoveredSeriesIndex(null);
        });

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            isRenderEndRef.current = true;
            setIsRenderEnd(true);
        }, ANIM_TOTAL);

        return () => {
            cancelAnimationFrame(resetId);
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [rechartsData]);

    const handleBarMouseEnter = (_: unknown, index: number) => {
        if (!isRenderEndRef.current) return;
        setHoveredIndex(index);
    };
    const handleBarMouseLeave = () => {
        if (!isRenderEndRef.current) return;
        setHoveredIndex(null);
    };
    const handleLegendMouseEnter = (index: number) => {
        if (!isRenderEndRef.current) return;
        setHoveredSeriesIndex(index);
    };
    const handleLegendMouseLeave = () => {
        if (!isRenderEndRef.current) return;
        setHoveredSeriesIndex(null);
    };

    const activeHover = isRenderEnd ? hoveredIndex : null;
    const activeSeriesHover = isRenderEnd ? hoveredSeriesIndex : null;

    return (
        <div className={fill ? "w-full h-full flex flex-col" : "h-[220px] w-full flex flex-col"} style={{ pointerEvents: isRenderEnd ? "auto" : "none" }}>
            <div className="flex-shrink-0 pb-2 flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-white/10" style={{ pointerEvents: isRenderEnd ? "auto" : "none" }}>
                {legendItems.map((item, index) => (
                    <div
                        key={`legend-${index}`}
                        className="flex items-center gap-2 text-sm cursor-pointer transition-opacity"
                        style={{ opacity: activeSeriesHover === null || activeSeriesHover === index ? 1 : LEGEND_DIM_OPACITY }}
                        onMouseEnter={() => handleLegendMouseEnter(index)}
                        onMouseLeave={handleLegendMouseLeave}
                        role="button"
                        tabIndex={0}
                        aria-label={item.label}
                        onKeyDown={(e) => {
                            if (!isRenderEndRef.current) return;
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setHoveredSeriesIndex((prev) => (prev === index ? null : index));
                            }
                        }}>
                        <span className="flex-shrink-0 w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} aria-hidden />
                        <span className="text-gray-200 truncate" title={item.label}>
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>
            <div className="flex-1 min-h-0 min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rechartsData} margin={{ top: 4, right: 20, left: 4, bottom: 24 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} tickMargin={8} interval="preserveStartEnd" padding={{ left: 4, right: 12 }} />
                        <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} width={36} tickSize={0} axisLine={false} />
                        {isRenderEnd && (
                            <Tooltip
                                contentStyle={{
                                    background: "rgba(20,20,28,0.95)",
                                    border: "1px solid rgba(255,255,255,0.12)",
                                    borderRadius: "10px",
                                    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                                }}
                                labelStyle={{ color: "#e5e7eb", fontWeight: 600, marginBottom: 4 }}
                                itemStyle={{ color: "#d1d5db" }}
                                wrapperStyle={{ outline: "none" }}
                                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                            />
                        )}
                        {dataKeys.map((key, seriesIdx) => (
                            <Bar key={key} dataKey={key} fill={BAR_COLORS[seriesIdx % BAR_COLORS.length]} radius={[4, 4, 0, 0]} animationBegin={ANIM_BEGIN} animationDuration={ANIM_DURATION} onMouseEnter={handleBarMouseEnter} onMouseLeave={handleBarMouseLeave}>
                                {rechartsData.map((_, index) => {
                                    const isHovered = activeHover === index;
                                    const baseColor = BAR_COLORS[seriesIdx % BAR_COLORS.length];
                                    const hoverColor = BAR_HOVER_COLORS[seriesIdx % BAR_HOVER_COLORS.length];
                                    const cellOpacity = activeSeriesHover !== null ? (activeSeriesHover === seriesIdx ? 1 : LEGEND_DIM_OPACITY) : activeHover === null || isHovered ? 1 : BAR_DIM_OPACITY;
                                    return <Cell key={index} fill={isHovered ? hoverColor : baseColor} opacity={cellOpacity} stroke={isHovered ? hoverColor : "none"} strokeWidth={isHovered ? 1 : 0} />;
                                })}
                            </Bar>
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
