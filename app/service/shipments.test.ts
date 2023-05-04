import { ShipmentsService } from "./shipments";
import { Shipment } from "../model";
import {
  clearDatabase,
  closeDatabase,
  connectDatabase,
} from "../utils/tests/db";
import { mockShipment } from "../utils/tests/mocks/shipments.mock";
import mongoose from "mongoose";
import { UpdateShipment } from "../model/validator/input/shipment/updateShipment";
import { CreateShipment } from "../model/validator/input/shipment/createShipment";
import { faker } from "@faker-js/faker";

// For accessing protected methods
class ShipmentsServicePublic extends ShipmentsService {
  public createShipment(
    data: CreateShipment & {
      sender_location: string;
      receiver_location: string;
    }
  ) {
    return super.createShipment(data);
  }

  public findShipments(filter?: { tracking_number: string; carrier: string }) {
    return super.findShipments(filter);
  }

  public findOneShipmentById(id: string) {
    return super.findOneShipmentById(id);
  }

  public updateShipments(id: string, data: UpdateShipment) {
    return super.updateShipments(id, data);
  }

  public deleteOneShipmentById(id: string) {
    return super.deleteOneShipmentById(id);
  }
}

describe("shipments service tests", () => {
  const shipmentsService = new ShipmentsServicePublic(Shipment);

  beforeAll(async () => await connectDatabase());

  afterEach(async () => await clearDatabase());

  afterAll(async () => await closeDatabase());

  describe("createShipment", () => {
    describe("using sufficient and valid data", () => {
      it("creates shipment successfully", async () => {
        const shipment = await mockShipment({ mockLocation: true });

        const shipmentRes = await shipmentsService.createShipment(shipment);

        const expectObj = {
          tracking_number: shipment.tracking_number,
          carrier: shipment.carrier,
          article_name: shipment.article_name,
          article_quantity: shipment.article_quantity,
          article_price: shipment.article_price,
          SKU: shipment.SKU,
        };

        const shipmentFromDB = await Shipment.findOne(expectObj);

        expect(shipmentFromDB).toMatchObject(expectObj);

        expect(shipmentRes).toMatchObject(expectObj);
      });
    });
  });

  describe("findOne shipment", () => {
    describe("using valid and existing id", () => {
      it("returns one shipment correctly", async () => {
        const shipment = await Shipment.create(
          await mockShipment({ mockLocation: true })
        );

        const shipmentRes = await shipmentsService.findOneShipmentById(
          String(shipment._id)
        );

        expect(shipmentRes).toMatchObject({
          tracking_number: shipment.tracking_number,
          carrier: shipment.carrier,
          article_name: shipment.article_name,
          article_quantity: shipment.article_quantity,
          article_price: shipment.article_price,
          SKU: shipment.SKU,
        });
      });
    });

    describe("using non-existent id", () => {
      it("returns null", async () => {
        const shipment = await Shipment.create(
          await mockShipment({ mockLocation: true })
        );

        expect(shipment._id).toBeDefined();

        const shipmentRes = await shipmentsService.findOneShipmentById(
          String(new mongoose.Types.ObjectId())
        );

        expect(shipmentRes).toBeNull();
      });
    });

    describe("using invalid id", () => {
      it("returns invalid input error", async () => {
        const shipment = await Shipment.create(
          await mockShipment({ mockLocation: true })
        );

        expect(shipment._id).toBeDefined();

        await expect(
          shipmentsService.findOneShipmentById("invalid-id")
        ).rejects.toThrow(
          'Cast to ObjectId failed for value "invalid-id" (type string) at path "_id" for model "Shipment"'
        );
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

      const shipmentsRes = await shipmentsService.findShipments();

      const shipment1Res = shipmentsRes.find(
        (eachItem) => String(eachItem._id) === String(shipment1._id)
      );

      const shipment2Res = shipmentsRes.find(
        (eachItem) => String(eachItem._id) === String(shipment2._id)
      );

      const shipment3Res = shipmentsRes.find(
        (eachItem) => String(eachItem._id) === String(shipment3._id)
      );

      expect(shipmentsRes).toHaveLength(3);

      expect(shipment1Res).toMatchObject({
        tracking_number: shipment1.tracking_number,
        carrier: shipment1.carrier,
        article_name: shipment1.article_name,
        article_quantity: shipment1.article_quantity,
        article_price: shipment1.article_price,
        SKU: shipment1.SKU,
      });
      expect(shipment2Res).toMatchObject({
        tracking_number: shipment2.tracking_number,
        carrier: shipment2.carrier,
        article_name: shipment2.article_name,
        article_quantity: shipment2.article_quantity,
        article_price: shipment2.article_price,
        SKU: shipment2.SKU,
      });
      expect(shipment3Res).toMatchObject({
        tracking_number: shipment3.tracking_number,
        carrier: shipment3.carrier,
        article_name: shipment3.article_name,
        article_quantity: shipment3.article_quantity,
        article_price: shipment3.article_price,
        SKU: shipment3.SKU,
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

        const shipmentRes = await shipmentsService.deleteOneShipmentById(
          String(shipment._id)
        );

        const shipmentFromDB = await Shipment.findOne({ _id: shipment._id });

        expect(shipmentFromDB).toBeNull();

        expect(shipmentRes).toMatchObject({
          tracking_number: shipment.tracking_number,
          carrier: shipment.carrier,
          article_name: shipment.article_name,
          article_quantity: shipment.article_quantity,
          article_price: shipment.article_price,
          SKU: shipment.SKU,
        });
      });
    });

    describe("using non-existent id", () => {
      it("returns not found error", async () => {
        await Shipment.create(await mockShipment({ mockLocation: true }));

        const shipmentRes = await shipmentsService.deleteOneShipmentById(
          String(new mongoose.Types.ObjectId())
        );

        expect(shipmentRes).toBeNull();
      });
    });

    describe("using invalid id", () => {
      it("returns invalid input error", async () => {
        const shipment = await Shipment.create(
          await mockShipment({ mockLocation: true })
        );

        expect(shipment._id).toBeDefined();

        await expect(
          shipmentsService.deleteOneShipmentById("invalid-id")
        ).rejects.toThrow(
          'Cast to ObjectId failed for value "invalid-id" (type string) at path "_id" for model "Shipment"'
        );
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

        const shipmentRes = await shipmentsService.updateShipments(
          String(shipment._id),
          updateData
        );

        const shipmentFromDB = await Shipment.findOne({ _id: shipment._id });

        expect(shipmentFromDB).toMatchObject(updateData);

        expect(shipmentRes).toMatchObject(updateData);
      });
    });

    describe("using non-existent id", () => {
      it("returns not found error", async () => {
        await Shipment.create(await mockShipment({ mockLocation: true }));

        const shipmentRes = await shipmentsService.updateShipments(
          String(new mongoose.Types.ObjectId()),
          updateData
        );

        expect(shipmentRes).toBeNull();
      });
    });

    describe("using invalid id", () => {
      it("returns invalid input error", async () => {
        await Shipment.create(await mockShipment({ mockLocation: true }));

        await expect(
          shipmentsService.updateShipments("invalid-id", updateData)
        ).rejects.toThrow(
          'Cast to ObjectId failed for value "invalid-id" (type string) at path "_id" for model "Shipment"'
        );
      });
    });
  });
});
