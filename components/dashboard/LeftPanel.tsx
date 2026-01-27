import { Icon } from '@iconify/react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { getRandomCCTVVideo } from '@/lib/cctv-video-utils';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';

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

interface InfrastructureStatus {
  waterLeakage: { status: 'normal' | 'warning' | 'error'; lastUpdate: string };
  powerSupply: { status: 'normal' | 'warning' | 'error'; lastUpdate: string };
  streetLightRate: number;
  iotSensorRate: number;
  alert: boolean;
  alertMessage?: string;
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
    }, 5000);
    return () => clearInterval(interval);
  }, [totalAreaPages, allHeatmapAreas.length, visibleHeatmapCount, heatmapData]);


  return (
    <div
      className={`${isCollapsed ? 'w-20' : ''} flex flex-col overflow-hidden relative transition-all duration-300`}
      style={{ 
        height: '100%',
        minHeight: 0,
        width: isCollapsed ? '5rem' : '30rem',
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
          className="flex-1 overflow-hidden pt-4 pb-4 pl-6 pr-6 flex flex-col gap-4"
          ref={scrollContainerRef}
          style={{ maxWidth: '100%', height: '100%' }}
        >
        {/* 상단 헤더: 좌측 로고, 우측 날씨 + 시간 */}
        <div className="rounded-lg p-4 flex items-center justify-between gradient-border-left-top" style={{ flexShrink: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
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

        {/* CCTV 운영 현황 (상세 카드) */}
        <div className="rounded-lg px-4 pt-4 pb-2 space-y-3 gradient-border-left-top" style={{ flexShrink: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
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
                      <p className="text-white text-sm font-semibold truncate">{area.area.replace('zone', 'Zone')}</p>
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
                      <p className="text-gray-400 text-xs font-semibold tracking-tight truncate">CCTV 장애율</p>
                      <p className="text-white text-xl">{area.streamRate}%</p>
                      <div className="w-full h-3 bg-[#1a1a1a] mt-1 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full progress-bar-fill"
                          style={{ 
                            width: `${area.streamRate}%`,
                            '--target-width': `${area.streamRate}%`,
                            animationDelay: `${areaIndex * 100 + 150}ms`,
                            background: 'linear-gradient(90deg, #8A2BE2 0%, #ff8566 100%)',
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
        <div className="rounded-lg p-4 gradient-border-left-top flex flex-col relative" style={{ flex: 1, minHeight: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white text-sm font-semibold">시간대 이벤트</h3>
            <span className="text-gray-400 text-xs">지난 24시간</span>
          </div>
          <div className="overflow-hidden flex-1 min-h-0">
            <div className="flex justify-end h-full">
              <div ref={trendChartContainerRef} className="relative flex-1 max-w-[434px] rounded-xl overflow-visible" style={{ minHeight: '80px', width: '100%', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%" minHeight={80}>
                  <AreaChart
                    data={animatedTrendData}
                    margin={{ top: 26, right: 20, left: 0, bottom: 30 }}
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
                  labeledTrendData.map((item) => {
                    const hourNum = Number.parseInt(item.hour ?? '0', 10);
                    // 차트 margin 및 축 크기 (AreaChart margin과 일치해야 함)
                    const yAxisWidth = 40;
                    const marginTop = 26;
                    const marginBottom = 30;
                    const marginRight = 20;
                    // 실제 plot area 크기 계산
                    const plotWidth = trendChartRect.width - yAxisWidth - marginRight;
                    const plotHeight = Math.max(0, trendChartRect.height - marginTop - marginBottom);
                    
                    // X 위치: xValue(0~24)를 plot area width에 매핑
                    const xValue = item.xValue ?? hourNum;
                    const xRatio = xValue / 24;
                    const left = yAxisWidth + (xRatio * plotWidth);
                    
                    // Y 위치: value를 Y축 domain [0, 50]에 맞춰 계산
                    // value=0 -> yRatio=1 (맨 아래), value=50 -> yRatio=0 (맨 위)
                    const value = item.value ?? 0;
                    const yRatio = 1 - (value / 50);
                    const dataPointY = marginTop + (yRatio * plotHeight);
                    // 데이터 포인트 위 20px에 라벨 배치
                    const top = dataPointY - 20;
                    
                    return (
                      <div
                        key={`floating-${item.originalIndex}`}
                        className="absolute pointer-events-none -translate-x-1/2"
                        style={{
                          left: `${left}px`,
                          top: `${top}px`,
                          zIndex: 10,
                        }}
                      >
                        <span className="rounded px-1.5 py-0.5 text-[11px] font-medium text-white whitespace-nowrap" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                          {Math.round(item.value ?? 0)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>


        {/* 4) 발생 히트맵 (시간대 x 동) */}
        <div className="rounded-lg p-4 gradient-border-right-bottom flex flex-col" style={{ flex: 1, minHeight: '240px', background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm">구역별 이벤트 발생 건 수</h3>
            <span className="text-gray-400 text-xs">지난 24시간</span>
          </div>
          <div className="flex items-center justify-end gap-4 text-[12px] text-gray-200 mb-3">
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

          <div className="flex-1 min-h-0 flex flex-col" style={{ overflow: 'hidden' }}>
            {/* 그리드 */}
            <div ref={heatmapGridRef} className="space-y-1 relative flex-1 min-h-0 overflow-hidden">
              {heatmapAreas.map((area, index) => {
                // 4개를 2개씩 2그룹으로 나누기 (애니메이션 타이밍용)
                const groupIndex = Math.floor(index / 2);
                const isFirstGroup = groupIndex === 0;
                const groupDelay = isFirstGroup ? 0 : 200;
                
                return (
                  <div
                    key={`${area}-${heatmapAnimationKey}`}
                    className="flex items-center gap-0"
                    style={{
                      animation: `fadeInUp 0.4s ease-out ${groupDelay}ms both`,
                    }}
                  >
                    <div className="w-10 text-[12px] text-gray-400 truncate" title={area}>
                      {area.replace('zone', 'Zone')}
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
                        // 애니메이션 키가 변경될 때마다 애니메이션 적용
                        const shouldAnimate = !isNowNone;
                        
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
              @keyframes fadeInUp {
                from {
                  opacity: 0;
                  transform: translateY(8px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              
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
            <div className="flex items-center gap-0 mt-2 flex-shrink-0">
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
                        slot.label
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 2) 실시간 환경 센서 모니터링 */}
        <div className="rounded-lg p-4 gradient-border-right-bottom" style={{ marginTop: 'auto', marginBottom: 0, flexShrink: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(23,23,23,0.6) 100%)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm">실시간 환경 센서 모니터링</h3>
            <span className="text-gray-400 text-xs flex items-center gap-1.5">
              마지막 업데이트: <span>{sensorLocations[sensorLocationIndex]} 기준</span>
              <span className="text-gray-400">·</span>
              <span>{lastUpdateTime || '--:--'}</span>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 min-w-0">
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

