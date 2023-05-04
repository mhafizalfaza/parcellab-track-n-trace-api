import { Model } from "mongoose";
import { LocationDocument } from "../model";
import { createShipmentValidator } from "../model/validator/input/shipment/createShipment";
import { objectIdValidator } from "../model/validator/objectId";
import { LocationsService } from "../service/locations";
import { WeatherService } from "../service/external/weather";
import { parseAddress, httpErrorCode } from "../utils/helpers";
import { MessageUtil, StatusCode } from "../utils/message";
import { findLocationsValidator } from "../model/validator/input/location/findLocations";

export class LocationsController extends LocationsService {
  weatherService: WeatherService;

  constructor(locations: Model<any>) {
    super(locations);

    this.weatherService = new WeatherService({
      apiUrl: process.env.WEATHER_API_URL,
      apiKey: process.env.WEATHER_API_KEY,
      geocodingApiUrl: process.env.GEOCODING_API_URL,
    });
  }

  /**
   * Find location list
   */
  async find(event?: any) {
    const queryStringJson: object = event?.queryStringParameters || undefined;

    try {
      const findLocationsQueryParsed = queryStringJson
        ? findLocationsValidator.parse(queryStringJson)
        : undefined;
      const result = await this.findLocations(findLocationsQueryParsed);

      return MessageUtil.success(result);
    } catch (err) {
      console.error(err);

      return MessageUtil.error(err.code, err.message, httpErrorCode(err));
    }
  }

  /**
   * Query location by id
   * @param event
   */
  async findOne(event: any) {
    const { id } = event.pathParameters;

    try {
      const idParsed = objectIdValidator.parse(id);
      const result = await this.findOneLocationById(idParsed);

      return MessageUtil.success(result);
    } catch (err) {
      console.error(err);

      return MessageUtil.error(err.code, err.message, httpErrorCode(err));
    }
  }

  /**
   * Get sender and receiver location ids
   */
  async getSenderAndReceiverLocationIds(event: any) {
    let json: unknown = JSON.parse(event.body);

    try {
      const createShipmentParsed = createShipmentValidator.parse(json);

      // Parse sender_address to make sure it contains all required fields to create locations
      const parsedSenderAddress = parseAddress(
        createShipmentParsed.sender_address
      );

      // Return immediately if parseAddress returns false
      if (!parsedSenderAddress) {
        return MessageUtil.error(
          StatusCode.forbidden,
          "Invalid sender_address",
          httpErrorCode(StatusCode.forbidden)
        );
      }

      const {
        zipCode: senderZipCode,
        city: senderCity,
        country: senderCountry,
        countryCode: senderCountryCode,
      } = parsedSenderAddress;

      // Parse receiver_address to make sure it contains all required fields to create locations
      const parsedReceiverAddress = parseAddress(
        createShipmentParsed.receiver_address
      );

      // Return immediately if parseAddress returns false
      if (!parsedReceiverAddress) {
        return MessageUtil.error(
          StatusCode.forbidden,
          "Invalid sender_address",
          httpErrorCode(StatusCode.forbidden)
        );
      }

      const {
        zipCode: receiverZipCode,
        city: receiverCity,
        country: receiverCountry,
        countryCode: receiverCountryCode,
      } = parsedReceiverAddress;

      // Check if sender location already exists in database based on zipCode and countryCode
      const senderLocationFromDB =
        await this.findLocationByZipCodeAndCountryCode({
          zipCode: senderZipCode,
          countryCode: senderCountryCode,
        });

      // Get sender location coordinates (lon, lat) to create a new location
      // Use OpenWeather Geocoding API to get location coordinates
      const senderCoordinates = senderLocationFromDB
        ? senderLocationFromDB.coordinates
        : await this.weatherService.getCoordinatesFromZipCode({
            zipCode: senderZipCode,
            countryCode: senderCountryCode,
          });

      // Get sender location ID from existing location data
      // If it doesn't exist yet, create a new location using sender location data from above process
      const senderLocationId =
        senderLocationFromDB?._id ||
        (
          await this.createLocation({
            city: senderCity,
            country: senderCountry,
            countryCode: senderCountryCode,
            zipCode: senderZipCode,
            coordinates: senderCoordinates,
          })
        )._id;

      // Check if receiver location already exists in database based on zipCode and countryCode
      const receiverLocationFromDB =
        await this.findLocationByZipCodeAndCountryCode({
          zipCode: receiverZipCode,
          countryCode: receiverCountryCode,
        });

      // Get receiver location coordinates (lon, lat) to create a new location
      // Use OpenWeather Geocoding API to get location coordinates
      const receiverCoordinates = receiverLocationFromDB
        ? receiverLocationFromDB.coordinates
        : await this.weatherService.getCoordinatesFromZipCode({
            zipCode: receiverZipCode,
            countryCode: receiverCountryCode,
          });

      // Get receiver location ID from existing location data
      // If it doesn't exist yet, create a new location using sender location data from above process
      const receiverLocationId =
        receiverLocationFromDB?._id ||
        (
          await this.createLocation({
            city: receiverCity,
            country: receiverCountry,
            countryCode: receiverCountryCode,
            zipCode: receiverZipCode,
            coordinates: receiverCoordinates,
          })
        )._id;

      // Return senderLocationId receiverLocationId
      return MessageUtil.success({
        senderLocation: senderLocationId,
        receiverLocation: receiverLocationId,
      });
    } catch (err) {
      console.error(err);

      return MessageUtil.error(err.code, err.message, httpErrorCode(err));
    }
  }

  /**
   * Update weather data for locations with the current weather
   */
  async updateWeatherForLocations(locations: LocationDocument[]) {
    const updatedLocations: LocationDocument[] = [];
    for (const location of locations) {
      // See if the current location has been updated in the previous iteration
      const updatedLocation = updatedLocations.find((updatedLocation) => {
        return String(updatedLocation._id) === String(location._id);
      });

      // Skip this iteration if location has been updated in the previous iteration
      if (updatedLocation) continue;

      const currentWeather = await this.weatherService.getCurrentWeather({
        lat: location.coordinates.lat,
        lon: location.coordinates.lon,
      });

      const updateLocationRes = await this.updateLocation(location._id, {
        weather: currentWeather,
      });

      updatedLocations.push(updateLocationRes);
    }

    return updatedLocations;
  }
}
