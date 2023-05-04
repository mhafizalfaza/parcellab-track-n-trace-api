import { z } from "zod";

export const getWeatherSchema = z.object({
  main: z.string(),
  description: z.string(),
  temp: z.number(),
  feels_like: z.number().optional(),
  temp_min: z.number().optional(),
  temp_max: z.number().optional(),
  pressure: z.number().optional(),
  humidity: z.number().optional(),
  visibility: z.number().optional(),
  wind: z
    .object({
      speed: z.number().optional(),
      deg: z.number().optional(),
    })
    .optional(),
});

export type GetWeather = z.infer<typeof getWeatherSchema>;
