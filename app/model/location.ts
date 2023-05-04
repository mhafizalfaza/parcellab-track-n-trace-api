import mongoose from "mongoose";

export type LocationDocument = mongoose.Document & {
  city: string;
  country: string;
  countryCode: string;
  zipCode: string;
  coordinates: {
    lon: number;
    lat: number;
  };
  weather: {
    main: string;
    description: string;
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
    visibility: number;
    wind: {
      speed: number;
      deg: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
};

const LocationSchema = new mongoose.Schema(
  {
    city: { type: String, required: true },
    country: { type: String, required: true },
    countryCode: { type: String, required: true },
    zipCode: { type: String, required: true },
    coordinates: {
      type: {
        _id: false,
        lon: { type: Number, required: true },
        lat: { type: Number, required: true },
      },
      required: true,
    },
    weather: {
      type: {
        _id: false,
        main: { type: String, required: true },
        description: { type: String, required: true },
        temp: { type: Number, required: true },
        feels_like: { type: Number },
        temp_min: { type: Number },
        temp_max: { type: Number },
        pressure: { type: Number },
        humidity: { type: Number },
        visibility: { type: Number },
        wind: {
          _id: false,
          speed: { type: Number },
          deg: { type: Number },
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

LocationSchema.index({ zipCode: 1, countryCode: 1 }, { unique: true });

export const Location =
  (mongoose.models.Location as mongoose.Model<LocationDocument>) ||
  mongoose.model<LocationDocument>(
    "Location",
    LocationSchema,
    process.env.DB_LOCATIONS_COLLECTION
  );
