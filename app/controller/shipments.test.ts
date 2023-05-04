import { ShipmentsController } from "./shipments";
import { Shipment } from "../model";
import {
  clearDatabase,
  closeDatabase,
  connectDatabase,
} from "../utils/tests/db";
import { mockShipment } from "../utils/tests/mocks/shipments.mock";
import mongoose from "mongoose";
import { createShipmentValidator } from "../model/validator/input/shipment/createShipment";
import { zodKeys } from "../utils/helpers";
import { faker } from "@faker-js/faker";

describe("shipments controller tests", () => {
  const createShipmentRequiredFields = zodKeys(createShipmentValidator);

  const shipmentsController = new ShipmentsController(Shipment);

  beforeAll(async () => await connectDatabase());

  afterEach(async () => await clearDatabase());

  afterAll(async () => await closeDatabase());

  describe("create shipment", () => {
    describe("using sufficient and valid data", () => {
      it("creates shipment successfully", async () => {
        const shipment = await mockShipment({ mockLocation: true });

        const shipmentRes = await shipmentsController.create(
          {
            body: JSON.stringify(shipment),
          },
          {
            senderLocation: shipment.sender_location,
            receiverLocation: shipment.receiver_location,
          }
        );

        const expectObj = {
          tracking_number: shipment.tracking_number,
          carrier: shipment.carrier,
          article_name: shipment.article_name,
          article_quantity: shipment.article_quantity,
          article_price: shipment.article_price,
          SKU: shipment.SKU,
        };

        const shipmentFromDB = await Shipment.findOne(expectObj);

        const shipmentResBody = JSON.parse(shipmentRes.body);

        expect(shipmentFromDB).toMatchObject(expectObj);

        expect(shipmentResBody.data).toMatchObject(expectObj);
      });
    });

    describe("using invalid article_price", () => {
      it("returns input validation error", async () => {
        const shipment = await mockShipment(
          { mockLocation: true },
          { article_price: -1 }
        );

        const shipmentRes = await shipmentsController.create(
          {
            body: JSON.stringify(shipment),
          },
          {
            senderLocation: shipment.sender_location,
            receiverLocation: shipment.receiver_location,
          }
        );
        const body = JSON.parse(shipmentRes.body);

        const errorMsgParsed = JSON.parse(body.message)[0].message;

        expect(errorMsgParsed).toEqual("Number must be greater than -1");
      });
    });

    describe("using invalid article_quantity", () => {
      it("returns input validation error", async () => {
        const shipment = await mockShipment(
          { mockLocation: true },
          { article_quantity: 0 }
        );

        const shipmentRes = await shipmentsController.create(
          {
            body: JSON.stringify(shipment),
          },
          {
            senderLocation: shipment.sender_location,
            receiverLocation: shipment.receiver_location,
          }
        );
        const body = JSON.parse(shipmentRes.body);

        const errorMsgParsed = JSON.parse(body.message)[0].message;

        expect(errorMsgParsed).toEqual("Number must be greater than 0");
      });
    });

    describe.each(createShipmentRequiredFields)(
      "missing a required field '%p'",
      (field) => {
        it("returns input validation error", async () => {
          const shipment = await mockShipment({ mockLocation: true });

          const shipmentRes = await shipmentsController.create(
            {
              body: JSON.stringify({
                ...shipment,
                [field]: undefined,
              }),
            },
            {
              senderLocation: shipment.sender_location,
              receiverLocation: shipment.receiver_location,
            }
          );
          const body = JSON.parse(shipmentRes.body);

          const errorMsgParsed = JSON.parse(body.message)[0].message;

          expect(errorMsgParsed).toEqual("Required");
        });
      }
    );

    describe("with an invalid field", () => {
      it("creates shipment correctly without invalid field", async () => {
        const shipment = await mockShipment({ mockLocation: true });

        const invalidField = "invalid-field";

        const res = await shipmentsController.create(
          {
            body: JSON.stringify({
              ...shipment,
              [invalidField]: "invalidField",
            }),
          },
          {
            senderLocation: shipment.sender_location,
            receiverLocation: shipment.receiver_location,
          }
        );

        const shipmentFromDB = await Shipment.findOne({
          tracking_number: shipment.tracking_number,
          carrier: shipment.carrier,
          article_name: shipment.article_name,
          article_quantity: shipment.article_quantity,
          article_price: shipment.article_price,
          SKU: shipment.SKU,
        });

        const shipmentRes = JSON.parse(res.body).data;

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
    });
  });

  describe("findOne shipment", () => {
    describe("using valid and existing id", () => {
      it("returns one shipment correctly", async () => {
        const shipment = await Shipment.create(
          await mockShipment({ mockLocation: true })
        );

        const shipmentRes = await shipmentsController.findOne({
          pathParameters: {
            id: String(shipment._id),
          },
        });

        const shipmentResBody = JSON.parse(shipmentRes.body);

        expect(shipmentResBody.data).toMatchObject({
          _id: String(shipment._id),
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

    describe("using non-existent id", () => {
      it("returns null", async () => {
        const shipment = await Shipment.create(
          await mockShipment({ mockLocation: true })
        );

        expect(shipment._id).toBeDefined();

        const shipmentRes = await shipmentsController.findOne({
          pathParameters: { id: String(new mongoose.Types.ObjectId()) },
        });

        const shipmentResBody = JSON.parse(shipmentRes.body);

        expect(shipmentResBody.data).toBeNull();
      });
    });

    describe("using invalid id", () => {
      it("returns invalid input error", async () => {
        const shipment = await Shipment.create(
          await mockShipment({ mockLocation: true })
        );

        expect(shipment._id).toBeDefined();

        const shipmentRes = await shipmentsController.findOne({
          pathParameters: { id: "invalid-id" },
        });

        const shipmentResBody = JSON.parse(shipmentRes.body);

        const errorMsgParsed = JSON.parse(shipmentResBody.message)[0].message;

        expect(errorMsgParsed).toEqual("Invalid input");
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

      const shipmentsRes = await shipmentsController.find();

      const shipmentsResBody = JSON.parse(shipmentsRes.body);

      const shipmentsResData = shipmentsResBody.data;

      const shipment1Res = shipmentsResData.find(
        (eachItem) => eachItem._id === String(shipment1._id)
      );

      const shipment2Res = shipmentsResData.find(
        (eachItem) => eachItem._id === String(shipment2._id)
      );

      const shipment3Res = shipmentsResData.find(
        (eachItem) => eachItem._id === String(shipment3._id)
      );

      expect(shipmentsResData).toHaveLength(3);

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

  describe("find shipments by tracking_number and carrier", () => {
    it("returns filtered shipments correctly", async () => {
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

      const shipmentsRes = await shipmentsController.find({
        queryStringParameters: {
          tracking_number: shipment1.tracking_number,
          carrier: shipment1.carrier,
        },
      });

      const shipmentsResBody = JSON.parse(shipmentsRes.body);

      const shipmentsResData = shipmentsResBody.data;

      const shipment1Res = shipmentsResData.find(
        (eachItem) => eachItem._id === String(shipment1._id)
      );

      const shipment2Res = shipmentsResData.find(
        (eachItem) => eachItem._id === String(shipment2._id)
      );

      // Only 2 shipments should return despite 3 shipments created because the third one has different tracking_number and carrier
      expect(shipmentsResData).toHaveLength(2);

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

  describe("deleteOne shipment", () => {
    describe("using valid and existing id", () => {
      it("deletes shipment successfully", async () => {
        const shipment = await Shipment.create(
          await mockShipment({ mockLocation: true })
        );

        expect(shipment._id).toBeDefined();

        const shipmentRes = await shipmentsController.deleteOne({
          pathParameters: { id: String(shipment._id) },
        });

        const shipmentFromDB = await Shipment.findOne({ _id: shipment._id });

        expect(shipmentFromDB).toBeNull();

        const shipmentResBody = JSON.parse(shipmentRes.body);

        expect(shipmentResBody.data).toMatchObject({
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

    describe("using non-existent id", () => {
      it("returns not found error", async () => {
        await Shipment.create(await mockShipment({ mockLocation: true }));

        const shipmentRes = await shipmentsController.deleteOne({
          pathParameters: { id: String(new mongoose.Types.ObjectId()) },
        });

        const shipmentResBody = JSON.parse(shipmentRes.body);

        expect(shipmentResBody).toMatchObject({
          code: 1010,
          message: "The data was not found! May have been deleted!",
        });
      });
    });

    describe("using invalid id", () => {
      it("returns invalid input error", async () => {
        const shipment = await Shipment.create(
          await mockShipment({ mockLocation: true })
        );

        expect(shipment._id).toBeDefined();

        const shipmentRes = await shipmentsController.deleteOne({
          pathParameters: {
            id: "invalid-id",
          },
        });

        const shipmentResBody = JSON.parse(shipmentRes.body);

        const errorMsgParsed = JSON.parse(shipmentResBody.message)[0].message;

        expect(errorMsgParsed).toEqual("Invalid input");
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
      it("updates shipment successfully", async () => {
        const shipment = await Shipment.create(
          await mockShipment({ mockLocation: true })
        );

        const shipmentRes = await shipmentsController.update({
          pathParameters: { id: String(shipment._id) },
          body: JSON.stringify(updateData),
        });

        const shipmentFromDB = await Shipment.findOne({ _id: shipment._id });

        expect(shipmentFromDB).toMatchObject(updateData);

        const shipmentResBody = JSON.parse(shipmentRes.body);

        expect(shipmentResBody.data).toMatchObject(updateData);
      });
    });

    describe("using non-existent id", () => {
      it("returns not found error", async () => {
        await Shipment.create(await mockShipment({ mockLocation: true }));

        const shipmentRes = await shipmentsController.update({
          pathParameters: { id: String(new mongoose.Types.ObjectId()) },
          body: JSON.stringify(updateData),
        });

        const shipmentResBody = JSON.parse(shipmentRes.body);

        expect(shipmentResBody).toMatchObject({
          code: 1010,
          message: "The data was not found!",
        });
      });
    });

    describe("using invalid id", () => {
      it("returns invalid input error", async () => {
        await Shipment.create(await mockShipment({ mockLocation: true }));

        const shipmentRes = await shipmentsController.update({
          pathParameters: { id: "invalid-id" },
          body: JSON.stringify(updateData),
        });

        const shipmentResBody = JSON.parse(shipmentRes.body);

        const errorMsgParsed = JSON.parse(shipmentResBody.message)[0].message;

        expect(errorMsgParsed).toEqual("Invalid input");
      });
    });
  });
});
