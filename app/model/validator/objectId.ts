import mongoose from "mongoose";
import * as z from "zod";

export const objectIdValidator = z.string().refine((val) => {
  return mongoose.Types.ObjectId.isValid(val);
});
