import { ChatMessage } from "./AIAgentPopup";
import { useMemo } from "react";

interface TableMessageProps {
    message: ChatMessage;
    onMapLocationRequest?: (lat: number, lng: number) => void;
}

export const stripHtmlTags = (html: string): string => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
};

export const ROW_LIMIT = 5;

export function TableMessage({ message, onMapLocationRequest }: TableMessageProps) {
    const displayTables = useMemo(() => {
        if (!message.tableData) return null;
        const totalRows = message.tableData.total_count ?? 0;
        const visibleRows = message.tableData.data?.slice(0, ROW_LIMIT) ?? [];
        const needsTruncation = totalRows > ROW_LIMIT;
        const remainingCount = needsTruncation ? totalRows - ROW_LIMIT : 0;
        const extensions = message.tableData.extension ?? [];
        return { ...message.tableData, visibleRows, needsTruncation, totalRows, remainingCount, idx: 0, extensions };
    }, [message]);

    const handleCellClick = (row: Record<string, string | number | boolean>) => {
        if (row.type === "map" && onMapLocationRequest) {
            const lat = typeof row.lat === "number" ? row.lat : Number(row.lat);
            const lng = typeof row.lng === "number" ? row.lng : Number(row.lng);
            if (Number.isFinite(lat) && Number.isFinite(lng)) {
                onMapLocationRequest(lat, lng);
            }
        }
    };

    if (!displayTables) return null;

    return (
        <>
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
                                    {displayTables.visibleRows?.map((row, rowIdx) => {
                                        const isClickable = displayTables.extension?.[rowIdx]?.type !== "text" && displayTables.extension?.[rowIdx]?.clickable;
                                        return (
                                            <tr key={rowIdx} className={`${isClickable ? "cursor-pointer hover:bg-[#393a42]!" : ""}`} style={{ background: rowIdx % 2 === 0 ? "rgba(35,35,42,0.6)" : "rgba(40,40,48,0.6)" }}>
                                                {row.map((cell, cellIdx) => {
                                                    const cellStr = String(cell);
                                                    const text = stripHtmlTags(cellStr);
                                                    const extension = displayTables.extension?.[rowIdx];
                                                    return (
                                                        <td
                                                            key={cellIdx}
                                                            className={`px-3 py-2 text-gray-300 font-medium`}
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
                        {displayTables.remainingCount > 0 && <p className="text-sm text-gray-400 py-2">... {displayTables.remainingCount}건 더 있음</p>}
                    </>
                )}
            </div>
            <br />
            <div
                className="mt-0 rounded-lg px-3 py-2.5"
                style={{
                    background: "rgba(50,50,58,0.6)",
                    border: "1px solid rgba(255,255,255,0.1)",
                }}>
                <p className="text-sm text-white font-medium">{message.tableData?.meta?.criteria}</p>
                <p className="text-sm text-gray-300 mt-1">{message.tableData?.meta?.guide}</p>
            </div>
            {message.disclaimer && (
                <>
                    <hr className="border-t border-[#40424a] my-6" role="separator" />
                    <p className="text-xs text-gray-400 text-center">{message.disclaimer}</p>
                </>
            )}
        </>
    );
}
