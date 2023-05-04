import { WeatherService } from "./weather";
import path from "path";
import dotenv from "dotenv";

const dotenvPath = path.join(
  __dirname,
  "../../../",
  `config/.env.${process.env.NODE_ENV}`
);

dotenv.config({
  path: dotenvPath,
});

describe("weather service tests", () => {
  const weatherService = new WeatherService({
    apiUrl: process.env.WEATHER_API_URL,
    apiKey: process.env.WEATHER_API_KEY,
    geocodingApiUrl: process.env.GEOCODING_API_URL,
  });

  describe("getCoordinatesFromZipCode", () => {
    it("gets current weather successfully", async () => {
      const zipCode = "12489";
      const countryCode = "DE";

      const weather = await weatherService.getCoordinatesFromZipCode({
        zipCode,
        countryCode,
      });

      expect(weather).toMatchObject({
        lon: expect.any(Number),
        lat: expect.any(Number),
      });
    });
  });

  describe("getCurrentWeather", () => {
    it("gets current weather successfully", async () => {
      const lat = 52.52;
      const lon = 13.405;

      const weather = await weatherService.getCurrentWeather({
        lat,
        lon,
      });

      expect(weather).toMatchObject({
        main: expect.any(String),
        description: expect.any(String),
        temp: expect.any(Number),
        feels_like: expect.any(Number),
        temp_min: expect.any(Number),
        temp_max: expect.any(Number),
        pressure: expect.any(Number),
        humidity: expect.any(Number),
        visibility: expect.any(Number),
        wind: { speed: expect.any(Number), deg: expect.any(Number) },
      });
    });
  });
});
