import { ChartStreamData } from "@/types/streamJson.types";
import { ChatMessage } from "./AIAgentPopup";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from "chart.js";
import { ChartDoughnut } from "@/components/chart/ChartDoughnut";
import { ROW_LIMIT } from "./TableMessage";
import { useMemo } from "react";
import { ChartLine } from "@/components/chart/ChartLine";
import { ChartPie } from "@/components/chart/ChartPie";
import { ChartBar } from "@/components/chart/ChartBar";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

const isClickable = (html: string): boolean => html.includes("clickable");

const stripHtmlTags = (html: string): string => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
};

const StreamChart: React.FC<{ data: ChartStreamData }> = ({ data }) => {
    const chartType = (data.type || "bar").toLowerCase();

    if (chartType === "line") {
        return (
            <div className="h-[220px] w-full mt-6">
                <ChartLine data={data} />
            </div>
        );
    }
    if (chartType === "pie") {
        return (
            <div className="h-[220px] w-full mt-6">
                <ChartPie data={data} />
            </div>
        );
    }
    if (chartType === "doughnut") {
        return (
            <div className="h-[240px] w-full mt-6">
                <ChartDoughnut data={data} />
            </div>
        );
    }
    return (
        <div className="h-[240px] w-full mt-6">
            <ChartBar data={data} />
        </div>
    );
};

interface ChartMessageProps {
    message: ChatMessage;
}

export function ChartMessage({ message }: ChartMessageProps) {
    const displayTables = useMemo(() => {
        if (!message.tableData) return null;
        const totalRows = message.tableData.total_count ?? 0;
        const visibleRows = message.tableData.data?.slice(0, ROW_LIMIT) ?? [];
        const needsTruncation = totalRows > ROW_LIMIT;
        const remainingCount = needsTruncation ? totalRows - ROW_LIMIT : 0;
        return { ...message.tableData, visibleRows, needsTruncation, totalRows, remainingCount, idx: 0 };
    }, [message]);

    if (!message.chartData) return null;

    return (
        <div className="text-sm leading-relaxed text-gray-200">
            {message.title && (
                <div
                    className="rounded-lg px-4 py-2.5 text-center text-white text-sm font-medium"
                    style={{
                        background: "rgba(30,30,35,0.8)",
                        backdropFilter: "blur(4px)",
                        border: "1px solid rgba(255,255,255,0.08)",
                    }}>
                    {message.title}
                </div>
            )}
            {message.title && message.rationale && <br />}
            {message.rationale && <p className="text-sm text-gray-200 leading-relaxed mb-3">{message.rationale}</p>}
            {displayTables && (
                <>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">표 데이터</h3>
                    <div className="rounded-lg overflow-hidden mt-4" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                        <table className="w-full text-sm">
                            <thead>
                                <tr style={{ background: "rgba(40,40,48,0.9)" }}>
                                    {displayTables.columns?.map((column, colIdx) => (
                                        <th className="px-3 py-2.5 text-left text-white font-semibold" key={colIdx}>
                                            {column}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {displayTables.visibleRows?.map((row, rowIdx) => (
                                    <tr key={rowIdx} style={{ background: rowIdx % 2 === 0 ? "rgba(35,35,42,0.6)" : "rgba(40,40,48,0.6)" }}>
                                        {row.map((cell, cellIdx) => {
                                            const cellStr = String(cell);
                                            const clickable = isClickable(cellStr);
                                            const text = stripHtmlTags(cellStr);
                                            return (
                                                <td key={cellIdx} className={`px-3 py-2 text-gray-300 font-medium`} onClick={clickable ? () => handleCellClick(cell) : undefined} role={clickable ? "button" : undefined} tabIndex={clickable ? 0 : undefined} onKeyDown={clickable ? (e) => e.key === "Enter" && handleCellClick(cell) : undefined} aria-label={clickable ? `위치 보기: ${text}` : undefined}>
                                                    {text}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {displayTables.remainingCount > 0 && (
                        <p className="text-sm text-gray-400 py-2">
                            ... {displayTables.remainingCount}건 더 있음
                        </p>
                    )}
                </>
            )}
            <div className="rounded-lg overflow-hidden mt-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">차트 데이터</h3>
                <StreamChart data={message.chartData} />
            </div>
            <br />
            {message.tableData && message.tableData.meta && (
                <div
                    className="mt-0 rounded-lg px-3 py-2.5"
                    style={{
                        background: "rgba(50,50,58,0.6)",
                        border: "1px solid rgba(255,255,255,0.1)",
                    }}>
                    <p className="text-sm text-white font-medium">{message.tableData?.meta?.criteria}</p>
                    <p className="text-sm text-gray-300 mt-1">{message.tableData?.meta?.guide}</p>
                </div>
            )}
            {message.disclaimer && (
                <>
                    <hr className="border-t border-[#40424a] my-6" role="separator" />
                    <p className="text-xs text-gray-400 text-center">{message.disclaimer}</p>
                </>
            )}
        </div>
    );
}
