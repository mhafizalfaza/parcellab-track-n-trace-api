import axios from "axios";
import {
  OpenWeatherApiResponse,
  OpenWeatherZipResponse,
} from "../../model/response";
import { getCoordinatesFromZipCodeSchema } from "../../model/validator/input/weather/getCoordinatesFromZipCode";
import { getWeatherSchema } from "../../model/validator/input/weather/getWeather";

export class WeatherService {
  private apiKey: string;
  private apiUrl: string;
  private geocodingApiUrl: string;

  constructor({
    apiKey,
    apiUrl,
    geocodingApiUrl,
  }: {
    apiKey: string;
    apiUrl: string;
    geocodingApiUrl: string;
  }) {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
    this.geocodingApiUrl = geocodingApiUrl;
  }

  async getCoordinatesFromZipCode({
    zipCode,
    countryCode,
  }: {
    zipCode: string;
    countryCode: string;
  }) {
    try {
      const response: { data: OpenWeatherZipResponse } = await axios.get(
        `${this.geocodingApiUrl}/zip?zip=${zipCode},${countryCode}&appid=${this.apiKey}`
      );

      return getCoordinatesFromZipCodeSchema.parse(response.data);
    } catch (err) {
      console.error(err);

      throw err;
    }
  }

  async getCurrentWeather({ lat, lon }: { lat: number; lon: number }) {
    try {
      const response: { data: OpenWeatherApiResponse } = await axios.get(
        `${this.apiUrl}?lat=${lat}&lon=${lon}&appid=${this.apiKey}`
      );

      return getWeatherSchema.parse(this.normalizeWeatherData(response.data));
    } catch (err) {
      console.error(err);

      throw err;
    }
  }

  private normalizeWeatherData(data: OpenWeatherApiResponse) {
    return {
      main: data?.weather?.[0]?.main,
      description: data?.weather?.[0]?.description,
      temp: data?.main?.temp,
      feels_like: data?.main?.feels_like,
      temp_min: data?.main?.temp_min,
      temp_max: data?.main?.temp_max,
      pressure: data?.main?.pressure,
      humidity: data?.main?.humidity,
      visibility: data?.visibility,
      wind: {
        speed: data?.wind?.speed,
        deg: data?.wind?.deg,
      },
    };
  }
}
