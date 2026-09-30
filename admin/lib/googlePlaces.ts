"use client";

import { loadGoogleMapsScript } from "./googleMapsLoader";
import { AutocompleteSuggestion, SavePlacePayload } from "./api";

/**
 * Search Google Places autocomplete predictions in browser
 */
export async function searchFrontendGooglePlaces(
  input: string
): Promise<AutocompleteSuggestion[]> {
  if (!input || !input.trim()) return [];

  const google = await loadGoogleMapsScript();
  if (!google || !google.maps || !google.maps.places) {
    throw new Error("Google Maps Places SDK is not available");
  }

  return new Promise((resolve) => {
    const service = new google.maps.places.AutocompleteService();
    service.getPlacePredictions(
      {
        input: input.trim(),
        componentRestrictions: { country: "in" },
      },
      (predictions: any[], status: any) => {
        if (
          status !== google.maps.places.PlacesServiceStatus.OK ||
          !predictions ||
          predictions.length === 0
        ) {
          resolve([]);
          return;
        }

        const results: AutocompleteSuggestion[] = predictions.map((p: any) => ({
          placeId: p.place_id,
          description: p.description,
          mainText: p.structured_formatting?.main_text || p.description,
          secondaryText: p.structured_formatting?.secondary_text || "",
          types: p.types || [],
        }));

        resolve(results);
      }
    );
  });
}

/**
 * Fetch full Place Details in browser and format into SavePlacePayload
 */
export async function getFrontendPlaceDetails(
  placeId: string
): Promise<SavePlacePayload> {
  if (!placeId) throw new Error("placeId is required");

  const google = await loadGoogleMapsScript();
  if (!google || !google.maps || !google.maps.places) {
    throw new Error("Google Maps Places SDK is not available");
  }

  return new Promise((resolve, reject) => {
    const dummyElement = document.createElement("div");
    const service = new google.maps.places.PlacesService(dummyElement);

    service.getDetails(
      {
        placeId,
        fields: [
          "place_id",
          "name",
          "formatted_address",
          "geometry",
          "address_components",
          "url",
          "types",
        ],
      },
      (result: any, status: any) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !result) {
          reject(new Error(`Failed to fetch Google Place details for placeId: ${placeId}`));
          return;
        }

        const lat = result.geometry?.location?.lat();
        const lng = result.geometry?.location?.lng();

        if (lat === undefined || lng === undefined) {
          reject(new Error("Missing coordinates in Google Place response"));
          return;
        }

        const parsedAddress = parseAddressComponents(result.address_components || []);
        const name =
          result.name ||
          parsedAddress.subLocality ||
          parsedAddress.locality ||
          parsedAddress.city ||
          "Unknown Location";
        const formattedAddress = result.formatted_address || name;

        const payload: SavePlacePayload = {
          placeId: result.place_id || placeId,
          name,
          formattedAddress,
          latitude: lat,
          longitude: lng,
          address: parsedAddress,
          googleMaps: {
            placeId: result.place_id || placeId,
            mapsUrl: result.url || `https://www.google.com/maps/place/?q=place_id:${result.place_id || placeId}`,
            location: { lat, lng },
          },
        };

        resolve(payload);
      }
    );
  });
}

/**
 * Helper to parse Google address_components into structured object
 */
function parseAddressComponents(components: any[]) {
  const address: any = {
    country: "India",
    countryCode: "IN",
  };

  for (const comp of components) {
    const types = comp.types || [];

    if (types.includes("street_number")) {
      address.streetNumber = comp.long_name;
    } else if (types.includes("route")) {
      address.route = comp.long_name;
    } else if (types.includes("sublocality_level_1") || types.includes("sublocality")) {
      address.subLocality = comp.long_name;
    } else if (types.includes("locality")) {
      address.locality = comp.long_name;
    } else if (types.includes("administrative_area_level_2")) {
      address.district = comp.long_name;
      if (!address.city) address.city = comp.long_name;
    } else if (types.includes("administrative_area_level_1")) {
      address.state = comp.long_name;
      address.stateCode = comp.short_name;
    } else if (types.includes("country")) {
      address.country = comp.long_name;
      address.countryCode = comp.short_name;
    } else if (types.includes("postal_code")) {
      address.postalCode = comp.long_name;
    }
  }

  if (!address.city) {
    address.city = address.locality || address.subLocality || address.district;
  }

  return address;
}
