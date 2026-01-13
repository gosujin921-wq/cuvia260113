'use client';

import { Icon } from '@iconify/react';
import { useState, useEffect, useRef, useMemo } from 'react';

// 데이터 타입 정의
interface CctvConnectionStatus {
  cameraId: string;
  name: string;
  status: 'normal' | 'delay' | 'error';
  latency: number | null;
}

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

const RightPanel = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentStreamIndex, setCurrentStreamIndex] = useState(0);
  const [spotThumbnailIndices, setSpotThumbnailIndices] = useState<Record<string, number>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [areaPage, setAreaPage] = useState(0);
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
  
  // 날씨 데이터 (샘플)
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

  // 각 지점별 썸네일 롤링 (5초 간격)
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

  // 페이지 자동 순환 (10초 간격)
  useEffect(() => {
    const totalPages = Math.ceil(cctvStatus.monitoringSpots.length / 2);
    if (totalPages <= 1) return;

    const interval = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % totalPages);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // 센서 값 실시간 업데이트 애니메이션 (2초 간격)
  useEffect(() => {
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

  // 1) CCTV 운영 현황 데이터
  const cctvStatus: CctvStatus = {
    totalRate: 96.1,
    totalCount: 1240,
    normalCount: 1192,
    errorCount: 48,
    delayCount: 12,
    areaStatus: [
      {
        area: '비산동',
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
        area: '안양동',
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
        area: '평촌동',
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
        area: '관악산로',
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
        area: '석수동',
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
        area: '중앙시장 일대',
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
        spotName: '안양역 광장',
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


  // CCTV 스트리밍 자동 순환 (5초 간격) + 지역 카드 자동 전환
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
    }, 5000);
    return () => clearInterval(interval);
  }, [totalAreaPages]);


  // level을 한글로 변환
  const getLevelText = (level: 'good' | 'normal' | 'bad') => {
    switch (level) {
      case 'good':
        return '양호';
      case 'normal':
        return '보통';
      case 'bad':
        return '나쁨';
    }
  };

  // 센서 값에 따른 level 계산
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

  // 2) 실시간 환경 센서 모니터링 데이터
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
    { label: '지연', value: cctvStatus.delayCount, dot: 'bg-yellow-400', color: 'text-yellow-400' },
    { label: '장애', value: cctvStatus.errorCount, dot: 'bg-red-400', color: 'text-red-400' },
  ];

  const collapsedSensors = [
    { icon: 'mdi:thermometer', label: '온도', value: `${sensorData.temperature.value.toFixed(0)}°` },
    { icon: 'mdi:water-percent', label: '습도', value: `${sensorData.humidity.value.toFixed(0)}%` },
    { icon: 'mdi:weather-windy', label: '풍속', value: `${sensorData.windSpeed.value.toFixed(1)}m/s` },
  ];

  // 3) 도시 기반시설 운영 상태 데이터
  const infrastructureStatus: InfrastructureStatus = useMemo(() => {
    const now = typeof window !== 'undefined' ? new Date().toISOString() : '';
    return {
      waterLeakage: { status: 'error', lastUpdate: now },
      powerSupply: { status: 'normal', lastUpdate: now },
      streetLightRate: 92,
      iotSensorRate: 95.5,
      alert: true,
      alertMessage: '상수도 누수 감지',
    };
  }, []);

  // 기반시설 업데이트 시간 포맷팅 (클라이언트에서만)
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
      case 'normal':
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
      case 'normal':
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

  return (
    <div
      className={`${isCollapsed ? 'w-20' : 'w-[30rem]'} bg-[#161719] border-l border-[#31353a] flex flex-col overflow-hidden relative transition-all duration-300`}
      style={{ 
        borderWidth: '1px',
        height: '100%',
        minHeight: 0,
      }}
    >
      <button
        onClick={() => setIsCollapsed((prev) => !prev)}
        className="absolute top-1/2 -translate-y-1/2 -left-2 w-8 h-14 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-white transition-colors focus:outline-none"
        aria-label={isCollapsed ? '우측 패널 펼치기' : '우측 패널 접기'}
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
          className="flex-1 overflow-y-auto p-3 pl-10 pr-9 space-y-8"
          ref={scrollContainerRef}
        >
        {/* 시간 및 날씨 */}
        <div className="flex items-center justify-between pb-3 border-b border-[#31353a]">
          <div className="text-white text-sm font-medium">
            {clockTime || '--:--:--'}
          </div>
          <div className="flex items-center gap-2">
            <Icon icon={weatherData.icon} className="w-6 h-6 text-white" />
            <div className="flex items-baseline gap-1">
              <span className="text-white text-sm font-medium">{weatherData.high}°</span>
              <span className="text-gray-400 text-xs">/</span>
              <span className="text-gray-400 text-xs">{weatherData.low}°</span>
            </div>
          </div>
        </div>
        
        {/* 1) CCTV 운영 현황 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold text-sm">CCTV 운영 현황</h3>
          </div>
                  
          {/* 전체 요약 데이터 */}
          <div className="space-y-3">
            {/* 정상/장애/지연 장비 수 (색있는 불릿) */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-500" style={{ borderRadius: '50%' }} />
                <span className="text-gray-400 text-xs">정상 장비 수</span>
                <span className="text-green-400 text-xs font-medium">{cctvStatus.normalCount.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-red-500" style={{ borderRadius: '50%' }} />
                <span className="text-gray-400 text-xs">장애 장비 수</span>
                <span className="text-red-400 text-xs font-medium">{cctvStatus.errorCount}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-yellow-500" style={{ borderRadius: '50%' }} />
                <span className="text-gray-400 text-xs">지연 발생 장비 수</span>
                <span className="text-yellow-400 text-xs font-medium">{cctvStatus.delayCount}</span>
              </div>
            </div>

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

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {visibleAreas.map((area) => (
                <div key={area.area} className="bg-[#36383B] border border-[#31353a] p-3 space-y-3" style={{ borderWidth: '1px' }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white text-sm font-semibold">{area.area}</p>
                    </div>
                    <Icon icon="mdi:chevron-right" className="w-4 h-4 text-gray-300" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-gray-200 text-xs font-semibold tracking-tight">장비 작동률</p>
                      <p className="text-white text-xl font-bold">{area.uptime}%</p>
                      <div className="w-full h-3 bg-[#161719] mt-1">
                        <div className="h-full bg-blue-500" style={{ width: `${area.uptime}%` }} />
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-200 text-xs font-semibold tracking-tight">영상 송출률</p>
                      <p className="text-white text-xl font-bold">{area.streamRate}%</p>
                      <div className="w-full h-3 bg-[#161719] mt-1">
                        <div className="h-full bg-blue-500" style={{ width: `${area.streamRate}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[0.65rem]">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-white">지연</span>
                      <span className="text-yellow-400 ml-3">{area.delay}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-white">장애</span>
                      <span className="text-red-400 ml-3">{area.error}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-white">경고</span>
                      <span className="text-orange-400 ml-3">{area.warning}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-white">정비</span>
                      <span className="text-purple-400 ml-3">{area.maintenance}</span>
                    </div>
                  </div>

                  <div className="bg-[#1f2022] border border-[#31353a] px-3 py-2" style={{ borderWidth: '1px' }}>
                    <p className="text-gray-200 text-xs font-semibold">CCTV 총 수량</p>
                    <p className="text-white text-lg font-semibold">{area.total.toLocaleString()}대</p>
                  </div>

                </div>
              ))}
            </div>
          </div>

          {/* 주요 감시 지점별 영상 스트리밍 상태 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-gray-400 text-xs">주요 감시 지점 (자동 순차)</div>
              <button
                onClick={() => setCurrentPage((prev) => (prev + 1) % Math.max(1, Math.ceil(cctvStatus.monitoringSpots.length / 2)))}
                className="text-gray-300 text-xs px-2 py-0.5 border border-[#31353a] hover:border-blue-400 transition-colors"
              >
                다음
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {cctvStatus.monitoringSpots.slice(currentPage * 2, (currentPage + 1) * 2).map((spot) => {
                const currentThumbnailIndex = spotThumbnailIndices[spot.spotId] || 0;
                const currentThumbnails = spot.thumbnails || [];
                const currentThumbnail = currentThumbnails[currentThumbnailIndex];
                const currentTime = clockTime || '--:--:--';

                return (
                  <div
                    key={spot.spotId}
                    className="p-3 space-y-2 border border-[#31353a]"
                    style={{ borderWidth: '1px' }}
                  >
                      {/* 장소 이름과 LIVE 인디케이터 (우측 정렬) */}
                      <div className="flex items-center justify-between">
                        <span className="text-white text-xs font-medium">{spot.spotName}</span>
                        <div className="flex items-center gap-1 text-[10px]">
                          {spot.status === 'normal' ? (
                            <span className="px-2 py-0.5 border border-green-400 text-green-400 rounded-full">정상</span>
                          ) : spot.status === 'delay' ? (
                            <span className="px-2 py-0.5 border border-yellow-400 text-yellow-400 rounded-full">지연</span>
                          ) : (
                            <span className="px-2 py-0.5 border border-red-400 text-red-400 rounded-full">연결끊김</span>
                          )}
                        </div>
                      </div>

                      {/* Spot ID */}
                      <div className="text-gray-400 text-xs">SPOT-{spot.spotId.padStart(3, '0')}</div>

                      {/* CCTV 썸네일 */}
                      {currentThumbnail && (
                        <div className="w-full h-24 overflow-hidden rounded-sm">
                          <img
                            src={currentThumbnail}
                            alt={`${spot.spotName} CCTV`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* 타임스탬프와 FPS (같은 줄, 양끝 정렬) */}
                      <div className="flex items-center justify-between">
                        <div className="text-gray-300 text-xs">{currentTime}</div>
                        <div className="text-gray-400 text-xs">{spot.fps} FPS</div>
                      </div>
                    </div>
                  );
                })}
              {/* 빈 슬롯 채우기 (2개 미만일 경우) */}
              {Array.from({ length: 2 - Math.min(2, cctvStatus.monitoringSpots.length - currentPage * 2) }).map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="bg-[#36383B]/30 border border-[#31353a]/30 p-3"
                  style={{ borderWidth: '1px' }}
                />
              ))}
            </div>

            {/* 페이지네이션 점 제거 */}
          </div>
        </div>

        {/* 2) 실시간 환경 센서 모니터링 */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold text-sm">실시간 환경 센서 모니터링</h3>
            <span className="text-gray-300 text-xs">
              마지막 업데이트: {lastUpdateTime || '--:--:--'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {/* PM2.5 */}
            <div className="bg-[#36383B] p-3 border border-[#31353a]" style={{ borderWidth: '1px' }}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1">
                  <Icon icon="mdi:air-filter" className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-400 text-xs">PM2.5</span>
                </div>
                <span className={`px-2 py-0.5 border ${getLevelColor(sensorData.pm25.level)} text-[10px]`} style={{ borderRadius: '9999px' }}>
                  {getLevelText(sensorData.pm25.level)}
                </span>
              </div>
              <div className="text-white text-base font-semibold transition-all duration-300">
                {sensorData.pm25.value.toFixed(1)}
                <span className="text-gray-400 text-xs ml-0.5">㎍/m³</span>
              </div>
            </div>

            {/* PM10 */}
            <div className="bg-[#36383B] p-3 border border-[#31353a]" style={{ borderWidth: '1px' }}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1">
                  <Icon icon="mdi:weather-dust" className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-400 text-xs">PM10</span>
                </div>
                <span className={`px-2 py-0.5 border ${getLevelColor(sensorData.pm10.level)} text-[10px]`} style={{ borderRadius: '9999px' }}>
                  {getLevelText(sensorData.pm10.level)}
                </span>
              </div>
              <div className="text-white text-base font-semibold transition-all duration-300">
                {sensorData.pm10.value.toFixed(1)}
                <span className="text-gray-400 text-xs ml-0.5">㎍/m³</span>
              </div>
            </div>

            {/* 온도 */}
            <div className="bg-[#36383B] p-3 border border-[#31353a]" style={{ borderWidth: '1px' }}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1">
                  <Icon icon="mdi:thermometer" className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-400 text-xs">온도</span>
                </div>
                <span className={`px-2 py-0.5 border ${getLevelColor(sensorData.temperature.level)} text-[10px]`} style={{ borderRadius: '9999px' }}>
                  {getLevelText(sensorData.temperature.level)}
                </span>
              </div>
              <div className="text-white text-base font-semibold transition-all duration-300">
                {sensorData.temperature.value.toFixed(1)}
                <span className="text-gray-400 text-xs ml-0.5">°C</span>
              </div>
            </div>

            {/* 습도 */}
            <div className="bg-[#36383B] p-3 border border-[#31353a]" style={{ borderWidth: '1px' }}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1">
                  <Icon icon="mdi:water-percent" className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-400 text-xs">습도</span>
                </div>
                <span className={`px-2 py-0.5 border ${getLevelColor(sensorData.humidity.level)} text-[10px]`} style={{ borderRadius: '9999px' }}>
                  {getLevelText(sensorData.humidity.level)}
                </span>
              </div>
              <div className="text-white text-base font-semibold transition-all duration-300">
                {sensorData.humidity.value.toFixed(1)}
                <span className="text-gray-400 text-xs ml-0.5">%</span>
              </div>
            </div>

            {/* 강수량 */}
            <div className="bg-[#36383B] p-3 border border-[#31353a]" style={{ borderWidth: '1px' }}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1">
                  <Icon icon="mdi:weather-rainy" className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-400 text-xs">강수량</span>
                </div>
                <span className={`px-2 py-0.5 border ${getLevelColor(sensorData.rainfall.level)} text-[10px]`} style={{ borderRadius: '9999px' }}>
                  {getLevelText(sensorData.rainfall.level)}
                </span>
              </div>
              <div className="text-white text-base font-semibold transition-all duration-300">
                {sensorData.rainfall.value.toFixed(1)}
                <span className="text-gray-400 text-xs ml-0.5">mm</span>
              </div>
            </div>

            {/* 풍속 */}
            <div className="bg-[#36383B] p-3 border border-[#31353a]" style={{ borderWidth: '1px' }}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1">
                  <Icon icon="mdi:weather-windy" className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-400 text-xs">풍속</span>
                </div>
                <span className={`px-2 py-0.5 border ${getLevelColor(sensorData.windSpeed.level)} text-[10px]`} style={{ borderRadius: '9999px' }}>
                  {getLevelText(sensorData.windSpeed.level)}
                </span>
              </div>
              <div className="text-white text-base font-semibold transition-all duration-300">
                {sensorData.windSpeed.value.toFixed(1)}
                <span className="text-gray-400 text-xs ml-0.5">m/s</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3) 도시 기반시설 운영 상태 */}
        <div className="space-y-2.5" ref={infrastructureRef}>
          <h3 className="text-white font-semibold text-sm">도시 기반시설 운영 상태</h3>
          
          {/* 장애 알림 (최상단) */}
          {infrastructureStatus.alert && infrastructureStatus.alertMessage && (
            <div className="bg-red-500/20 border border-red-500/50 p-3" style={{ borderWidth: '1px' }}>
              <div className="flex items-center gap-1.5 text-red-400 text-xs font-medium">
                <Icon icon="mdi:alert" className="w-4 h-4" />
                <span>{infrastructureStatus.alertMessage}</span>
              </div>
            </div>
          )}

          <div className="bg-[#36383B] border border-[#31353a] p-3 space-y-1.5" style={{ borderWidth: '1px' }}>
            {/* 상수도 누수 상태 */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <Icon
                  icon={getStatusIcon(infrastructureStatus.waterLeakage.status)}
                  className={`w-3.5 h-3.5 ${getStatusColor(infrastructureStatus.waterLeakage.status)}`}
                />
                <span className="text-white">상수도 누수 상태</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 text-xs ${
                  infrastructureStatus.waterLeakage.status === 'normal' 
                    ? 'bg-green-500/20 text-green-400' 
                    : infrastructureStatus.waterLeakage.status === 'warning' 
                      ? 'bg-yellow-500/20 text-yellow-400' 
                      : 'bg-red-500/20 text-red-400'
                }`} style={{ borderRadius: '9999px' }}>
                  {infrastructureStatus.waterLeakage.status === 'normal' ? '정상' : 
                   infrastructureStatus.waterLeakage.status === 'warning' ? '경고' : '장애'}
                </span>
                <span className="text-gray-300 text-xs" suppressHydrationWarning>
                  {isMounted ? (waterLeakageTime || '--:--:--') : '--:--:--'}
                </span>
              </div>
            </div>

            {/* 전력 공급 상태 */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <Icon
                  icon={getStatusIcon(infrastructureStatus.powerSupply.status)}
                  className={`w-3.5 h-3.5 ${getStatusColor(infrastructureStatus.powerSupply.status)}`}
                />
                <span className="text-white">전력 공급 상태</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 text-xs ${
                  infrastructureStatus.powerSupply.status === 'normal' 
                    ? 'bg-green-500/20 text-green-400' 
                    : infrastructureStatus.powerSupply.status === 'warning' 
                      ? 'bg-yellow-500/20 text-yellow-400' 
                      : 'bg-red-500/20 text-red-400'
                }`} style={{ borderRadius: '9999px' }}>
                  {infrastructureStatus.powerSupply.status === 'normal' ? '정상' : 
                   infrastructureStatus.powerSupply.status === 'warning' ? '경고' : '장애'}
                </span>
                <span className="text-gray-300 text-xs" suppressHydrationWarning>
                  {isMounted ? (powerSupplyTime || '--:--:--') : '--:--:--'}
                </span>
              </div>
            </div>

            {/* 가로등 점등률 */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-white">가로등 점등률</span>
              <span className="text-white text-xs">{infrastructureStatus.streetLightRate}%</span>
            </div>

            {/* 공공 IoT 센서 가동률 */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-white">공공 IoT 센서 가동률</span>
              <span className="text-white text-xs">{infrastructureStatus.iotSensorRate}%</span>
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
};

export default RightPanel;
