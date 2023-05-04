import { Model } from "mongoose";
import { LocationDocument } from "../model";

import { CreateLocation } from "../model/validator/input/location/createLocation";
import { FindLocations } from "../model/validator/input/location/findLocations";
import { UpdateLocation } from "../model/validator/input/location/updateLocation";
import { DEFAULT_LIMIT_QUERY, insensitiveRegexQuery } from "../utils/helpers";

export class LocationsService {
  private locations: Model<any>;
  constructor(locations: Model<any>) {
    this.locations = locations;
  }

  /**
   * Create location
   * @param data
   */
  protected async createLocation(
    data: CreateLocation
  ): Promise<LocationDocument> {
    try {
      const result = await this.locations.create(data);

      return result;
    } catch (err) {
      console.error(err);

      throw err;
    }
  }

  /**
   * Update a location by id
   * @param id
   * @param data
   */
  protected updateLocation(_id: string, data: UpdateLocation) {
    return this.locations.findOneAndUpdate({ _id }, data, {
      new: true,
    });
  }

  /**
   * Find locations
   */
  protected findLocations(filter?: FindLocations) {
    // Apply filter query and make it case-insensitive to make filtering more intuitive
    const query: {
      [key in keyof FindLocations]: ReturnType<typeof insensitiveRegexQuery>;
    } = {};
    if (filter?.zipCode) query.zipCode = insensitiveRegexQuery(filter.zipCode);
    if (filter?.city) query.city = insensitiveRegexQuery(filter.city);
    if (filter?.country) query.country = insensitiveRegexQuery(filter.country);
    if (filter?.countryCode)
      query.countryCode = insensitiveRegexQuery(filter.countryCode);

    return this.locations.find(
      query,
      {},
      // Limiting the query results to a reasonable number to prevent overfetching
      // 'skip' enables pagination
      { limit: filter?.limit || DEFAULT_LIMIT_QUERY, skip: filter?.skip }
    );
  }

  /**
   * Find location by name and country
   */
  protected findLocationByZipCodeAndCountryCode({
    zipCode,
    countryCode,
  }: {
    zipCode: string;
    countryCode: string;
  }) {
    return this.locations.findOne({ zipCode, countryCode });
  }

  /**
   * Query location by id
   * @param id
   */
  protected findOneLocationById(_id: string) {
    return this.locations.findOne({ _id });
  }
}
