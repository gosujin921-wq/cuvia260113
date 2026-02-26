import PropagationLeftMenu from "./PropagationLeftMenu";
import PropagationModal from "./PropagationModal";
import { VlmAnalysisResult } from "./UnityAIAgentPopup";
import { EventType } from "@/src/apis/event/types";

interface Props {
    vlmAnalysisResult: VlmAnalysisResult;
    propagationTime: Date;
    eventType: EventType;
    onClose: () => void;
}

export default function Propagation({ eventType, vlmAnalysisResult, propagationTime, onClose }: Props) {
    return (
        <div>
            <div className={`absolute left-0 top-0 bottom-0 transition-all duration-500 ease-out translate-x-0 opacity-100"`} style={{ zIndex: 100001 }}>
                <PropagationLeftMenu />
            </div>
            <PropagationModal isVisible={true} onClose={onClose} eventType={eventType} vlmAnalysisResult={vlmAnalysisResult} propagationTime={propagationTime} />
        </div>
    );
}
