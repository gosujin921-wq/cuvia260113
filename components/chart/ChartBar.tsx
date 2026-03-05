import { ChartStreamData } from "@/types/streamJson.types";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const BAR_COLORS = ["#0066FF", "#3b82f6", "#8A2BE2", "#ff8566", "#10b981"];

interface Props {
    data: ChartStreamData;
    fill?: boolean;
}

export function ChartBar({ data, fill }: Props) {
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

    return (
        <div className={fill ? "w-full h-full" : "h-[220px] w-full"}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rechartsData} margin={{ top: 4, right: 20, left: 4, bottom: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} tickMargin={8} interval="preserveStartEnd" padding={{ left: 4, right: 12 }} />
                    <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} width={36} tickSize={0} axisLine={false} />
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
                    {dataKeys.map((key, i) => (
                        <Bar key={key} dataKey={key} fill={BAR_COLORS[i % BAR_COLORS.length]} radius={[4, 4, 0, 0]} />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
