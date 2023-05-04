import * as z from "zod";

export const findLocationsValidator = z
  .object({
    zipCode: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    countryCode: z.string().optional(),
    limit: z.string().pipe(z.coerce.number()).optional(),
    skip: z.string().pipe(z.coerce.number()).optional(),
  })
  .optional();

export type FindLocations = z.infer<typeof findLocationsValidator>;
