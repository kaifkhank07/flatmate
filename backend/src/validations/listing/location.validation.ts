import { z } from 'zod';

export const savePlaceSchema = z.object({
  body: z.object({
    placeId: z
      .string({ required_error: 'placeId is required' })
      .trim()
      .min(1, 'placeId is required'),
    name: z
      .string({ required_error: 'Location name is required' })
      .trim()
      .min(1, 'Location name is required'),
    formattedAddress: z
      .string({ required_error: 'Formatted address is required' })
      .trim()
      .min(1, 'Formatted address is required'),
    latitude: z
      .number({ required_error: 'Latitude is required', invalid_type_error: 'Latitude must be a number' })
      .min(-90)
      .max(90),
    longitude: z
      .number({ required_error: 'Longitude is required', invalid_type_error: 'Longitude must be a number' })
      .min(-180)
      .max(180),
    address: z
      .object({
        streetNumber: z.string().trim().optional(),
        route: z.string().trim().optional(),
        subLocality: z.string().trim().optional(),
        locality: z.string().trim().optional(),
        city: z.string().trim().optional(),
        district: z.string().trim().optional(),
        state: z.string().trim().optional(),
        stateCode: z.string().trim().optional(),
        country: z.string().trim().optional(),
        countryCode: z.string().trim().optional(),
        postalCode: z.string().trim().optional(),
      })
      .optional(),
    googleMaps: z
      .object({
        placeId: z.string().trim().optional(),
        mapsUrl: z.string().trim().optional(),
        location: z.object({ lat: z.number(), lng: z.number() }).optional(),
      })
      .optional(),
  }),
});
