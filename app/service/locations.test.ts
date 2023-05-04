import { LocationsService } from "./locations";
import { Location } from "../model/location";
import {
  clearDatabase,
  closeDatabase,
  connectDatabase,
} from "../utils/tests/db";
import { mockLocation } from "../utils/tests/mocks/locations.mock";
import mongoose from "mongoose";
import { UpdateLocation } from "../model/validator/input/location/updateLocation";
import { CreateLocation } from "../model/validator/input/location/createLocation";

// For accessing protected methods
class LocationsServicePublic extends LocationsService {
  public createLocation(data: CreateLocation) {
    return super.createLocation(data);
  }

  public findLocations() {
    return super.findLocations();
  }

  public findOneLocationById(id) {
    return super.findOneLocationById(id);
  }

  public updateLocation(id: string, data: UpdateLocation) {
    return super.updateLocation(id, data);
  }
}

describe("locations service tests", () => {
  const locationsService = new LocationsServicePublic(Location);

  beforeAll(async () => await connectDatabase());

  afterEach(async () => await clearDatabase());

  afterAll(async () => await closeDatabase());

  describe("createLocation", () => {
    describe("using sufficient and valid data", () => {
      it("creates location successfully", async () => {
        const location = mockLocation();

        const expectObj = {
          city: location.city,
        };

        const locationRes = await locationsService.createLocation(location);

        const locationFromDB = await Location.findOne({ city: location.city });

        expect(locationFromDB).toMatchObject(expectObj);

        expect(locationRes).toMatchObject(expectObj);
      });
    });
  });

  describe("findOne location", () => {
    describe("using valid and existing id", () => {
      it("returns one location correctly", async () => {
        const location = await Location.create(mockLocation());

        const locationRes = await locationsService.findOneLocationById(String(location._id));

        expect(locationRes).toMatchObject({
          _id: location._id,
          city: location.city,
        });
      });
    });

    describe("using non-existent id", () => {
      it("returns null", async () => {
        const location = await Location.create(mockLocation());

        expect(location._id).toBeDefined();

        const locationRes = await locationsService.findOneLocationById(
          String(new mongoose.Types.ObjectId())
        );

        expect(locationRes).toBeNull();
      });
    });

    describe("using invalid id", () => {
      it("returns invalid input error", async () => {
        const location = await Location.create(mockLocation());

        expect(location._id).toBeDefined();

        await expect(
          locationsService.findOneLocationById("invalid-id")
        ).rejects.toThrow(
          'Cast to ObjectId failed for value "invalid-id" (type string) at path "_id" for model "Location"'
        );
      });
    });
  });

  describe("find locations", () => {
    it("returns all locations correctly", async () => {
      const location1 = await Location.create(mockLocation());
      const location2 = await Location.create(mockLocation());
      const location3 = await Location.create(mockLocation());

      const locationsRes = await locationsService.findLocations();

      const location1Res = locationsRes.find(
        (eachItem) => String(eachItem._id) === String(location1._id)
      );

      const location2Res = locationsRes.find(
        (eachItem) => String(eachItem._id) === String(location2._id)
      );

      const location3Res = locationsRes.find(
        (eachItem) => String(eachItem._id) === String(location3._id)
      );

      expect(locationsRes).toHaveLength(3);

      expect(location1Res).toMatchObject({
        city: location1.city,
      });
      expect(location2Res).toMatchObject({
        city: location2.city,
      });
      expect(location3Res).toMatchObject({
        city: location3.city,
      });
    });
  });

  describe("update location", () => {
    const updateData = {
      weather: {
        main: "Cloudy",
        description: "cloudy sky",
        temp: 290.39,
        feels_like: 290.93,
        temp_min: 290.58,
        temp_max: 291.03,
        pressure: 1000,
        humidity: 55,
        visibility: 10000,
        wind: {
          speed: 3,
          deg: 290,
        },
      },
    };
    describe("using valid and existing id", () => {
      it("updates location successfully", async () => {
        const location = await Location.create(mockLocation());

        const locationRes = await locationsService.updateLocation(
          String(location._id),
          updateData
        );

        const locationFromDB = await Location.findOne({ _id: location._id });

        expect(locationFromDB).toMatchObject(updateData);

        expect(locationRes).toMatchObject(updateData);
      });
    });

    describe("using non-existent id", () => {
      it("returns null", async () => {
        await Location.create(mockLocation());

        const locationRes = await locationsService.updateLocation(
          String(new mongoose.Types.ObjectId()),
          updateData
        );

        expect(locationRes).toBeNull();
      });
    });

    describe("using invalid id", () => {
      it("returns invalid input error", async () => {
        await Location.create(mockLocation());

        await expect(
          locationsService.updateLocation("invalid-id", updateData)
        ).rejects.toThrow(
          'Cast to ObjectId failed for value "invalid-id" (type string) at path "_id" for model "Location"'
        );
      });
    });
  });
});
