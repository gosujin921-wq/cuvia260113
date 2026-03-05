import { ChartStreamData } from "@/types/streamJson.types";
import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const PIE_COLORS = ["#0066FF", "#3b82f6", "#60a5fa", "#2563eb", "#1d4ed8", "#8A2BE2", "#8b5cf6", "#a78bfa", "#7c3aed", "#ff8566", "#fb923c", "#f97316"];

interface Props {
    data: ChartStreamData;
    fill?: boolean;
}

export function ChartPie({ data, fill }: Props) {
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

    return (
        <div className={fill ? "w-full h-full flex" : "h-[260px] w-full flex"}>
            <div className="flex-1 min-w-0 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={fill ? "80%" : 105}>
                            {pieData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="rgba(30,30,35,0.95)" strokeWidth={1} />
                            ))}
                        </Pie>
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
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="flex-shrink-0 pl-3 flex flex-col justify-center gap-1.5 border-l border-white/10 overflow-auto">
                {pieData.map((item, index) => (
                    <div key={`legend-${index}`} className="flex items-center gap-2 text-sm">
                        <span className="flex-shrink-0 w-3 h-3 rounded-sm" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} aria-hidden />
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
