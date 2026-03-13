import { ChartStreamData } from "@/types/streamJson.types";
import { useEffect, useMemo, useRef, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const LINE_COLORS = ["#3b82f6", "#8A2BE2", "#ff8566", "#10b981", "#f59e0b"];

const X_TICK_PROPS = { fill: "#9ca3af", fontSize: 11 };

const LEGEND_DIM_OPACITY = 0.2;
const ANIM_BEGIN = 400;
const ANIM_DURATION = 1500;
const ANIM_TOTAL = ANIM_BEGIN + ANIM_DURATION + 200;

interface Props {
    data: ChartStreamData;
    fill?: boolean;
}

export function ChartLine({ data, fill }: Props) {
    const [isRenderEnd, setIsRenderEnd] = useState(false);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
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

    const legendItems = useMemo(() => dataKeys.map((label, i) => ({ label, color: LINE_COLORS[i % LINE_COLORS.length] })), [dataKeys]);

    useEffect(() => {
        isRenderEndRef.current = false;

        const resetId = requestAnimationFrame(() => {
            setIsRenderEnd(false);
            setHoveredIndex(null);
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

    const handleLegendMouseEnter = (index: number) => {
        if (!isRenderEndRef.current) return;
        setHoveredIndex(index);
    };
    const handleLegendMouseLeave = () => {
        if (!isRenderEndRef.current) return;
        setHoveredIndex(null);
    };

    const activeHover = isRenderEnd ? hoveredIndex : null;

    return (
        <div className={fill ? "w-full h-full flex flex-col" : "h-[220px] w-full flex flex-col"} style={{ pointerEvents: isRenderEnd ? "auto" : "none" }}>
            <div className="flex-shrink-0 pb-2 flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-white/10" style={{ pointerEvents: isRenderEnd ? "auto" : "none" }}>
                {legendItems.map((item, index) => (
                    <div
                        key={`legend-${index}`}
                        className="flex items-center gap-2 text-sm cursor-pointer transition-opacity"
                        style={{ opacity: activeHover === null || activeHover === index ? 1 : LEGEND_DIM_OPACITY }}
                        onMouseEnter={() => handleLegendMouseEnter(index)}
                        onMouseLeave={handleLegendMouseLeave}
                        role="button"
                        tabIndex={0}
                        aria-label={item.label}
                        onKeyDown={(e) => {
                            if (!isRenderEndRef.current) return;
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setHoveredIndex((prev) => (prev === index ? null : index));
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
                    <LineChart data={rechartsData} margin={{ top: 4, right: 20, left: 4, bottom: 24 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" />
                        <XAxis dataKey="name" tick={X_TICK_PROPS} tickMargin={8} interval="preserveStartEnd" padding={{ left: 4, right: 12 }} />
                        <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} width={36} tickSize={0} axisLine={false} />
                        {isRenderEnd && (
                            <Tooltip
                                contentStyle={{
                                    background: "rgba(30,30,35,0.95)",
                                    border: "1px solid rgba(255,255,255,0.15)",
                                    borderRadius: "8px",
                                }}
                                labelStyle={{ color: "#e5e7eb" }}
                                itemStyle={{ color: "#e5e7eb" }}
                                wrapperStyle={{ outline: "none" }}
                            />
                        )}
                        {dataKeys.map((key, i) => (
                            <Line
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stroke={LINE_COLORS[i % LINE_COLORS.length]}
                                strokeWidth={2}
                                strokeOpacity={activeHover === null || activeHover === i ? 1 : LEGEND_DIM_OPACITY}
                                dot={(props: { cx?: number; cy?: number; key?: string }) => <circle key={props.key} cx={props.cx} cy={props.cy} r={3} fill={LINE_COLORS[i % LINE_COLORS.length]} opacity={activeHover === null || activeHover === i ? 1 : LEGEND_DIM_OPACITY} />}
                                activeDot={{ r: 5 }}
                                animationBegin={ANIM_BEGIN}
                                animationDuration={ANIM_DURATION}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
