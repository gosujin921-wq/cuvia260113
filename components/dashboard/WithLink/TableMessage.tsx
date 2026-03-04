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
            </div>
            <br />
            <div className="text-xs text-gray-200 mt-2">{message.tableData?.meta?.criteria}</div>
            <div className="text-xs text-gray-200 mt-2">{message.tableData?.meta?.guide}</div>
            <div className="text-xs text-gray-200 mt-2">{message.disclaimer ?? ""}</div>
            <div className="text-xs text-gray-200 mt-2">{message.timestamp}</div>
        </>
    );
}
