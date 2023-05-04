import { Handler } from "aws-lambda";
import { LocationsController } from "../controller/locations";
import { Location } from "../model";

const locationsController = new LocationsController(Location);

export const find: Handler = (event: any) => {
  return locationsController.find(event);
};

export const findOne: Handler = (event: any) => {
  return locationsController.findOne(event);
};
