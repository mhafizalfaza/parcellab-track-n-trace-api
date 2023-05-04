import * as z from "zod";
import { getWeatherSchema } from "../weather/getWeather";

export const createLocationValidator = z.object({
  city: z.string(),
  country: z.string(),
  countryCode: z.string(),
  zipCode: z.string(),
  coordinates: z.object({
    lat: z.number().refine(
      (lat) => {
        return !isNaN(lat) && lat >= -90 && lat <= 90;
      },
      {
        message: "Latitude must be a valid number between -90 and 90",
      }
    ),
    lon: z.number().refine(
      (lon) => {
        return !isNaN(lon) && lon >= -180 && lon <= 180;
      },
      {
        message: "Longitude must be a valid number between -180 and 180",
      }
    ),
  }),
  weather: getWeatherSchema.optional(),
});

export type CreateLocation = z.infer<typeof createLocationValidator>;
