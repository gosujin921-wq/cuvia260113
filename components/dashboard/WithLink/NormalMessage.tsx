import { ChatMessage } from "./AIAgentPopup";
import { CTAActionButtons } from "./CTAActionButtons";

interface NormalMessageProps {
    message: ChatMessage;
    isLatest?: boolean;
    onActionClick: (prompt: string) => void;
}

export function NormalMessage({ message, isLatest = true, onActionClick }: NormalMessageProps) {
    return (
        <>
            {message.htmlContent && (
                <div className="text-sm leading-relaxed text-gray-200 mb-3">
                    <div dangerouslySetInnerHTML={{ __html: message.htmlContent }} />
                </div>
            )}
            {message.actions && message.actions.length > 0 && (
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
            {/* <div className="text-xs text-gray-400 mt-2">{message.timestamp}</div> */}
        </>
    );
}
