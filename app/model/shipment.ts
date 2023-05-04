import mongoose, { Schema } from "mongoose";
import { LocationDocument } from "./location";

export type ShipmentDocument = mongoose.Document & {
  tracking_number: string;
  carrier: string;
  sender_address: string;
  receiver_address: string;
  article_name: string;
  article_quantity: number;
  article_price: number;
  SKU: string;
  sender_location: string;
  receiver_location: string;
  createdAt: string;
  updatedAt: string;
};

export type ShipmentWithPopulatedLocations = ShipmentDocument & {
  sender_location: LocationDocument;
  receiver_location: LocationDocument;
};

const ShipmentSchema = new mongoose.Schema(
  {
    tracking_number: { type: String, required: true },
    carrier: { type: String, required: true },
    sender_address: { type: String, required: true },
    receiver_address: { type: String, required: true },
    article_name: { type: String, required: true },
    article_quantity: { type: Number, min: 1, required: true },
    article_price: { type: Number, min: 0, required: true },
    SKU: { type: String, required: true },
    sender_location: {
      type: Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },
    receiver_location: {
      type: Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Shipment =
  (mongoose.models.Shipment as mongoose.Model<ShipmentDocument>) ||
  mongoose.model<ShipmentDocument>(
    "Shipment",
    ShipmentSchema,
    process.env.DB_SHIPMENTS_COLLECTION
  );
