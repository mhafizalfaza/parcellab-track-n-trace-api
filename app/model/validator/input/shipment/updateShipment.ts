import * as z from "zod";
import { parseAddress } from "../../../../utils/helpers";

export const updateShipmentValidator = z.object({
  tracking_number: z.string().optional(),
  carrier: z.string().optional(),
  sender_address: z
    .string()
    .refine(
      (address) => {
        return Boolean(parseAddress(address));
      },
      {
        message: "sender_address is invalid, make sure there is no typo.",
      }
    )
    .optional(),
  receiver_address: z
    .string()
    .refine(
      (address) => {
        return Boolean(parseAddress(address));
      },
      {
        message: "receiver_address is invalid, make sure there is no typo.",
      }
    )
    .optional(),
  article_name: z.string().optional(),
  article_quantity: z.number().gt(0).optional(),
  // Allowing 'free' item to get shipped
  article_price: z.number().gte(0).optional(),
  SKU: z.string().optional(),
});

export type UpdateShipment = z.infer<typeof updateShipmentValidator>;
