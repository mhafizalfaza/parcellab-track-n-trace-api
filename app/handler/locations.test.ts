import lambdaTester from "lambda-tester";
import { find, findOne } from "./locations";
import { Location } from "../model";
import {
  clearDatabase,
  closeDatabase,
  connectDatabase,
} from "../utils/tests/db";
import { mockLocation } from "../utils/tests/mocks/locations.mock";
import mongoose from "mongoose";

describe("locations handler tests", () => {
  beforeAll(async () => await connectDatabase());

  afterEach(async () => await clearDatabase());

  afterAll(async () => await closeDatabase());

  describe("findOne location", () => {
    describe("using valid and existing id", () => {
      it("returns one location correctly", async () => {
        const location = await Location.create(mockLocation());

        await lambdaTester(findOne)
          .event({ pathParameters: { id: String(location._id) } })
          .expectResult((result: any) => {
            const body = JSON.parse(result.body);
            const locationRes = body.data;

            expect(locationRes).toMatchObject({
              _id: String(location._id),
              city: location.city,
            });
          });
      });
    });

    describe("using non-existent id", () => {
      it("returns null", async () => {
        const location = await Location.create(mockLocation());

        expect(location._id).toBeDefined();

        await lambdaTester(findOne)
          .event({
            pathParameters: { id: String(new mongoose.Types.ObjectId()) },
          })
          .expectResult((result: any) => {
            const body = JSON.parse(result.body);
            const locationRes = body.data;

            expect(locationRes).toBeNull();
          });
      });
    });

    describe("using invalid id", () => {
      it("returns invalid input error", async () => {
        const location = await Location.create(mockLocation());

        expect(location._id).toBeDefined();

        await lambdaTester(findOne)
          .event({
            pathParameters: { id: "invalid-id" },
          })
          .expectResult((result: any) => {
            const body = JSON.parse(result.body);

            const errorMsgParsed = JSON.parse(body.message)[0].message;

            expect(errorMsgParsed).toEqual("Invalid input");
          });
      });
    });
  });

  describe("find locations", () => {
    it("returns all locations correctly", async () => {
      const location1 = await Location.create(mockLocation());
      const location2 = await Location.create(mockLocation());
      const location3 = await Location.create(mockLocation());

      await lambdaTester(find)
        .event({})
        .expectResult((result: any) => {
          const body = JSON.parse(result.body);

          const locationsRes = body.data;

          const location1Res = locationsRes.find(
            (eachItem) => eachItem._id === String(location1._id)
          );

          const location2Res = locationsRes.find(
            (eachItem) => eachItem._id === String(location2._id)
          );

          const location3Res = locationsRes.find(
            (eachItem) => eachItem._id === String(location3._id)
          );

          expect(locationsRes).toHaveLength(3);

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

    describe("using limit 2", () => {
      it("returns 2 locations correctly", async () => {
        const location1 = await Location.create(mockLocation());
        const location2 = await Location.create(mockLocation());
        await Location.create(mockLocation());

        await lambdaTester(find)
          .event({ queryStringParameters: { limit: "2" } })
          .expectResult((result: any) => {
            const body = JSON.parse(result.body);

            const locationsRes = body.data;

            const location1Res = locationsRes.find(
              (eachItem) => eachItem._id === String(location1._id)
            );

            const location2Res = locationsRes.find(
              (eachItem) => eachItem._id === String(location2._id)
            );

            // Only 2 locations should return despite 3 locations created because limit is set to 2
            expect(locationsRes).toHaveLength(2);

            expect(location1Res).toMatchObject({
              _id: String(location1._id),
              city: location1.city,
            });
            expect(location2Res).toMatchObject({
              _id: String(location2._id),
              city: location2.city,
            });
          });
      });
    });

    describe("find locations by city and country", () => {
      it("returns all locations correctly", async () => {
        const location1 = await Location.create(mockLocation());
        // Passing city and country from shipment1 to shipment2
        const location2 = await Location.create(
          mockLocation({
            city: location1.city,
            country: location1.country,
          })
        );

        // The third shipment has different city and country
        await Location.create(mockLocation());

        await lambdaTester(find)
          .event({
            queryStringParameters: {
              city: location1.city,
              country: location1.country,
            },
          })
          .expectResult((result: any) => {
            const body = JSON.parse(result.body);

            const locationsRes = body.data;

            const location1Res = locationsRes.find(
              (eachItem) => eachItem._id === String(location1._id)
            );

            const location2Res = locationsRes.find(
              (eachItem) => eachItem._id === String(location2._id)
            );

            // Only 2 locations should return despite 3 locations created because the third one has different city and country
            expect(locationsRes).toHaveLength(2);

            expect(location1Res).toMatchObject({
              _id: String(location1._id),
              city: location1.city,
              country: location1.country,
              countryCode: location1.countryCode,
            });

            expect(location2Res).toMatchObject({
              _id: String(location2._id),
              city: location2.city,
              country: location2.country,
              countryCode: location2.countryCode,
            });
          });
      });

      describe("using limit 1", () => {
        it("returns 1 location correctly", async () => {
          const location1 = await Location.create(mockLocation());
          // Passing city and country from shipment1 to shipment2
          await Location.create(
            mockLocation({
              city: location1.city,
              country: location1.country,
            })
          );

          // The third shipment has different city and country
          await Location.create(mockLocation());

          await lambdaTester(find)
            .event({
              queryStringParameters: {
                limit: "1",
                city: location1.city,
                country: location1.country,
              },
            })
            .expectResult((result: any) => {
              const body = JSON.parse(result.body);

              const locationsRes = body.data;

              const location1Res = locationsRes.find(
                (eachItem) => eachItem._id === String(location1._id)
              );

              // Only 1 locations should return despite 3 locations created because limit is set to 1
              expect(locationsRes).toHaveLength(1);

              expect(location1Res).toMatchObject({
                _id: String(location1._id),
                city: location1.city,
                country: location1.country,
                countryCode: location1.countryCode,
              });
            });
        });
      });
    });
  });
});
