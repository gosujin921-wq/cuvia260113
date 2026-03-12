import { ChatMessage } from "./AIAgentPopup";
import { useMemo } from "react";
import { CTAActionButtons } from "./CTAActionButtons";

interface TableMessageProps {
    message: ChatMessage;
    isLatest?: boolean;
    onMapLocationRequest?: (lat: number, lng: number) => void;
    flyToLocation?: [number, number] | null;
    isMapMoving?: boolean;
    onActionClick?: (prompt: string) => void;
}

export const stripHtmlTags = (html: string): string => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
};

export const ROW_LIMIT = 5;

export function TableMessage({ message, isLatest = true, onMapLocationRequest, flyToLocation, isMapMoving, onActionClick }: TableMessageProps) {
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
        <div>
            <div className={`text-sm leading-relaxed text-gray-200${!isLatest ? " select-none" : ""}`}>
                {message.title && (
                    <div
                        className="rounded-lg px-4 py-2.5 text-center text-white text-sm font-medium"
                        style={{
                            background: "rgba(30,30,35,0.8)",
                            backdropFilter: "blur(4px)",
                            border: "1px solid rgba(255,255,255,0.08)",
                        }}>
                        {message.tableData?.title || message.title || ""}
                    </div>
                )}
                {message.title && message.rationale && <br />}
                {message.rationale && <p className="text-sm text-gray-200 leading-relaxed mb-3">{message.rationale}</p>}
                <div dangerouslySetInnerHTML={{ __html: message?.htmlContent ?? "" }} />
                {displayTables && (
                    <>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">{message.tableData?.title ?? "표 데이터"}</h3>
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
                                        const isClickable = isLatest && !isMapMoving && displayTables.extension?.[rowIdx]?.type !== "text" && displayTables.extension?.[rowIdx]?.clickable;
                                        const ext = displayTables.extension?.[rowIdx];
                                        const isHighlighted = (() => {
                                            if (!flyToLocation || !ext || !isLatest) return false;
                                            const extLat = typeof ext.lat === "number" ? ext.lat : Number(ext.lat);
                                            const extLng = typeof ext.lng === "number" ? ext.lng : Number(ext.lng);
                                            if (!Number.isFinite(extLat) || !Number.isFinite(extLng)) return false;
                                            return Math.abs(flyToLocation[0] - extLng) < 0.0001 && Math.abs(flyToLocation[1] - extLat) < 0.0001;
                                        })();
                                        const rowBg = isHighlighted ? "rgba(239, 68, 68, 0.15)" : rowIdx % 2 === 0 ? "rgba(35,35,42,0.6)" : "rgba(40,40,48,0.6)";
                                        return (
                                            <tr
                                                key={rowIdx}
                                                className={`transition-colors duration-200 ${isClickable ? "cursor-pointer hover:bg-[#393a42]!" : "cursor-default"}`}
                                                style={{
                                                    background: rowBg,
                                                    borderLeft: isHighlighted ? "2px solid #ef4444" : "2px solid transparent",
                                                }}>
                                                {row.map((cell, cellIdx) => {
                                                    const cellStr = String(cell);
                                                    const text = stripHtmlTags(cellStr);
                                                    const extension = displayTables.extension?.[rowIdx];
                                                    return (
                                                        <td
                                                            key={cellIdx}
                                                            className={`px-3 py-2 font-medium ${isHighlighted ? "text-white" : "text-gray-300"}`}
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
            {message.actions && message.actions.length > 0 && onActionClick && (
                <div className={!isLatest ? "pointer-events-none select-none" : undefined}>
                    <CTAActionButtons actions={message.actions} onActionClick={onActionClick} />
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
