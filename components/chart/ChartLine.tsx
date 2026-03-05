import { ChartStreamData } from "@/types/streamJson.types";
import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const LINE_COLORS = ["#3b82f6", "#8A2BE2", "#ff8566", "#10b981", "#f59e0b"];

const X_TICK_PROPS = { fill: "#9ca3af", fontSize: 11 };

interface Props {
    data: ChartStreamData;
    fill?: boolean;
}

export function ChartLine({ data, fill }: Props) {
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
                <LineChart data={rechartsData} margin={{ top: 4, right: 20, left: 4, bottom: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" />
                    <XAxis dataKey="name" tick={X_TICK_PROPS} tickMargin={8} interval="preserveStartEnd" padding={{ left: 4, right: 12 }} />
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
                        <Line key={key} type="monotone" dataKey={key} stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth={2} dot={{ fill: LINE_COLORS[i % LINE_COLORS.length], r: 3 }} activeDot={{ r: 5 }} />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
