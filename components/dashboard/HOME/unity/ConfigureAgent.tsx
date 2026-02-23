import { useAddAgent, useDeleteAgent, useGetAgentList, useUpdateAgent } from "@/src/apis/agent/hooks";
import { AgentAddRequest, AgentDeleteRequest, AgentListPageData, AgentUpdateRequest } from "@/src/apis/agent/types";
import { Icon } from "@iconify/react";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

// 에이전트 타입 정의
export type AgentType = "media" | "selective" | "download" | "stun-turn";

export const AGENT_TYPE_OPTIONS: { value: AgentType; label: string; apiValue: 1 | 2 | 3 | 4 }[] = [
    { value: "media", label: "미디어 에이전트", apiValue: 1 },
    { value: "selective", label: "선별 관제 에이전트", apiValue: 2 },
    { value: "download", label: "다운로드 에이전트", apiValue: 3 },
    { value: "stun-turn", label: "STUN/TURN 서버", apiValue: 4 },
];

// API 타입을 UI 타입으로 변환
const apiTypeToAgentType = (apiType: 1 | 2 | 3 | 4): AgentType => {
    const option = AGENT_TYPE_OPTIONS.find((o) => o.apiValue === apiType);
    return option?.value || "media";
};

// UI 타입을 API 타입으로 변환
const agentTypeToApiType = (agentType: AgentType): 1 | 2 | 3 | 4 => {
    const option = AGENT_TYPE_OPTIONS.find((o) => o.value === agentType);
    return option?.apiValue || 1;
};

export default function ConfigureAgent() {
    const queryClient = useQueryClient();
    const { data: agentListData, isLoading } = useGetAgentList(-1, 100, "", "");
    const { mutate: addAgent } = useAddAgent();
    const { mutate: updateAgent } = useUpdateAgent();
    const { mutate: deleteAgent } = useDeleteAgent();

    // agentListData를 UI에서 사용하기 편한 형태로 변환
    const agentList = useMemo(() => {
        if (!agentListData?.page_data) return [];
        return agentListData.page_data;
    }, [agentListData]);

    const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
    const [isAddingAgent, setIsAddingAgent] = useState(false);
    const [newAgentIp, setNewAgentIp] = useState("");
    const [newAgentPort, setNewAgentPort] = useState("");
    const [newAgentName, setNewAgentName] = useState("");
    const [newAgentType, setNewAgentType] = useState<AgentType>("media");
    const [newStunTurnConfig, setNewStunTurnConfig] = useState({
        protocol: "stun" as "stun" | "turn",
        priority: 1,
        username: "",
        credential: "",
    });

    // 편집 모드 상태
    const [editingAgentId, setEditingAgentId] = useState<number | null>(null);
    const [editName, setEditName] = useState("");
    const [editIp, setEditIp] = useState("");
    const [editPort, setEditPort] = useState("");
    const [editAgentType, setEditAgentType] = useState<AgentType>("media");
    const [editIsEnabled, setEditIsEnabled] = useState(true);
    const [editStunTurnConfig, setEditStunTurnConfig] = useState({
        protocol: "stun" as "stun" | "turn",
        priority: 1,
        username: "",
        credential: "",
    });

    // Key-Value 데이터 상태 (Agent별로 관리)
    const [agentKeyValues, setAgentKeyValues] = useState<Record<number, { key: string; value: string }[]>>({});
    const [newKeyInput, setNewKeyInput] = useState("");
    const [newValueInput, setNewValueInput] = useState("");
    const [editingKvIndex, setEditingKvIndex] = useState<number | null>(null);
    const [editKvKey, setEditKvKey] = useState("");
    const [editKvValue, setEditKvValue] = useState("");

    const selectedAgent = agentList.find((agent) => agent.agent_id === selectedAgentId);
    const selectedAgentKeyValues = selectedAgentId !== null ? agentKeyValues[selectedAgentId] || [] : [];

    const invalidateAgentList = () => {
        queryClient.invalidateQueries({ queryKey: ["agentList"] });
    };

    const handleAddAgent = () => {
        if (!newAgentIp.trim()) return;

        const portNumber = parseInt(newAgentPort) || 5060;

        const newAgent: AgentAddRequest = {
            agent_type: agentTypeToApiType(newAgentType),
            agent_ip: newAgentIp.trim(),
            agent_port: portNumber,
            agent_name: newAgentName.trim() || `Agent ${agentList.length + 1}`,
            is_used: 1,
            ...(newAgentType === "stun-turn" && {
                protocol: newStunTurnConfig.protocol,
                priority: newStunTurnConfig.priority,
                username: newStunTurnConfig.username,
                credential: newStunTurnConfig.credential,
            }),
        };

        addAgent(newAgent, {
            onSuccess: () => {
                invalidateAgentList();
                setNewAgentIp("");
                setNewAgentPort("");
                setNewAgentName("");
                setNewAgentType("media");
                setNewStunTurnConfig({ protocol: "stun", priority: 1, username: "", credential: "" });
                setIsAddingAgent(false);
            },
        });
    };

    const handleSelectAgent = (agentId: number) => {
        setSelectedAgentId(agentId);
        setEditingAgentId(null);
    };

    const handleDeleteAgent = () => {
        if (selectedAgentId === null) return;

        const payload: AgentDeleteRequest = {
            agent_ids: [selectedAgentId],
        };

        deleteAgent(payload, {
            onSuccess: () => {
                invalidateAgentList();
                setSelectedAgentId(null);
                setEditingAgentId(null);
            },
        });
    };

    const handleStartEditAgent = (agentId: number) => {
        const agent = agentList.find((a) => a.agent_id === agentId);
        if (agent) {
            setEditingAgentId(agentId);
            setEditName(agent.agent_name);
            setEditIp(agent.agent_ip);
            setEditPort(agent.agent_port.toString());
            setEditAgentType(apiTypeToAgentType(agent.agent_type));
            setEditIsEnabled(agent.is_used === 1);
            setEditStunTurnConfig({
                protocol: agent.protocol || "stun",
                priority: agent.priority || 1,
                username: agent.username || "",
                credential: agent.credential || "",
            });
            setSelectedAgentId(agentId);
        }
    };

    const handleSaveEditAgent = () => {
        if (editingAgentId === null) return;

        const agent = agentList.find((a) => a.agent_id === editingAgentId);
        if (!agent) return;

        const portNumber = parseInt(editPort) || 5060;

        const payload: AgentUpdateRequest = {
            agent_id: editingAgentId,
            agent_type: agentTypeToApiType(editAgentType),
            agent_ip: editIp.trim() || agent.agent_ip,
            agent_port: portNumber,
            agent_name: editName.trim() || agent.agent_name,
            is_used: editIsEnabled ? 1 : 0,
            ...(editAgentType === "stun-turn" && {
                protocol: editStunTurnConfig.protocol,
                priority: editStunTurnConfig.priority,
                username: editStunTurnConfig.username,
                credential: editStunTurnConfig.credential,
            }),
        };

        updateAgent(payload, {
            onSuccess: () => {
                invalidateAgentList();
                setEditingAgentId(null);
            },
        });
    };

    const handleCancelEditAgent = () => {
        setEditingAgentId(null);
        setEditName("");
        setEditIp("");
        setEditPort("5060");
        setEditAgentType("media");
        setEditIsEnabled(true);
        setEditStunTurnConfig({ protocol: "stun", priority: 1, username: "", credential: "" });
    };

    const handleToggleEnabled = (agent: AgentListPageData) => {
        const payload: AgentUpdateRequest = {
            agent_id: agent.agent_id,
            agent_type: agent.agent_type,
            agent_ip: agent.agent_ip,
            agent_port: agent.agent_port,
            agent_name: agent.agent_name,
            is_used: agent.is_used === 1 ? 0 : 1,
            protocol: agent.protocol,
            priority: agent.priority,
            username: agent.username,
            credential: agent.credential,
        };

        updateAgent(payload, {
            onSuccess: () => {
                invalidateAgentList();
            },
        });
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
        e.stopPropagation();
    };

    // Key-Value 핸들러
    const handleAddKeyValue = () => {
        if (!newKeyInput.trim() || selectedAgentId === null) return;

        setAgentKeyValues((prev) => ({
            ...prev,
            [selectedAgentId]: [...(prev[selectedAgentId] || []), { key: newKeyInput.trim(), value: newValueInput.trim() }],
        }));
        setNewKeyInput("");
        setNewValueInput("");
    };

    const handleDeleteKeyValue = (index: number) => {
        if (selectedAgentId === null) return;

        setAgentKeyValues((prev) => ({
            ...prev,
            [selectedAgentId]: prev[selectedAgentId]?.filter((_, i) => i !== index) || [],
        }));
    };

    const handleStartEditKeyValue = (index: number) => {
        if (selectedAgentId === null) return;

        const kv = selectedAgentKeyValues[index];
        if (kv) {
            setEditingKvIndex(index);
            setEditKvKey(kv.key);
            setEditKvValue(kv.value);
        }
    };

    const handleSaveEditKeyValue = () => {
        if (selectedAgentId === null || editingKvIndex === null) return;

        setAgentKeyValues((prev) => ({
            ...prev,
            [selectedAgentId]: prev[selectedAgentId]?.map((kv, i) => (i === editingKvIndex ? { key: editKvKey.trim(), value: editKvValue.trim() } : kv)) || [],
        }));
        setEditingKvIndex(null);
        setEditKvKey("");
        setEditKvValue("");
    };

    const handleCancelEditKeyValue = () => {
        setEditingKvIndex(null);
        setEditKvKey("");
        setEditKvValue("");
    };

    // 에이전트 타입별 배지 스타일
    const getAgentTypeBadgeStyle = (agentType: AgentType) => {
        switch (agentType) {
            case "media":
                return "bg-purple-100 text-purple-700";
            case "selective":
                return "bg-blue-100 text-blue-700";
            case "download":
                return "bg-green-100 text-green-700";
            case "stun-turn":
                return "bg-orange-100 text-orange-700";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    return (
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
                            <select value={newAgentType} onChange={(e) => setNewAgentType(e.target.value as AgentType)} onKeyDown={handleInputKeyDown} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white">
                                {AGENT_TYPE_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            <input type="text" placeholder="Agent 이름 (선택)" value={newAgentName} onChange={(e) => setNewAgentName(e.target.value)} onKeyDown={handleInputKeyDown} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 text-black" />
                            <div className="flex gap-2">
                                <input type="text" placeholder="IP 주소" value={newAgentIp} onChange={(e) => setNewAgentIp(e.target.value)} onKeyDown={handleInputKeyDown} className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 text-black" />
                                <input type="number" placeholder="포트" value={newAgentPort} onChange={(e) => setNewAgentPort(e.target.value)} onKeyDown={handleInputKeyDown} className="w-20 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 text-black" />
                            </div>

                            {newAgentType === "stun-turn" && (
                                <div className="space-y-2 p-2 bg-white rounded-lg border border-gray-200">
                                    <p className="text-xs font-medium text-gray-600">STUN/TURN 설정</p>
                                    <select value={newStunTurnConfig.protocol} onChange={(e) => setNewStunTurnConfig((prev) => ({ ...prev, protocol: e.target.value as "stun" | "turn" }))} onKeyDown={handleInputKeyDown} className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white">
                                        <option value="stun">STUN</option>
                                        <option value="turn">TURN</option>
                                    </select>
                                    <input type="number" placeholder="Priority (1~100)" value={newStunTurnConfig.priority} onChange={(e) => setNewStunTurnConfig((prev) => ({ ...prev, priority: parseInt(e.target.value) || 1 }))} onKeyDown={handleInputKeyDown} className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" />
                                    <input type="text" placeholder="Username" value={newStunTurnConfig.username} onChange={(e) => setNewStunTurnConfig((prev) => ({ ...prev, username: e.target.value }))} onKeyDown={handleInputKeyDown} className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" />
                                    <input type="password" placeholder="Credential" value={newStunTurnConfig.credential} onChange={(e) => setNewStunTurnConfig((prev) => ({ ...prev, credential: e.target.value }))} onKeyDown={handleInputKeyDown} className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" />
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button type="button" onClick={handleAddAgent} disabled={!newAgentIp.trim()} className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed">
                                    등록
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAddingAgent(false);
                                        setNewAgentIp("");
                                        setNewAgentPort("");
                                        setNewAgentName("");
                                        setNewAgentType("media");
                                        setNewStunTurnConfig({ protocol: "stun", priority: 1, username: "", credential: "" });
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
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <Icon icon="mdi:loading" className="w-8 h-8 animate-spin mb-2" />
                            <p className="text-xs">로딩 중...</p>
                        </div>
                    ) : agentList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <Icon icon="mdi:robot-off-outline" className="w-10 h-10 mb-2" />
                            <p className="text-xs">등록된 Agent가 없습니다</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {agentList.map((agent) => {
                                const agentType = apiTypeToAgentType(agent.agent_type);
                                return (
                                    <div key={agent.agent_id} className={`w-full px-4 py-3 transition-colors ${selectedAgentId === agent.agent_id ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                                        {editingAgentId === agent.agent_id ? (
                                            /* 편집 모드 UI */
                                            <div className="space-y-2">
                                                <select value={editAgentType} onChange={(e) => setEditAgentType(e.target.value as AgentType)} onKeyDown={handleInputKeyDown} className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white">
                                                    {AGENT_TYPE_OPTIONS.map((opt) => (
                                                        <option key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="flex items-center gap-2">
                                                    <Icon icon="mdi:robot" className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={handleInputKeyDown} placeholder="Agent 이름" className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black" autoFocus />
                                                </div>
                                                <div className="flex items-center gap-2 pl-7">
                                                    <input type="text" value={editIp} onChange={(e) => setEditIp(e.target.value)} onKeyDown={handleInputKeyDown} placeholder="IP 주소" className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black" />
                                                    <input type="number" value={editPort} onChange={(e) => setEditPort(e.target.value)} onKeyDown={handleInputKeyDown} placeholder="포트" className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black" />
                                                </div>
                                                {editAgentType === "stun-turn" && (
                                                    <div className="space-y-1.5 pl-7">
                                                        <select value={editStunTurnConfig.protocol} onChange={(e) => setEditStunTurnConfig((prev) => ({ ...prev, protocol: e.target.value as "stun" | "turn" }))} onKeyDown={handleInputKeyDown} className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white">
                                                            <option value="stun">STUN</option>
                                                            <option value="turn">TURN</option>
                                                        </select>
                                                        <input
                                                            type="number"
                                                            placeholder="Priority"
                                                            value={editStunTurnConfig.priority}
                                                            onChange={(e) => setEditStunTurnConfig((prev) => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                                                            onKeyDown={handleInputKeyDown}
                                                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                                                        />
                                                        <input type="text" placeholder="Username" value={editStunTurnConfig.username} onChange={(e) => setEditStunTurnConfig((prev) => ({ ...prev, username: e.target.value }))} onKeyDown={handleInputKeyDown} className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" />
                                                        <input type="password" placeholder="Credential" value={editStunTurnConfig.credential} onChange={(e) => setEditStunTurnConfig((prev) => ({ ...prev, credential: e.target.value }))} onKeyDown={handleInputKeyDown} className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" />
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 pl-7">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input type="checkbox" checked={editIsEnabled} onChange={(e) => setEditIsEnabled(e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                                                        <span className="text-xs text-gray-600">사용</span>
                                                    </label>
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
                                                <button type="button" onClick={() => handleSelectAgent(agent.agent_id)} className="flex items-center gap-2 flex-1 text-left" aria-label={`${agent.agent_name} 선택`} tabIndex={0}>
                                                    <Icon icon="mdi:robot" className="w-5 h-5 text-gray-500" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-medium text-gray-900 truncate">{agent.agent_name}</p>
                                                            <span className={`flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded ${getAgentTypeBadgeStyle(agentType)}`}>
                                                                {AGENT_TYPE_OPTIONS.find((o) => o.value === agentType)
                                                                    ?.label.replace(" 에이전트", "")
                                                                    .replace(" 서버", "") || agentType}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500">
                                                            {agent.agent_ip}:{agent.agent_port}
                                                        </p>
                                                    </div>
                                                </button>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleToggleEnabled(agent);
                                                        }}
                                                        className={`w-8 h-4 rounded-full relative transition-colors ${agent.is_used === 1 ? "bg-blue-600" : "bg-gray-300"}`}
                                                        aria-label={`${agent.agent_name} ${agent.is_used === 1 ? "비활성화" : "활성화"}`}
                                                        tabIndex={0}>
                                                        <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${agent.is_used === 1 ? "left-4" : "left-0.5"}`} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleStartEditAgent(agent.agent_id);
                                                        }}
                                                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                        aria-label={`${agent.agent_name} 수정`}
                                                        tabIndex={0}>
                                                        <Icon icon="mdi:pencil" className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
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
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-semibold text-gray-900">{selectedAgent.agent_name}</h3>
                                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${getAgentTypeBadgeStyle(apiTypeToAgentType(selectedAgent.agent_type))}`}>{AGENT_TYPE_OPTIONS.find((o) => o.apiValue === selectedAgent.agent_type)?.label || selectedAgent.agent_type}</span>
                                </div>
                                <p className="text-xs text-gray-500">
                                    {selectedAgent.agent_ip}:{selectedAgent.agent_port}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${selectedAgent.is_used === 1 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>{selectedAgent.is_used === 1 ? "사용 중" : "미사용"}</div>
                                <button type="button" onClick={handleDeleteAgent} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" aria-label="Agent 삭제" tabIndex={0}>
                                    <Icon icon="mdi:delete" className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* STUN/TURN 서버 설정 정보 표시 */}
                        {selectedAgent.agent_type === 4 && (selectedAgent.protocol || selectedAgent.username) && (
                            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                <p className="text-xs font-medium text-orange-800 mb-2">STUN/TURN 설정</p>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <span className="text-gray-500">Protocol:</span>
                                        <span className="ml-1 font-medium text-gray-700">{selectedAgent.protocol?.toUpperCase() || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Priority:</span>
                                        <span className="ml-1 font-medium text-gray-700">{selectedAgent.priority === null ? "-" : selectedAgent.priority}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Username:</span>
                                        <span className="ml-1 font-medium text-gray-700">{selectedAgent.username || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Credential:</span>
                                        <span className="ml-1 font-medium text-gray-700">{selectedAgent.credential ? "••••••" : "-"}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Agent 상세 정보 */}
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <p className="text-xs font-medium text-gray-700 mb-2">상세 정보</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <span className="text-gray-500">Agent ID:</span>
                                    <span className="ml-1 font-medium text-gray-700">{selectedAgent.agent_id}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">포트:</span>
                                    <span className="ml-1 font-medium text-gray-700">{selectedAgent.agent_port}</span>
                                </div>
                            </div>
                        </div>

                        {/* Key-Value 설정 영역 */}
                        <div className="p-3 bg-white border border-gray-200 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-medium text-gray-700">커스텀 설정</p>
                                <span className="text-[10px] text-gray-400">{selectedAgentKeyValues.length}개</span>
                            </div>

                            {/* Key-Value 목록 */}
                            {selectedAgentKeyValues.length > 0 && (
                                <div className="space-y-2 mb-3">
                                    {selectedAgentKeyValues.map((kv, index) => (
                                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                            {editingKvIndex === index ? (
                                                <>
                                                    <input
                                                        type="text"
                                                        value={editKvKey}
                                                        onChange={(e) => setEditKvKey(e.target.value)}
                                                        onKeyDown={handleInputKeyDown}
                                                        placeholder="Key"
                                                        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={editKvValue}
                                                        onChange={(e) => setEditKvValue(e.target.value)}
                                                        onKeyDown={handleInputKeyDown}
                                                        placeholder="Value"
                                                        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                                                    />
                                                    <button type="button" onClick={handleSaveEditKeyValue} className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors" aria-label="저장" tabIndex={0}>
                                                        <Icon icon="mdi:check" className="w-4 h-4" />
                                                    </button>
                                                    <button type="button" onClick={handleCancelEditKeyValue} className="p-1 text-gray-400 hover:bg-gray-100 rounded transition-colors" aria-label="취소" tabIndex={0}>
                                                        <Icon icon="mdi:close" className="w-4 h-4" />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-xs font-medium text-blue-600">{kv.key}</span>
                                                        <span className="text-xs text-gray-400 mx-1">:</span>
                                                        <span className="text-xs text-gray-700 break-all">{kv.value || <span className="text-gray-400 italic">비어있음</span>}</span>
                                                    </div>
                                                    <button type="button" onClick={() => handleStartEditKeyValue(index)} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" aria-label="수정" tabIndex={0}>
                                                        <Icon icon="mdi:pencil" className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button type="button" onClick={() => handleDeleteKeyValue(index)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" aria-label="삭제" tabIndex={0}>
                                                        <Icon icon="mdi:delete" className="w-3.5 h-3.5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* 새 Key-Value 추가 */}
                            <div className="flex items-center gap-2">
                                <input type="text" value={newKeyInput} onChange={(e) => setNewKeyInput(e.target.value)} onKeyDown={handleInputKeyDown} placeholder="Key" className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 text-black" />
                                <input type="text" value={newValueInput} onChange={(e) => setNewValueInput(e.target.value)} onKeyDown={handleInputKeyDown} placeholder="Value" className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 text-black" />
                                <button type="button" onClick={handleAddKeyValue} disabled={!newKeyInput.trim()} className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed" aria-label="추가" tabIndex={0}>
                                    <Icon icon="mdi:plus" className="w-4 h-4" />
                                </button>
                            </div>
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
    );
}
