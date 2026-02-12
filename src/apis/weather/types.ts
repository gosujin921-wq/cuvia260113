export interface WeatherResponse {
    sido_nm: string; // 시도 명
    station_nm: string; // 측정소 명
    current_temp: string; // 현재 온도
    current_humidity: string; // 현재 습도
    min_temp: string; // 최저 온도
    max_temp: string; // 최고 온도
    weather: string; // 날씨, 1: 맑음, 2: 구름많음, 3: 흐림, 4: 비, 5: 비/눈, 6: 눈, 7: 소나기
    fcst_date: string; // 예보 대상 일자
    fcst_time: string; // 예보 대상 시간
    pm10_value: string; // 미세먼지 값
    pm25_value: string; // 미세먼지 등급
    pm10_grade: string; // 초미세먼지 값, 1: 좋음, 2: 보통, 3: 나쁨, 4: 매우 나쁨
    pm25_grade: string; // 초미세먼지 등급, 1: 좋음, 2: 보통, 3: 나쁨, 4: 매우 나쁨
}
