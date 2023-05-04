import { Model } from "mongoose";
import { MessageUtil } from "../utils/message";
import { ShipmentsService } from "../service/shipments";
import { createShipmentValidator } from "../model/validator/input/shipment/createShipment";
import { objectIdValidator } from "../model/validator/objectId";
import { updateShipmentValidator } from "../model/validator/input/shipment/updateShipment";
import {
  DEFAULT_WEATHER_UPDATE_INTERVAL_IN_SECONDS,
  httpErrorCode,
} from "../utils/helpers";
import { findShipmentsValidator } from "../model/validator/input/shipment/findShipments";
import { LocationDocument, ShipmentWithPopulatedLocations } from "../model";
import { differenceInSeconds } from "date-fns";

export class ShipmentsController extends ShipmentsService {
  constructor(shipments: Model<any>) {
    super(shipments);
  }

  /**
   * Create shipment
   * @param {*} event
   */
  async create(
    event: any,
    locations: { senderLocation: string; receiverLocation: string }
  ) {
    let json: unknown = JSON.parse(event.body);

    try {
      const createShipmentParsed = createShipmentValidator.parse(json);
      const result = await this.createShipment({
        ...createShipmentParsed,
        sender_location: locations.senderLocation,
        receiver_location: locations.receiverLocation,
      });

      return MessageUtil.success(result);
    } catch (err) {
      console.error(err);

      return MessageUtil.error(err.code, err.message, httpErrorCode(err));
    }
  }

  /**
   * Update a shipment by id
   * @param event
   */
  async update(event: any) {
    const { id } = event.pathParameters;
    const body: object = JSON.parse(event.body);

    try {
      const idParsed = objectIdValidator.parse(id);
      const bodyParsed = updateShipmentValidator.parse(body);
      const result = await this.updateShipments(idParsed, bodyParsed);

      if (!result) {
        return MessageUtil.error(1010, "The data was not found!");
      }

      return MessageUtil.success(result);
    } catch (err) {
      console.error(err);

      return MessageUtil.error(err.code, err.message, httpErrorCode(err));
    }
  }

  /**
   * Find shipment list
   */
  async find(event?: any) {
    const queryStringJson: object = event?.queryStringParameters || undefined;

    try {
      const findShipmentsQueryParsed = queryStringJson
        ? findShipmentsValidator.parse(queryStringJson)
        : undefined;
      const shipments = await this.findShipments(findShipmentsQueryParsed);

      return MessageUtil.success(shipments);
    } catch (err) {
      console.error(err);

      return MessageUtil.error(err.code, err.message, httpErrorCode(err));
    }
  }

  /**
   * Query shipment by id
   * @param event
   */
  async findOne(event: any) {
    const { id } = event.pathParameters;

    try {
      const idParsed = objectIdValidator.parse(id);
      const result = await this.findOneShipmentById(idParsed);

      return MessageUtil.success(result);
    } catch (err) {
      console.error(err);

      return MessageUtil.error(err.code, err.message, httpErrorCode(err));
    }
  }

  /**
   * Delete shipment by id
   * @param event
   */
  async deleteOne(event: any) {
    const { id } = event.pathParameters;

    try {
      const idParsed = objectIdValidator.parse(id);
      const result = await this.deleteOneShipmentById(idParsed);

      if (!result) {
        return MessageUtil.error(
          1010,
          "The data was not found! May have been deleted!"
        );
      }

      return MessageUtil.success(result);
    } catch (err) {
      console.error(err);

      return MessageUtil.error(err.code, err.message, httpErrorCode(err));
    }
  }

  getLocationsWithOutdatedWeatherFromShipments(
    shipments: ShipmentWithPopulatedLocations[]
  ): LocationDocument[] {
    const outdatedLocationsArray = [];
    shipments.forEach((shipment) => {
      const now = new Date();

      // Calculating the time difference between now and the last weather update
      // If it's greater than the interval value, push the location to outdatedLocationsArray
      if (
        differenceInSeconds(now, new Date(shipment.sender_location.updatedAt)) >
        (Number(process.env.WEATHER_UPDATE_INTERVAL_IN_SECONDS) ||
          DEFAULT_WEATHER_UPDATE_INTERVAL_IN_SECONDS)
      ) {
        outdatedLocationsArray.push(shipment.sender_location);
      }

      if (
        differenceInSeconds(
          now,
          new Date(shipment.receiver_location.updatedAt)
        ) >
        (Number(process.env.WEATHER_UPDATE_INTERVAL_IN_SECONDS) ||
          DEFAULT_WEATHER_UPDATE_INTERVAL_IN_SECONDS)
      ) {
        outdatedLocationsArray.push(shipment.receiver_location);
      }
    });

    return outdatedLocationsArray;
  }

  replaceOutdatedLocationsWithUpdatedLocations({
    shipments,
    updatedLocations,
  }: {
    shipments: ShipmentWithPopulatedLocations[];
    updatedLocations: LocationDocument[];
  }) {
    return shipments.map((shipment) => {
      // Check if sender location has been updated
      const updatedSenderLocation = updatedLocations.find((updatedLocation) => {
        return (
          String(updatedLocation._id) === String(shipment.sender_location._id)
        );
      });

      // Check if receiver location has been updated
      const updatedReceiverLocation = updatedLocations.find(
        (updatedLocation) => {
          return (
            String(updatedLocation._id) ===
            String(shipment.receiver_location._id)
          );
        }
      );

      // If updated location is found,replace the location with the updated one
      return {
        ...shipment,
        sender_location: updatedSenderLocation || shipment.sender_location,
        receiver_location: updatedReceiverLocation || shipment.sender_location,
      };
    });
  }
}
