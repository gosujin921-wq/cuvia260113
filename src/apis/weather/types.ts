export type WeatherGrade = "1" | "2" | "3" | "4" | "5" | "6" | "7";
export type pm10Grade = "1" | "2" | "3" | "4";
export type pm25Grade = "1" | "2" | "3" | "4";

export interface WeatherResponse {
    sido_nm: string; // 시도 명
    station_nm: string; // 측정소 명
    current_temp: string; // 현재 온도
    current_humidity: string; // 현재 습도
    min_temp: string; // 최저 온도
    max_temp: string; // 최고 온도
    weather: WeatherGrade; // 날씨, 1: 맑음, 2: 구름많음, 3: 흐림, 4: 비, 5: 비/눈, 6: 눈, 7: 소나기
    fcst_date: string; // 예보 대상 일자
    fcst_time: string; // 예보 대상 시간
    pm10_value: string; // 미세먼지 값
    pm25_value: string; // 미세먼지 등급
    pm10_grade: pm10Grade; // 초미세먼지 값, 1: 좋음, 2: 보통, 3: 나쁨, 4: 매우 나쁨
    pm25_grade: pm25Grade; // 초미세먼지 등급, 1: 좋음, 2: 보통, 3: 나쁨, 4: 매우 나쁨
    wind_speed: string; // 풍속
    precipitation: string; // 강수량
}
