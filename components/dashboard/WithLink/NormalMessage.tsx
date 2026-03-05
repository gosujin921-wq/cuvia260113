import Markdown from "react-markdown";
import { ChatMessage } from "./AIAgentPopup";

interface NormalMessageProps {
    message: ChatMessage;
    onActionClick: (prompt: string) => void;
}

export function NormalMessage({ message, onActionClick }: NormalMessageProps) {
    const handleClickAction = (action: unknown) => {
        const actionData = action as { label: string; action: string; payload: { query: string } };
        onActionClick(actionData.payload.query);
    };
    return (
        <>
            {message.htmlContent && (
                <div className="text-sm leading-relaxed text-gray-200 mb-3">
                    <Markdown>{message.htmlContent}</Markdown>
                </div>
            )}
            {message.actions && (
                <div className="flex gap-4 flex-wrap text-sm leading-relaxed text-gray-200 mb-3">
                    {message.actions.map((action, index) => (
                        <button
                            className="mt-0 rounded-lg px-3 py-2.5 cursor-pointer hover:bg-[#16161a]!"
                            style={{
                                background: "rgba(50,50,58,0.6)",
                                border: "1px solid rgba(255,255,255,0.1)",
                            }}
                            onClick={() => handleClickAction(action)}
                            key={index}>
                            {(action as { label: string; action: string; payload: { query: string } }).label}
                        </button>
                    ))}
                </div>
            )}
            {/* <div className="text-xs text-gray-400 mt-2">{message.timestamp}</div> */}
        </>
    );
}
