import Markdown from "react-markdown";
import { ChatMessage } from "./AIAgentPopup";
import { CTAActionButtons } from "./CTAActionButtons";

interface NormalMessageProps {
    message: ChatMessage;
    type?: "html" | "markdown";
    onActionClick: (prompt: string) => void;
}

export function NormalMessage({ message, type = "html", onActionClick }: NormalMessageProps) {
    return (
        <>
            {type === "markdown" && message.markdownContent && (
                <div className="text-sm leading-relaxed text-gray-200 mb-3">
                    <Markdown>{message.markdownContent}</Markdown>
                </div>
            )}
            {type === "html" && message.htmlContent && (
                <div className="text-sm leading-relaxed text-gray-200 mb-3">
                    <div dangerouslySetInnerHTML={{ __html: message.htmlContent }} />
                </div>
            )}
            {message.actions && message.actions.length > 0 && (
                <CTAActionButtons actions={message.actions} onActionClick={onActionClick} />
            )}
            {/* <div className="text-xs text-gray-400 mt-2">{message.timestamp}</div> */}
        </>
    );
}
