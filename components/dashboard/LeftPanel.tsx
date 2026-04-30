import { Icon } from "@iconify/react";
import { TrafficIncidentSection } from "@/components/dashboard/TrafficIncidentSection";
import { TrafficRouteStatusSection } from "@/components/dashboard/TrafficRouteStatusSection";
import { useState, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { getRandomCCTVVideo } from "@/lib/cctv-video-utils";
import { BarChart, Bar, XAxis, YAxis } from "recharts";
import { useGetWeather } from "@/src/apis/weather/hooks";
import { pm10Grade, pm25Grade, WeatherGrade } from "@/src/apis/weather/types";

interface MonitoringSpot {
    spotId: string;
    spotName: string;
    streamUrl?: string;
    thumbnails?: string[];
    fps: number;
    status: "normal" | "delay" | "disconnected";
    autoSequence: boolean;
    environment?: "normal" | "night" | "fog" | "rain";
}

interface AreaStatus {
    area: string;
    total: number;
    normal: number;
    delay: number;
    error: number;
    uptime: number;
    streamRate: number;
    online: number;
    offline: number;
    warning: number;
    maintenance: number;
    airQuality: "안정" | "양호" | "주의";
    monitorState: "정상" | "집중" | "경보";
}

interface CctvStatus {
    totalRate: number;
    totalCount: number;
    normalCount: number;
    errorCount: number;
    delayCount: number;
    areaStatus: AreaStatus[];
    monitoringSpots: MonitoringSpot[];
}

interface SensorData {
    pm25: { value: number; level: "good" | "normal" | "bad" };
    pm10: { value: number; level: "good" | "normal" | "bad" };
    temperature: { value: number; level: "good" | "normal" | "bad" };
    humidity: { value: number; level: "good" | "normal" | "bad" };
    rainfall: { value: number; level: "good" | "normal" | "bad" };
    windSpeed: { value: number; level: "good" | "normal" | "bad" };
    lastUpdate: string; // timestamp
}

interface FloodRiskZone {
    zone: string;
    currentLevel: number;
    warningLevel: number;
    percentage: number;
}

interface FacilityRiskZone {
    zone: string;
    riskLevel: number;
    maxLevel: number;
    percentage: number;
}

interface InfrastructureStatus {
    waterLeakage: { status: "normal" | "warning" | "error"; lastUpdate: string };
    powerSupply: { status: "normal" | "warning" | "error"; lastUpdate: string };
    streetLightRate: number;
    iotSensorRate: number;
    alert: boolean;
    alertMessage?: string;
    streetLight: { normalCount: number; errorCount: number };
    trafficSignal: { normalCount: number; errorCount: number };
    emergencyBell: { normalCount: number; errorCount: number };
    floodRiskZones: FloodRiskZone[];
    facilityRiskZones: FacilityRiskZone[];
}

const cctvLocalImages = ["/cctv_img/001.jpg", "/cctv_img/002.jpg", "/cctv_img/003.jpg", "/cctv_img/004.jpg", "/cctv_img/005.jpg"];

const buildThumbnails = (identifier: string, count = 3) => {
    const seed = identifier.split("").reduce((acc, char, idx) => acc + char.charCodeAt(0) * (idx + 1), 0);

    return Array.from({ length: count }, (_, idx) => {
        const nextIndex = (seed + idx) % cctvLocalImages.length;
        return cctvLocalImages[nextIndex];
    });
};

const getWeatherIcon = (status: WeatherGrade) => {
    switch (status) {
        case "1":
            return "mdi:weather-sunny";
        case "2":
            return "mdi:weather-partly-cloudy";
        case "3":
            return "mdi:weather-cloudy";
        case "4":
            return "mdi:weather-rainy";
        case "5":
            return "mdi:weather-snowy-rainy";
        case "6":
            return "mdi:weather-snowy";
        case "7":
            return "mdi:weather-pouring";
        default:
            return "mdi:weather-cloudy";
    }
};

interface LeftPanelProps {
    onCollapsedChange?: (isCollapsed: boolean) => void;
}

const LeftPanel = ({ onCollapsedChange }: LeftPanelProps = {}) => {
    const { t, i18n } = useTranslation();
    const [currentStreamIndex, setCurrentStreamIndex] = useState(0);
    const [spotThumbnailIndices, setSpotThumbnailIndices] = useState<Record<string, number>>({});
    const [currentPage, setCurrentPage] = useState(0);
    const [areaPage, setAreaPage] = useState(0);
    const [heatmapAreaOffset, setHeatmapAreaOffset] = useState(0);
    const [heatmapAnimationKey, setHeatmapAnimationKey] = useState(0);
    const [previousHeatmapData, setPreviousHeatmapData] = useState<Record<string, Record<string, number>>>({});
    const previousHeatmapDataRef = useRef<Record<string, Record<string, number>>>({});
    const [visibleHeatmapCount, setVisibleHeatmapCount] = useState(4);
    const [sensorValues, setSensorValues] = useState({
        pm25: 38,
        pm10: 72,
        temperature: 11,
        humidity: 62,
        rainfall: 0.3,
        windSpeed: 1.2,
    });

    const [clockTime, setClockTime] = useState<string>("");
    const [lastUpdateTime, setLastUpdateTime] = useState<string>("");
    const [waterLeakageTime, setWaterLeakageTime] = useState<string>("");
    const [powerSupplyTime, setPowerSupplyTime] = useState<string>("");
    const [isMounted, setIsMounted] = useState(false);
    const [sensorLocationIndex, setSensorLocationIndex] = useState<number>(0);
    const [airQualitySlideIndex, setAirQualitySlideIndex] = useState<number>(0);
    const [floodRiskZoneIndex, setFloodRiskZoneIndex] = useState<number>(0);
    const [facilityRiskZoneIndex, setFacilityRiskZoneIndex] = useState<number>(0);
    const [showAttributionPopup, setShowAttributionPopup] = useState(false);

    // 영문 시연 모드에서는 짧은 영문 지명을 사용 (i18n.language를 deps에 두어 언어 전환 시 갱신)
    const sensorLocations = useMemo(() => {
        const lang = (i18n.resolvedLanguage || i18n.language || 'ko').slice(0, 2);
        if (lang === 'en') {
            return ["Wave", "Rainbow Main", "Galaxy Elem.", "Sunshine", "Sunset"];
        }
        return ["물결동", "무지개본동", "은하초교", "햇살동", "노을동"];
    }, [i18n.language]);

    const { data: weatherData1 } = useGetWeather("경기", "주엽동");

    const weatherData = {
        icon: "mdi:weather-partly-cloudy",
        high: 25,
        low: 18,
    };

    useEffect(() => {
        setIsMounted(true);
        const formatTime = () => {
            const isEN = (i18n.resolvedLanguage || i18n.language || 'ko').startsWith('en');
            return new Date().toLocaleTimeString(isEN ? 'en-US' : 'ko-KR', {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: !isEN,
            });
        };

        setClockTime(formatTime());
        setLastUpdateTime(formatTime());
        const timer = setInterval(() => {
            setClockTime(formatTime());
        }, 1000);
        return () => clearInterval(timer);
    }, [i18n.language]);

    useEffect(() => {
        const interval = setInterval(() => {
            setSpotThumbnailIndices((prev) => {
                const newIndices: Record<string, number> = {};
                cctvStatus.monitoringSpots.forEach((spot) => {
                    if (spot.thumbnails && spot.thumbnails.length > 0) {
                        const currentIndex = prev[spot.spotId] || 0;
                        newIndices[spot.spotId] = (currentIndex + 1) % spot.thumbnails.length;
                    }
                });
                return newIndices;
            });
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const totalPages = Math.ceil(cctvStatus.monitoringSpots.length / 2);
        if (totalPages <= 1) return;

        const interval = setInterval(() => {
            setCurrentPage((prev) => (prev + 1) % totalPages);
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    /**
     * 📡 API 연동 필요: 환경 센서 데이터 실시간 업데이트
     * 현재: 더미 데이터 랜덤 업데이트
     * 변경: WebSocket 또는 Polling으로 실시간 데이터 수신
     */
    useEffect(() => {
        // 📡 API 연동 후 아래 코드로 대체:
        // const fetchSensorData = async () => {
        //   const response = await fetch('/api/sensors/realtime');
        //   const data = await response.json();
        //   setSensorValues(data);
        //   setLastUpdateTime(new Date().toLocaleTimeString('ko-KR'));
        // };
        // fetchSensorData();
        // const interval = setInterval(fetchSensorData, 2000);
        // return () => clearInterval(interval);

        const interval = setInterval(() => {
            setSensorValues((prev) => ({
                pm25: Math.max(0, prev.pm25 + (Math.random() - 0.5) * 4),
                pm10: Math.max(0, prev.pm10 + (Math.random() - 0.5) * 6),
                temperature: prev.temperature + (Math.random() - 0.5) * 0.5,
                humidity: Math.max(0, Math.min(100, prev.humidity + (Math.random() - 0.5) * 2)),
                rainfall: Math.max(0, prev.rainfall + (Math.random() - 0.5) * 0.2),
                windSpeed: Math.max(0, prev.windSpeed + (Math.random() - 0.5) * 0.3),
            }));
            setLastUpdateTime(new Date().toLocaleTimeString(
                i18n.language?.startsWith('en') ? 'en-US' : 'ko-KR',
                { hour: '2-digit', minute: '2-digit', hour12: !i18n.language?.startsWith('en') }
            ));
            setSensorLocationIndex((prev) => (prev + 1) % sensorLocations.length);
        }, 2000);
        return () => clearInterval(interval);
    }, [sensorLocations]);

    useEffect(() => {
        const totalSlides = sensorLocations.length * 2;
        const interval = setInterval(() => {
            setAirQualitySlideIndex((prev) => (prev + 1) % totalSlides);
        }, 3000);
        return () => clearInterval(interval);
    }, [sensorLocations.length]);

    const cctvStatus: CctvStatus = {
        totalRate: 96.1,
        totalCount: 1240,
        normalCount: 1192,
        errorCount: 48,
        delayCount: 12,
        areaStatus: [
            {
                area: "zone1",
                total: 182,
                normal: 176,
                delay: 4,
                error: 2,
                uptime: 96,
                streamRate: 2.3,
                online: 176,
                offline: 6,
                warning: 1,
                maintenance: 0,
                airQuality: "양호",
                monitorState: "정상",
            },
            {
                area: "zone2",
                total: 205,
                normal: 198,
                delay: 5,
                error: 2,
                uptime: 93,
                streamRate: 3.7,
                online: 198,
                offline: 7,
                warning: 2,
                maintenance: 1,
                airQuality: "양호",
                monitorState: "집중",
            },
            {
                area: "zone3",
                total: 210,
                normal: 203,
                delay: 5,
                error: 2,
                uptime: 95,
                streamRate: 1.8,
                online: 203,
                offline: 7,
                warning: 1,
                maintenance: 0,
                airQuality: "안정",
                monitorState: "정상",
            },
            {
                area: "zone4",
                total: 96,
                normal: 90,
                delay: 4,
                error: 2,
                uptime: 89,
                streamRate: 4.2,
                online: 90,
                offline: 6,
                warning: 1,
                maintenance: 1,
                airQuality: "주의",
                monitorState: "집중",
            },
            {
                area: "zone5",
                total: 134,
                normal: 127,
                delay: 5,
                error: 2,
                uptime: 92,
                streamRate: 2.9,
                online: 127,
                offline: 7,
                warning: 1,
                maintenance: 0,
                airQuality: "양호",
                monitorState: "정상",
            },
            {
                area: "zone6",
                total: 108,
                normal: 101,
                delay: 5,
                error: 2,
                uptime: 90,
                streamRate: 3.5,
                online: 101,
                offline: 7,
                warning: 2,
                maintenance: 1,
                airQuality: "주의",
                monitorState: "집중",
            },
        ],
        monitoringSpots: [
            {
                spotId: "1",
                spotName: "중앙역 출입구 2번",
                fps: 29,
                status: "delay",
                autoSequence: true,
                thumbnails: buildThumbnails("spot-1"),
                environment: "normal",
            },
            {
                spotId: "2",
                spotName: "경찰서 앞",
                fps: 30,
                status: "normal",
                autoSequence: true,
                thumbnails: buildThumbnails("spot-2"),
                environment: "night",
            },
            {
                spotId: "3",
                spotName: "평촌대로 교차로",
                fps: 28,
                status: "normal",
                autoSequence: true,
                thumbnails: buildThumbnails("spot-3"),
                environment: "fog",
            },
            {
                spotId: "4",
                spotName: "터널 입구",
                fps: 30,
                status: "normal",
                autoSequence: false,
                thumbnails: buildThumbnails("spot-4"),
                environment: "normal",
            },
            {
                spotId: "5",
                spotName: "하늘역 광장",
                fps: 27,
                status: "delay",
                autoSequence: true,
                thumbnails: buildThumbnails("spot-5"),
                environment: "rain",
            },
            {
                spotId: "6",
                spotName: "중앙시장 입구",
                fps: 30,
                status: "normal",
                autoSequence: false,
                thumbnails: buildThumbnails("spot-6"),
                environment: "normal",
            },
        ],
    };

    const areasPerPage = 2;
    const totalAreaPages = Math.ceil(cctvStatus.areaStatus.length / areasPerPage);
    const visibleAreas = cctvStatus.areaStatus.slice(areaPage * areasPerPage, areaPage * areasPerPage + areasPerPage);

    // 모든 지역 목록 (히트맵 롤링용) - useEffect보다 먼저 정의 (zone1~zone8)
    const allHeatmapAreas = useMemo(() => {
        return ["zone1", "zone2", "zone3", "zone4", "zone5", "zone6", "zone7", "zone8"];
    }, []);

    const getLevelText = (level: pm10Grade | pm25Grade | undefined) => {
        const isEN = i18n.language?.startsWith('en');
        switch (level) {
            case "1":
                return isEN ? "Good" : "좋음";
            case "2":
                return isEN ? "OK" : "보통";
            case "3":
                return isEN ? "Bad" : "나쁨";
            case "4":
                return isEN ? "V. bad" : "매우 나쁨";
            default:
                return isEN ? "OK" : "보통";
        }
    };

    const getPm25Level = (value: number): "good" | "normal" | "bad" => {
        if (value <= 15) return "good";
        if (value <= 35) return "normal";
        return "bad";
    };

    const getPm10Level = (value: number): "good" | "normal" | "bad" => {
        if (value <= 30) return "good";
        if (value <= 80) return "normal";
        return "bad";
    };

    const getTemperatureLevel = (value: number): "good" | "normal" | "bad" => {
        if (value >= 18 && value <= 26) return "good";
        if (value >= 10 && value <= 30) return "normal";
        return "bad";
    };

    const getHumidityLevel = (value: number): "good" | "normal" | "bad" => {
        if (value >= 40 && value <= 60) return "good";
        if (value >= 30 && value <= 70) return "normal";
        return "bad";
    };

    const getRainfallLevel = (value: number): "good" | "normal" | "bad" => {
        if (value <= 0.5) return "good";
        if (value <= 2.0) return "normal";
        return "bad";
    };

    const getWindSpeedLevel = (value: number): "good" | "normal" | "bad" => {
        if (value <= 2.0) return "good";
        if (value <= 5.0) return "normal";
        return "bad";
    };

    const infrastructureRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const heatmapGridRef = useRef<HTMLDivElement>(null);

    const sensorData: SensorData = useMemo(
        () => ({
            pm25: { value: sensorValues.pm25, level: getPm25Level(sensorValues.pm25) },
            pm10: { value: sensorValues.pm10, level: getPm10Level(sensorValues.pm10) },
            temperature: { value: sensorValues.temperature, level: getTemperatureLevel(sensorValues.temperature) },
            humidity: { value: sensorValues.humidity, level: getHumidityLevel(sensorValues.humidity) },
            rainfall: { value: sensorValues.rainfall, level: getRainfallLevel(sensorValues.rainfall) },
            windSpeed: { value: sensorValues.windSpeed, level: getWindSpeedLevel(sensorValues.windSpeed) },
            lastUpdate: new Date().toISOString(),
        }),
        [sensorValues]
    );

    const collapsedIndicators = [
        { label: "정상", value: cctvStatus.normalCount, dot: "bg-green-400", color: "text-green-400" },
        { label: "장애", value: cctvStatus.errorCount, dot: "bg-red-400", color: "text-red-400" },
        { label: "지연", value: cctvStatus.delayCount, dot: "bg-yellow-400", color: "text-yellow-400" },
    ];

    /**
     * 📡 API 연동 필요: 도시 안전·시설 관리 현황
     * 현재: 더미 데이터
     * 변경: GET /api/infrastructure/status
     */
    const infrastructureStatus: InfrastructureStatus = useMemo(() => {
        const now = typeof window !== "undefined" ? new Date().toISOString() : "";
        const lang = (i18n.resolvedLanguage || i18n.language || 'ko').slice(0, 2);
        const zoneNames = lang === 'en'
            ? { byeolbit: 'Starlight', mujigae: 'Rainbow', haetsal: 'Sunshine', dalbit: 'Moonlight' }
            : { byeolbit: '별빛동', mujigae: '무지개동', haetsal: '햇살동', dalbit: '달빛동' };
        return {
            waterLeakage: { status: "error", lastUpdate: now },
            powerSupply: { status: "normal", lastUpdate: now },
            streetLightRate: 92,
            iotSensorRate: 95.5,
            alert: true,
            alertMessage: lang === 'en' ? "Water network anomaly" : "상수도 관망 이상 징후",
            // 도로 조명 운영 상태
            streetLight: { normalCount: 1245, errorCount: 8 },
            // 교통신호 운영 상태
            trafficSignal: { normalCount: 892, errorCount: 3 },
            // 안전 비상벨 운영 상태
            emergencyBell: { normalCount: 456, errorCount: 2 },
            floodRiskZones: [
                { zone: zoneNames.byeolbit, currentLevel: 1.2, warningLevel: 3.5, percentage: 35 },
                { zone: zoneNames.mujigae, currentLevel: 2.1, warningLevel: 3.5, percentage: 60 },
                { zone: zoneNames.haetsal, currentLevel: 0.8, warningLevel: 3.5, percentage: 23 },
                { zone: zoneNames.dalbit, currentLevel: 1.5, warningLevel: 3.5, percentage: 43 },
            ],
            facilityRiskZones: [
                { zone: zoneNames.byeolbit, riskLevel: 65, maxLevel: 100, percentage: 65 },
                { zone: zoneNames.mujigae, riskLevel: 45, maxLevel: 100, percentage: 45 },
                { zone: zoneNames.haetsal, riskLevel: 78, maxLevel: 100, percentage: 78 },
                { zone: zoneNames.dalbit, riskLevel: 52, maxLevel: 100, percentage: 52 },
            ],
        };
    }, [i18n.language]);

    useEffect(() => {
        if (!isMounted || typeof window === "undefined") return;

        const formatInfrastructureTime = (isoString: string) => {
            if (!isoString) return "--:--:--";
            const isEN = i18n.language?.startsWith('en');
            return new Date(isoString).toLocaleTimeString(isEN ? 'en-US' : 'ko-KR', {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: !isEN,
                hour12: true,
            });
        };

        const waterLeakageUpdate = infrastructureStatus.waterLeakage.lastUpdate;
        const powerSupplyUpdate = infrastructureStatus.powerSupply.lastUpdate;

        if (waterLeakageUpdate) {
            setWaterLeakageTime(formatInfrastructureTime(waterLeakageUpdate));
        }
        if (powerSupplyUpdate) {
            setPowerSupplyTime(formatInfrastructureTime(powerSupplyUpdate));
        }
    }, [isMounted, infrastructureStatus.waterLeakage.lastUpdate, infrastructureStatus.powerSupply.lastUpdate]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "normal":
            case "good":
                return "text-green-400";
            case "delay":
            case "warning":
                return "text-yellow-400";
            case "error":
            case "bad":
            case "disconnected":
                return "text-red-400";
            default:
                return "text-gray-400";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "normal":
            case "good":
                return "mdi:check-circle";
            case "delay":
            case "warning":
                return "mdi:alert-circle";
            case "error":
            case "bad":
            case "disconnected":
                return "mdi:alert";
            default:
                return "mdi:help-circle";
        }
    };

    const getLevelColor = (level: pm10Grade | pm25Grade | undefined) => {
        switch (level) {
            case "1":
                return "text-green-400 border-green-400";
            case "2":
                return "text-yellow-400 border-yellow-400";
            case "3":
                return "text-red-400 border-red-400";
            case "4":
                return "text-yellow-400 border-yellow-400";
            default:
                return "text-yellow-400 border-yellow-400";
        }
    };

    const getEnvironmentLabel = (env?: "normal" | "night" | "fog" | "rain") => {
        switch (env) {
            case "night":
                return "야간";
            case "fog":
                return "안개";
            case "rain":
                return "우천";
            default:
                return "정상";
        }
    };

    const getEnvironmentColor = (env?: "normal" | "night" | "fog" | "rain") => {
        switch (env) {
            case "night":
                return "text-blue-400";
            case "fog":
                return "text-gray-400";
            case "rain":
                return "text-blue-400";
            default:
                return "text-green-400";
        }
    };

    const handleFacilityClick = () => {
        infrastructureRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const getSeededInt = (seed: string, maxInclusive: number) => {
        let hash = 0;
        for (let i = 0; i < seed.length; i += 1) {
            hash = (hash << 5) - hash + seed.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash) % (maxInclusive + 1);
    };

    const heatmapTimeSlots = useMemo(() => {
        return Array.from({ length: 12 }, (_, idx) => {
            const hour = idx * 2;
            const padded = hour.toString().padStart(2, "0");
            return {
                key: `${padded}`,
                label: padded,
                startHour: hour,
            };
        });
    }, []);

    // 현재 표시할 지역 (화면 높이에 따라 동적으로 계산)
    const heatmapAreas = useMemo(() => {
        const startIndex = heatmapAreaOffset % allHeatmapAreas.length;
        const result: string[] = [];
        for (let i = 0; i < visibleHeatmapCount; i++) {
            const index = (startIndex + i) % allHeatmapAreas.length;
            result.push(allHeatmapAreas[index]);
        }
        return result;
    }, [heatmapAreaOffset, allHeatmapAreas, visibleHeatmapCount]);

    type HeatmapBucket = "none" | "low" | "mid" | "high";
    const getHeatmapBucket = (count: number): HeatmapBucket => {
        if (count <= 0) return "none";
        if (count <= 2) return "low";
        if (count <= 5) return "mid";
        return "high";
    };

    const getHeatmapCellClassName = (count: number) => {
        const bucket = getHeatmapBucket(count);
        // none 은 살짝 더 밝은 blue-gray 톤, 나머지는 현재 톤 유지
        if (bucket === "none") return "bg-[#1f2937]"; // 기존보다 살짝 밝은 blue-gray
        if (bucket === "low") return "bg-[#3b5a8c]"; // 1–2건 (파란 계열)
        if (bucket === "mid") return "bg-[#005eb8]"; // 3–5건 (요청 컬러)
        return "bg-[#F87171]"; // 6+ (강조 레드)
    };

    const heatmapData = useMemo(() => {
        const nowSeed = typeof window !== "undefined" ? new Date().toISOString().slice(0, 10) : "static";
        const result: Record<string, Record<string, number>> = {};

        // 구역별 컬러 분포 패턴 정의
        const getAreaDistribution = (area: string) => {
            const areaNum = parseInt(area.replace("zone", "")) || 1;
            const jitter = getSeededInt(`${nowSeed}:${area}:jitter`, 11) - 5; // -5 ~ +5

            // 각 구역별로 다른 분포 패턴
            switch (areaNum) {
                case 1: // zone1: None이 많고, 낮은 값 위주
                    return {
                        noneThreshold: 65 + jitter, // 60~70% None
                        lowThreshold: 25, // 20~30% 낮은 값
                        midThreshold: 10, // 5~15% 중간 값
                    };
                case 2: // zone2: 중간 값이 많음
                    return {
                        noneThreshold: 40 + jitter, // 35~45% None
                        lowThreshold: 30, // 25~35% 낮은 값
                        midThreshold: 25, // 20~30% 중간 값
                    };
                case 3: // zone3: 높은 값이 조금 더 많음
                    return {
                        noneThreshold: 45 + jitter, // 40~50% None
                        lowThreshold: 25, // 20~30% 낮은 값
                        midThreshold: 20, // 15~25% 중간 값
                    };
                case 4: // zone4: 균등한 분포
                    return {
                        noneThreshold: 50 + jitter, // 45~55% None
                        lowThreshold: 25, // 20~30% 낮은 값
                        midThreshold: 20, // 15~25% 중간 값
                    };
                case 5: // zone5: None이 적고, 중간~높은 값이 많음
                    return {
                        noneThreshold: 30 + jitter, // 25~35% None
                        lowThreshold: 30, // 25~35% 낮은 값
                        midThreshold: 30, // 25~35% 중간 값
                    };
                case 6: // zone6: 낮은 값이 많음
                    return {
                        noneThreshold: 50 + jitter, // 45~55% None
                        lowThreshold: 35, // 30~40% 낮은 값
                        midThreshold: 10, // 5~15% 중간 값
                    };
                case 7: // zone7: 높은 값이 많음
                    return {
                        noneThreshold: 35 + jitter, // 30~40% None
                        lowThreshold: 25, // 20~30% 낮은 값
                        midThreshold: 30, // 25~35% 중간 값
                    };
                case 8: // zone8: 균등하지만 약간 높은 값 위주
                    return {
                        noneThreshold: 45 + jitter, // 40~50% None
                        lowThreshold: 20, // 15~25% 낮은 값
                        midThreshold: 25, // 20~30% 중간 값
                    };
                default:
                    return {
                        noneThreshold: 55 + jitter,
                        lowThreshold: 25,
                        midThreshold: 15,
                    };
            }
        };

        heatmapAreas.forEach((area) => {
            result[area] = {};
            const distribution = getAreaDistribution(area);

            heatmapTimeSlots.forEach((slot) => {
                // 각 셀마다 독립적인 랜덤 값 생성 (더 랜덤하게 섞이도록)
                const cellSeed = getSeededInt(`${nowSeed}:${area}:${slot.key}:cell`, 1000); // 0~999
                const baseRand = cellSeed % 100; // 0~99
                const slotJitter = getSeededInt(`${nowSeed}:${area}:${slot.key}:j`, 21) - 10; // -10 ~ +10

                // none 값의 임계값을 셀마다 다르게 적용하여 일렬로 배치되지 않도록
                const cellNoneOffset = getSeededInt(`${nowSeed}:${area}:${slot.key}:noneOffset`, 31) - 15; // -15 ~ +15
                const noneThreshold = Math.max(20, Math.min(80, distribution.noneThreshold + slotJitter + cellNoneOffset));

                const lowThreshold = distribution.lowThreshold;
                const midThreshold = distribution.midThreshold;
                const highThreshold = 100 - noneThreshold - lowThreshold - midThreshold;

                let value: number;
                const valueRand = baseRand;

                if (valueRand < noneThreshold) {
                    value = 0;
                } else if (valueRand < noneThreshold + lowThreshold) {
                    value = 1 + getSeededInt(`${nowSeed}:${area}:${slot.key}:low`, 1); // 1~2
                } else if (valueRand < noneThreshold + lowThreshold + midThreshold) {
                    value = 3 + getSeededInt(`${nowSeed}:${area}:${slot.key}:mid`, 2); // 3~5
                } else {
                    value = 6 + getSeededInt(`${nowSeed}:${area}:${slot.key}:high`, 3); // 6~9
                }

                result[area][slot.key] = value;
            });
        });

        return result;
    }, [heatmapAreas, heatmapTimeSlots]);

    // 초기 데이터 저장
    useEffect(() => {
        if (Object.keys(previousHeatmapDataRef.current).length === 0 && Object.keys(heatmapData).length > 0) {
            const initialData = JSON.parse(JSON.stringify(heatmapData));
            previousHeatmapDataRef.current = initialData;
            setPreviousHeatmapData(initialData);
        }
    }, [heatmapData]);

    // 히트맵 그리드 높이 측정하여 표시 가능한 개수 계산
    useEffect(() => {
        const calculateVisibleCount = () => {
            if (!heatmapGridRef.current) return;

            const container = heatmapGridRef.current;
            const containerHeight = container.clientHeight;

            // 각 행의 높이: h-5 (20px) + space-y-1 (4px) = 약 24px
            const rowHeight = 24;
            const maxVisibleRows = Math.floor(containerHeight / rowHeight);

            // 최소 1개, 최대 allHeatmapAreas.length개
            const count = Math.max(1, Math.min(maxVisibleRows, allHeatmapAreas.length));
            setVisibleHeatmapCount(count);
        };

        calculateVisibleCount();

        const resizeObserver = new ResizeObserver(() => {
            calculateVisibleCount();
        });

        if (heatmapGridRef.current) {
            resizeObserver.observe(heatmapGridRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, [allHeatmapAreas.length]);

    // 히트맵 지역 롤링 (5초마다) - heatmapData 선언 이후에 위치
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStreamIndex((prev) => {
                const autoSequenceSpots = cctvStatus.monitoringSpots.filter((spot) => spot.autoSequence);
                if (autoSequenceSpots.length === 0) return prev;
                return (prev + 1) % autoSequenceSpots.length;
            });
            setAreaPage((prev) => {
                if (totalAreaPages <= 1) return prev;
                return (prev + 1) % totalAreaPages;
            });
            // 히트맵 지역 롤링 (5초마다) - 화면 높이에 따라 동적으로 계산된 개수만큼 전환
            // 애니메이션을 위해 현재 데이터를 이전 데이터로 저장 (offset 변경 전)
            // ref에 먼저 저장 (동기적으로)
            const currentDataCopy = JSON.parse(JSON.stringify(heatmapData));
            previousHeatmapDataRef.current = currentDataCopy;
            // state에도 저장 (비동기)
            setPreviousHeatmapData(currentDataCopy);
            // 그 다음 offset 변경 및 애니메이션 트리거
            setHeatmapAreaOffset((prev) => (prev + visibleHeatmapCount) % allHeatmapAreas.length);
            setHeatmapAnimationKey((prev) => prev + 1);

            // 침수 위험 & 노후·위험 시설 롤링
            setFloodRiskZoneIndex((prev) => (prev + 1) % 4);
            setFacilityRiskZoneIndex((prev) => (prev + 1) % 4);
        }, 5000);
        return () => clearInterval(interval);
    }, [totalAreaPages, allHeatmapAreas.length, visibleHeatmapCount, heatmapData]);

    return (
        <div
            className="flex flex-col overflow-hidden relative"
            style={{
                height: "100%",
                minHeight: 0,
                width: "26rem",
            }}>
            <div className="flex-1 overflow-hidden pt-4 pb-4 pl-4 pr-5 flex flex-col gap-4" ref={scrollContainerRef} style={{ maxWidth: "100%", height: "100%" }}>
                {/* 상단 헤더: 좌측 로고, 우측 날씨 + 시간 */}
                <div className="rounded-lg p-4 flex items-center justify-between gradient-border-left-top" style={{ flexShrink: 0, background: "linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}>
                    {/* 좌측: 패널 로고 */}
                    <a href="/" className="flex items-center gap-2 cursor-pointer" aria-label="메인으로 이동" tabIndex={0}>
                        <img src="/logo.svg" alt="CUVIA" className="h-5 w-auto object-contain" style={{ filter: "brightness(0) invert(1)" }} />
                    </a>

                    {/* 우측: 날씨 + 시간 (시간을 뒤로) */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Icon icon={getWeatherIcon(weatherData1?.weather as WeatherGrade)} className="w-6 h-6 text-white" />
                            <div className="flex items-baseline gap-1">
                                <span className="text-white text-sm font-medium">{weatherData1?.max_temp}°</span>
                                <span className="text-gray-400 text-xs">/</span>
                                <span className="text-gray-400 text-xs">{weatherData1?.min_temp}°</span>
                            </div>
                        </div>
                        <div className="text-white text-sm font-medium whitespace-nowrap min-w-[90px] text-right">{clockTime || "--:--:--"}</div>
                        <div className="relative group">
                            <button
                                onClick={() => setShowAttributionPopup(prev => !prev)}
                                className="w-4 h-4 flex items-center justify-center flex-shrink-0"
                                aria-label="정보 제공처"
                                tabIndex={0}
                            >
                                <Icon icon="mdi:information-outline" className="w-4 h-4 text-gray-400 hover:text-white transition-colors cursor-pointer" />
                            </button>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-black/90 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                                정보 제공처
                            </div>
                        </div>
                    </div>
                </div>

                {showAttributionPopup && (
                    <div
                        className="fixed inset-0"
                        style={{ zIndex: 9999 }}
                        onClick={() => setShowAttributionPopup(false)}
                        onKeyDown={(e) => { if (e.key === 'Escape') setShowAttributionPopup(false); }}
                        role="presentation"
                    >
                        <div
                            className="absolute rounded-lg border border-gray-700/50 overflow-hidden"
                            style={{
                                top: '80px',
                                left: '1rem',
                                width: 'calc(26rem - 1rem - 1.25rem)',
                                background: 'linear-gradient(135deg, rgba(15,15,20,0.97) 0%, rgba(25,25,30,0.97) 100%)',
                                backdropFilter: 'blur(12px)',
                                WebkitBackdropFilter: 'blur(12px)',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
                                <h3 className="text-white font-semibold text-sm">정보 제공처</h3>
                                <button
                                    onClick={() => setShowAttributionPopup(false)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                    aria-label="닫기"
                                    tabIndex={0}
                                >
                                    <Icon icon="mdi:close" className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="px-4 py-3 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-2.5 text-xs leading-relaxed">
                                <div>
                                    <span className="text-gray-300 font-medium">지도</span>
                                    <span className="text-gray-500 ml-1.5">Map data ©</span>
                                    <p className="text-gray-400 mt-0.5">NAVER Corp., OpenStreetMap contributors</p>
                                </div>
                                <div>
                                    <span className="text-gray-300 font-medium">위성/항공</span>
                                    <span className="text-gray-500 ml-1.5">Imagery data ©</span>
                                    <p className="text-gray-400 mt-0.5">국토지리정보원, OpenMapTiles</p>
                                </div>
                                <div>
                                    <span className="text-gray-300 font-medium">교통정보</span>
                                    <span className="text-gray-500 ml-1.5">Traffic data ©</span>
                                    <p className="text-gray-400 mt-0.5">국토교통부, 경찰청 도시교통정보센터, 경기도 교통정보센터, TBS, 서울지방경찰청, 전남자치경찰위원회, 부산지방경찰청, 인천지방경찰청, 광주지방경찰청, 서울국토청, 서울시설공단, 부산시설공단</p>
                                </div>
                                <div>
                                    <span className="text-gray-300 font-medium">대중교통정보</span>
                                    <span className="text-gray-500 ml-1.5">Pubtrans info ©</span>
                                    <p className="text-gray-400 mt-0.5">국토교통부, 서울시 교통정보과, 경기도 버스종합상황실, 부산광역시 버스정보관리시스템, 대전시 교통정보센터, 인천광역시 버스정보센터, 아로정보기술, 티머니, 한국교통안전공단, 이동의즐거움</p>
                                </div>
                                <div>
                                    <span className="text-gray-300 font-medium">전기차 충전소</span>
                                    <span className="text-gray-500 ml-1.5">Electric car charging station data ©</span>
                                    <p className="text-gray-400 mt-0.5">환경부, 한국환경공단, 한국전력공사</p>
                                </div>
                                <div>
                                    <span className="text-gray-300 font-medium">도시생활정보</span>
                                    <span className="text-gray-500 ml-1.5">City life information ©</span>
                                    <p className="text-gray-400 mt-0.5">서울특별시, 인천광역시</p>
                                </div>
                                <div>
                                    <span className="text-gray-300 font-medium">기차 조회예매</span>
                                    <span className="text-gray-500 ml-1.5">Book train tickets ©</span>
                                    <p className="text-gray-400 mt-0.5">코레일, SR</p>
                                </div>
                                <div>
                                    <span className="text-gray-300 font-medium">연안여객선 교통정보</span>
                                    <span className="text-gray-500 ml-1.5">Passenger Ship Transportation Info ©</span>
                                    <p className="text-gray-400 mt-0.5">해양수산부, 한국해양교통안전공단, 한국해운조합</p>
                                </div>
                                <div>
                                    <span className="text-gray-300 font-medium">실시간 기차정보</span>
                                    <span className="text-gray-500 ml-1.5">Realtime train info ©</span>
                                    <p className="text-gray-400 mt-0.5">코레일, SR</p>
                                </div>
                                <div>
                                    <span className="text-gray-300 font-medium">항공 운항 정보</span>
                                    <span className="text-gray-500 ml-1.5">Aviation information ©</span>
                                    <p className="text-gray-400 mt-0.5">한국공항공사</p>
                                </div>
                                <div>
                                    <span className="text-gray-300 font-medium">실내지도</span>
                                    <span className="text-gray-500 ml-1.5">Indoor map ©</span>
                                    <p className="text-gray-400 mt-0.5">네이버랩스, 다비오, 다울지오인포</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 실시간 대기질 모니터링 - 3x1 롤링 */}
                <div className="rounded-lg px-4 pt-4 pb-3 gradient-border-left-top" style={{ flexShrink: 0, background: "linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-semibold text-sm">{t('leftPanel.airQuality.title')}</h3>
                        <span className="text-gray-400 text-xs flex items-center gap-1.5">
                            {/* 영문 모드는 "Reading from..." 텍스트가 길어 한 줄을 넘기므로 location은 한국어 모드에서만 표기. 영문은 시각만 노출. */}
                            {!i18n.language?.startsWith('en') && (
                                <>
                                    {t('leftPanel.airQuality.lastUpdate')}: <span>{t('leftPanel.airQuality.basedOn', { location: sensorLocations[Math.floor(airQualitySlideIndex / 2)] })}</span>
                                    <span className="text-gray-400">·</span>
                                </>
                            )}
                            {i18n.language?.startsWith('en') && (
                                <span className="text-gray-500">{t('leftPanel.airQuality.lastUpdate')} ·</span>
                            )}
                            <span>{weatherData1?.fcst_time || "--:--"}</span>
                        </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 min-w-0">
                        {airQualitySlideIndex % 2 === 0 ? (
                            <>
                                {/* PM2.5 */}
                                <div className="bg-[#393a42] p-3 min-w-0 overflow-hidden rounded-lg">
                                    <div className="flex items-center justify-between gap-1 min-w-0" style={{ height: "20px", marginBottom: "6px" }}>
                                        <div className="flex items-center gap-1 min-w-0">
                                            <Icon icon="mdi:air-filter" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                            <span className="text-gray-400 text-xs truncate">PM2.5</span>
                                        </div>
                                        <span className={`px-1.5 py-0.5 border ${getLevelColor(weatherData1?.pm25_grade)} text-[9px] whitespace-nowrap flex-shrink-0`} style={{ borderRadius: "9999px" }}>
                                            {getLevelText(weatherData1?.pm25_grade)}
                                        </span>
                                    </div>
                                    <div className="text-white text-base font-semibold transition-all duration-300">
                                        {weatherData1?.pm25_value}
                                        <span className="text-gray-400 text-xs ml-0.5">㎍/m³</span>
                                    </div>
                                </div>
                                {/* PM10 */}
                                <div className="bg-[#393a42] p-3 min-w-0 overflow-hidden rounded-lg">
                                    <div className="flex items-center justify-between gap-1 min-w-0" style={{ height: "20px", marginBottom: "6px" }}>
                                        <div className="flex items-center gap-1 min-w-0">
                                            <Icon icon="mdi:weather-dust" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                            <span className="text-gray-400 text-xs truncate">PM10</span>
                                        </div>
                                        <span className={`px-1.5 py-0.5 border ${getLevelColor(weatherData1?.pm10_grade)} text-[9px] whitespace-nowrap flex-shrink-0`} style={{ borderRadius: "9999px" }}>
                                            {getLevelText(weatherData1?.pm10_grade)}
                                        </span>
                                    </div>
                                    <div className="text-white text-base font-semibold transition-all duration-300">
                                        {weatherData1?.pm10_value}
                                        <span className="text-gray-400 text-xs ml-0.5">㎍/m³</span>
                                    </div>
                                </div>
                                {/* 온도 */}
                                <div className="bg-[#393a42] p-3 min-w-0 overflow-hidden rounded-lg">
                                    <div className="flex items-center gap-1 min-w-0" style={{ height: "20px", marginBottom: "6px" }}>
                                        <Icon icon="mdi:thermometer" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                        <span className="text-gray-400 text-xs truncate">{t('leftPanel.airQuality.temperature')}</span>
                                    </div>
                                    <div className="text-white text-base font-semibold transition-all duration-300">
                                        {weatherData1?.current_temp}
                                        <span className="text-gray-400 text-xs ml-0.5">°C</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* 습도 */}
                                <div className="bg-[#393a42] p-3 min-w-0 overflow-hidden rounded-lg">
                                    <div className="flex items-center gap-1 min-w-0" style={{ height: "20px", marginBottom: "6px" }}>
                                        <Icon icon="mdi:water-percent" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                        <span className="text-gray-400 text-xs truncate">{t('leftPanel.airQuality.humidity')}</span>
                                    </div>
                                    <div className="text-white text-base font-semibold transition-all duration-300">
                                        {weatherData1?.current_humidity}
                                        <span className="text-gray-400 text-xs ml-0.5">%</span>
                                    </div>
                                </div>
                                {/* 강수량 */}
                                <div className="bg-[#393a42] p-3 min-w-0 overflow-hidden rounded-lg">
                                    <div className="flex items-center gap-1 min-w-0" style={{ height: "20px", marginBottom: "6px" }}>
                                        <Icon icon="mdi:weather-rainy" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                        <span className="text-gray-400 text-xs truncate">{t('leftPanel.airQuality.precipitation')}</span>
                                    </div>
                                    <div className="text-white text-sm font-semibold transition-all duration-300">
                                        {weatherData1?.precipitation}
                                        <span className="text-gray-400 text-[10px] ml-0.5">mm</span>
                                        <span className="text-gray-400 text-[10px] ml-1">{t('leftPanel.airQuality.cumulative')}</span>
                                    </div>
                                </div>
                                {/* 풍속 */}
                                <div className="bg-[#393a42] p-3 min-w-0 overflow-hidden rounded-lg">
                                    <div className="flex items-center gap-1 min-w-0" style={{ height: "20px", marginBottom: "6px" }}>
                                        <Icon icon="mdi:weather-windy" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                        <span className="text-gray-400 text-xs truncate">{t('leftPanel.airQuality.windSpeed')}</span>
                                    </div>
                                    <div className="text-white text-base font-semibold transition-all duration-300">
                                        {weatherData1?.wind_speed}
                                        <span className="text-gray-400 text-xs ml-0.5">m/s</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <TrafficIncidentSection />

                <TrafficRouteStatusSection />

                {/* 도시 안전·시설 관리 현황 */}
                <div className="rounded-lg px-4 pt-4 pb-4 flex flex-col gap-3 gradient-border-left-top" style={{ flexShrink: 0, background: "linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}>
                    <h3 className="text-white font-semibold text-sm">{t('leftPanel.safety.title')}</h3>

                    {/* 침수 위험 & 노후·위험 시설 */}
                    <div className="grid grid-cols-2 gap-3 min-w-0">
                        {/* 침수 위험 관리 수준 */}
                        <div className="bg-[#393a42] px-3 pt-3 pb-0 min-w-0 overflow-hidden rounded-lg">
                            <div className="flex items-start justify-between mb-1" style={{ minHeight: "32px" }}>
                                <span className="text-gray-400 text-xs font-semibold">{t('leftPanel.safety.floodRisk')}</span>
                                <span className="text-white text-xs">{infrastructureStatus.floodRiskZones[floodRiskZoneIndex]?.zone}</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="relative" style={{ width: "140px", height: "90px" }}>
                                    <svg width="140" height="90" viewBox="0 0 140 90">
                                        <defs>
                                            <linearGradient id="floodGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#10b981" />
                                                <stop offset="50%" stopColor="#f59e0b" />
                                                <stop offset="100%" stopColor="#ef4444" />
                                            </linearGradient>
                                        </defs>

                                        {/* 배경 아크 */}
                                        <path d="M 20 65 A 50 50 0 0 1 120 65" fill="none" stroke="#1a1a1a" strokeWidth="12" strokeLinecap="round" />

                                        {/* 컬러 아크 */}
                                        <path d="M 20 65 A 50 50 0 0 1 120 65" fill="none" stroke="url(#floodGaugeGradient)" strokeWidth="12" strokeLinecap="round" strokeDasharray="157" strokeDashoffset={157 - 157 * ((infrastructureStatus.floodRiskZones[floodRiskZoneIndex]?.percentage || 0) / 100)} style={{ transition: "stroke-dashoffset 1s ease-out" }} />

                                        {/* 바늘 */}
                                        <g style={{ transformOrigin: "70px 65px", transform: `rotate(${-90 + 180 * ((infrastructureStatus.floodRiskZones[floodRiskZoneIndex]?.percentage || 0) / 100)}deg)`, transition: "transform 1s ease-out" }}>
                                            <line x1="70" y1="65" x2="70" y2="20" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                                            <circle cx="70" cy="65" r="6" fill="#fff" />
                                        </g>
                                    </svg>
                                    {/* 플로팅 상태 텍스트 */}
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-2">
                                        {(() => {
                                            const percentage = infrastructureStatus.floodRiskZones[floodRiskZoneIndex]?.percentage || 0;
                                            if (percentage < 33) {
                                                return (
                                                    <div className="px-2 py-1.5 rounded-full bg-green-500/20 backdrop-blur-sm border border-green-500/30 flex items-center justify-center">
                                                        <span className="text-green-400 text-[10px] font-medium leading-none">{t('leftPanel.safety.statusNormal')}</span>
                                                    </div>
                                                );
                                            } else if (percentage < 66) {
                                                return (
                                                    <div className="px-2 py-1.5 rounded-full bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/30 flex items-center justify-center">
                                                        <span className="text-yellow-400 text-[10px] font-medium leading-none">{t('leftPanel.safety.statusCaution')}</span>
                                                    </div>
                                                );
                                            } else {
                                                return (
                                                    <div className="px-2 py-1.5 rounded-full bg-red-500/20 backdrop-blur-sm border border-red-500/30 flex items-center justify-center">
                                                        <span className="text-red-400 text-[10px] font-medium leading-none">{t('leftPanel.safety.statusDanger')}</span>
                                                    </div>
                                                );
                                            }
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 노후·위험시설 관리 필요도 */}
                        <div className="bg-[#393a42] px-3 pt-3 pb-0 min-w-0 overflow-hidden rounded-lg">
                            <div className="flex items-start justify-between mb-1">
                                <div className="text-gray-400 text-xs font-semibold">
                                    <div>{t('leftPanel.safety.facilityRiskLine1')}</div>
                                    {/* 영문 모드에서는 두 번째 줄(관리 필요도) 생략 — line1만으로 충분히 의미 전달됨 */}
                                    {!i18n.language?.startsWith('en') && (
                                        <div>{t('leftPanel.safety.facilityRiskLine2')}</div>
                                    )}
                                </div>
                                <span className="text-white text-xs">{infrastructureStatus.facilityRiskZones[facilityRiskZoneIndex]?.zone}</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="relative" style={{ width: "140px", height: "90px" }}>
                                    <svg width="140" height="90" viewBox="0 0 140 90">
                                        <defs>
                                            <linearGradient id="facilityGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#10b981" />
                                                <stop offset="50%" stopColor="#f59e0b" />
                                                <stop offset="100%" stopColor="#ef4444" />
                                            </linearGradient>
                                        </defs>

                                        {/* 배경 아크 */}
                                        <path d="M 20 65 A 50 50 0 0 1 120 65" fill="none" stroke="#1a1a1a" strokeWidth="12" strokeLinecap="round" />

                                        {/* 컬러 아크 */}
                                        <path d="M 20 65 A 50 50 0 0 1 120 65" fill="none" stroke="url(#facilityGaugeGradient)" strokeWidth="12" strokeLinecap="round" strokeDasharray="157" strokeDashoffset={157 - 157 * ((infrastructureStatus.facilityRiskZones[facilityRiskZoneIndex]?.percentage || 0) / 100)} style={{ transition: "stroke-dashoffset 1s ease-out" }} />

                                        {/* 바늘 */}
                                        <g style={{ transformOrigin: "70px 65px", transform: `rotate(${-90 + 180 * ((infrastructureStatus.facilityRiskZones[facilityRiskZoneIndex]?.percentage || 0) / 100)}deg)`, transition: "transform 1s ease-out" }}>
                                            <line x1="70" y1="65" x2="70" y2="20" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                                            <circle cx="70" cy="65" r="6" fill="#fff" />
                                        </g>
                                    </svg>
                                    {/* 플로팅 상태 텍스트 */}
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-2">
                                        {(() => {
                                            const percentage = infrastructureStatus.facilityRiskZones[facilityRiskZoneIndex]?.percentage || 0;
                                            if (percentage < 35) {
                                                return (
                                                    <div className="px-2 py-1.5 rounded-full bg-green-500/20 backdrop-blur-sm border border-green-500/30 flex items-center justify-center">
                                                        <span className="text-green-400 text-[10px] font-medium leading-none">{t('leftPanel.safety.levelLow')}</span>
                                                    </div>
                                                );
                                            } else if (percentage < 70) {
                                                return (
                                                    <div className="px-2 py-1.5 rounded-full bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/30 flex items-center justify-center">
                                                        <span className="text-yellow-400 text-[10px] font-medium leading-none">{t('leftPanel.safety.levelMedium')}</span>
                                                    </div>
                                                );
                                            } else {
                                                return (
                                                    <div className="px-2 py-1.5 rounded-full bg-red-500/20 backdrop-blur-sm border border-red-500/30 flex items-center justify-center">
                                                        <span className="text-red-400 text-[10px] font-medium leading-none">{t('leftPanel.safety.levelHigh')}</span>
                                                    </div>
                                                );
                                            }
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 시설물 운영 상태 */}
                    <div className="grid grid-cols-3 gap-3">
                        {/* 도로 조명 */}
                        <div className="bg-[#393a42] px-3 py-3 rounded-lg">
                            <div className="flex items-center justify-between gap-4 mb-2">
                                <span className="text-gray-400 text-xs font-semibold">{t('leftPanel.facility.streetLight')}</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                                    <span className="text-gray-400 text-xs whitespace-nowrap">{t('leftPanel.facility.normal')}</span>
                                    <span className="text-green-400 text-xs font-medium ml-auto">{infrastructureStatus.streetLight.normalCount.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                                    <span className="text-gray-400 text-xs whitespace-nowrap">{t('leftPanel.facility.error')}</span>
                                    <span className="text-red-400 text-xs font-medium ml-auto">{infrastructureStatus.streetLight.errorCount}</span>
                                </div>
                            </div>
                        </div>

                        {/* 교통신호 */}
                        <div className="bg-[#393a42] px-3 py-3 rounded-lg">
                            <div className="flex items-center justify-between gap-4 mb-2">
                                <span className="text-gray-400 text-xs font-semibold">{t('leftPanel.facility.trafficSignal')}</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                                    <span className="text-gray-400 text-xs whitespace-nowrap">{t('leftPanel.facility.normal')}</span>
                                    <span className="text-green-400 text-xs font-medium ml-auto">{infrastructureStatus.trafficSignal.normalCount.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                                    <span className="text-gray-400 text-xs whitespace-nowrap">{t('leftPanel.facility.error')}</span>
                                    <span className="text-red-400 text-xs font-medium ml-auto">{infrastructureStatus.trafficSignal.errorCount}</span>
                                </div>
                            </div>
                        </div>

                        {/* 안전 비상벨 */}
                        <div className="bg-[#393a42] px-3 py-3 rounded-lg">
                            <div className="flex items-center justify-between gap-4 mb-2">
                                <span className="text-gray-400 text-xs font-semibold">{t('leftPanel.facility.emergencyBell')}</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                                    <span className="text-gray-400 text-xs whitespace-nowrap">{t('leftPanel.facility.normal')}</span>
                                    <span className="text-green-400 text-xs font-medium ml-auto">{infrastructureStatus.emergencyBell.normalCount.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                                    <span className="text-gray-400 text-xs whitespace-nowrap">{t('leftPanel.facility.error')}</span>
                                    <span className="text-red-400 text-xs font-medium ml-auto">{infrastructureStatus.emergencyBell.errorCount}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeftPanel;
