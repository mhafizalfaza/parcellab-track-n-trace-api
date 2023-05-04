export class ResponseBodyVO {
  code: number;
  message: string;
  data?: object;
}

export class ResponseVO {
  statusCode: number;
  body: string;
}

// All properties in third-party API response type should be made optional due to unpredictable response body changes
export interface OpenWeatherApiResponse {
  coord?: {
    lon?: number;
    lat?: number;
  };
  weather?: Array<{
    id?: number;
    main?: string;
    description?: string;
    icon?: string;
  }>;
  base?: string;
  main?: {
    temp?: number;
    feels_like?: number;
    temp_min?: number;
    temp_max?: number;
    pressure?: number;
    humidity?: number;
  };
  visibility?: number;
  wind?: {
    speed?: number;
    deg?: number;
  };
  clouds?: {
    all?: number;
  };
  dt?: number;
  sys: {
    type?: number;
    id?: number;
    country?: string;
    sunrise?: number;
    sunset?: number;
  };
  timezone?: number;
  id?: number;
  name?: string;
  cod?: number;
}

export interface OpenWeatherZipResponse {
  zip?: string;
  name?: string;
  lat?: number;
  lon?: number;
  country: string;
}
