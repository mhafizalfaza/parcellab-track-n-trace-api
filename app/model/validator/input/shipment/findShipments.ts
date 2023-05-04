import * as z from "zod";

export const findShipmentsValidator = z
  .object({
    tracking_number: z.string().optional(),
    carrier: z.string().optional(),
    limit: z.string().pipe(z.coerce.number()).optional(),
    skip: z.string().pipe(z.coerce.number()).optional(),
  })
  .optional();

export type FindShipments = z.infer<typeof findShipmentsValidator>;
