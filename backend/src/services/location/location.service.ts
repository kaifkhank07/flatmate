import { Types } from 'mongoose';
import { Location, ILocation } from '../../models/listing/location.model';
import { Property } from '../../models/listing/property.model';
import { FlatmateRequirement } from '../../models/listing/flatmateRequirements.model';
import { logger } from '../../utils/logger.util';

class LocationService {
  /**
   * Save a brand NEW location document in MongoDB using resolved Google payload from frontend.
   * Every call creates a new Location document (no deduplication / no placeId reuse).
   */
  public async savePlaceLocation(payload: any): Promise<ILocation> {
    const placeId = (payload.placeId || '').trim();
    if (!placeId) {
      throw new Error('placeId is required');
    }
    if (!payload.name || !payload.name.trim()) {
      throw new Error('location name is required');
    }
    if (payload.latitude === undefined || payload.longitude === undefined) {
      throw new Error('latitude and longitude are required');
    }

    // 1. Generate unique slug
    const slug = await this.generateUniqueSlug(payload.name, payload.address?.city || payload.name);

    // 2. Always create a NEW Location document
    const locationDoc = await Location.create({
      name: payload.name.trim(),
      slug,
      formattedAddress: (payload.formattedAddress || payload.name).trim(),
      latitude: Number(payload.latitude),
      longitude: Number(payload.longitude),
      geoLocation: {
        type: 'Point',
        coordinates: [Number(payload.longitude), Number(payload.latitude)],
      },
      placeId,
      locationType: 'geocode',
      address: payload.address || { city: payload.name, state: 'State', country: 'India' },
      googleMaps: payload.googleMaps || {
        placeId,
        mapsUrl: `https://www.google.com/maps/place/?q=place_id:${placeId}`,
        location: { lat: Number(payload.latitude), lng: Number(payload.longitude) },
      },
      providerResponse: { provider: 'google_frontend', placeId },
      isActive: true,
      isPopular: false,
    });

    logger.info(`[LocationService] Created NEW location document in DB: ${locationDoc._id} (${locationDoc.name})`);
    return locationDoc;
  }

  /**
   * Get location document by MongoDB ObjectId
   */
  public async getLocationById(id: string | Types.ObjectId): Promise<ILocation | null> {
    const strId = id ? id.toString() : '';
    if (!Types.ObjectId.isValid(strId)) return null;
    return Location.findById(strId).lean() as any;
  }

  /**
   * Delete location document from MongoDB ONLY if no Property or FlatmateRequirement references it.
   */
  public async deleteLocationIfUnreferenced(id: string | Types.ObjectId): Promise<boolean> {
    if (!id) return false;
    const strId = id.toString();
    if (!Types.ObjectId.isValid(strId)) return false;

    try {
      // Verify if any Property or FlatmateRequirement document still references this location
      const [isPropReferenced, isReqReferenced] = await Promise.all([
        Property.exists({ location: strId }),
        FlatmateRequirement.exists({ location: strId }),
      ]);

      if (!isPropReferenced && !isReqReferenced) {
        await Location.deleteOne({ _id: strId });
        logger.info(`[LocationService] Deleted unreferenced Location document: ${strId}`);
        return true;
      }
      logger.info(`[LocationService] Location ${strId} is still referenced by a property or flatmate requirement. Skipped deletion.`);
      return false;
    } catch (error: any) {
      logger.error(`[LocationService] Error deleting location ${strId}:`, error);
      return false;
    }
  }

  /**
   * Helper to generate a unique slug
   */
  private async generateUniqueSlug(name: string, city?: string): Promise<string> {
    let baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!baseSlug) baseSlug = 'location';

    let candidateSlug = baseSlug;
    let count = 0;

    while (await Location.exists({ slug: candidateSlug })) {
      count++;
      if (count === 1 && city) {
        const citySlug = city
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-');
        candidateSlug = `${baseSlug}-${citySlug}`;
      } else {
        candidateSlug = `${baseSlug}-${count}`;
      }
    }

    return candidateSlug;
  }
}

export const locationService = new LocationService();
