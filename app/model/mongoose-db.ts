import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { connectDatabase as connectTestDatabase } from "../utils/tests/db";

const dotenvPath = path.join(
  __dirname,
  "../../",
  `config/.env.${process.env.NODE_ENV}`
);

dotenv.config({
  path: dotenvPath,
});

const mongoConnection =
  process.env.NODE_ENV === "test"
    ? connectTestDatabase
    : mongoose.connect(process.env.DB_URL, {
        dbName: process.env.DB_NAME,
      });

export default mongoConnection;
