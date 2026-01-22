import { Icon } from '@iconify/react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { getRandomCCTVVideo } from '@/lib/cctv-video-utils';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';

interface MonitoringSpot {
  spotId: string;
  spotName: string;
  streamUrl?: string;
  thumbnails?: string[]; // 여러 썸네일 (2-3개)
  fps: number;
  status: 'normal' | 'delay' | 'disconnected';
  autoSequence: boolean;
  environment?: 'normal' | 'night' | 'fog' | 'rain'; // 환경 상태
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
  airQuality: '안정' | '양호' | '주의';
  monitorState: '정상' | '집중' | '경보';
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
  pm25: { value: number; level: 'good' | 'normal' | 'bad' };
  pm10: { value: number; level: 'good' | 'normal' | 'bad' };
  temperature: { value: number; level: 'good' | 'normal' | 'bad' };
  humidity: { value: number; level: 'good' | 'normal' | 'bad' };
  rainfall: { value: number; level: 'good' | 'normal' | 'bad' };
  windSpeed: { value: number; level: 'good' | 'normal' | 'bad' };
  lastUpdate: string; // timestamp
}

interface InfrastructureStatus {
  waterLeakage: { status: 'normal' | 'warning' | 'error'; lastUpdate: string };
  powerSupply: { status: 'normal' | 'warning' | 'error'; lastUpdate: string };
  streetLightRate: number; // 가로등 점등률 (%)
  iotSensorRate: number; // 공공 IoT 센서 가동률 (%)
  alert: boolean;
  alertMessage?: string;
}

/**
 * 📡 API 연동 필요: CCTV 썸네일 이미지
 * 현재: 로컬 정적 이미지 사용
 * 변경: API에서 썸네일 URL 조회 필요
 */
const cctvLocalImages = [
  '/cctv_img/001.jpg',
  '/cctv_img/002.jpg',
  '/cctv_img/003.jpg',
  '/cctv_img/004.jpg',
  '/cctv_img/005.jpg',
];

/**
 * 📡 API 연동 필요: CCTV 썸네일 생성
 * 현재: 로컬 이미지 순환
 * 변경: API에서 실제 썸네일 URL 배열 반환
 */
const buildThumbnails = (identifier: string, count = 3) => {
  const seed = identifier
    .split('')
    .reduce((acc, char, idx) => acc + char.charCodeAt(0) * (idx + 1), 0);

  return Array.from({ length: count }, (_, idx) => {
    const nextIndex = (seed + idx) % cctvLocalImages.length;
    return cctvLocalImages[nextIndex];
  });
};

const LeftPanel = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentStreamIndex, setCurrentStreamIndex] = useState(0);
  const [spotThumbnailIndices, setSpotThumbnailIndices] = useState<Record<string, number>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [areaPage, setAreaPage] = useState(0);
  const [heatmapAreaOffset, setHeatmapAreaOffset] = useState(0);
  const [heatmapAnimationKey, setHeatmapAnimationKey] = useState(0);
  const [previousHeatmapData, setPreviousHeatmapData] = useState<Record<string, Record<string, number>>>({});
  const previousHeatmapDataRef = useRef<Record<string, Record<string, number>>>({});
  /**
   * ============================================================================
   * 📡 API 연동 포인트: 센서 데이터 및 상태 정보
   * ============================================================================
   * 현재: 더미 데이터 및 로컬 상태 관리
   * 변경: API 호출로 실시간 데이터 조회 필요
   * ============================================================================
   */
  
  // 📡 API 연동 필요: 환경 센서 데이터
  // GET /api/sensors/realtime
  const [sensorValues, setSensorValues] = useState({
    pm25: 38,
    pm10: 72,
    temperature: 11,
    humidity: 62,
    rainfall: 0.3,
    windSpeed: 1.2,
  });
  
  const [clockTime, setClockTime] = useState<string>('');
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');
  const [waterLeakageTime, setWaterLeakageTime] = useState<string>('');
  const [powerSupplyTime, setPowerSupplyTime] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);
  
  // 📡 API 연동 필요: 날씨 데이터
  // GET /api/weather/current
  const weatherData = {
    icon: 'mdi:weather-partly-cloudy',
    high: 25, // 섭씨
    low: 18, // 섭씨
  };
  
  useEffect(() => {
    setIsMounted(true);
    const formatTime = () =>
      new Date().toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });

    setClockTime(formatTime());
    setLastUpdateTime(formatTime());
    const timer = setInterval(() => {
      setClockTime(formatTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
    
    // 현재: 더미 데이터 (개발용)
    const interval = setInterval(() => {
      setSensorValues((prev) => ({
        pm25: Math.max(0, prev.pm25 + (Math.random() - 0.5) * 4),
        pm10: Math.max(0, prev.pm10 + (Math.random() - 0.5) * 6),
        temperature: prev.temperature + (Math.random() - 0.5) * 0.5,
        humidity: Math.max(0, Math.min(100, prev.humidity + (Math.random() - 0.5) * 2)),
        rainfall: Math.max(0, prev.rainfall + (Math.random() - 0.5) * 0.2),
        windSpeed: Math.max(0, prev.windSpeed + (Math.random() - 0.5) * 0.3),
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  /**
   * 📡 API 연동 필요: CCTV 운영 현황 데이터
   * 현재: 더미 데이터
   * 변경: GET /api/cctv/status
   */
  const cctvStatus: CctvStatus = {
    totalRate: 96.1,
    totalCount: 1240,
    normalCount: 1192,
    errorCount: 48,
    delayCount: 12,
    areaStatus: [
      {
        area: '원미동',
        total: 182,
        normal: 176,
        delay: 4,
        error: 2,
        uptime: 96,
        streamRate: 91,
        online: 176,
        offline: 6,
        warning: 1,
        maintenance: 0,
        airQuality: '양호',
        monitorState: '정상',
      },
      {
        area: '중동',
        total: 205,
        normal: 198,
        delay: 5,
        error: 2,
        uptime: 93,
        streamRate: 88,
        online: 198,
        offline: 7,
        warning: 2,
        maintenance: 1,
        airQuality: '양호',
        monitorState: '집중',
      },
      {
        area: '심곡동',
        total: 210,
        normal: 203,
        delay: 5,
        error: 2,
        uptime: 95,
        streamRate: 90,
        online: 203,
        offline: 7,
        warning: 1,
        maintenance: 0,
        airQuality: '안정',
        monitorState: '정상',
      },
      {
        area: '부천로',
        total: 96,
        normal: 90,
        delay: 4,
        error: 2,
        uptime: 89,
        streamRate: 84,
        online: 90,
        offline: 6,
        warning: 1,
        maintenance: 1,
        airQuality: '주의',
        monitorState: '집중',
      },
      {
        area: '춘의동',
        total: 134,
        normal: 127,
        delay: 5,
        error: 2,
        uptime: 92,
        streamRate: 86,
        online: 127,
        offline: 7,
        warning: 1,
        maintenance: 0,
        airQuality: '양호',
        monitorState: '정상',
      },
      {
        area: '부천중앙시장 일대',
        total: 108,
        normal: 101,
        delay: 5,
        error: 2,
        uptime: 90,
        streamRate: 82,
        online: 101,
        offline: 7,
        warning: 2,
        maintenance: 1,
        airQuality: '주의',
        monitorState: '집중',
      },
    ],
    monitoringSpots: [
      {
        spotId: '1',
        spotName: '중앙역 출입구 2번',
        fps: 29,
        status: 'delay',
        autoSequence: true,
        thumbnails: buildThumbnails('spot-1'),
        environment: 'normal',
      },
      {
        spotId: '2',
        spotName: '경찰서 앞',
        fps: 30,
        status: 'normal',
        autoSequence: true,
        thumbnails: buildThumbnails('spot-2'),
        environment: 'night',
      },
      {
        spotId: '3',
        spotName: '평촌대로 교차로',
        fps: 28,
        status: 'normal',
        autoSequence: true,
        thumbnails: buildThumbnails('spot-3'),
        environment: 'fog',
      },
      {
        spotId: '4',
        spotName: '터널 입구',
        fps: 30,
        status: 'normal',
        autoSequence: false,
        thumbnails: buildThumbnails('spot-4'),
        environment: 'normal',
      },
      {
        spotId: '5',
        spotName: '부천역 광장',
        fps: 27,
        status: 'delay',
        autoSequence: true,
        thumbnails: buildThumbnails('spot-5'),
        environment: 'rain',
      },
      {
        spotId: '6',
        spotName: '중앙시장 입구',
        fps: 30,
        status: 'normal',
        autoSequence: false,
        thumbnails: buildThumbnails('spot-6'),
        environment: 'normal',
      },
    ],
  };

  const areasPerPage = 2;
  const totalAreaPages = Math.ceil(cctvStatus.areaStatus.length / areasPerPage);
  const visibleAreas = cctvStatus.areaStatus.slice(areaPage * areasPerPage, areaPage * areasPerPage + areasPerPage);

  // 모든 지역 목록 (히트맵 롤링용) - useEffect보다 먼저 정의 (부천시 동 단위만)
  const allHeatmapAreas = useMemo(() => {
    return [
      '원미동',
      '심곡동',
      '춘의동',
      '도당동',
      '약대동',
      '중동',
      '상동',
      '소사동',
      '역곡동',
      '여월동',
      '작동',
      '고강동',
      '오정동',
      '신흥동',
      '삼정동',
      '부개동',
      '원종동',
    ];
  }, []);

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
      // 히트맵 지역 롤링 (5초마다) - 6개씩 한 판으로 전환
      // 애니메이션을 위해 현재 데이터를 이전 데이터로 저장 (offset 변경 전)
      // ref에 먼저 저장 (동기적으로)
      const currentDataCopy = JSON.parse(JSON.stringify(heatmapData));
      previousHeatmapDataRef.current = currentDataCopy;
      // state에도 저장 (비동기)
      setPreviousHeatmapData(currentDataCopy);
      // 그 다음 offset 변경 및 애니메이션 트리거
      setHeatmapAreaOffset((prev) => (prev + 6) % allHeatmapAreas.length);
      setHeatmapAnimationKey((prev) => prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, [totalAreaPages, allHeatmapAreas.length]);

  const getLevelText = (level: 'good' | 'normal' | 'bad') => {
    switch (level) {
      case 'good':
        return '양호';
      case 'normal':
        return '보통';
      case 'bad':
        return '나쁨';
      default:
        return '보통';
    }
  };

  const getPm25Level = (value: number): 'good' | 'normal' | 'bad' => {
    if (value <= 15) return 'good';
    if (value <= 35) return 'normal';
    return 'bad';
  };

  const getPm10Level = (value: number): 'good' | 'normal' | 'bad' => {
    if (value <= 30) return 'good';
    if (value <= 80) return 'normal';
    return 'bad';
  };

  const getTemperatureLevel = (value: number): 'good' | 'normal' | 'bad' => {
    if (value >= 18 && value <= 26) return 'good';
    if (value >= 10 && value <= 30) return 'normal';
    return 'bad';
  };

  const getHumidityLevel = (value: number): 'good' | 'normal' | 'bad' => {
    if (value >= 40 && value <= 60) return 'good';
    if (value >= 30 && value <= 70) return 'normal';
    return 'bad';
  };

  const getRainfallLevel = (value: number): 'good' | 'normal' | 'bad' => {
    if (value <= 0.5) return 'good';
    if (value <= 2.0) return 'normal';
    return 'bad';
  };

  const getWindSpeedLevel = (value: number): 'good' | 'normal' | 'bad' => {
    if (value <= 2.0) return 'good';
    if (value <= 5.0) return 'normal';
    return 'bad';
  };

  const infrastructureRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const sensorData: SensorData = {
    pm25: { value: sensorValues.pm25, level: getPm25Level(sensorValues.pm25) },
    pm10: { value: sensorValues.pm10, level: getPm10Level(sensorValues.pm10) },
    temperature: { value: sensorValues.temperature, level: getTemperatureLevel(sensorValues.temperature) },
    humidity: { value: sensorValues.humidity, level: getHumidityLevel(sensorValues.humidity) },
    rainfall: { value: sensorValues.rainfall, level: getRainfallLevel(sensorValues.rainfall) },
    windSpeed: { value: sensorValues.windSpeed, level: getWindSpeedLevel(sensorValues.windSpeed) },
    lastUpdate: new Date().toISOString(),
  };

  const collapsedIndicators = [
    { label: '정상', value: cctvStatus.normalCount, dot: 'bg-green-400', color: 'text-green-400' },
    { label: '장애', value: cctvStatus.errorCount, dot: 'bg-red-400', color: 'text-red-400' },
    { label: '지연', value: cctvStatus.delayCount, dot: 'bg-yellow-400', color: 'text-yellow-400' },
  ];

  /**
   * 📡 API 연동 필요: 도시 기반시설 운영 상태
   * 현재: 더미 데이터
   * 변경: GET /api/infrastructure/status
   */
  const infrastructureStatus: InfrastructureStatus = useMemo(() => {
    const now = typeof window !== 'undefined' ? new Date().toISOString() : '';
    return {
      waterLeakage: { status: 'error', lastUpdate: now },
      powerSupply: { status: 'normal', lastUpdate: now },
      streetLightRate: 92,
      iotSensorRate: 95.5,
      alert: true,
      alertMessage: '상수도 관망 이상 징후',
    };
  }, []);

  useEffect(() => {
    if (!isMounted || typeof window === 'undefined') return;
    
    const formatInfrastructureTime = (isoString: string) => {
      if (!isoString) return '--:--:--';
      return new Date(isoString).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
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
      case 'normal':
      case 'good':
        return 'text-green-400';
      case 'delay':
      case 'warning':
        return 'text-yellow-400';
      case 'error':
      case 'bad':
      case 'disconnected':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal':
      case 'good':
        return 'mdi:check-circle';
      case 'delay':
      case 'warning':
        return 'mdi:alert-circle';
      case 'error':
      case 'bad':
      case 'disconnected':
        return 'mdi:alert';
      default:
        return 'mdi:help-circle';
    }
  };

  const getLevelColor = (level: 'good' | 'normal' | 'bad') => {
    switch (level) {
      case 'good':
        return 'text-green-400';
      case 'normal':
        return 'text-yellow-400';
      case 'bad':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  };

  const getEnvironmentLabel = (env?: 'normal' | 'night' | 'fog' | 'rain') => {
    switch (env) {
      case 'night':
        return '야간';
      case 'fog':
        return '안개';
      case 'rain':
        return '우천';
      default:
        return '정상';
    }
  };

  const getEnvironmentColor = (env?: 'normal' | 'night' | 'fog' | 'rain') => {
    switch (env) {
      case 'night':
        return 'text-blue-400';
      case 'fog':
        return 'text-gray-400';
      case 'rain':
        return 'text-cyan-400';
      default:
        return 'text-green-400';
    }
  };

  useEffect(() => {
    if (!isCollapsed) {
      scrollContainerRef.current?.scrollTo({ top: 0 });
    }
  }, [isCollapsed]);

  const handleFacilityClick = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setTimeout(() => {
        infrastructureRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 350);
      return;
    }
    infrastructureRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const getSeededInt = (seed: string, maxInclusive: number) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % (maxInclusive + 1);
  };

  const trendData = useMemo(() => {
    const seedBase = typeof window !== 'undefined' ? new Date().toISOString().slice(0, 10) : 'static';
    // 더 부드러운 곡선 + 충분한 셰이프를 위해 30분 간격 포인트 사용 (48개)
    const hours = Array.from({ length: 48 }, (_, index) => index * 0.5); // 0 ~ 23.5시 (30분 간격)
    const maxValue = 800;
    const minValue = 0;
    const range = maxValue - minValue;

    return hours.map((hour) => {
      const t = hour / 23.5;
      // 기본 큰 파형 + 살짝 빠른 파형을 섞어서, 골과 봉우리가 있는 부드러운 곡선
      const wave1 = Math.sin(t * Math.PI * 2) * 1.0; // 메인 파형 (진폭 조금 더 키움)
      const wave2 = Math.sin(t * Math.PI * 4) * 0.5; // 디테일용 서브 파형도 약간 키움
      const baseWave = (wave1 + wave2) / 1.4; // 너무 과하지 않게 한 번 눌러줌

      const noiseSeed = getSeededInt(`${seedBase}-${Math.floor(hour)}`, 100);
      const noise = (noiseSeed / 100 - 0.5) * 0.04; // 노이즈는 더 줄여서 형태만 살짝 깨주는 정도

      const shaped = baseWave + noise; // -1 ~ 1 근처의 파형
      const value = minValue + (range / 2) + shaped * (range / 2); // 0~800 안에서 굴곡만 더 강하게

      return {
        hour: hour % 1 === 0 ? hour.toString().padStart(2, '0') : '', // 정수 시간만 라벨로 사용
        value: Math.round(value * 10) / 10,
      };
    });
  }, []);

  const renderTrendXAxisTick = (props: any) => {
    const { x, y, payload } = props ?? {};
    const raw = payload?.value;
    if (!raw) return null;

    const hour = Number.parseInt(String(raw), 10);
    if (Number.isNaN(hour) || hour % 2 !== 0) return null;

    const label = String(hour).padStart(2, '0');
    const isLast = hour === 22;

    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={12} textAnchor="middle" fill="#9ca3af" fontSize={12}>
          {label}
        </text>
        {isLast ? (
          <text x={0} y={0} dy={28} textAnchor="middle" fill="#9ca3af" fontSize={12}>
            (시)
          </text>
        ) : null}
      </g>
    );
  };

  const renderTrendYAxisTick = (props: any) => {
    const { x, y, payload } = props ?? {};
    const value = Number(payload?.value);
    if (Number.isNaN(value)) return null;

    const isTop = value === 800;

    return (
      <g transform={`translate(${x},${y})`}>
        {isTop ? (
          <text x={0} y={0} dy={-12} textAnchor="end" fill="#9ca3af" fontSize={12}>
            (건)
          </text>
        ) : null}
        <text x={0} y={0} dy={4} textAnchor="end" fill="#9ca3af" fontSize={12}>
          {value}
        </text>
      </g>
    );
  };

  const heatmapTimeSlots = useMemo(() => {
    return Array.from({ length: 12 }, (_, idx) => {
      const hour = idx * 2;
      const padded = hour.toString().padStart(2, '0');
      return {
        key: `${padded}`,
        label: padded,
        startHour: hour,
      };
    });
  }, []);

  // 현재 표시할 지역 (6개씩 롤링)
  const heatmapAreas = useMemo(() => {
    const startIndex = heatmapAreaOffset % allHeatmapAreas.length;
    const result: string[] = [];
    for (let i = 0; i < 6; i++) {
      const index = (startIndex + i) % allHeatmapAreas.length;
      result.push(allHeatmapAreas[index]);
    }
    return result;
  }, [heatmapAreaOffset, allHeatmapAreas]);


  type HeatmapBucket = 'none' | 'low' | 'mid' | 'high';
  const getHeatmapBucket = (count: number): HeatmapBucket => {
    if (count <= 0) return 'none';
    if (count <= 2) return 'low';
    if (count <= 5) return 'mid';
    return 'high';
  };

  const getHeatmapCellClassName = (count: number) => {
    const bucket = getHeatmapBucket(count);
    // none 은 살짝 더 밝은 blue-gray 톤, 나머지는 현재 톤 유지
    if (bucket === 'none') return 'bg-[#1f2937]';         // 기존보다 살짝 밝은 blue-gray
    if (bucket === 'low') return 'bg-[#3b5a8c]';          // 1–2건 (파란 계열)
    if (bucket === 'mid') return 'bg-[#005eb8]';          // 3–5건 (요청 컬러)
    return 'bg-[#F87171]';                                // 6+ (강조 레드)
  };

  const heatmapData = useMemo(() => {
    const nowSeed = typeof window !== 'undefined' ? new Date().toISOString().slice(0, 10) : 'static';
    const result: Record<string, Record<string, number>> = {};

    heatmapAreas.forEach((area) => {
      result[area] = {};
      heatmapTimeSlots.forEach((slot) => {
        // 기본 분포는 None이 많고 6+가 적게, 다만 셀마다 임계값을 살짝씩 흔들어서 패턴이 더 랜덤하게 보이도록 처리
        const baseRand = getSeededInt(`${nowSeed}:${area}:${slot.key}`, 100); // 0~100
        const jitter = getSeededInt(`${nowSeed}:${area}:${slot.key}:j`, 11) - 5; // -5 ~ +5

        const noneThreshold = 55 + jitter; // 약 50~60% 정도 None
        const lowThreshold = noneThreshold + 25; // 그 다음 20~30% 정도 1~2건
        const midThreshold = lowThreshold + 15; // 그 다음 10~20% 정도 3~5건

        let value: number;
        if (baseRand < noneThreshold) {
          value = 0;
        } else if (baseRand < lowThreshold) {
          value = 1 + getSeededInt(`${nowSeed}:${area}:${slot.key}:low`, 1); // 1~2
        } else if (baseRand < midThreshold) {
          value = 3 + getSeededInt(`${nowSeed}:${area}:${slot.key}:mid`, 2); // 3~5
        } else {
          value = 6 + getSeededInt(`${nowSeed}:${area}:${slot.key}:high`, 3); // 6~9 (아주 드물게)
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

  return (
    <div
      className={`${isCollapsed ? 'w-20' : ''} bg-[#242a34] border-r border-[#31353a] flex flex-col overflow-hidden relative transition-all duration-300`}
      style={{ 
        borderWidth: '1px',
        height: '100%',
        minHeight: 0,
        width: isCollapsed ? '5rem' : '30rem',
      }}
    >
      <button
        onClick={() => setIsCollapsed((prev) => !prev)}
        className="absolute top-1/2 -translate-y-1/2 -right-2 w-8 h-14 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-white transition-colors focus:outline-none"
        aria-label={isCollapsed ? '좌측 패널 펼치기' : '좌측 패널 접기'}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50 scale-75" />
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50 scale-75" />
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50 scale-75" />
      </button>

      {isCollapsed ? (
        <div className="flex-1 flex flex-col items-center justify-between py-8 pl-4 pr-2 gap-6 text-[0.65rem] text-gray-300">
          <div className="flex flex-col items-center gap-2 text-[10.4px]">
            <span className="text-white font-semibold tracking-tight text-center leading-tight">
              CCTV<br />상태
            </span>
            {collapsedIndicators.map((indicator) => (
              <div key={indicator.label} className="flex flex-col items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${indicator.dot}`} />
                <span className="text-white">{indicator.label}</span>
                <span className={`${indicator.color} text-sm font-semibold`}>
                  {indicator.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          <div className="flex flex-col items-center gap-2 text-[10.4px]">
            <span className="text-white font-semibold tracking-tight text-center leading-tight">
              환경<br />지표
            </span>
            {[
              { icon: 'mdi:blur', label: 'PM2.5', value: `${sensorData.pm25.value.toFixed(0)}㎍/m³` },
              { icon: 'mdi:blur-linear', label: 'PM10', value: `${sensorData.pm10.value.toFixed(0)}㎍/m³` },
              { icon: 'mdi:thermometer', label: '온도', value: `${sensorData.temperature.value.toFixed(0)}°` },
              { icon: 'mdi:water-percent', label: '습도', value: `${sensorData.humidity.value.toFixed(0)}%` },
              { icon: 'mdi:weather-rainy', label: '강수량', value: `${sensorData.rainfall.value.toFixed(1)}mm` },
              { icon: 'mdi:weather-windy', label: '풍속', value: `${sensorData.windSpeed.value.toFixed(1)}m/s` },
            ].map((sensor) => (
              <div key={sensor.label} className="flex flex-col items-center gap-1 text-center">
                <Icon icon={sensor.icon} className="w-4 h-4 text-gray-200" />
                <span className="text-white">{sensor.label}</span>
                <span className="text-blue-300 font-semibold">{sensor.value}</span>
              </div>
            ))}
          </div>
          <button
            onClick={handleFacilityClick}
            className="flex flex-col items-center gap-1 text-center text-[10.4px] focus:outline-none"
          >
            <Icon icon="mdi:alert" className="w-4 h-4 text-red-400" />
            <span className="text-white">시설장애</span>
            <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-300" style={{ borderRadius: '9999px' }}>
              {infrastructureStatus.alert ? 1 : 0}
            </span>
          </button>
        </div>
      ) : (
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden pt-4 pb-4 pl-6 pr-6 space-y-3"
          ref={scrollContainerRef}
          style={{ maxWidth: '100%' }}
        >
        {/* 상단 헤더: 좌측 로고, 우측 날씨 + 시간 */}
        <div className="flex items-center justify-between pb-2 mb-4 border-b border-[#31353a]">
          {/* 좌측: 패널 로고 */}
          <div className="flex items-center gap-2">
            <img
              src="/logo.svg"
              alt="CUVIA"
              className="h-5 w-auto object-contain"
            />
          </div>

          {/* 우측: 날씨 + 시간 (시간을 뒤로) */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Icon icon={weatherData.icon} className="w-6 h-6 text-white" />
              <div className="flex items-baseline gap-1">
                <span className="text-white text-sm font-medium">{weatherData.high}°</span>
                <span className="text-gray-400 text-xs">/</span>
                <span className="text-gray-400 text-xs">{weatherData.low}°</span>
              </div>
            </div>
            <div className="text-white text-sm font-medium">
              {clockTime || '--:--:--'}
            </div>
          </div>
        </div>

        {/* CCTV 운영 현황 (상세 카드) */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-white font-semibold text-sm">CCTV 운영 현황</h3>
            {/* 정상/장애/지연 장비 수 */}
            <div className="flex items-center gap-x-2 gap-y-2 flex-wrap ml-auto">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                <span className="text-gray-400 text-xs whitespace-nowrap">정상</span>
                <span className="text-green-400 text-xs font-medium">{cctvStatus.normalCount.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                <span className="text-gray-400 text-xs whitespace-nowrap">장애</span>
                <span className="text-red-400 text-xs font-medium">{cctvStatus.errorCount}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0" />
                <span className="text-gray-400 text-xs whitespace-nowrap">지연</span>
                <span className="text-yellow-400 text-xs font-medium">{cctvStatus.delayCount}</span>
              </div>
            </div>
          </div>
                  
          {/* 전체 요약 데이터 */}
          <div className="space-y-3">
            {/* 전체 CCTV 가동률과 총 CCTV 수 (큰 숫자 스코어 스타일) */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="text-gray-400 text-xs mb-1 mt-2">전체 CCTV 가동률</div>
                <div className="text-white text-2xl font-bold">
                  {cctvStatus.totalRate}
                  <span className="text-xl">%</span>
                </div>
              </div>
              <div className="w-px h-12 bg-[#31353a]" />
              <div className="flex-1">
                <div className="text-gray-400 text-xs mb-1 mt-2">총 CCTV 수</div>
                <div className="text-white text-2xl font-bold">
                  {cctvStatus.totalCount.toLocaleString()}
                  <span className="text-xl">대</span>
                </div>
              </div>
            </div>
          </div>

          {/* 지역별 CCTV 운영 현황 카드 (막대 그래프 포함) */}
          <div className="space-y-4 mt-3">
            <div className="grid grid-cols-2 gap-3 min-w-0">
              {visibleAreas.map((area, areaIndex) => (
                <div
                  key={`${area.area}-${areaPage}`}
                  className="bg-[#393a42] px-3 py-2 space-y-3 min-w-0 overflow-hidden rounded-lg"
                >
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm font-semibold truncate">{area.area}</p>
                    </div>
                    <Icon icon="mdi:chevron-right" className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 min-w-0">
                    <div className="min-w-0">
                      <p className="text-gray-400 text-xs font-semibold tracking-tight truncate">장비 작동률</p>
                      <p className="text-white text-xl">{area.uptime}%</p>
                      <div className="w-full h-3 bg-[#1a1a1a] mt-1 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full progress-bar-fill"
                          style={{ 
                            width: `${area.uptime}%`,
                            '--target-width': `${area.uptime}%`,
                            animationDelay: `${areaIndex * 100}ms`,
                            background: 'linear-gradient(90deg, #0066FF 0%, #8A2BE2 100%)',
                          } as React.CSSProperties}
                        />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-gray-400 text-xs font-semibold tracking-tight truncate">영상 수신율</p>
                      <p className="text-white text-xl">{area.streamRate}%</p>
                      <div className="w-full h-3 bg-[#1a1a1a] mt-1 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full progress-bar-fill"
                          style={{ 
                            width: `${area.streamRate}%`,
                            '--target-width': `${area.streamRate}%`,
                            animationDelay: `${areaIndex * 100 + 150}ms`,
                            background: 'linear-gradient(90deg, #0066FF 0%, #8A2BE2 100%)',
                          } as React.CSSProperties}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <style>{`
            @keyframes progressBarFill {
              0% {
                width: 0%;
              }
              100% {
                width: var(--target-width);
              }
            }
            
            .progress-bar-fill {
              animation: progressBarFill 1s ease-out both;
            }
          `}</style>
        </div>

        {/* 시간별 이벤트 트렌드 (X축: 시간/날짜, Y축: 이벤트 발생 건수) */}
        <div className="mb-0 pt-0">
          <div className="flex items-center" style={{ paddingTop: '12px', paddingBottom: '0', marginBottom: '0' }}>
            <h3 className="text-white text-sm font-semibold">시간대 이벤트</h3>
          </div>
          <div className="overflow-hidden" style={{ paddingTop: '12px', paddingBottom: '12px', marginTop: '0' }}>
            <div className="flex justify-end">
              <div className="relative h-40 w-[418px] rounded-xl overflow-visible">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={trendData}
                    margin={{ top: 26, right: 4, left: 0, bottom: 34 }}
                  >
                    <defs>
                      <linearGradient id="eventWaveFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(0,102,255,0.28)" />
                        <stop offset="100%" stopColor="rgba(15,23,42,0.05)" />
                      </linearGradient>
                      <linearGradient id="eventWaveStroke" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#0066FF" />
                        <stop offset="50%" stopColor="#8A2BE2" />
                        <stop offset="100%" stopColor="#ff8566" />
                      </linearGradient>
                      <filter id="neonGlow">
                        <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      {/* 빛 반사 효과를 위한 그라디언트 */}
                      <linearGradient id="lightReflectionStroke" x1="0%" y1="0%" x2="100%" y2="0%" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                        <stop offset="30%" stopColor="rgba(255,255,255,0)" />
                        <stop offset="50%" stopColor="rgba(255,255,255,0.9)" />
                        <stop offset="70%" stopColor="rgba(255,255,255,0)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                        <animateTransform
                          attributeName="gradientTransform"
                          type="translate"
                          values="-200 0;400 0"
                          dur="5s"
                          repeatCount="indefinite"
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="1.5 2" stroke="rgba(107, 114, 128, 0.3)" opacity={1} />
                    <XAxis
                      dataKey="hour"
                      tick={renderTrendXAxisTick}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(107, 114, 128, 0.3)', strokeWidth: 1 }}
                      interval={3}
                      tickMargin={8}
                    />
                    <YAxis
                      domain={[0, 800]}
                      tick={renderTrendYAxisTick}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(107, 114, 128, 0.3)', strokeWidth: 1 }}
                      ticks={[0, 200, 400, 600, 800]}
                      width={40}
                      allowDecimals={false}
                    />
                    <Area
                      type="basis"
                      dataKey="value"
                      stroke="url(#eventWaveStroke)"
                      strokeWidth={3}
                      fill="url(#eventWaveFill)"
                      fillOpacity={0.9}
                    />
                    {/* 빛 반사 효과 - 선에만 적용 */}
                    <Area
                      type="basis"
                      dataKey="value"
                      stroke="url(#lightReflectionStroke)"
                      strokeWidth={4}
                      fill="none"
                      opacity={0.7}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
        </div>

        {/* 1) CCTV 운영 현황 상세 (그래프/지역별 카드 잠시 비노출) */}
        {false && (
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-white font-semibold text-sm">CCTV 운영 현황</h3>
              {/* 정상/장애/지연 장비 수 */}
              <div className="flex items-center gap-x-2 gap-y-2 flex-wrap ml-auto">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                  <span className="text-gray-400 text-xs whitespace-nowrap">정상</span>
                  <span className="text-green-400 text-xs font-medium">{cctvStatus.normalCount.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                  <span className="text-gray-400 text-xs whitespace-nowrap">장애</span>
                  <span className="text-red-400 text-xs font-medium">{cctvStatus.errorCount}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0" />
                  <span className="text-gray-400 text-xs whitespace-nowrap">지연</span>
                  <span className="text-yellow-400 text-xs font-medium">{cctvStatus.delayCount}</span>
                </div>
              </div>
            </div>
                    
            {/* 전체 요약 데이터 */}
            <div className="space-y-3">
              {/* 전체 CCTV 가동률과 총 CCTV 수 (큰 숫자 스코어 스타일) */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-gray-400 text-xs mb-1 mt-2">전체 CCTV 가동률</div>
                  <div className="text-white text-2xl font-bold">
                    {cctvStatus.totalRate}
                    <span className="text-xl">%</span>
                  </div>
                </div>
                <div className="w-px h-12 bg-[#31353a]" />
                <div className="flex-1">
                  <div className="text-gray-400 text-xs mb-1 mt-2">총 CCTV 수</div>
                  <div className="text-white text-2xl font-bold">
                    {cctvStatus.totalCount.toLocaleString()}
                    <span className="text-xl">대</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 지역별 CCTV 운영 현황 카드 (막대 그래프 포함) */}
            <div className="space-y-4 mt-3">
              <div className="grid grid-cols-2 gap-3 min-w-0">
                {visibleAreas.map((area) => (
                  <div
                    key={area.area}
                    className="p-3 space-y-3 min-w-0 overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-white text-sm font-semibold truncate">{area.area}</p>
                      </div>
                      <Icon icon="mdi:chevron-right" className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 min-w-0">
                      <div className="min-w-0">
                        <p className="text-gray-200 text-xs font-semibold tracking-tight truncate">장비 작동률</p>
                        <p className="text-white text-xl font-bold">{area.uptime}%</p>
                        <div className="w-full h-3 bg-[#1a1a1a] mt-1">
                          <div className="h-full bg-blue-500" style={{ width: `${area.uptime}%` }} />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="text-gray-200 text-xs font-semibold tracking-tight truncate">영상 수신율</p>
                        <p className="text-white text-xl font-bold">{area.streamRate}%</p>
                        <div className="w-full h-3 bg-[#1a1a1a] mt-1">
                          <div className="h-full bg-blue-500" style={{ width: `${area.streamRate}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[0.65rem] min-w-0">
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <span className="text-white truncate">경고</span>
                        <span className="text-orange-400 flex-shrink-0">{area.warning}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <span className="text-white truncate">장애</span>
                        <span className="text-red-400 flex-shrink-0">{area.error}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <span className="text-white truncate">지연</span>
                        <span className="text-yellow-400 flex-shrink-0">{area.delay}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <span className="text-white truncate">정비</span>
                        <span className="text-orange-400 flex-shrink-0">{area.maintenance}</span>
                      </div>
                    </div>

                    <div className="px-3 py-2">
                      <p className="text-gray-200 text-xs font-semibold">CCTV 총 수량</p>
                      <p className="text-white text-lg font-semibold">{area.total.toLocaleString()}대</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4) 발생 히트맵 (시간대 x 동) */}
        <div className="mb-4">
          <div className="flex items-center justify-between gap-4" style={{ paddingTop: '12px', paddingBottom: '0', marginBottom: '0' }}>
            <h3 className="text-white font-semibold text-sm">지역별 이벤트 발생 건 수</h3>
            <div className="flex items-center gap-4 text-[12px] text-gray-200">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-sm bg-[#1f2937] border border-gray-500/30" />
                <span>None</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-sm bg-[#3b5a8c]" />
                <span>1–2</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-sm bg-[#005eb8]" />
                <span>3–5</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-sm bg-[#F87171]" />
                <span>6+</span>
              </div>
            </div>
          </div>

          <div className="overflow-hidden" style={{ paddingTop: '12px', paddingBottom: '12px', marginTop: '0' }}>
            {/* 그리드 */}
            <div className="space-y-1 relative">
              {heatmapAreas.map((area, index) => {
                // 6개를 3개씩 2그룹으로 나누기 (애니메이션 타이밍용)
                const groupIndex = Math.floor(index / 3);
                const isFirstGroup = groupIndex === 0;
                const groupDelay = isFirstGroup ? 0 : 200;
                
                return (
                  <div
                    key={`${area}`}
                    className="flex items-center gap-0"
                  >
                    <div className="w-10 text-[12px] text-gray-400 truncate" title={area}>
                      {area}
                    </div>
                    <div className="grid grid-cols-12 gap-1 flex-1 min-w-0">
                      {heatmapTimeSlots.map((slot, slotIndex) => {
                        const count = heatmapData[area]?.[slot.key] ?? 0;
                        const bucket = getHeatmapBucket(count);
                        const isNowNone = bucket === 'none';
                        
                        const label = `${area} · ${slot.label}~${(slot.startHour + 2).toString().padStart(2, '0')}시 · ${count}건`;
                        const borderClass = bucket === 'none' ? 'border border-gray-500/30' : '';
                        
                        // 각 셀마다 랜덤한 지연으로 반짝이는 효과
                        const cellSeed = `${heatmapAnimationKey}-${area}-${slot.key}`;
                        const delaySeed = getSeededInt(`${cellSeed}-delay`, 100);
                        const cellDelay = (index * 50) + (slotIndex * 20) + (delaySeed % 100); // 행과 열에 따른 지연 + 랜덤
                        
                        // 새로운 색상 결정
                        const newColorClass = getHeatmapCellClassName(count);
                        const newColorValue = bucket === 'low' ? '#3b5a8c' : 
                                             bucket === 'mid' ? '#005eb8' : 
                                             bucket === 'high' ? '#F87171' : '#1f2937';
                        
                        // 애니메이션 적용: 판이 전환될 때(heatmapAnimationKey가 변경될 때) 모든 none이 아닌 셀에 적용
                        // 매우 단순화: 현재 none이 아니고 애니메이션 키가 0보다 크면 항상 애니메이션 적용
                        const shouldAnimate = !isNowNone && heatmapAnimationKey > 0;
                        
                        return (
                          <div
                            key={`${area}-${slot.key}-${heatmapAnimationKey}`}
                            className={`h-5 rounded-sm ${borderClass} ${!shouldAnimate ? newColorClass : ''} ${bucket !== 'none' ? 'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]' : ''} ${shouldAnimate ? 'heatmap-cell-sparkle-dissolve' : ''}`}
                            title={label}
                            aria-label={label}
                            style={{
                              '--new-color': newColorValue,
                              ...(shouldAnimate ? { 
                                backgroundColor: newColorValue,
                                animation: `heatmapCellSparkleDissolve 1.8s cubic-bezier(0.4, 0, 0.2, 1) ${cellDelay}ms both`,
                              } : {}),
                            } as React.CSSProperties}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <style>{`
              @keyframes heatmapCellSparkleDissolve {
                /* Phase 1: None 상태에서 반짝이기 (0-30%) */
                0% {
                  background-color: #1f2937;
                  opacity: 0.6;
                  transform: scale(1);
                  filter: brightness(0.8);
                }
                15% {
                  background-color: #1f2937;
                  opacity: 1;
                  transform: scale(1.05);
                  filter: brightness(1.5);
                }
                30% {
                  background-color: #1f2937;
                  opacity: 0.95;
                  transform: scale(1.08);
                  filter: brightness(1.3);
                }
                
                /* Phase 2: 새로운 컬러로 디졸브 (30-100%) */
                40% {
                  background-color: var(--new-color);
                  opacity: 0.4;
                  transform: scale(1.05);
                  filter: brightness(0.6) blur(1.5px);
                }
                55% {
                  background-color: var(--new-color);
                  opacity: 0.7;
                  transform: scale(1.08);
                  filter: brightness(1.1) blur(1px);
                }
                70% {
                  background-color: var(--new-color);
                  opacity: 0.9;
                  transform: scale(1.05);
                  filter: brightness(1.2) blur(0.5px);
                }
                85% {
                  background-color: var(--new-color);
                  opacity: 0.95;
                  transform: scale(1.02);
                  filter: brightness(1.05) blur(0.3px);
                }
                100% {
                  background-color: var(--new-color);
                  opacity: 1;
                  transform: scale(1);
                  filter: brightness(1) blur(0px);
                }
              }
              
              .heatmap-cell-sparkle-dissolve {
                animation: heatmapCellSparkleDissolve 1.8s cubic-bezier(0.4, 0, 0.2, 1) both;
              }
            `}</style>

            {/* X축 라벨 (아래) */}
            <div className="flex items-center gap-0 mt-2">
              <div className="w-10" />
              <div className="grid grid-cols-12 gap-1 flex-1 min-w-0">
                {heatmapTimeSlots.map((slot, index) => {
                  const isLast = index === heatmapTimeSlots.length - 1;
                  return (
                    <div key={slot.key} className="text-[12px] text-gray-400 text-center select-none">
                      {isLast ? (
                        <>
                          {slot.label}
                          <br />
                          (시)
                        </>
                      ) : (
                        `${slot.label}시`
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 2) 실시간 환경 센서 모니터링 */}
        <div className="mb-4">
          <div className="flex items-center justify-between" style={{ paddingTop: '12px', paddingBottom: '12px', marginBottom: '0' }}>
            <h3 className="text-white font-semibold text-sm">실시간 환경 센서 모니터링</h3>
            <span className="text-gray-300 text-xs">
              마지막 업데이트: {lastUpdateTime || '--:--:--'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 min-w-0" style={{ marginTop: '0' }}>
            {/* PM2.5 */}
            <div className="bg-[#393a42] p-3 min-w-0 overflow-hidden rounded-lg">
              <div className="flex items-center justify-between mb-1.5 gap-1 min-w-0">
                <div className="flex items-center gap-1 min-w-0">
                  <Icon icon="mdi:air-filter" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-400 text-xs truncate">PM2.5</span>
                </div>
                <span className={`px-2 py-0.5 border ${getLevelColor(sensorData.pm25.level)} text-[10px] whitespace-nowrap flex-shrink-0`} style={{ borderRadius: '9999px' }}>
                  {getLevelText(sensorData.pm25.level)}
                </span>
              </div>
              <div className="text-white text-base font-semibold transition-all duration-300">
                {sensorData.pm25.value.toFixed(1)}
                <span className="text-gray-400 text-xs ml-0.5">㎍/m³</span>
              </div>
            </div>

            {/* PM10 */}
            <div className="bg-[#393a42] p-3 min-w-0 overflow-hidden rounded-lg">
              <div className="flex items-center justify-between mb-1.5 gap-1 min-w-0">
                <div className="flex items-center gap-1 min-w-0">
                  <Icon icon="mdi:weather-dust" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-400 text-xs truncate">PM10</span>
                </div>
                <span className={`px-2 py-0.5 border ${getLevelColor(sensorData.pm10.level)} text-[10px] whitespace-nowrap flex-shrink-0`} style={{ borderRadius: '9999px' }}>
                  {getLevelText(sensorData.pm10.level)}
                </span>
              </div>
              <div className="text-white text-base font-semibold transition-all duration-300">
                {sensorData.pm10.value.toFixed(1)}
                <span className="text-gray-400 text-xs ml-0.5">㎍/m³</span>
              </div>
            </div>

            {/* 온도 */}
            <div className="bg-[#393a42] p-3 min-w-0 overflow-hidden rounded-lg">
              <div className="flex items-center gap-1 min-w-0 mb-1.5">
                <Icon icon="mdi:thermometer" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-gray-400 text-xs truncate">온도</span>
              </div>
              <div className="text-white text-base font-semibold transition-all duration-300">
                {sensorData.temperature.value.toFixed(1)}
                <span className="text-gray-400 text-xs ml-0.5">°C</span>
              </div>
            </div>

            {/* 습도 */}
            <div className="bg-[#393a42] p-3 min-w-0 overflow-hidden rounded-lg">
              <div className="flex items-center gap-1 min-w-0 mb-1.5">
                <Icon icon="mdi:water-percent" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-gray-400 text-xs truncate">습도</span>
              </div>
              <div className="text-white text-base font-semibold transition-all duration-300">
                {sensorData.humidity.value.toFixed(1)}
                <span className="text-gray-400 text-xs ml-0.5">%</span>
              </div>
            </div>

            {/* 강수량 */}
            <div className="bg-[#393a42] p-3 min-w-0 overflow-hidden rounded-lg">
              <div className="flex items-center gap-1 min-w-0 mb-1.5">
                <Icon icon="mdi:weather-rainy" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-gray-400 text-xs truncate">강수량</span>
              </div>
              <div className="text-white text-sm font-semibold transition-all duration-300 mx-auto">
                {sensorData.rainfall.value.toFixed(1)}
                <span className="text-gray-400 text-[10px] ml-0.5">mm</span>
                <span className="text-gray-400 text-[10px] ml-1">(누적 강수량)</span>
              </div>
            </div>

            {/* 풍속 */}
            <div className="bg-[#393a42] p-3 min-w-0 overflow-hidden rounded-lg">
              <div className="flex items-center gap-1 min-w-0 mb-1.5">
                <Icon icon="mdi:weather-windy" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-gray-400 text-xs truncate">풍속</span>
              </div>
              <div className="text-white text-base font-semibold transition-all duration-300">
                {sensorData.windSpeed.value.toFixed(1)}
                <span className="text-gray-400 text-xs ml-0.5">m/s</span>
              </div>
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
};

export default LeftPanel;

