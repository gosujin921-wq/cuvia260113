import { Icon } from "@iconify/react";
import { useState } from "react";
import ConfigureAgent from "./ConfigureAgent";
import { CameraListPageData } from "@/src/apis/camera/types";
import { useAssignCamera } from "@/src/apis/camera/hooks";

interface ConfigurePopupProps {
    onClose: () => void;
    availableCCTVs: CameraListPageData[];
    bridgeSlots: BridgeSlot[];
}

// Unity Bridge 슬롯 (CCTV-V-1 ~ CCTV-V-11)
export interface BridgeSlot {
    bridgeId: string;
    assignedCctvId?: string;
    isGrouped: boolean;
    isMain: boolean;
    isRobot: boolean;
}

// 기존 CCTVInfo 호환을 위한 통합 인터페이스
export interface CCTVInfo {
    bridgeId: string;
    camera_id: string;
    camera_name: string;
    rtsp_url: string;
    isGrouped: boolean;
    isMain: boolean;
}

type TabType = "CCTV" | "Agent";

const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: "CCTV", label: "CCTV", icon: "mdi:cctv" },
    { id: "Agent", label: "Agent", icon: "mdi:robot" },
];

export default function ConfigurePopup({ onClose, availableCCTVs, bridgeSlots }: ConfigurePopupProps) {
    const [activeTab, setActiveTab] = useState<TabType>("CCTV");
    const { mutate: assignCamera } = useAssignCamera();
    // 이미 할당된 CCTV 목록 계산 (다른 슬롯에서 사용 중인 CCTV)
    const assignedCctvIds = bridgeSlots.filter((slot) => slot.assignedCctvId).map((slot) => slot.assignedCctvId);

    // Bridge 슬롯에 CCTV 할당 핸들러
    const handleAssignCctv = (bridgeId: string, cctvId: string | undefined) => {
        // 선택된 카메라 정보 가져오기
        const selectedCamera = availableCCTVs.find((cctv) => cctv.camera_id === cctvId);

        assignCamera(
            {
                request: {
                    camera_id: cctvId || "",
                    camera_name: selectedCamera?.camera_name || "",
                },
                bridgeId,
            },
            {
                onError: () => {
                    alert("CCTV 할당에 실패했습니다.");
                },
            }
        );
    };

    // 그룹핑 토글 핸들러 (bridgeId 기준)
    const handleToggleGrouped = (bridgeId: string) => {
        const isGrouped = bridgeSlots.find((slot) => slot.bridgeId === bridgeId)?.isGrouped ? "N" : "Y";
        assignCamera(
            { request: { is_grouped: isGrouped }, bridgeId },
            {
                onError: () => {
                    alert("그룹핑 설정에 실패했습니다.");
                },
            }
        );
    };

    // 메인 카메라 설정 핸들러 (bridgeId 기준, 전체 중 하나만 가능)
    const handleSetMain = (bridgeId: string) => {
        const isMain = bridgeSlots.find((slot) => slot.bridgeId === bridgeId)?.isMain ? "N" : "Y";
        assignCamera(
            { request: { is_main: isMain }, bridgeId },
            {
                onError: () => {
                    alert("메인 카메라 설정에 실패했습니다.");
                },
            }
        );
    };

    const handleSetRobot = (bridgeId: string) => {
        const isRobot = bridgeSlots.find((slot) => slot.bridgeId === bridgeId)?.isRobot ? "N" : "Y";
        assignCamera(
            { request: { is_robot: isRobot }, bridgeId },
            {
                onError: () => {
                    alert("순찰 카메라 설정에 실패했습니다.");
                },
            }
        );
    };

    // bridgeId로 할당된 실제 CCTV 정보 가져오기
    const getAssignedCctv = (bridgeId: string): CameraListPageData | undefined => {
        const slot = bridgeSlots.find((s) => s.bridgeId === bridgeId);
        if (!slot?.assignedCctvId) return undefined;
        return availableCCTVs.find((cctv) => cctv.camera_id === slot.assignedCctvId);
    };

    const handleClickRefresh = () => {
        console.log("카메라 목록 갱신");
    };

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/50" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-[1000px] max-h-[80vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
                {/* 헤더 */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900">설정</h2>
                    <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" aria-label="닫기">
                        <Icon icon="mdi:close" className="w-5 h-5" />
                    </button>
                </div>

                {/* 탭 메뉴 */}
                <div className="flex border-b border-gray-200">
                    {tabs.map((tab) => (
                        <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors relative ${activeTab === tab.id ? "text-blue-600" : "text-gray-500 hover:text-gray-700"}`} aria-label={`${tab.label} 탭`} tabIndex={0}>
                            <Icon icon={tab.icon} className="w-4 h-4" />
                            {tab.label}
                            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
                        </button>
                    ))}
                </div>

                {/* 탭 콘텐츠 */}
                <div className="flex-1 overflow-auto">
                    {activeTab === "CCTV" && (
                        <div className="px-6 py-4">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-2 font-semibold text-gray-700 w-[150px]">Bridge ID</th>
                                        <th className="text-left py-3 px-2 font-semibold text-gray-700 w-[160px]">CCTV 할당</th>
                                        <th className="text-left py-3 px-2 font-semibold text-gray-700">카메라 이름</th>
                                        <th className="text-left py-3 px-2 font-semibold text-gray-700">RTSP 주소</th>
                                        <th className="text-center py-3 px-2 font-semibold text-gray-700 w-[70px]">그룹핑</th>
                                        <th className="text-center py-3 px-2 font-semibold text-gray-700 w-[60px]">메인</th>
                                        <th className="text-center py-3 px-2 font-semibold text-gray-700 w-[60px]">순찰</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bridgeSlots.map((slot) => {
                                        const assignedCctv = getAssignedCctv(slot.bridgeId);
                                        return (
                                            <tr key={slot.bridgeId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                                <td className="py-3 px-2 text-gray-900 font-medium">{slot.bridgeId}</td>
                                                <td className="py-3 px-2">
                                                    <select
                                                        value={slot.assignedCctvId || ""}
                                                        onChange={(e) => handleAssignCctv(slot.bridgeId, e.target.value || undefined)}
                                                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer text-gray-700"
                                                        aria-label={`${slot.bridgeId} CCTV 할당`}>
                                                        <option value="">미할당</option>
                                                        {availableCCTVs.map((cctv) => {
                                                            const isAssignedToOther = assignedCctvIds.includes(cctv.camera_id) && slot.assignedCctvId !== cctv.camera_id;
                                                            return (
                                                                <option key={cctv.camera_id} value={cctv.camera_id} disabled={isAssignedToOther}>
                                                                    {cctv.camera_id} - {cctv.camera_name}
                                                                    {isAssignedToOther ? " (사용 중)" : ""}
                                                                </option>
                                                            );
                                                        })}
                                                    </select>
                                                </td>
                                                <td className="py-3 px-2 text-gray-700">{assignedCctv?.camera_name || <span className="text-gray-400">-</span>}</td>
                                                <td className="py-3 px-2 text-gray-500 font-mono text-xs">{assignedCctv ? assignedCctv.rtsp_url : <span className="text-gray-400">-</span>}</td>
                                                <td className="py-3 px-2 text-center">
                                                    <input type="checkbox" checked={slot.isGrouped} onChange={() => handleToggleGrouped(slot.bridgeId)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer" aria-label={`${slot.bridgeId} 그룹핑`} />
                                                </td>
                                                <td className="py-3 px-2 text-center">
                                                    <input type="radio" name="mainCamera" checked={slot.isMain} onChange={() => handleSetMain(slot.bridgeId)} className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer" aria-label={`${slot.bridgeId} 메인 카메라로 설정`} />
                                                </td>
                                                <td className="py-3 px-2 text-center">
                                                    <input type="radio" name="robotCamera" checked={slot.isRobot} onChange={() => handleSetRobot(slot.bridgeId)} className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer" aria-label={`${slot.bridgeId} 순찰 카메라로 설정`} />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === "Agent" && <ConfigureAgent />}
                </div>

                {/* 푸터 - 갱신 버튼 (CCTV 탭에서만 표시) */}
                {activeTab === "CCTV" && (
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <button type="button" onClick={handleClickRefresh} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                            <Icon icon="mdi:refresh" className="w-4 h-4" />
                            카메라 갱신
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
