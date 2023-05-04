# Parcel Lab Track and Trace API

This is a backend application that manages shipments and locations integrated with [OpenWeather API](https://openweathermap.org) to get the latest weather data for a specific location.

## Setup

To run this project locally, you will need to have the following installed on your system:

- Node.js v14 or higher
- Docker
- Serverless Framework installed globally (`npm install -g serverless`)

1. Clone this repository

2. Install dependencies

`npm install` or `npm install --legacy-peer-deps` if you are using NPM v7 or higher

3. Start a local MongoDB instance

Using Docker (recommended)

- Run mongo docker image:

```
docker run -d --name <YOUR_CONTAINER_NAME_HERE> -p <YOUR_LOCALHOST_PORT_HERE>:27017 -e MONGO_INITDB_ROOT_USERNAME=<YOUR_USERNAME_HERE> -e MONGO_INITDB_ROOT_PASSWORD=<YOUR_PASSWORD_HERE> mongo
```

- Check that the container’s up and running:

`docker container ls`

- Start + connect to a bash shell within the container:

`docker exec -it <YOUR_CONTAINER_NAME_HERE> bash`

- Access the MongoDB instance via the mongo command line interface:

`mongosh --username <YOUR_USERNAME_HERE> --password <YOUR_PASSWORD_HERE>`

- Create database:

`use <YOUR_DATABASE_NAME_HERE>`

4. Set environment variables

Go to `config/.env.[NODE_ENV]` and set the environment variables for each node environment

```
DB_URL=mongodb://<YOUR_USERNAME_HERE>:<YOUR_PASSWORD_HERE>@0.0.0.0:<YOUR_LOCALHOST_PORT_HERE>
DB_NAME=<YOUR_DATABASE_NAME_HERE>
DB_LOCATIONS_COLLECTION=locations
DB_SHIPMENTS_COLLECTION=shipments
WEATHER_API_URL=https://api.openweathermap.org/data/2.5/weather
// Get you API key here https://openweathermap.org
WEATHER_API_KEY=<YOUR_OPENWEATHER_API_KEY_HERE>
GEOCODING_API_URL=http://api.openweathermap.org/geo/1.0
// Setting weather update interval to 2 hours
WEATHER_UPDATE_INTERVAL_IN_SECONDS=7200
```

5. Seed shipments data to get started with some data

`npm run seed`

6. Run app locally

`npm run local`

The API will now be available at `http://localhost:3000/dev`

## Endpoints

### Shipments

- `GET /shipments?tracking_number={tracking_number}&carrier={carrier}&limit={limit}&skip={skip}`: Get a list of all shipments based on query parameters (optional, leave query parameters empty to fetch all shipments with default limit 20)

Note: Fetching shipments will check the last updated datetime of the weather of the shipment locations (sender and receiver), and if it's outdated (determined by `WEATHER_UPDATE_INTERVAL_IN_SECONDS` env variable) it will fetch the current weather data from [OpenWeather API](https://openweathermap.org) for the corresponding location and update the location in database with the current weather data

- `GET /shipments/{id}`: Get a shipment by ID

- `POST /shipments`: Add a new shipment

  Request body JSON:

```
{
  tracking_number: "TN12345680", // string, required
  carrier: "DPD", // string, required
  sender_address: "Street 3, 80331 Munich, Germany", // string, required (must be in correct format)
  receiver_address: "Street 5, 28013 Madrid, Spain", // string, required (must be in correct format)
  article_name: "Keyboard", // string, required
  article_quantity: 1, // string, required
  article_price: 50, // string, required
  SKU: "KB012", // string, required
}

```

Note: Adding a new shipment will automatically create a new location if the location with specific `zipCode` and `country` doesn't exist in database yet, otherwise it will simply associate the `shipment.sender_address` and `shipment.receiver_address` with the existing `location`

- `PUT /shipments/{id}`: Update a shipment by ID

  Request body JSON:

```
{
  tracking_number: "TN12345680", // string, optional
  carrier: "DPD", // string, optional
  sender_address: "Street 3, 80331 Munich, Germany", // string, optional (must be in correct format)
  receiver_address: "Street 5, 28013 Madrid, Spain", // string, optional (must be in correct format)
  article_name: "Keyboard", // string, optional
  article_quantity: 1, // number, optional
  article_price: 50, // number, optional
  SKU: "KB012", // string, optional
}
```

- `DELETE /shipments/{id}`: Remove a shipment by ID

### Locations

- `GET /locations?zipCode={zipCode}&city={city}&country={country}&countryCode={countryCode}&limit={limit}&skip={skip}`: Get a list of all locations based on query parameters (optional, leave query parameters empty to fetch all locations with default limit 20)
- `GET /locations/{id}`: Get a location by ID

For safety reasons, `create`, `update` and `delete` `location` APIs are not provided

## Tests

Before running the tests, please set the env variables in `./config/.env.test`

To run the tests, run the following command:

`npm run test`
