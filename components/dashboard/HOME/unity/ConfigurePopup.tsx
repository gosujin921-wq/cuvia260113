import { Icon } from "@iconify/react";
import { useState } from "react";

interface ConfigurePopupProps {
    onClose: () => void;
}

export interface CCTVInfo {
    cctvId: string;
    cctvName: string;
    rtspURL: string;
}

export interface AgentKeyValue {
    id: string;
    key: string;
    value: string;
}

export interface AgentInfo {
    id: string;
    name: string;
    ipAddress: string;
    status: "connected" | "disconnected";
    data: AgentKeyValue[];
}

type TabType = "CCTV" | "Agent";

const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: "CCTV", label: "CCTV", icon: "mdi:cctv" },
    { id: "Agent", label: "Agent", icon: "mdi:robot" },
];

export default function ConfigurePopup({ onClose }: ConfigurePopupProps) {
    const [activeTab, setActiveTab] = useState<TabType>("CCTV");
    const [cctvList] = useState<CCTVInfo[]>([
        { cctvId: "CCTV-V-1", cctvName: "1번 카메라", rtspURL: "rtsp://192.168.1.101:554/stream1" },
        { cctvId: "CCTV-V-2", cctvName: "2번 카메라", rtspURL: "rtsp://192.168.1.102:554/stream1" },
        { cctvId: "CCTV-V-5", cctvName: "5번 카메라", rtspURL: "rtsp://192.168.1.105:554/stream1" },
        { cctvId: "CCTV-V-6", cctvName: "6번 카메라", rtspURL: "rtsp://192.168.1.106:554/stream1" },
        { cctvId: "CCTV-V-7", cctvName: "7번 카메라", rtspURL: "rtsp://192.168.1.107:554/stream1" },
        { cctvId: "CCTV-V-8", cctvName: "8번 카메라", rtspURL: "rtsp://192.168.1.108:554/stream1" },
        { cctvId: "CCTV-V-9", cctvName: "9번 카메라", rtspURL: "rtsp://192.168.1.109:554/stream1" },
        { cctvId: "CCTV-V-10", cctvName: "10번 카메라", rtspURL: "rtsp://192.168.1.110:554/stream1" },
        { cctvId: "CCTV-V-11", cctvName: "11번 카메라 (메인)", rtspURL: "rtsp://192.168.1.111:554/stream1" },
    ]);

    // Agent 관련 상태
    const [agentList, setAgentList] = useState<AgentInfo[]>([
        { id: "agent-1", name: "선별 관제 Agent", ipAddress: "192.168.1.100", status: "connected", data: [] },
        { id: "agent-2", name: "다운로드 Agent", ipAddress: "192.168.1.101", status: "connected", data: [] },
    ]);
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const [isAddingAgent, setIsAddingAgent] = useState(false);
    const [newAgentIp, setNewAgentIp] = useState("");
    const [newAgentName, setNewAgentName] = useState("");

    // 편집 모드 상태
    const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editIp, setEditIp] = useState("");

    // 선택된 Agent 정보
    const selectedAgent = agentList.find((agent) => agent.id === selectedAgentId);

    const handleClickRefresh = () => {
        console.log("카메라 목록 갱신");
    };

    const handleAddAgent = () => {
        if (!newAgentIp.trim()) return;

        const newAgent: AgentInfo = {
            id: `agent-${Date.now()}`,
            name: newAgentName.trim() || `Agent ${agentList.length + 1}`,
            ipAddress: newAgentIp.trim(),
            status: "disconnected",
            data: [],
        };

        setAgentList((prev) => [...prev, newAgent]);
        setNewAgentIp("");
        setNewAgentName("");
        setIsAddingAgent(false);
        setSelectedAgentId(newAgent.id);
    };

    const handleSelectAgent = (agentId: string) => {
        setSelectedAgentId(agentId);
        // 편집 모드 종료
        setEditingAgentId(null);
    };

    const handleDeleteAgent = () => {
        if (!selectedAgentId) return;

        setAgentList((prev) => prev.filter((agent) => agent.id !== selectedAgentId));
        setSelectedAgentId(null);
        setEditingAgentId(null);
    };

    const handleAgentName = (value: string) => {
        setNewAgentName(value);
    };

    const handleAgentIp = (value: string) => {
        setNewAgentIp(value);
    };

    // Agent 편집 모드 시작
    const handleStartEditAgent = (agentId: string) => {
        const agent = agentList.find((a) => a.id === agentId);
        if (agent) {
            setEditingAgentId(agentId);
            setEditName(agent.name);
            setEditIp(agent.ipAddress);
            setSelectedAgentId(agentId);
        }
    };

    // Agent 편집 저장
    const handleSaveEditAgent = () => {
        if (!editingAgentId) return;

        setAgentList((prev) => prev.map((agent) => (agent.id === editingAgentId ? { ...agent, name: editName.trim() || agent.name, ipAddress: editIp.trim() || agent.ipAddress } : agent)));
        setEditingAgentId(null);
    };

    // Agent 편집 취소
    const handleCancelEditAgent = () => {
        setEditingAgentId(null);
        setEditName("");
        setEditIp("");
    };

    // Key-Value 데이터 추가
    const handleAddKeyValue = () => {
        if (!selectedAgentId) return;

        const newKeyValue: AgentKeyValue = {
            id: `kv-${Date.now()}`,
            key: "",
            value: "",
        };

        setAgentList((prev) => prev.map((agent) => (agent.id === selectedAgentId ? { ...agent, data: [...agent.data, newKeyValue] } : agent)));
    };

    const handleSaveKeyValue = () => {
        if (!selectedAgentId) return;

        setAgentList((prev) => prev.map((agent) => (agent.id === selectedAgentId ? { ...agent, data: agent.data.map((kv) => ({ ...kv, id: `kv-${Date.now()}` })) } : agent)));
    };

    // Key-Value 데이터 수정
    const handleUpdateKeyValue = (kvId: string, field: "key" | "value", newValue: string) => {
        if (!selectedAgentId) return;

        setAgentList((prev) =>
            prev.map((agent) =>
                agent.id === selectedAgentId
                    ? {
                          ...agent,
                          data: agent.data.map((kv) => (kv.id === kvId ? { ...kv, [field]: newValue } : kv)),
                      }
                    : agent
            )
        );
    };

    // Key-Value 데이터 삭제
    const handleDeleteKeyValue = (kvId: string) => {
        if (!selectedAgentId) return;

        setAgentList((prev) => prev.map((agent) => (agent.id === selectedAgentId ? { ...agent, data: agent.data.filter((kv) => kv.id !== kvId) } : agent)));
    };

    // 입력 필드에서 키 이벤트가 상위로 전파되지 않도록 방지
    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        e.stopPropagation();
    };

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/50" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-[800px] max-h-[80vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
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
                                        <th className="text-left py-3 px-2 font-semibold text-gray-700">카메라 ID</th>
                                        <th className="text-left py-3 px-2 font-semibold text-gray-700">카메라 이름</th>
                                        <th className="text-left py-3 px-2 font-semibold text-gray-700">RTSP 주소</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cctvList.map((camera) => (
                                        <tr key={camera.cctvId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="py-3 px-2 text-gray-900 font-medium">{camera.cctvId}</td>
                                            <td className="py-3 px-2 text-gray-700">{camera.cctvName}</td>
                                            <td className="py-3 px-2 text-gray-500 font-mono text-xs">{camera.rtspURL}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === "Agent" && (
                        <div className="flex h-[400px]">
                            {/* 좌측: Agent 목록 */}
                            <div className="w-[280px] border-r border-gray-200 flex flex-col">
                                {/* 등록 버튼 */}
                                <div className="p-3 border-b border-gray-100">
                                    <button type="button" onClick={() => setIsAddingAgent(true)} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                                        <Icon icon="mdi:plus" className="w-4 h-4" />
                                        Agent 등록
                                    </button>
                                </div>

                                {/* 등록 폼 */}
                                {isAddingAgent && (
                                    <div className="p-3 border-b border-gray-100 bg-gray-50">
                                        <div className="space-y-2">
                                            <input type="text" placeholder="Agent 이름 (선택)" value={newAgentName} onChange={(e) => handleAgentName(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 text-black" />
                                            <input
                                                type="text"
                                                placeholder="IP 주소 (예: 192.168.1.100)"
                                                value={newAgentIp}
                                                onChange={(e) => handleAgentIp(e.target.value)}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 text-black"
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") handleAddAgent();
                                                }}
                                            />
                                            <div className="flex gap-2">
                                                <button type="button" onClick={handleAddAgent} disabled={!newAgentIp.trim()} className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed">
                                                    등록
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsAddingAgent(false);
                                                        setNewAgentIp("");
                                                        setNewAgentName("");
                                                    }}
                                                    className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-300 transition-colors">
                                                    취소
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Agent 목록 */}
                                <div className="flex-1 overflow-auto">
                                    {agentList.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                            <Icon icon="mdi:robot-off-outline" className="w-10 h-10 mb-2" />
                                            <p className="text-xs">등록된 Agent가 없습니다</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-100">
                                            {agentList.map((agent) => (
                                                <div key={agent.id} className={`w-full px-4 py-3 transition-colors ${selectedAgentId === agent.id ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                                                    {editingAgentId === agent.id ? (
                                                        /* 편집 모드 UI */
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <Icon icon="mdi:robot" className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                                                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={handleInputKeyDown} placeholder="Agent 이름" className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black" autoFocus />
                                                            </div>
                                                            <div className="flex items-center gap-2 pl-7">
                                                                <input type="text" value={editIp} onChange={(e) => setEditIp(e.target.value)} onKeyDown={handleInputKeyDown} placeholder="IP 주소" className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black" />
                                                            </div>
                                                            <div className="flex items-center gap-2 pl-7">
                                                                <button type="button" onClick={handleSaveEditAgent} className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors">
                                                                    저장
                                                                </button>
                                                                <button type="button" onClick={handleCancelEditAgent} className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors">
                                                                    취소
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        /* 일반 모드 UI */
                                                        <div className="flex items-center justify-between">
                                                            <button type="button" onClick={() => handleSelectAgent(agent.id)} className="flex items-center gap-2 flex-1 text-left" aria-label={`${agent.name} 선택`} tabIndex={0}>
                                                                <Icon icon="mdi:robot" className="w-5 h-5 text-gray-500" />
                                                                <div>
                                                                    <p className="text-sm font-medium text-gray-900">{agent.name}</p>
                                                                    <p className="text-xs text-gray-500">{agent.ipAddress}</p>
                                                                </div>
                                                            </button>
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-2 h-2 rounded-full ${agent.status === "connected" ? "bg-green-500" : "bg-gray-300"}`} title={agent.status === "connected" ? "연결됨" : "연결 안됨"} />
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleStartEditAgent(agent.id);
                                                                    }}
                                                                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                                    aria-label={`${agent.name} 수정`}
                                                                    tabIndex={0}>
                                                                    <Icon icon="mdi:pencil" className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 우측: Agent 설정 영역 */}
                            <div className="flex-1 p-6 overflow-auto">
                                {selectedAgent ? (
                                    <div className="space-y-4">
                                        {/* 헤더 */}
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">{selectedAgent.name}</h3>
                                                <p className="text-xs text-gray-500">{selectedAgent.ipAddress}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${selectedAgent.status === "connected" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${selectedAgent.status === "connected" ? "bg-green-500" : "bg-gray-400"}`} />
                                                    {selectedAgent.status === "connected" ? "연결됨" : "연결 안됨"}
                                                </div>
                                                <button type="button" onClick={handleDeleteAgent} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" aria-label="Agent 삭제" tabIndex={0}>
                                                    <Icon icon="mdi:delete" className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Key-Value 데이터 섹션 */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium text-gray-700">설정 데이터</p>
                                                <span className="flex items-center gap-1">
                                                    <button type="button" onClick={handleAddKeyValue} className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" aria-label="데이터 추가" tabIndex={0}>
                                                        <Icon icon="mdi:plus" className="w-4 h-4" />
                                                        추가
                                                    </button>
                                                    <button type="button" onClick={handleSaveKeyValue} className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" aria-label="데이터 저장" tabIndex={0}>
                                                        <Icon icon="mdi:file" className="w-4 h-4" />
                                                        저장
                                                    </button>
                                                </span>
                                            </div>

                                            {/* Key-Value 목록 */}
                                            {selectedAgent.data.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-8 text-gray-400 border border-dashed border-gray-200 rounded-lg">
                                                    <Icon icon="mdi:database-off-outline" className="w-8 h-8 mb-2" />
                                                    <p className="text-xs">등록된 데이터가 없습니다</p>
                                                    <button type="button" onClick={handleAddKeyValue} className="mt-2 text-xs text-blue-600 hover:underline">
                                                        데이터 추가하기
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {selectedAgent.data.map((kv) => (
                                                        <div key={kv.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                                            <input type="text" placeholder="Key" value={kv.key} onChange={(e) => handleUpdateKeyValue(kv.id, "key", e.target.value)} onKeyDown={handleInputKeyDown} className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black" />
                                                            <span className="text-gray-400">:</span>
                                                            <input type="text" placeholder="Value" value={kv.value} onChange={(e) => handleUpdateKeyValue(kv.id, "value", e.target.value)} onKeyDown={handleInputKeyDown} className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black" />
                                                            <button type="button" onClick={() => handleDeleteKeyValue(kv.id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" aria-label="데이터 삭제" tabIndex={0}>
                                                                <Icon icon="mdi:close" className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                        <Icon icon="mdi:cursor-default-click-outline" className="w-12 h-12 mb-3" />
                                        <p className="text-sm">좌측에서 Agent를 선택하세요</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
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
