import { faker } from "@faker-js/faker";
import { Location } from "../../../model";
import { parseAddress } from "../../helpers";
import { mockLocation } from "./locations.mock";

const mockAddress = (
  street: string,
  location?: ReturnType<typeof mockLocation>
) => {
  const address = `${street}, ${location?.zipCode || faker.address.zipCode()} ${
    location?.city || faker.address.city()
  }, ${location?.country || faker.address.country()}`;

  // Sometimes faker generates bogus country
  // Needs to be handled to prevent randomly failing tests
  if (!parseAddress(address)) {
    return mockAddress(street, location);
  }

  return address;
};

export const mockShipment = async (
  opts?: { mockLocation?: boolean },
  values?: {
    sender_address?: string;
    receiver_address?: string;
    article_price?: number;
    article_quantity?: number;
    tracking_number?: string;
    carrier?: string;
  }
) => {
  const locationMocked = opts?.mockLocation ? mockLocation() : undefined;

  let locationId = undefined;
  if (locationMocked) {
    locationId = String((await Location.create(locationMocked))._id);
  }

  const sender_address =
    values?.sender_address || mockAddress("Street 1", locationMocked);
  const receiver_address =
    values?.receiver_address || mockAddress("Street 1", locationMocked);

  return {
    tracking_number: values?.tracking_number || faker.random.alphaNumeric(8),
    carrier: values?.carrier || faker.company.name(),
    sender_address,
    receiver_address,
    article_name: faker.commerce.product(),
    article_quantity:
      typeof values?.article_quantity === "number"
        ? values?.article_quantity
        : 1,
    article_price:
      typeof values?.article_price === "number"
        ? values?.article_price
        : Number(faker.commerce.price()),
    SKU: faker.random.alphaNumeric(5),
    sender_location: locationId,
    receiver_location: locationId,
  };
};
