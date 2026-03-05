import { ChatMessage } from "./AIAgentPopup";
import { useMemo } from "react";

interface TableMessageProps {
    message: ChatMessage;
    onLocationClick?: (lat: number, lng: number, text: string) => void;
}

const stripHtmlTags = (html: string): string => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
};

const isClickable = (html: string): boolean => html.includes("clickable");

const parseClickableData = (html: string): { lat: number; lng: number } | null => {
    const latMatch = html.match(/data-lat=['"]([^'"]+)['"]/);
    const lngMatch = html.match(/data-lng=['"]([^'"]+)['"]/);
    if (latMatch && lngMatch) {
        return { lat: parseFloat(latMatch[1]), lng: parseFloat(lngMatch[1]) };
    }
    return null;
};

export const ROW_LIMIT = 5;

export function TableMessage({ message, onLocationClick }: TableMessageProps) {
    const displayTables = useMemo(() => {
        if (!message.tableData) return null;
        return { ...message.tableData, visibleRows: message.tableData.data?.slice(0, ROW_LIMIT), needsTruncation: (message.tableData.data?.length ?? 0) > ROW_LIMIT, totalRows: message.tableData.data?.length ?? 0, idx: 0 };
    }, [message]);

    const handleCellClick = (cell: string | number) => {
        const cellStr = String(cell);
        if (!isClickable(cellStr) || !onLocationClick) return;
        const coords = parseClickableData(cellStr);
        if (coords) {
            onLocationClick(coords.lat, coords.lng, stripHtmlTags(cellStr));
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
                                    {displayTables.visibleRows?.map((row, rowIdx) => (
                                        <tr key={rowIdx} style={{ background: rowIdx % 2 === 0 ? "rgba(35,35,42,0.6)" : "rgba(40,40,48,0.6)" }}>
                                            {row.map((cell, cellIdx) => {
                                                const cellStr = String(cell);
                                                const clickable = isClickable(cellStr);
                                                const text = stripHtmlTags(cellStr);
                                                return (
                                                    <td
                                                        key={cellIdx}
                                                        className={`px-3 py-2 text-gray-300 font-medium`}
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
                        </div>
                        {displayTables.needsTruncation && (
                            <div className="flex flex-col items-center py-2 text-gray-400 select-none text-lg leading-tight">
                                <span>⦁</span>
                                <span>⦁</span>
                                <span>⦁</span>
                            </div>
                        )}
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
