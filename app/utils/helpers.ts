import * as z from "zod";
import { ZodError } from "zod";
import { StatusCode } from "./message";
import countryCodeLookup from "country-code-lookup";

export const zodKeys = <T extends z.ZodTypeAny>(
  schema: T,
  opts?: { enumOnly: boolean }
): string[] => {
  if (schema === null || schema === undefined) return [];
  if (schema instanceof z.ZodNullable || schema instanceof z.ZodOptional)
    return zodKeys(schema.unwrap());
  if (schema instanceof z.ZodArray) return zodKeys(schema.element);
  if (schema instanceof z.ZodObject) {
    const entries = Object.entries(schema.shape);
    return entries
      .flatMap(([key, value]) => {
        const nested =
          value instanceof z.ZodType
            ? zodKeys(value).map((subKey) => `${key}.${subKey}`)
            : [];

        const typeEval = opts?.enumOnly
          ? value instanceof z.ZodEnum || value instanceof z.ZodNativeEnum
          : !(value instanceof z.ZodOptional);

        return nested.length ? nested : typeEval ? key : null;
      })
      .filter(Boolean);
  }

  return [];
};

export const httpErrorCode = (err: unknown) => {
  const httpCode =
    err instanceof ZodError
      ? StatusCode.forbidden
      : StatusCode.internalServerError;

  return httpCode;
};

export const parseAddress = (address: string) => {
  const addressSplitByComma = address.split(",");
  const streetAndNumber = addressSplitByComma?.[0];
  const zipCodeAndCitySplitByWhitespace = addressSplitByComma?.[1]
    ?.trim()
    ?.split(" ");
  const zipCode = zipCodeAndCitySplitByWhitespace?.[0];
  const city = zipCodeAndCitySplitByWhitespace?.slice(1)?.join(" ");
  const country = addressSplitByComma?.[2]?.trim();

  const countryCode = countryCodeLookup.byCountry(country);

  const addressIsValid =
    Boolean(streetAndNumber) &&
    Boolean(zipCode) &&
    Boolean(city) &&
    Boolean(country) &&
    Boolean(countryCode);

  return (
    addressIsValid && {
      street: streetAndNumber,
      zipCode,
      city,
      country,
      countryCode: countryCode?.iso2,
    }
  );
};

export const getCountryIso2 = (countryName: string) => {
  const countryCode = countryCodeLookup.byCountry(countryName);

  const countryIsValid = Boolean(countryCode?.iso2);

  return countryIsValid && countryCode?.iso2;
};

export const insensitiveRegexQuery = (value: string) => {
  return { $regex: new RegExp(value, "i") };
};

// Constants
export const DEFAULT_WEATHER_UPDATE_INTERVAL_IN_SECONDS = 7200;
export const DEFAULT_LIMIT_QUERY = 20;
