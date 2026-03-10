import { useState } from "react";
import { Icon } from "@iconify/react";

export interface ActionOption {
    label: string;
    query: string;
}

export interface CTAAction {
    label: string;
    action: "send_query" | "show_modal" | "open_url";
    query: string;
    payload: {
        title?: string;
        options?: ActionOption[];
        url?: string;
    };
}

interface ModalState {
    title: string;
    options: ActionOption[];
}

interface CTAActionButtonsProps {
    actions: unknown[];
    onActionClick: (prompt: string) => void;
}

export function CTAActionButtons({ actions, onActionClick }: CTAActionButtonsProps) {
    const [modal, setModal] = useState<ModalState | null>(null);

    const handleClick = (action: CTAAction) => {
        switch (action.action) {
            case "send_query":
                onActionClick(action.query);
                break;
            case "show_modal":
                setModal({
                    title: action.payload.title ?? "",
                    options: action.payload.options ?? [],
                });
                break;
            case "open_url":
                if (action.payload.url) {
                    window.open(action.payload.url, "_blank");
                }
                break;
        }
    };

    const handleModalSelect = (option: ActionOption) => {
        setModal(null);
        onActionClick(option.query);
    };

    return (
        <>
            <div className="flex gap-2 flex-wrap text-sm leading-relaxed text-gray-200 mt-3">
                {actions.map((action, index) => {
                    const a = action as CTAAction;
                    const isModal = a.action === "show_modal";
                    return (
                        <button
                            key={index}
                            className="flex items-center gap-1.5 rounded-lg px-3 py-2 cursor-pointer transition-colors hover:bg-[#16161a]!"
                            style={{
                                background: isModal ? "rgba(40,40,55,0.7)" : "rgba(50,50,58,0.6)",
                                border: isModal ? "1px solid rgba(138,43,226,0.4)" : "1px solid rgba(255,255,255,0.1)",
                            }}
                            onClick={() => handleClick(a)}>
                            {isModal && <Icon icon="mdi:chevron-down" className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />}
                            {a.label}
                        </button>
                    );
                })}
            </div>

            {modal && (
                <div className="absolute inset-0 z-[999] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }} onClick={() => setModal(null)}>
                    <div
                        className="relative rounded-2xl p-5 min-w-[260px] max-w-[320px] w-full shadow-2xl"
                        style={{
                            background: "linear-gradient(135deg, rgba(18,18,28,0.97) 0%, rgba(28,28,40,0.97) 100%)",
                            border: "1px solid rgba(255,255,255,0.12)",
                            backdropFilter: "blur(12px)",
                        }}
                        onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-semibold text-white">{modal.title}</p>
                            <button
                                type="button"
                                onClick={() => setModal(null)}
                                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white rounded-md transition-colors">
                                <Icon icon="mdi:close" className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex flex-col gap-2">
                            {modal.options.map((opt, i) => (
                                <button
                                    key={i}
                                    className="w-full text-left text-sm text-gray-200 px-3 py-2.5 rounded-lg transition-colors hover:bg-white/10 cursor-pointer"
                                    style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                                    onClick={() => handleModalSelect(opt)}>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
