import { ChartStreamData } from "@/types/streamJson.types";
import { ChatMessage } from "./AIAgentPopup";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, type ChartOptions } from "chart.js";
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2";
import { ROW_LIMIT } from "./TableMessage";
import { useMemo } from "react";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

const CHART_COLORS = ["rgba(255, 99, 132, 0.85)", "rgba(54, 162, 235, 0.85)", "rgba(255, 206, 86, 0.85)", "rgba(75, 192, 192, 0.85)", "rgba(153, 102, 255, 0.85)"];
const LINE_CHART_COLORS = ["#0066FF", "#8A2BE2", "#ff8566"];

const CHART_LEGEND_TITLE_COLOR = "rgba(229, 231, 235, 0.95)";

const isClickable = (html: string): boolean => html.includes("clickable");

const stripHtmlTags = (html: string): string => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
};

const getChartOptions = (title: string): ChartOptions<"bar" | "line" | "pie" | "doughnut"> => ({
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
        legend: {
            position: "top" as const,
            labels: {
                color: CHART_LEGEND_TITLE_COLOR,
                font: { size: 12 },
                usePointStyle: true,
                pointStyle: "circle",
                padding: 16,
            },
        },
        title: {
            display: !!title,
            text: title,
            color: CHART_LEGEND_TITLE_COLOR,
            font: { size: 14 },
        },
    },
    scales: {
        x: {
            ticks: { color: CHART_LEGEND_TITLE_COLOR, maxRotation: 45 },
            grid: { color: "rgba(229, 231, 235, 0.2)" },
        },
        y: {
            ticks: { color: CHART_LEGEND_TITLE_COLOR },
            grid: { color: "rgba(229, 231, 235, 0.2)" },
        },
    },
});

const StreamChart: React.FC<{ data: ChartStreamData }> = ({ data }) => {
    const chartType = (data.type || "bar").toLowerCase();
    const labels = data.labels ?? [];
    const datasets = (data.datasets ?? []).map((ds, i) => {
        const isLine = chartType === "line";
        const color = isLine ? LINE_CHART_COLORS[i % LINE_CHART_COLORS.length] : CHART_COLORS[i % CHART_COLORS.length];
        return {
            label: ds.label ?? `데이터 ${i + 1}`,
            data: ds.data ?? [],
            backgroundColor: (ds as { backgroundColor?: string }).backgroundColor ?? color,
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

    const chartData = {
        labels,
        datasets,
    };

    const options = getChartOptions(data.title ?? "");

    if (chartType === "line") {
        return (
            <div className="w-full max-w-md h-64">
                <Line data={chartData} options={options as ChartOptions<"line">} />
            </div>
        );
    }
    if (chartType === "pie") {
        return (
            <div className="w-full max-w-xs h-64 mx-auto">
                <Pie data={chartData} options={options as ChartOptions<"pie">} />
            </div>
        );
    }
    if (chartType === "doughnut") {
        return (
            <div className="w-full max-w-xs h-64 mx-auto">
                <Doughnut data={chartData} options={options as ChartOptions<"doughnut">} />
            </div>
        );
    }
    return (
        <div className="w-full max-w-md h-64">
            <Bar data={chartData} options={options as ChartOptions<"bar">} />
        </div>
    );
};

interface ChartMessageProps {
    message: ChatMessage;
}

export function ChartMessage({ message }: ChartMessageProps) {
    const displayTables = useMemo(() => {
        if (!message.tableData) return null;
        return { ...message.tableData, visibleRows: message.tableData.data?.slice(0, ROW_LIMIT), needsTruncation: (message.tableData.data?.length ?? 0) > ROW_LIMIT, totalRows: message.tableData.data?.length ?? 0, idx: 0 };
    }, [message]);

    if (!message.chartData) return null;

    return (
        <div className="text-sm leading-relaxed text-gray-200 agent-html-content">
            {message.title && <h2 className="text-lg font-bold">{message.title}</h2>}
            {message.title && message.rationale && <br />}
            {message.rationale && <p className="text-md">{message.rationale}</p>}
            {displayTables && (
                <div className="mb-4">
                    <table className="agent-table">
                        <thead>
                            <tr>
                                {displayTables.columns?.map((column, colIdx) => (
                                    <th className="agent-table-header" key={colIdx}>
                                        {column}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {displayTables.visibleRows?.map((row, rowIdx) => (
                                <tr key={rowIdx}>
                                    {row.map((cell, cellIdx) => {
                                        const cellStr = String(cell);
                                        const clickable = isClickable(cellStr);
                                        const text = stripHtmlTags(cellStr);
                                        return (
                                            <td
                                                key={cellIdx}
                                                className={`agent-table-cell ${clickable ? "cursor-pointer hover:text-blue-400 transition-colors font-bold" : ""}`}
                                                onClick={clickable ? () => handleCellClick(cell) : undefined}
                                                role={clickable ? "button" : undefined}
                                                tabIndex={clickable ? 0 : undefined}
                                                onKeyDown={clickable ? (e) => e.key === "Enter" && handleCellClick(cell) : undefined}
                                                aria-label={clickable ? `위치 보기: ${text}` : undefined}>
                                                {text}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {displayTables.needsTruncation && (
                        <div className="flex flex-col items-center py-2 text-gray-400 select-none text-lg leading-tight">
                            <span>⦁</span>
                            <span>⦁</span>
                            <span>⦁</span>
                        </div>
                    )}
                </div>
            )}
            <div className="rounded-lg border border-[#31353a] bg-white/10 p-3 overflow-hidden">
                <StreamChart data={message.chartData} />
            </div>
            <div className="text-md text-gray-200 mt-2">{message.tableData?.meta?.criteria}</div>
            <div className="text-md text-gray-200 mt-2">{message.tableData?.meta?.guide}</div>
            <div className="text-xs text-gray-200 mt-2">{message.disclaimer ?? ""}</div>
            <div className="text-md text-gray-200 mt-2">{message.timestamp}</div>
        </div>
    );
}
