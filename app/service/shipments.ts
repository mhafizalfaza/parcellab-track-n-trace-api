import { Model } from "mongoose";
import { CreateShipment } from "../model/validator/input/shipment/createShipment";
import { FindShipments } from "../model/validator/input/shipment/findShipments";
import { UpdateShipment } from "../model/validator/input/shipment/updateShipment";
import { DEFAULT_LIMIT_QUERY, insensitiveRegexQuery } from "../utils/helpers";

export class ShipmentsService {
  private shipments: Model<any>;
  constructor(shipments: Model<any>) {
    this.shipments = shipments;
  }

  /**
   * Create shipment
   * @param data
   */
  protected async createShipment(
    data: CreateShipment & {
      sender_location: string;
      receiver_location: string;
    }
  ): Promise<object> {
    try {
      const result = await this.shipments.create(data);

      return result;
    } catch (err) {
      console.error(err);

      throw err;
    }
  }

  /**
   * Update a shipment by id
   * @param id
   * @param data
   */
  protected updateShipments(_id: string, data: UpdateShipment) {
    return this.shipments.findOneAndUpdate({ _id }, data, {
      new: true,
    });
  }

  /**
   * Find shipments
   */
  protected findShipments(filter?: FindShipments) {
    // Apply filter query and make it case-insensitive to make filtering more intuitive
    const query: {
      [key in keyof FindShipments]: ReturnType<typeof insensitiveRegexQuery>;
    } = {};
    if (filter?.tracking_number)
      query.tracking_number = insensitiveRegexQuery(filter.tracking_number);
    if (filter?.carrier) query.carrier = insensitiveRegexQuery(filter.carrier);

    return this.shipments
      .find(
        query,
        {},
        // Limiting the query results to a reasonable number to prevent overfetching
        // 'skip' enables pagination
        { limit: filter?.limit || DEFAULT_LIMIT_QUERY, skip: filter?.skip }
      )
      .populate("sender_location")
      .populate("receiver_location");
  }

  /**
   * Query shipment by id
   * @param id
   */
  protected findOneShipmentById(_id: string) {
    return this.shipments.findOne({ _id });
  }

  /**
   * Delete shipment by id
   * @param id
   */
  protected deleteOneShipmentById(_id: string) {
    return this.shipments.findOneAndDelete({ _id });
  }
}
