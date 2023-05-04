import { Handler } from "aws-lambda";
import { LocationsController } from "../controller/locations";
import { ShipmentsController } from "../controller/shipments";
import { Shipment, ShipmentWithPopulatedLocations } from "../model";
import { Location } from "../model";
import { MessageUtil } from "../utils/message";

const locationsController = new LocationsController(Location);
const shipmentsController = new ShipmentsController(Shipment);

export const create: Handler = async (event: any) => {
  const senderAndReceiverLocationIds =
    await locationsController.getSenderAndReceiverLocationIds(event);

  return shipmentsController.create(
    event,
    JSON.parse(senderAndReceiverLocationIds.body).data
  );
};

export const update: Handler = (event: any) =>
  shipmentsController.update(event);

export const find: Handler = async (event: any) => {
  // Find shipments based on filter applied
  const res = await shipmentsController.find(event);

  const shipments = JSON.parse(res.body).data as ShipmentWithPopulatedLocations[];

  // Check if there is location with outdated weather data
  const locationsWithOutdatedWeather =
    shipmentsController.getLocationsWithOutdatedWeatherFromShipments(shipments);

  // Return shipments immediately if weather data of all locations are up-to-date
  if (!locationsWithOutdatedWeather.length) {
    return MessageUtil.success(shipments);
  }

  // Update weather data for all locations with outdated weather data
  const updatedLocations = await locationsController.updateWeatherForLocations(
    locationsWithOutdatedWeather
  );

  // Replace outdated locations with updated locations with current weather data
  const shipmentsWithUpdatedLocations =
    shipmentsController.replaceOutdatedLocationsWithUpdatedLocations({
      shipments,
      updatedLocations,
    });

  return MessageUtil.success(shipmentsWithUpdatedLocations);
};

export const findOne: Handler = (event: any) => {
  return shipmentsController.findOne(event);
};

export const deleteOne: Handler = (event: any) =>
  shipmentsController.deleteOne(event);
