import { z } from "zod";

export const getCoordinatesFromZipCodeSchema = z.object({
  lat: z.number(),
  lon: z.number(),
});

export type GetWeather = z.infer<typeof getCoordinatesFromZipCodeSchema>;
