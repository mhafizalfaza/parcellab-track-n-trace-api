import * as z from "zod";
import { parseAddress } from "../../../../utils/helpers";

export const createShipmentValidator = z.object({
  tracking_number: z.string(),
  carrier: z.string(),
  sender_address: z.string().refine(
    (address) => {
      return Boolean(parseAddress(address));
    },
    {
      message: "sender_address is invalid, make sure there is no typo.",
    }
  ),
  receiver_address: z.string().refine(
    (address) => {
      return Boolean(parseAddress(address));
    },
    {
      message: "receiver_address is invalid, make sure there is no typo.",
    }
  ),
  article_name: z.string(),
  article_quantity: z.number().gt(0),
  article_price: z.number().gt(-1),
  SKU: z.string(),
});

export type CreateShipment = z.infer<typeof createShipmentValidator>;
