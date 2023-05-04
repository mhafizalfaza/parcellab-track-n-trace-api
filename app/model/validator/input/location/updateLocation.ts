import * as z from "zod";

export const updateLocationValidator = z.object({
  weather: z
    .object({
      main: z.string(),
      description: z.string(),
      temp: z.number(),
      feels_like: z.number().optional(),
      temp_min: z.number().optional(),
      temp_max: z.number().optional(),
      pressure: z.number().optional(),
      humidity: z.number().optional(),
      visibility: z.number().optional(),
      wind: z.object({
        speed: z.number().optional(),
        deg: z.number().optional(),
      }),
    })
    .optional(),
});

export type UpdateLocation = z.infer<typeof updateLocationValidator>;
