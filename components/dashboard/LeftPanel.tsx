import { Icon } from '@iconify/react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { getRandomCCTVVideo } from '@/lib/cctv-video-utils';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';

interface MonitoringSpot {
  spotId: string;
  spotName: string;
  streamUrl?: string;
  thumbnails?: string[];
  fps: number;
  status: 'normal' | 'delay' | 'disconnected';
  autoSequence: boolean;
  environment?: 'normal' | 'night' | 'fog' | 'rain';
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
  waterLeakage: { status: 'normal' | 'warning' | 'error'; lastUpdate: string };
  powerSupply: { status: 'normal' | 'warning' | 'error'; lastUpdate: string };
  streetLightRate: number;
  iotSensorRate: number;
  alert: boolean;
  alertMessage?: string;
  floodRiskZones: FloodRiskZone[];
  facilityRiskZones: FacilityRiskZone[];
}

const cctvLocalImages = [
  '/cctv_img/001.jpg',
  '/cctv_img/002.jpg',
  '/cctv_img/003.jpg',
  '/cctv_img/004.jpg',
  '/cctv_img/005.jpg',
];

const buildThumbnails = (identifier: string, count = 3) => {
  const seed = identifier
    .split('')
    .reduce((acc, char, idx) => acc + char.charCodeAt(0) * (idx + 1), 0);

  return Array.from({ length: count }, (_, idx) => {
    const nextIndex = (seed + idx) % cctvLocalImages.length;
    return cctvLocalImages[nextIndex];
  });
};

interface LeftPanelProps {
  onCollapsedChange?: (isCollapsed: boolean) => void;
}

const LeftPanel = ({ onCollapsedChange }: LeftPanelProps = {}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentStreamIndex, setCurrentStreamIndex] = useState(0);
  const [spotThumbnailIndices, setSpotThumbnailIndices] = useState<Record<string, number>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [areaPage, setAreaPage] = useState(0);
  const [heatmapAreaOffset, setHeatmapAreaOffset] = useState(0);
  const [heatmapAnimationKey, setHeatmapAnimationKey] = useState(0);
  const [previousHeatmapData, setPreviousHeatmapData] = useState<Record<string, Record<string, number>>>({});
  const previousHeatmapDataRef = useRef<Record<string, Record<string, number>>>({});
  const [visibleHeatmapCount, setVisibleHeatmapCount] = useState(4);
  const [trendAnimationProgress, setTrendAnimationProgress] = useState(0);
  const [activeFloatingLabelIndex, setActiveFloatingLabelIndex] = useState(0);
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
  const [sensorLocationIndex, setSensorLocationIndex] = useState<number>(0);
  const [floodRiskZoneIndex, setFloodRiskZoneIndex] = useState<number>(0);
  const [facilityRiskZoneIndex, setFacilityRiskZoneIndex] = useState<number>(0);
  
  const sensorLocations = useMemo(() => ['신원동', '행신동', '식사동'], []);
  
  const weatherData = {
    icon: 'mdi:weather-partly-cloudy',
    high: 25,
    low: 18,
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
    
    const interval = setInterval(() => {
      setSensorValues((prev) => ({
        pm25: Math.max(0, prev.pm25 + (Math.random() - 0.5) * 4),
        pm10: Math.max(0, prev.pm10 + (Math.random() - 0.5) * 6),
        temperature: prev.temperature + (Math.random() - 0.5) * 0.5,
        humidity: Math.max(0, Math.min(100, prev.humidity + (Math.random() - 0.5) * 2)),
        rainfall: Math.max(0, prev.rainfall + (Math.random() - 0.5) * 0.2),
        windSpeed: Math.max(0, prev.windSpeed + (Math.random() - 0.5) * 0.3),
      }));
      setLastUpdateTime(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }));
      setSensorLocationIndex((prev) => (prev + 1) % sensorLocations.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [sensorLocations]);

  const cctvStatus: CctvStatus = {
    totalRate: 96.1,
    totalCount: 1240,
    normalCount: 1192,
    errorCount: 48,
    delayCount: 12,
    areaStatus: [
      {
        area: 'zone1',
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
        airQuality: '양호',
        monitorState: '정상',
      },
      {
        area: 'zone2',
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
        airQuality: '양호',
        monitorState: '집중',
      },
      {
        area: 'zone3',
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
        airQuality: '안정',
        monitorState: '정상',
      },
      {
        area: 'zone4',
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
        airQuality: '주의',
        monitorState: '집중',
      },
      {
        area: 'zone5',
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
        airQuality: '양호',
        monitorState: '정상',
      },
      {
        area: 'zone6',
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

  // 모든 지역 목록 (히트맵 롤링용) - useEffect보다 먼저 정의 (zone1~zone8)
  const allHeatmapAreas = useMemo(() => {
    return [
      'zone1',
      'zone2',
      'zone3',
      'zone4',
      'zone5',
      'zone6',
      'zone7',
      'zone8',
    ];
  }, []);


  const getLevelText = (level: 'good' | 'normal' | 'bad') => {
    switch (level) {
      case 'good':
        return '좋음';
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
  const heatmapGridRef = useRef<HTMLDivElement>(null);

  const sensorData: SensorData = useMemo(() => ({
    pm25: { value: sensorValues.pm25, level: getPm25Level(sensorValues.pm25) },
    pm10: { value: sensorValues.pm10, level: getPm10Level(sensorValues.pm10) },
    temperature: { value: sensorValues.temperature, level: getTemperatureLevel(sensorValues.temperature) },
    humidity: { value: sensorValues.humidity, level: getHumidityLevel(sensorValues.humidity) },
    rainfall: { value: sensorValues.rainfall, level: getRainfallLevel(sensorValues.rainfall) },
    windSpeed: { value: sensorValues.windSpeed, level: getWindSpeedLevel(sensorValues.windSpeed) },
    lastUpdate: new Date().toISOString(),
  }), [sensorValues]);

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
      floodRiskZones: [
        { zone: '중앙구', currentLevel: 1.2, warningLevel: 3.5, percentage: 35 },
        { zone: '동부구', currentLevel: 2.1, warningLevel: 3.5, percentage: 60 },
        { zone: '서부구', currentLevel: 0.8, warningLevel: 3.5, percentage: 23 },
        { zone: '남부구', currentLevel: 1.5, warningLevel: 3.5, percentage: 43 },
      ],
      facilityRiskZones: [
        { zone: '중앙구', riskLevel: 65, maxLevel: 100, percentage: 65 },
        { zone: '동부구', riskLevel: 45, maxLevel: 100, percentage: 45 },
        { zone: '서부구', riskLevel: 78, maxLevel: 100, percentage: 78 },
        { zone: '남부구', riskLevel: 52, maxLevel: 100, percentage: 52 },
      ],
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
        return 'text-green-400 border-green-400';
      case 'normal':
        return 'text-yellow-400 border-yellow-400';
      case 'bad':
        return 'text-red-400 border-red-400';
      default:
        return 'text-yellow-400 border-yellow-400';
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
        return 'text-blue-400';
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

  // 시간대별 이벤트 트렌드 데이터 생성 (0~24시, 30분 간격, 총 49개 포인트)
  const trendData = useMemo(() => {
    const seedBase = typeof window !== 'undefined' ? new Date().toISOString().slice(0, 10) : 'static';
    const hours = Array.from({ length: 49 }, (_, index) => index * 0.5);
    const maxValue = 50;
    const minValue = 0;
    const range = maxValue - minValue;

    return hours.map((hour) => {
      const t = hour / 24;
      // 부드러운 곡선을 위한 파형 생성
      const wave1 = Math.sin(t * Math.PI * 2) * 1.0;
      const wave2 = Math.sin(t * Math.PI * 4) * 0.5;
      const baseWave = (wave1 + wave2) / 1.4;
      // 시드 기반 노이즈로 자연스러운 변동 추가
      const noiseSeed = getSeededInt(`${seedBase}-${Math.floor(hour)}`, 100);
      const noise = (noiseSeed / 100 - 0.5) * 0.04;
      const shaped = baseWave + noise;
      const value = minValue + (range / 2) + shaped * (range / 2);

      return {
        hour: hour % 1 === 0 ? (hour === 24 ? '24' : hour.toString().padStart(2, '0')) : '',
        xValue: hour, // X축 위치 (0~24)
        value: Math.round(value * 10) / 10,
        originalHour: hour,
      };
    });
  }, []);

  const X_AXIS_TICKS = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24];

  const labeledTrendData = useMemo(() => {
    return trendData
      .map((item, index) => ({ ...item, originalIndex: index }))
      .filter(item => {
        if (!item.hour || item.hour === '') return false;
        const hour = Number.parseInt(item.hour, 10);
        return !Number.isNaN(hour) && X_AXIS_TICKS.includes(hour);
      });
  }, [trendData]);

  // 애니메이션을 위한 데이터 (순차적으로 나타나는 효과)
  const animatedTrendData = useMemo(() => {
    return trendData.map((item, index) => {
      const hasLabel = item.hour !== '';
      if (!hasLabel) {
        return { ...item, _opacity: 0 };
      }
      
      const labelIndex = labeledTrendData.findIndex(labeled => labeled.originalIndex === index);
      
      if (labelIndex === -1) {
        return { ...item, _opacity: 0 };
      }
      
      // 순차적으로 나타나도록 opacity 계산
      const totalLabels = labeledTrendData.length;
      const pointProgress = (trendAnimationProgress * totalLabels) - labelIndex;
      const opacity = Math.max(0, Math.min(1, pointProgress));
      
      return {
        ...item,
        _opacity: opacity,
      };
    });
  }, [trendData, labeledTrendData, trendAnimationProgress]);

  // X축 마지막 틱(24)의 Y 위치를 다른 틱과 맞추기 위한 ref
  const xAxisBaselineYRef = useRef<number | null>(null);
  // X축 각 틱의 SVG 내부 X 좌표를 저장 (플로팅 라벨 위치 계산용)
  const xAxisTickXMapRef = useRef<Map<number, number>>(new Map());
  // 차트 컨테이너 ref (크기 측정용)
  const trendChartContainerRef = useRef<HTMLDivElement>(null);
  // 차트 컨테이너의 크기 정보 (플로팅 라벨 위치 계산용)
  const [trendChartRect, setTrendChartRect] = useState<{ left: number; width: number; top: number; height: number }>({ left: 0, width: 0, top: 0, height: 0 });

  // 차트 컨테이너 크기 측정 (ResizeObserver + window resize)
  useEffect(() => {
    const chartEl = trendChartContainerRef.current;
    if (!chartEl) return;
    const update = () => {
      const cr = chartEl.getBoundingClientRect();
      setTrendChartRect({
        left: 0, // wrapper 내부 기준이므로 0
        width: cr.width,
        top: 0, // wrapper 내부 기준이므로 0
        height: cr.height,
      });
    };
    const ro = new ResizeObserver(() => requestAnimationFrame(update));
    ro.observe(chartEl);
    update();
    const onResize = () => requestAnimationFrame(update);
    window.addEventListener('resize', onResize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const renderTrendXAxisTick = (props: any) => {
    const { x, y, payload } = props ?? {};
    const raw = payload?.value;
    if (raw === undefined || raw === null) return null;

    const hour = Number(raw);
    xAxisTickXMapRef.current.set(hour, x);
    const label = String(hour).padStart(2, '0');
    const isLast = hour === 24;

    if (!isLast) {
      xAxisBaselineYRef.current = y;
    }
    const yToUse = isLast && xAxisBaselineYRef.current != null ? xAxisBaselineYRef.current : y;

    return (
      <g transform={`translate(${x},${yToUse})`}>
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

    const isTop = value === 50;

    return (
      <g transform={`translate(${x},${y})`}>
        {isTop ? (
          <text x={0} y={0} dy={-8} textAnchor="end" fill="#9ca3af" fontSize={12}>
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

    // 구역별 컬러 분포 패턴 정의
    const getAreaDistribution = (area: string) => {
      const areaNum = parseInt(area.replace('zone', '')) || 1;
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

  // 플로팅 라벨 순차적 애니메이션 (각 라벨이 1초씩 표시)
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFloatingLabelIndex((prev) => (prev + 1) % X_AXIS_TICKS.length);
    }, 1000);
    return () => clearInterval(interval);
  }, []);


  return (
    <div
      className={`${isCollapsed ? 'w-20' : ''} flex flex-col overflow-hidden relative transition-all duration-300`}
      style={{ 
        height: '100%',
        minHeight: 0,
        width: isCollapsed ? '5rem' : '26rem',
      }}
    >
      <button
        onClick={() => {
          setIsCollapsed((prev) => {
            const newValue = !prev;
            onCollapsedChange?.(newValue);
            return newValue;
          });
        }}
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
          className="flex-1 overflow-hidden pt-4 pb-4 pl-3 pr-3 flex flex-col gap-4"
          ref={scrollContainerRef}
          style={{ maxWidth: '100%', height: '100%' }}
        >
        {/* 상단 헤더: 좌측 로고, 우측 날씨 + 시간 */}
        <div className="rounded-lg p-4 flex items-center justify-between gradient-border-left-top" style={{ flexShrink: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}>
          {/* 좌측: 패널 로고 */}
          <div className="flex items-center gap-2">
            <img
              src="/logo.svg"
              alt="CUVIA"
              className="h-5 w-auto object-contain"
              style={{ filter: 'brightness(0) invert(1)' }}
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
            <div className="text-white text-sm font-medium whitespace-nowrap min-w-[90px] text-right">
              {clockTime || '--:--:--'}
            </div>
          </div>
        </div>

        {/* 실시간 대기질 모니터링 */}
        <div className="rounded-lg px-4 pt-4 pb-3 gradient-border-left-top" style={{ flexShrink: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm">실시간 대기질 모니터링</h3>
            <span className="text-gray-400 text-xs flex items-center gap-1.5">
              마지막 업데이트: <span>{sensorLocations[sensorLocationIndex]} 기준</span>
              <span className="text-gray-400">·</span>
              <span>{lastUpdateTime || '--:--'}</span>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 min-w-0">
            {/* PM2.5 */}
            <div className="bg-[#393a42] p-3 min-w-0 overflow-hidden rounded-lg">
              <div className="flex items-center justify-between gap-1 min-w-0" style={{ height: '20px', marginBottom: '6px' }}>
                <div className="flex items-center gap-1 min-w-0">
                  <Icon icon="mdi:air-filter" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-400 text-xs truncate">PM2.5</span>
                </div>
                <span className={`px-1.5 py-0.5 border ${getLevelColor(sensorData.pm25.level)} text-[9px] whitespace-nowrap flex-shrink-0`} style={{ borderRadius: '9999px' }}>
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
              <div className="flex items-center justify-between gap-1 min-w-0" style={{ height: '20px', marginBottom: '6px' }}>
                <div className="flex items-center gap-1 min-w-0">
                  <Icon icon="mdi:weather-dust" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-400 text-xs truncate">PM10</span>
                </div>
                <span className={`px-1.5 py-0.5 border ${getLevelColor(sensorData.pm10.level)} text-[9px] whitespace-nowrap flex-shrink-0`} style={{ borderRadius: '9999px' }}>
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
              <div className="flex items-center gap-1 min-w-0" style={{ height: '20px', marginBottom: '6px' }}>
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
              <div className="flex items-center gap-1 min-w-0" style={{ height: '20px', marginBottom: '6px' }}>
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
              <div className="flex items-center gap-1 min-w-0" style={{ height: '20px', marginBottom: '6px' }}>
                <Icon icon="mdi:weather-rainy" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-gray-400 text-xs truncate">강수량</span>
              </div>
              <div className="text-white text-sm font-semibold transition-all duration-300">
                {sensorData.rainfall.value.toFixed(1)}
                <span className="text-gray-400 text-[10px] ml-0.5">mm</span>
                <span className="text-gray-400 text-[10px] ml-1">(누적량)</span>
              </div>
            </div>

            {/* 풍속 */}
            <div className="bg-[#393a42] p-3 min-w-0 overflow-hidden rounded-lg">
              <div className="flex items-center gap-1 min-w-0" style={{ height: '20px', marginBottom: '6px' }}>
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

        {/* 도시 기반시설 운영 상태 */}
        <div className="rounded-lg px-4 pt-4 pb-4 flex flex-col gap-3 gradient-border-left-top" style={{ flexShrink: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}>
          <h3 className="text-white font-semibold text-sm">도시 기반시설 운영 상태</h3>

          {/* 침수 위험 & 노후·위험 시설 */}
            <div className="grid grid-cols-2 gap-3 min-w-0">
              {/* 침수 위험 */}
              <div className="bg-[#393a42] px-3 pt-3 pb-2 min-w-0 overflow-hidden rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-400 text-xs font-semibold">침수 위험</span>
                  <span className="text-white text-xs">{infrastructureStatus.floodRiskZones[floodRiskZoneIndex]?.zone}</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="relative" style={{ width: '140px', height: '90px' }}>
                    <svg width="140" height="90" viewBox="0 0 140 90">
                      <defs>
                        <linearGradient id="floodGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="50%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                      </defs>
                      
                      {/* 배경 아크 */}
                      <path
                        d="M 20 65 A 50 50 0 0 1 120 65"
                        fill="none"
                        stroke="#1a1a1a"
                        strokeWidth="12"
                        strokeLinecap="round"
                      />
                      
                      {/* 컬러 아크 */}
                      <path
                        d="M 20 65 A 50 50 0 0 1 120 65"
                        fill="none"
                        stroke="url(#floodGaugeGradient)"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray="157"
                        strokeDashoffset={157 - (157 * ((infrastructureStatus.floodRiskZones[floodRiskZoneIndex]?.percentage || 0) / 100))}
                        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                      />
                      
                      {/* 바늘 */}
                      <g style={{ transformOrigin: '70px 65px', transform: `rotate(${-90 + 180 * ((infrastructureStatus.floodRiskZones[floodRiskZoneIndex]?.percentage || 0) / 100)}deg)`, transition: 'transform 1s ease-out' }}>
                        <line
                          x1="70"
                          y1="65"
                          x2="70"
                          y2="20"
                          stroke="#fff"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                        <circle cx="70" cy="65" r="6" fill="#fff" />
                      </g>
                      
                    </svg>
                  </div>
                  <div className="flex items-center justify-center gap-2 w-full -mt-2">
                    <span className="text-green-400 text-[10px]">정상</span>
                    <span className="text-yellow-400 text-[10px]">주의</span>
                    <span className="text-red-400 text-[10px]">위험</span>
                  </div>
                </div>
              </div>

              {/* 노후·위험 시설 */}
              <div className="bg-[#393a42] px-3 pt-3 pb-2 min-w-0 overflow-hidden rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-400 text-xs font-semibold">노후·위험 시설</span>
                  <span className="text-white text-xs">{infrastructureStatus.facilityRiskZones[facilityRiskZoneIndex]?.zone}</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="relative" style={{ width: '140px', height: '90px' }}>
                    <svg width="140" height="90" viewBox="0 0 140 90">
                      <defs>
                        <linearGradient id="facilityGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="50%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                      </defs>
                      
                      {/* 배경 아크 */}
                      <path
                        d="M 20 65 A 50 50 0 0 1 120 65"
                        fill="none"
                        stroke="#1a1a1a"
                        strokeWidth="12"
                        strokeLinecap="round"
                      />
                      
                      {/* 컬러 아크 */}
                      <path
                        d="M 20 65 A 50 50 0 0 1 120 65"
                        fill="none"
                        stroke="url(#facilityGaugeGradient)"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray="157"
                        strokeDashoffset={157 - (157 * ((infrastructureStatus.facilityRiskZones[facilityRiskZoneIndex]?.percentage || 0) / 100))}
                        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                      />
                      
                      {/* 바늘 */}
                      <g style={{ transformOrigin: '70px 65px', transform: `rotate(${-90 + 180 * ((infrastructureStatus.facilityRiskZones[facilityRiskZoneIndex]?.percentage || 0) / 100)}deg)`, transition: 'transform 1s ease-out' }}>
                        <line
                          x1="70"
                          y1="65"
                          x2="70"
                          y2="20"
                          stroke="#fff"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                        <circle cx="70" cy="65" r="6" fill="#fff" />
                      </g>
                      
                    </svg>
                  </div>
                  <div className="flex items-center justify-center gap-1 w-full -mt-2">
                    <span className="text-green-400 text-[9px]">정상</span>
                    <span className="text-yellow-400 text-[9px]">점검 필요</span>
                    <span className="text-orange-400 text-[9px]">보수 필요</span>
                    <span className="text-red-400 text-[9px]">사용 제한</span>
                  </div>
                </div>
              </div>
            </div>

          {/* 도로조명 점등률 카드 */}
          <div className="bg-[#393a42] px-3 py-3 rounded-lg">
            <div className="flex items-center justify-between gap-4 mb-2">
              <span className="text-gray-400 text-xs font-semibold">도로조명 점등률</span>
              <span className="text-white text-xs font-medium">{infrastructureStatus.streetLightRate}%</span>
            </div>
            <div className="w-full h-3 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full relative"
                style={{ 
                  width: `${infrastructureStatus.streetLightRate}%`,
                  transition: 'width 1s ease-out'
                }}
              >
                <div 
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #0066FF 0%, #8A2BE2 50%, #0066FF 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'gradientSlide 3s linear infinite'
                  }}
                />
              </div>
            </div>
            <style>{`
              @keyframes gradientSlide {
                0% {
                  background-position: 0% 0%;
                }
                100% {
                  background-position: 200% 0%;
                }
              }
            `}</style>
          </div>

          {/* 안전 비상벨 & 교통신호 운영 상태 카드 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#393a42] px-3 py-3 rounded-lg">
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className="text-gray-400 text-xs font-semibold">안전 비상벨 가동률</span>
              </div>
              <div className="flex items-center justify-center gap-4">
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
              </div>
            </div>
            <div className="bg-[#393a42] px-3 py-3 rounded-lg">
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className="text-gray-400 text-xs font-semibold">교통신호 운영 상태</span>
              </div>
              <div className="flex items-center justify-center gap-4">
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
              </div>
            </div>
          </div>
        </div>

        {/* 시간별 이벤트 트렌드 (X축: 시간/날짜, Y축: 이벤트 발생 건수) */}
        <div className="rounded-lg p-4 gradient-border-left-top flex flex-col relative" style={{ flex: 1, minHeight: '200px', background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white text-sm font-semibold">시간대 이벤트</h3>
            <span className="text-gray-400 text-xs">지난 24시간</span>
          </div>
          <div className="overflow-hidden flex-1">
            <div className="flex justify-end h-full">
              <div ref={trendChartContainerRef} className="relative flex-1 max-w-[434px] rounded-xl overflow-visible" style={{ width: '100%', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={animatedTrendData}
                    margin={{ top: 30, right: 20, left: 0, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="eventWaveFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(0,102,255,0.5)" />
                        <stop offset="100%" stopColor="rgba(15,23,42,0.15)" />
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
                      dataKey="xValue"
                      type="number"
                      domain={[0, 24]}
                      ticks={X_AXIS_TICKS}
                      tick={renderTrendXAxisTick}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(107, 114, 128, 0.3)', strokeWidth: 1 }}
                      tickMargin={8}
                    />
                    <YAxis
                      domain={[0, 50]}
                      tick={renderTrendYAxisTick}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(107, 114, 128, 0.3)', strokeWidth: 1 }}
                      ticks={[0, 25, 50]}
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
                      isAnimationActive={false}
                      dot={false}
                      activeDot={false}
                    />
                    {/* 빛 반사 효과 - 선에만 적용 */}
                    <Area
                      type="basis"
                      dataKey="value"
                      stroke="url(#lightReflectionStroke)"
                      strokeWidth={4}
                      fill="none"
                      opacity={0.7}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                {/* X축 틱에 해당하는 데이터 포인트 위에 플로팅 라벨 표시 */}
                {trendChartRect.width > 0 &&
                  X_AXIS_TICKS.map((hourNum, index) => {
                    // 현재 활성화된 인덱스만 표시
                    if (index !== activeFloatingLabelIndex) return null;
                    
                    // 해당 시간의 데이터 찾기 - animatedTrendData에서 가져오기 (실제 차트와 동일)
                    const dataIndex = hourNum * 2; // 0.5시간 간격이므로 시간 * 2
                    const dataPoint = animatedTrendData[dataIndex];
                    if (!dataPoint) return null;
                    
                    // X축 틱의 실제 SVG 좌표 사용
                    const tickX = xAxisTickXMapRef.current.get(hourNum);
                    if (tickX === undefined) return null;
                    
                    // 차트 설정
                    const marginTop = 30;
                    const marginBottom = 20;
                    
                    // plot area 크기
                    const plotHeight = trendChartRect.height - marginTop - marginBottom;
                    
                    // X 위치: SVG 좌표 그대로 사용
                    const left = tickX;
                    
                    // Y 위치: value를 Y축 domain [0, 50]에 맞춰 계산
                    const value = dataPoint.value ?? 0;
                    const valueRatio = value / 50; // 0 = 하단, 1 = 상단
                    // basis 곡선은 데이터 포인트를 보간하므로 약간의 오프셋 필요
                    // 시간대별 개별 조정
                    let extraOffset = 0;
                    if (hourNum === 16) extraOffset = 15;
                    else if (hourNum === 18 || hourNum === 20 || hourNum === 22) extraOffset = 25;
                    const top = marginTop + (plotHeight * (1 - valueRatio)) - 20 - extraOffset;
                    
                    return (
                      <div
                        key={`floating-${hourNum}`}
                        className="absolute pointer-events-none -translate-x-1/2 transition-opacity duration-300"
                        style={{
                          left: `${left}px`,
                          top: `${top}px`,
                          zIndex: 10,
                          opacity: 1,
                        }}
                      >
                        <span className="rounded-full w-8 h-8 flex items-center justify-center text-[11px] font-medium text-white" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                          {Math.round(value)}
                        </span>
                      </div>
                    );
                  })}
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

