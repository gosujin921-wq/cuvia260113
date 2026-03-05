import Markdown from "react-markdown";
import { ChatMessage } from "./AIAgentPopup";

interface NormalMessageProps {
    message: ChatMessage;
}

export function NormalMessage({ message }: NormalMessageProps) {
    return (
        <>
            {message.htmlContent && (
                <div className="text-sm leading-relaxed text-gray-200 mb-3">
                    <Markdown>{message.htmlContent}</Markdown>
                </div>
            )}
            {/* <div className="text-xs text-gray-400 mt-2">{message.timestamp}</div> */}
        </>
    );
}
