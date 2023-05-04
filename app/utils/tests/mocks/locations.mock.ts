import { faker } from "@faker-js/faker";
import { getCountryIso2 } from "../../helpers";

const getValidCountry = () => {
  const country = faker.address.country();
  const countryIso2 = getCountryIso2(country);

  // Sometimes faker generates bogus country
  // Needs to be handled to prevent randomly failing tests
  if (!countryIso2) {
    return getValidCountry();
  }

  return { country, countryCode: countryIso2 };
};

export const mockLocation = (values?: {
  city?: string;
  country?: string;
  countryCode?: string;
}) => {
  const { country, countryCode } = getValidCountry();
  return {
    city: values?.city || faker.address.cityName(),
    country: values?.country || country,
    countryCode: values?.countryCode || countryCode,
    zipCode: faker.address.zipCode(),
    coordinates: {
      lon: Number(faker.address.longitude()),
      lat: Number(faker.address.latitude()),
    },
    weather: {
      main: "Clear",
      description: "clear sky",
      temp: 284.39,
      feels_like: 282.93,
      temp_min: 282.58,
      temp_max: 287.03,
      pressure: 1027,
      humidity: 52,
      visibility: 10000,
      wind: {
        speed: 2.68,
        deg: 278,
      },
    },
  };
};
