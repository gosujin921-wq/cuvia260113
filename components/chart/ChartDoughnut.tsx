import { ChartStreamData } from "@/types/streamJson.types";
import { useEffect, useMemo, useRef, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const DOUGHNUT_COLORS = ["#0066FF", "#3b82f6", "#60a5fa", "#2563eb", "#1d4ed8", "#8A2BE2", "#8b5cf6", "#a78bfa", "#7c3aed", "#ff8566", "#fb923c", "#f97316"];

interface Props {
    data: ChartStreamData;
    fill?: boolean;
}

const LEGEND_DIM_OPACITY = 0.35;
const ANIM_BEGIN = 400;
const ANIM_DURATION = 1500;
const ANIM_TOTAL = ANIM_BEGIN + ANIM_DURATION + 200;

export function ChartDoughnut({ data, fill }: Props) {
    const [isRenderEnd, setIsRenderEnd] = useState(false);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const isRenderEndRef = useRef(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const labels = useMemo(() => data.labels ?? [], [data.labels]);
    const datasets = useMemo(() => data.datasets ?? [], [data.datasets]);
    const firstDataset = datasets[0];

    const pieData = useMemo(
        () =>
            labels.map((label, i) => ({
                name: label,
                value: firstDataset?.data?.[i] ?? 0,
            })),
        [labels, firstDataset]
    );

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
    }, [pieData]);

    const handlePieMouseEnter = (_: unknown, index: number) => {
        if (!isRenderEndRef.current) return;
        setHoveredIndex(index);
    };
    const handlePieMouseLeave = () => {
        if (!isRenderEndRef.current) return;
        setHoveredIndex(null);
    };
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
        <div className={fill ? "w-full h-full flex" : "h-full w-full flex"} style={{ pointerEvents: isRenderEnd ? "auto" : "none" }}>
            <div className="flex-1 min-w-0 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={fill ? "52%" : 68} outerRadius={fill ? "80%" : 105} paddingAngle={1} animationBegin={ANIM_BEGIN} animationDuration={ANIM_DURATION} onMouseEnter={handlePieMouseEnter} onMouseLeave={handlePieMouseLeave}>
                            {pieData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={DOUGHNUT_COLORS[index % DOUGHNUT_COLORS.length]} stroke="rgba(30,30,35,0.95)" strokeWidth={1} opacity={activeHover === null || activeHover === index ? 1 : LEGEND_DIM_OPACITY} />
                            ))}
                        </Pie>
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
                                formatter={(value: number | undefined, name: string | undefined) => [`${value ?? 0}건`, name ?? ""]}
                            />
                        )}
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="flex-shrink-0 pl-3 flex flex-col justify-center border-l border-white/10 overflow-auto" style={{ pointerEvents: isRenderEnd ? "auto" : "none" }}>
                {pieData.map((item, index) => (
                    <div
                        key={`legend-${index}`}
                        className="flex items-center gap-2 text-sm cursor-pointer transition-opacity py-1.5"
                        style={{ opacity: activeHover === null || activeHover === index ? 1 : LEGEND_DIM_OPACITY }}
                        onMouseEnter={() => handleLegendMouseEnter(index)}
                        onMouseLeave={handleLegendMouseLeave}
                        role="button"
                        tabIndex={0}
                        aria-label={`${item.name}: ${item.value}건`}
                        onKeyDown={(e) => {
                            if (!isRenderEndRef.current) return;
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setHoveredIndex((prev) => (prev === index ? null : index));
                            }
                        }}>
                        <span className="flex-shrink-0 w-3 h-3 rounded-sm" style={{ backgroundColor: DOUGHNUT_COLORS[index % DOUGHNUT_COLORS.length] }} aria-hidden />
                        <span className="text-gray-200 truncate" title={item.name}>
                            {item.name}
                        </span>
                        <span className="text-gray-400 flex-shrink-0">{item.value}건</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
