import { LocationsController } from "./locations";
import { Location } from "../model";
import {
  clearDatabase,
  closeDatabase,
  connectDatabase,
} from "../utils/tests/db";
import { mockLocation } from "../utils/tests/mocks/locations.mock";
import mongoose from "mongoose";

describe("locations controller tests", () => {
  const locationsController = new LocationsController(Location);

  beforeAll(async () => await connectDatabase());

  afterEach(async () => await clearDatabase());

  afterAll(async () => await closeDatabase());

  describe("findOne location", () => {
    describe("using valid and existing id", () => {
      it("returns one location correctly", async () => {
        const location = await Location.create(mockLocation());

        const locationRes = await locationsController.findOne({
          pathParameters: {
            id: String(location._id),
          },
        });

        const locationResBody = JSON.parse(locationRes.body);

        expect(locationResBody.data).toMatchObject({
          _id: String(location._id),
          city: location.city,
        });
      });
    });

    describe("using non-existent id", () => {
      it("returns null", async () => {
        const location = await Location.create(mockLocation());

        expect(location._id).toBeDefined();

        const locationRes = await locationsController.findOne({
          pathParameters: { id: String(new mongoose.Types.ObjectId()) },
        });

        const locationResBody = JSON.parse(locationRes.body);

        expect(locationResBody.data).toBeNull();
      });
    });

    describe("using invalid id", () => {
      it("returns invalid input error", async () => {
        const location = await Location.create(mockLocation());

        expect(location._id).toBeDefined();

        const locationRes = await locationsController.findOne({
          pathParameters: { id: "invalid-id" },
        });

        const locationResBody = JSON.parse(locationRes.body);

        const errorMsgParsed = JSON.parse(locationResBody.message)[0].message;

        expect(errorMsgParsed).toEqual("Invalid input");
      });
    });
  });

  describe("find locations", () => {
    it("returns all locations correctly", async () => {
      const location1 = await Location.create(mockLocation());
      const location2 = await Location.create(mockLocation());
      const location3 = await Location.create(mockLocation());

      const locationsRes = await locationsController.find();

      const locationsResBody = JSON.parse(locationsRes.body);

      const locationsResData = locationsResBody.data;

      const location1Res = locationsResData.find(
        (eachItem) => eachItem._id === String(location1._id)
      );

      const location2Res = locationsResData.find(
        (eachItem) => eachItem._id === String(location2._id)
      );

      const location3Res = locationsResData.find(
        (eachItem) => eachItem._id === String(location3._id)
      );

      expect(locationsResData).toHaveLength(3);

      expect(location1Res).toMatchObject({
        _id: String(location1._id),
        city: location1.city,
      });
      expect(location2Res).toMatchObject({
        _id: String(location2._id),
        city: location2.city,
      });
      expect(location3Res).toMatchObject({
        _id: String(location3._id),
        city: location3.city,
      });
    });
  });
});
