import lambdaTester from "lambda-tester";
import { create, find, findOne, update } from "./shipments";
import { Shipment } from "../model";
import {
  clearDatabase,
  closeDatabase,
  connectDatabase,
} from "../utils/tests/db";
import { mockShipment } from "../utils/tests/mocks/shipments.mock";
import mongoose from "mongoose";
import { parseAddress, zodKeys } from "../utils/helpers";
import { createShipmentValidator } from "../model/validator/input/shipment/createShipment";
import { Location } from "../model";
import { faker } from "@faker-js/faker";
import { mockWeather } from "../utils/tests/mocks/weather.mock";

// Mocking OpenWeather API integration to minimize API calls
jest.mock("../service/external/weather", () => {
  return {
    WeatherService: jest.fn().mockImplementation(() => {
      return {
        getCoordinatesFromZipCode: () => ({ lon: 45, lat: 45 }),
        getCurrentWeather: () => mockWeather(),
      };
    }),
  };
});

describe("shipments handler tests", () => {
  const createShipmentRequiredFields = zodKeys(createShipmentValidator);

  beforeAll(async () => await connectDatabase());

  afterEach(async () => await clearDatabase());

  afterAll(async () => await closeDatabase());

  describe("create shipment", () => {
    describe("using sufficient and valid data", () => {
      it("creates shipment correctly", async () => {
        const shipment = await mockShipment();

        await lambdaTester(create)
          .event({ body: JSON.stringify(shipment) })
          .expectResult(async (result: any) => {
            const body = JSON.parse(result.body);

            const expectObj = {
              tracking_number: shipment.tracking_number,
              carrier: shipment.carrier,
              article_name: shipment.article_name,
              article_quantity: shipment.article_quantity,
              article_price: shipment.article_price,
              SKU: shipment.SKU,
            };

            const shipmentFromDB = await Shipment.findOne(expectObj);

            const shipmentRes = body.data;

            expect(shipmentFromDB).toMatchObject(expectObj);

            expect(shipmentRes).toMatchObject(expectObj);
          });
      }, 20000);
    });

    describe("using invalid sender_address", () => {
      it("returns input validation error", async () => {
        const shipment = await mockShipment(
          { mockLocation: true },
          { sender_address: "Invalid Address" }
        );

        await lambdaTester(create)
          .event({ body: JSON.stringify(shipment) })
          .expectResult(async (result: any) => {
            const body = JSON.parse(result.body);

            const errorMsgParsed = JSON.parse(body.message)[0].message;

            expect(errorMsgParsed).toEqual(
              "sender_address is invalid, make sure there is no typo."
            );
          });
      });
    });

    describe("using sender_address with correct format but invalid country", () => {
      it("returns input validation error", async () => {
        const shipment = await mockShipment(
          { mockLocation: true },
          { sender_address: "Street 3, 80331 Munich, Mock Country" }
        );

        await lambdaTester(create)
          .event({ body: JSON.stringify(shipment) })
          .expectResult(async (result: any) => {
            const body = JSON.parse(result.body);

            const errorMsgParsed = JSON.parse(body.message)[0].message;

            expect(errorMsgParsed).toEqual(
              "sender_address is invalid, make sure there is no typo."
            );
          });
      });
    });

    describe("using invalid receiver_address", () => {
      it("returns input validation error", async () => {
        const shipment = await mockShipment(
          { mockLocation: true },
          { receiver_address: "Invalid Address" }
        );

        await lambdaTester(create)
          .event({ body: JSON.stringify(shipment) })
          .expectResult(async (result: any) => {
            const body = JSON.parse(result.body);

            const errorMsgParsed = JSON.parse(body.message)[0].message;

            expect(errorMsgParsed).toEqual(
              "receiver_address is invalid, make sure there is no typo."
            );
          });
      });
    });

    describe("using receiver_address with correct format but invalid country", () => {
      it("returns input validation error", async () => {
        const shipment = await mockShipment(
          { mockLocation: true },
          { receiver_address: "Street 3, 80331 Munich, Mock Country" }
        );

        await lambdaTester(create)
          .event({ body: JSON.stringify(shipment) })
          .expectResult(async (result: any) => {
            const body = JSON.parse(result.body);

            const errorMsgParsed = JSON.parse(body.message)[0].message;

            expect(errorMsgParsed).toEqual(
              "receiver_address is invalid, make sure there is no typo."
            );
          });
      });
    });

    describe("using invalid article_price", () => {
      it("returns input validation error", async () => {
        const shipment = await mockShipment(
          { mockLocation: true },
          { article_price: -1 }
        );

        await lambdaTester(create)
          .event({ body: JSON.stringify(shipment) })
          .expectResult(async (result: any) => {
            const body = JSON.parse(result.body);

            const errorMsgParsed = JSON.parse(body.message)[0].message;

            expect(errorMsgParsed).toEqual("Number must be greater than -1");
          });
      });
    });

    describe("using invalid article_quantity", () => {
      it("returns input validation error", async () => {
        const shipment = await mockShipment(
          { mockLocation: true },
          { article_quantity: 0 }
        );

        await lambdaTester(create)
          .event({ body: JSON.stringify(shipment) })
          .expectResult(async (result: any) => {
            const body = JSON.parse(result.body);

            const errorMsgParsed = JSON.parse(body.message)[0].message;

            expect(errorMsgParsed).toEqual("Number must be greater than 0");
          });
      });
    });

    describe.each(createShipmentRequiredFields)(
      "missing a required field '%p'",
      (field) => {
        it("returns input validation error", async () => {
          const shipment = await mockShipment();
          await lambdaTester(create)
            .event({
              body: JSON.stringify({
                ...shipment,
                [field]: undefined,
              }),
            })
            .expectResult(async (result: any) => {
              const body = JSON.parse(result.body);

              const errorMsgParsed = JSON.parse(body.message)[0].message;

              expect(errorMsgParsed).toEqual("Required");
            });
        });
      }
    );

    describe("with an invalid field", () => {
      it("creates shipment correctly without invalid field", async () => {
        const shipment = await mockShipment();

        const { city, country } = parseAddress(shipment.sender_address);

        const locationFromDB = await Location.findOne({ city, country });

        expect(locationFromDB).toBeDefined();

        const invalidField = "invalid-field";

        await lambdaTester(create)
          .event({
            body: JSON.stringify({
              ...shipment,
              [invalidField]: invalidField,
            }),
          })
          .expectResult(async (result: any) => {
            const body = JSON.parse(result.body);

            const shipmentFromDB = await Shipment.findOne({
              tracking_number: shipment.tracking_number,
              carrier: shipment.carrier,
              article_name: shipment.article_name,
              article_quantity: shipment.article_quantity,
              article_price: shipment.article_price,
              SKU: shipment.SKU,
            });

            const shipmentRes = body.data;

            expect(shipmentRes).toMatchObject({
              tracking_number: shipmentFromDB.tracking_number,
              carrier: shipmentFromDB.carrier,
              article_name: shipmentFromDB.article_name,
              article_quantity: shipmentFromDB.article_quantity,
              article_price: shipmentFromDB.article_price,
              SKU: shipmentFromDB.SKU,
            });

            expect(shipmentRes).toMatchObject({
              tracking_number: shipment.tracking_number,
              carrier: shipment.carrier,
              article_name: shipment.article_name,
              article_quantity: shipment.article_quantity,
              article_price: shipment.article_price,
              SKU: shipment.SKU,
            });

            expect(shipmentFromDB[invalidField]).toBeUndefined();
          });
      }, 20000);
    });
  });

  describe("findOne shipment", () => {
    describe("using valid and existing id", () => {
      it("returns one shipment correctly", async () => {
        const shipment = await Shipment.create(
          await mockShipment({ mockLocation: true })
        );

        await lambdaTester(findOne)
          .event({ pathParameters: { id: String(shipment._id) } })
          .expectResult((result: any) => {
            const body = JSON.parse(result.body);
            const shipmentRes = body.data;

            expect(shipmentRes).toMatchObject({
              tracking_number: shipment.tracking_number,
              carrier: shipment.carrier,
              article_name: shipment.article_name,
              article_quantity: shipment.article_quantity,
              article_price: shipment.article_price,
              SKU: shipment.SKU,
              sender_location: String(shipment.sender_location),
              receiver_location: String(shipment.receiver_location),
            });
          });
      });
    });

    describe("using non-existent id", () => {
      it("returns null", async () => {
        const shipment = await Shipment.create(
          await mockShipment({ mockLocation: true })
        );

        expect(shipment._id).toBeDefined();

        await lambdaTester(findOne)
          .event({
            pathParameters: { id: String(new mongoose.Types.ObjectId()) },
          })
          .expectResult((result: any) => {
            const body = JSON.parse(result.body);
            const shipmentRes = body.data;

            expect(shipmentRes).toBeNull();
          });
      });
    });

    describe("using invalid id", () => {
      it("returns invalid input error", async () => {
        const shipment = await Shipment.create(
          await mockShipment({ mockLocation: true })
        );

        expect(shipment._id).toBeDefined();

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

  describe("find shipments", () => {
    it("returns all shipments correctly", async () => {
      const shipment1 = await Shipment.create(
        await mockShipment({ mockLocation: true })
      );
      const shipment2 = await Shipment.create(
        await mockShipment({ mockLocation: true })
      );
      const shipment3 = await Shipment.create(
        await mockShipment({ mockLocation: true })
      );

      await lambdaTester(find)
        .event({})
        .expectResult((result: any) => {
          const body = JSON.parse(result.body);

          const shipmentsRes = body.data;

          const shipment1Res = shipmentsRes.find(
            (eachItem) => eachItem._id === String(shipment1._id)
          );

          const shipment2Res = shipmentsRes.find(
            (eachItem) => eachItem._id === String(shipment2._id)
          );

          const shipment3Res = shipmentsRes.find(
            (eachItem) => eachItem._id === String(shipment3._id)
          );

          expect(shipmentsRes).toHaveLength(3);

          expect(shipment1Res).toMatchObject({
            _id: String(shipment1._id),
            tracking_number: shipment1.tracking_number,
            carrier: shipment1.carrier,
            article_name: shipment1.article_name,
            article_quantity: shipment1.article_quantity,
            article_price: shipment1.article_price,
            SKU: shipment1.SKU,
          });
          expect(shipment2Res).toMatchObject({
            _id: String(shipment2._id),
            tracking_number: shipment2.tracking_number,
            carrier: shipment2.carrier,
            article_name: shipment2.article_name,
            article_quantity: shipment2.article_quantity,
            article_price: shipment2.article_price,
            SKU: shipment2.SKU,
          });
          expect(shipment3Res).toMatchObject({
            _id: String(shipment3._id),
            tracking_number: shipment3.tracking_number,
            carrier: shipment3.carrier,
            article_name: shipment3.article_name,
            article_quantity: shipment3.article_quantity,
            article_price: shipment3.article_price,
            SKU: shipment3.SKU,
          });
        });
    });
  });

  describe("find only 2 shipments", () => {
    it("returns 2 shipments correctly", async () => {
      const shipment1 = await Shipment.create(
        await mockShipment({ mockLocation: true })
      );
      const shipment2 = await Shipment.create(
        await mockShipment({ mockLocation: true })
      );
      await Shipment.create(await mockShipment({ mockLocation: true }));

      await lambdaTester(find)
        .event({ queryStringParameters: { limit: "2" } })
        .expectResult((result: any) => {
          const body = JSON.parse(result.body);

          const shipmentsRes = body.data;

          const shipment1Res = shipmentsRes.find(
            (eachItem) => eachItem._id === String(shipment1._id)
          );

          const shipment2Res = shipmentsRes.find(
            (eachItem) => eachItem._id === String(shipment2._id)
          );

          // Only 2 shipments should return despite 3 shipments created because limit parameter is set to 2
          expect(shipmentsRes).toHaveLength(2);

          expect(shipment1Res).toMatchObject({
            _id: String(shipment1._id),
            tracking_number: shipment1.tracking_number,
            carrier: shipment1.carrier,
            article_name: shipment1.article_name,
            article_quantity: shipment1.article_quantity,
            article_price: shipment1.article_price,
            SKU: shipment1.SKU,
          });
          expect(shipment2Res).toMatchObject({
            _id: String(shipment2._id),
            tracking_number: shipment2.tracking_number,
            carrier: shipment2.carrier,
            article_name: shipment2.article_name,
            article_quantity: shipment2.article_quantity,
            article_price: shipment2.article_price,
            SKU: shipment2.SKU,
          });
        });
    });
  });

  describe("find shipments by tracking_number and carrier", () => {
    it("returns all shipments correctly", async () => {
      const shipment1 = await Shipment.create(
        await mockShipment({ mockLocation: true })
      );
      // Passing tracking_number and carrier from shipment1 to shipment2
      const shipment2 = await Shipment.create(
        await mockShipment(
          { mockLocation: true },
          {
            tracking_number: shipment1.tracking_number,
            carrier: shipment1.carrier,
          }
        )
      );

      // The third shipment has different tracking_number and carrier
      await Shipment.create(await mockShipment({ mockLocation: true }));

      await lambdaTester(find)
        .event({
          queryStringParameters: {
            tracking_number: shipment1.tracking_number,
            carrier: shipment1.carrier,
          },
        })
        .expectResult((result: any) => {
          const body = JSON.parse(result.body);

          const shipmentsRes = body.data;

          const shipment1Res = shipmentsRes.find(
            (eachItem) => eachItem._id === String(shipment1._id)
          );

          const shipment2Res = shipmentsRes.find(
            (eachItem) => eachItem._id === String(shipment2._id)
          );

          // Only 2 shipments should return despite 3 shipments created because the third one has different tracking_number and carrier
          expect(shipmentsRes).toHaveLength(2);

          expect(shipment1Res).toMatchObject({
            _id: String(shipment1._id),
            tracking_number: shipment1.tracking_number,
            carrier: shipment1.carrier,
            article_name: shipment1.article_name,
            article_quantity: shipment1.article_quantity,
            article_price: shipment1.article_price,
            SKU: shipment1.SKU,
          });
          expect(shipment2Res).toMatchObject({
            _id: String(shipment2._id),
            tracking_number: shipment2.tracking_number,
            carrier: shipment2.carrier,
            article_name: shipment2.article_name,
            article_quantity: shipment2.article_quantity,
            article_price: shipment2.article_price,
            SKU: shipment2.SKU,
          });
        });
    });

    describe("using limit 1", () => {
      it("returns 1 shipment correctly", async () => {
        const shipment1 = await Shipment.create(
          await mockShipment({ mockLocation: true })
        );
        // Passing tracking_number and carrier from shipment1 to shipment2
        await Shipment.create(
          await mockShipment(
            { mockLocation: true },
            {
              tracking_number: shipment1.tracking_number,
              carrier: shipment1.carrier,
            }
          )
        );

        // The third shipment has different tracking_number and carrier
        await Shipment.create(await mockShipment({ mockLocation: true }));

        await lambdaTester(find)
          .event({
            queryStringParameters: {
              limit: "1",
              tracking_number: shipment1.tracking_number,
              carrier: shipment1.carrier,
            },
          })
          .expectResult((result: any) => {
            const body = JSON.parse(result.body);

            const shipmentsRes = body.data;

            const shipment1Res = shipmentsRes.find(
              (eachItem) => eachItem._id === String(shipment1._id)
            );

            // Only 1 shipments should return despite 3 shipments created because limit is set to 1
            expect(shipmentsRes).toHaveLength(1);

            expect(shipment1Res).toMatchObject({
              _id: String(shipment1._id),
              tracking_number: shipment1.tracking_number,
              carrier: shipment1.carrier,
              article_name: shipment1.article_name,
              article_quantity: shipment1.article_quantity,
              article_price: shipment1.article_price,
              SKU: shipment1.SKU,
            });
          });
      });
    });
  });

  describe("update shipment", () => {
    const updateData = {
      tracking_number: faker.random.alphaNumeric(8),
      carrier: faker.company.name(),
      article_name: faker.commerce.product(),
      article_quantity: 1,
      article_price: Number(faker.commerce.price()),
      SKU: faker.random.alphaNumeric(5),
    };
    describe("using valid and existing id", () => {
      it("updates shipment correctly", async () => {
        const shipment = await Shipment.create(
          await mockShipment({ mockLocation: true })
        );

        await lambdaTester(update)
          .event({
            pathParameters: { id: String(shipment._id) },
            body: JSON.stringify(updateData),
          })
          .expectResult(async (result: any) => {
            const shipmentFromDB = await Shipment.findOne({
              _id: shipment._id,
            });

            expect(shipmentFromDB).toMatchObject(updateData);

            const body = JSON.parse(result.body);

            const shipmentRes = body.data;

            expect(shipmentRes).toMatchObject(updateData);
          });
      });
    });

    describe("using non-existent id", () => {
      it("returns not found error", async () => {
        await Shipment.create(await mockShipment({ mockLocation: true }));

        await lambdaTester(update)
          .event({
            pathParameters: {
              id: String(new mongoose.Types.ObjectId()),
            },
            body: JSON.stringify(updateData),
          })
          .expectResult(async (result: any) => {
            const body = JSON.parse(result.body);

            expect(body).toMatchObject({
              code: 1010,
              message: "The data was not found!",
            });
          });
      });
    });

    describe("using invalid id", () => {
      it("returns invalid input error", async () => {
        const shipment = await Shipment.create(
          await mockShipment({ mockLocation: true })
        );

        expect(shipment._id).toBeDefined();

        await lambdaTester(update)
          .event({
            pathParameters: { id: "invalid-id" },
            body: JSON.stringify(updateData),
          })
          .expectResult((result: any) => {
            const body = JSON.parse(result.body);

            const errorMsgParsed = JSON.parse(body.message)[0].message;

            expect(errorMsgParsed).toEqual("Invalid input");
          });
      });
    });

    describe("using invalid sender_address", () => {
      it("returns input validation error", async () => {
        const shipment = await Shipment.create(
          await mockShipment({ mockLocation: true })
        );

        expect(shipment._id).toBeDefined();

        await lambdaTester(update)
          .event({
            pathParameters: { id: String(shipment._id) },
            body: JSON.stringify({
              ...updateData,
              sender_address: "Invalid Address",
            }),
          })
          .expectResult(async (result: any) => {
            const body = JSON.parse(result.body);

            const errorMsgParsed = JSON.parse(body.message)[0].message;

            expect(errorMsgParsed).toEqual(
              "sender_address is invalid, make sure there is no typo."
            );
          });
      });
    });

    describe("using sender_address with correct format but invalid country", () => {
      it("returns input validation error", async () => {
        const shipment = await Shipment.create(
          await mockShipment({ mockLocation: true })
        );

        expect(shipment._id).toBeDefined();

        await lambdaTester(update)
          .event({
            pathParameters: { id: String(shipment._id) },
            body: JSON.stringify({
              ...updateData,
              sender_address: "Street 3, 80331 Munich, Mock Country",
            }),
          })
          .expectResult(async (result: any) => {
            const body = JSON.parse(result.body);

            const errorMsgParsed = JSON.parse(body.message)[0].message;

            expect(errorMsgParsed).toEqual(
              "sender_address is invalid, make sure there is no typo."
            );
          });
      });
    });

    describe("using invalid receiver_address", () => {
      it("returns input validation error", async () => {
        const shipment = await Shipment.create(
          await mockShipment({ mockLocation: true })
        );

        expect(shipment._id).toBeDefined();

        await lambdaTester(update)
          .event({
            pathParameters: { id: String(shipment._id) },
            body: JSON.stringify({
              ...updateData,
              receiver_address: "Invalid Address",
            }),
          })
          .expectResult(async (result: any) => {
            const body = JSON.parse(result.body);

            const errorMsgParsed = JSON.parse(body.message)[0].message;

            expect(errorMsgParsed).toEqual(
              "receiver_address is invalid, make sure there is no typo."
            );
          });
      });
    });

    describe("using receiver_address with correct format but invalid country", () => {
      it("returns input validation error", async () => {
        const shipment = await Shipment.create(
          await mockShipment({ mockLocation: true })
        );

        expect(shipment._id).toBeDefined();

        await lambdaTester(update)
          .event({
            pathParameters: { id: String(shipment._id) },
            body: JSON.stringify({
              ...updateData,
              receiver_address: "Street 3, 80331 Munich, Mock Country",
            }),
          })
          .expectResult(async (result: any) => {
            const body = JSON.parse(result.body);

            const errorMsgParsed = JSON.parse(body.message)[0].message;

            expect(errorMsgParsed).toEqual(
              "receiver_address is invalid, make sure there is no typo."
            );
          });
      });
    });
  });
});
