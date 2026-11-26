import { Types } from 'mongoose';
import { Property, IProperty } from '../../models/listing/property.model';
import {
  FlatmateRequirement,
  IFlatmateRequirement,
} from '../../models/listing/flatmateRequirements.model';
import { createNotification } from '../notification/notification.service';
import { logger } from '../../utils/logger.util';

export interface ProcessListingMatchesOptions {
  listingType: 'property' | 'flatmate_requirement';
  listingId: Types.ObjectId | string;
}

export interface ProcessMatchesSummary {
  sourceId: string;
  sourceType: 'property' | 'flatmate_requirement';
  candidatesEvaluated: number;
  matchesFound: number;
  notificationsSent: number;
}

/**
 * Haversine formula to compute distance between two geographical points in km
 */
export const calculateHaversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 100) / 100;
};

/**
 * Extract lat/lon coordinates from a populated location document
 */
export const getCoordinates = (
  location: any
): { lat?: number; lon?: number } => {
  if (!location) return {};
  let lat =
    typeof location.latitude === 'number' && !isNaN(location.latitude)
      ? location.latitude
      : undefined;
  let lon =
    typeof location.longitude === 'number' && !isNaN(location.longitude)
      ? location.longitude
      : undefined;

  // Fallback to GeoJSON coordinates [longitude, latitude]
  if (
    (lat === undefined || lon === undefined) &&
    Array.isArray(location.geoLocation?.coordinates) &&
    location.geoLocation.coordinates.length === 2
  ) {
    lon = location.geoLocation.coordinates[0];
    lat = location.geoLocation.coordinates[1];
  }

  return { lat, lon };
};

/**
 * Check location compatibility between two listings
 * - Distance <= maxRadiusKm (default 25km) OR
 * - Same city name (case-insensitive) OR
 * - Same location ObjectId
 */
export const isLocationCompatible = (
  loc1: any,
  loc2: any,
  maxRadiusKm: number = 25
): boolean => {
  if (!loc1 || !loc2) return false;

  // If both share the exact same location document ID
  const id1 = loc1._id ? loc1._id.toString() : loc1.toString();
  const id2 = loc2._id ? loc2._id.toString() : loc2.toString();
  if (id1 && id2 && id1 === id2) {
    return true;
  }

  // Check Haversine distance if coordinates are available
  const coords1 = getCoordinates(loc1);
  const coords2 = getCoordinates(loc2);

  if (
    coords1.lat !== undefined &&
    coords1.lon !== undefined &&
    coords2.lat !== undefined &&
    coords2.lon !== undefined &&
    (coords1.lat !== 0 || coords1.lon !== 0) &&
    (coords2.lat !== 0 || coords2.lon !== 0)
  ) {
    const distance = calculateHaversineDistance(
      coords1.lat,
      coords1.lon,
      coords2.lat,
      coords2.lon
    );
    if (distance <= maxRadiusKm) {
      return true;
    }
  }

  // Fallback: Check city name match (case-insensitive)
  const city1 = (loc1.address?.city || loc1.name || '').trim().toLowerCase();
  const city2 = (loc2.address?.city || loc2.name || '').trim().toLowerCase();

  if (city1 && city2 && (city1 === city2 || city1.includes(city2) || city2.includes(city1))) {
    return true;
  }

  // Check locality match if available
  const locality1 = (loc1.address?.locality || loc1.address?.subLocality || '').trim().toLowerCase();
  const locality2 = (loc2.address?.locality || loc2.address?.subLocality || '').trim().toLowerCase();
  if (
    locality1 &&
    locality2 &&
    (locality1 === locality2 || locality1.includes(locality2) || locality2.includes(locality1))
  ) {
    return true;
  }

  return false;
};

/**
 * Check if space rent is within seeker's budget
 * Supports a 10% flexible buffer so spaceRent <= seekerBudget * 1.10
 */
export const isBudgetCompatible = (
  spaceRent: number,
  seekerBudget: number,
  toleranceMultiplier: number = 1.10
): boolean => {
  if (spaceRent <= 0 || seekerBudget <= 0) return true;
  return spaceRent <= Math.round(seekerBudget * toleranceMultiplier);
};

/**
 * Check property type compatibility
 * Wildcard if either is unset. Compatible groups for flat and room.
 */
export const isPropertyTypeCompatible = (
  type1?: any,
  type2?: any
): boolean => {
  if (!type1 || !type2) return true;
  const extractVal = (val: any): string => {
    if (typeof val === 'string') return val.trim().toLowerCase();
    if (typeof val === 'object' && val) {
      if (val.category) return String(val.category).trim().toLowerCase();
      if (val.type) return String(val.type).trim().toLowerCase();
    }
    return '';
  };
  const t1 = extractVal(type1);
  const t2 = extractVal(type2);
  if (!t1 || !t2) return true;
  if (t1 === t2) return true;

  const flatGroup = new Set(['flat', 'entire_property', 'apartment', 'flat_apartment', 'flats_apartments', 'house', 'villa', 'houses_villas', 'residential']);
  const roomGroup = new Set(['room', 'shared_apartment', 'pg']);

  if (flatGroup.has(t1) && flatGroup.has(t2)) return true;
  if (roomGroup.has(t1) && roomGroup.has(t2)) return true;

  return false;
};

/**
 * Check availability / move-in date compatibility
 * Space should be available on or within 30 days of seeker's move-in date
 */
export const isAvailabilityCompatible = (
  spaceAvailableFrom?: Date | string | null,
  seekerMoveInDate?: Date | string | null,
  maxDelayDays: number = 30
): boolean => {
  if (!spaceAvailableFrom || !seekerMoveInDate) return true;
  const spaceDate = new Date(spaceAvailableFrom);
  const seekerDate = new Date(seekerMoveInDate);

  if (isNaN(spaceDate.getTime()) || isNaN(seekerDate.getTime())) return true;

  const diffTime = spaceDate.getTime() - seekerDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  return diffDays <= maxDelayDays;
};

/**
 * Check furnishing compatibility
 * Fully furnished space satisfies semi-furnished or unfurnished seekers
 */
export const isFurnishingCompatible = (
  spaceFurnishing?: string,
  seekerFurnishing?: string
): boolean => {
  if (!spaceFurnishing || !seekerFurnishing) return true;
  const f1 = spaceFurnishing.trim().toLowerCase();
  const f2 = seekerFurnishing.trim().toLowerCase();
  if (f1 === f2) return true;
  if (f1 === 'fully_furnished') return true;
  return false;
};

/**
 * Check gender preference compatibility
 * Respects 'any' as wildcard
 */
export const isGenderCompatible = (
  pref1?: string,
  pref2?: string
): boolean => {
  if (!pref1 || !pref2) return true;
  const p1 = pref1.trim().toLowerCase();
  const p2 = pref2.trim().toLowerCase();
  if (p1 === 'any' || p2 === 'any') return true;
  return p1 === p2;
};

/**
 * Check occupation preference compatibility
 * Respects 'any' as wildcard
 */
export const isOccupationCompatible = (
  pref1?: string,
  pref2?: string
): boolean => {
  if (!pref1 || !pref2) return true;
  const p1 = pref1.trim().toLowerCase();
  const p2 = pref2.trim().toLowerCase();
  if (p1 === 'any' || p2 === 'any') return true;
  return p1 === p2;
};

/**
 * Generate a deterministic deduplication key for a match notification
 * Format: property_match_${minId}_${maxId}_${recipientId}
 */
export const getDeduplicationKey = (
  id1: Types.ObjectId | string,
  id2: Types.ObjectId | string,
  recipientId: Types.ObjectId | string
): string => {
  const [minId, maxId] = [id1.toString(), id2.toString()].sort();
  return `property_match_${minId}_${maxId}_${recipientId.toString()}`;
};

/**
 * Main property matching processor.
 * Triggered whenever a Property or FlatmateRequirement transitions to 'approved'.
 *
 * Routing Rules:
 * - Case A: Property approved -> Find matching FlatmateRequirement(property) -> Notify seeker
 * - Case B: FlatmateRequirement(partner) approved -> Find matching FlatmateRequirement(property) -> Notify seeker
 * - Case C: FlatmateRequirement(property) approved -> Find matching FlatmateRequirement(partner) + Property -> Notify both groups
 *
 * Safe & resilient: will never throw unhandled errors to the caller.
 */
export const processListingMatches = async (
  options: ProcessListingMatchesOptions
): Promise<ProcessMatchesSummary> => {
  const { listingType, listingId } = options;
  const summary: ProcessMatchesSummary = {
    sourceId: listingId.toString(),
    sourceType: listingType,
    candidatesEvaluated: 0,
    matchesFound: 0,
    notificationsSent: 0,
  };

  try {
    const objId = new Types.ObjectId(listingId.toString());

    if (listingType === 'property') {
      // Fetch source property
      const property = await Property.findById(objId).populate('location').lean();
      if (!property) {
        logger.warn(`[PropertyMatch] Source property not found: ${listingId}`);
        return summary;
      }
      if (property.status !== 'approved') {
        logger.info(`[PropertyMatch] Source property ${listingId} is not approved (status: ${property.status}). Skipping matching.`);
        return summary;
      }

      // Case A: Approved Property -> Matching FlatmateRequirement (property) -> Notify requirement owners
      const candidates = await FlatmateRequirement.find({
        status: 'approved',
        postType: 'property',
        userId: { $ne: property.userId },
      }).populate('location').lean();

      summary.candidatesEvaluated = candidates.length;

      for (const candidate of candidates) {
        try {
          if (!isLocationCompatible(property.location, candidate.location)) continue;
          if (!isBudgetCompatible(property.rent, candidate.rent)) continue;
          if (!isPropertyTypeCompatible(property.propertyType, candidate.propertyType)) continue;
          if (!isAvailabilityCompatible(property.availableFrom, candidate.availableFrom)) continue;
          if (!isFurnishingCompatible(property.furnishing, candidate.furnishing)) continue;
          if (!isGenderCompatible(property.genderPreference, candidate.genderPreference)) continue;
          if (!isOccupationCompatible(property.occupationPreference, candidate.occupationPreference)) continue;

          summary.matchesFound++;

          const dedupKey = getDeduplicationKey(property._id, candidate._id, candidate.userId);

          await createNotification({
            recipientType: 'USER',
            recipientId: candidate.userId,
            eventType: 'PROPERTY_MATCH_FOUND',
            category: 'PROPERTY_MATCH',
            title: 'New Matching Property Available!',
            message: `A new property listing "${property.title}" matches your budget and location criteria.`,
            actionUrl: `/listing/${property.slug || property._id}`,
            data: {
              sourceListingId: property._id.toString(),
              sourceListingType: 'property',
              matchedListingId: candidate._id.toString(),
              matchedListingType: 'flatmate_requirement',
              matchType: 'property_to_seeker',
            },
            priority: 'NORMAL',
            deduplicationKey: dedupKey,
          });

          summary.notificationsSent++;
        } catch (candidateErr) {
          logger.warn(
            `[PropertyMatch] Error processing candidate requirement ${candidate._id} for property ${property._id}:`,
            candidateErr
          );
        }
      }

      logger.info(
        `[PropertyMatch] Case A completed for property ${property._id}: ${summary.candidatesEvaluated} evaluated, ${summary.matchesFound} matched, ${summary.notificationsSent} notified.`
      );
    } else if (listingType === 'flatmate_requirement') {
      // Fetch source flatmate requirement
      const requirement = await FlatmateRequirement.findById(objId).populate('location').lean();
      if (!requirement) {
        logger.warn(`[PropertyMatch] Source flatmate requirement not found: ${listingId}`);
        return summary;
      }
      if (requirement.status !== 'approved') {
        logger.info(
          `[PropertyMatch] Source flatmate requirement ${listingId} is not approved (status: ${requirement.status}). Skipping matching.`
        );
        return summary;
      }

      if (requirement.postType === 'partner') {
        // Case B: Approved Requirement (partner) -> Matching FlatmateRequirement (property) -> Notify requirement owners
        const candidates = await FlatmateRequirement.find({
          status: 'approved',
          postType: 'property',
          userId: { $ne: requirement.userId },
        }).populate('location').lean();

        summary.candidatesEvaluated = candidates.length;

        for (const candidate of candidates) {
          try {
            if (!isLocationCompatible(requirement.location, candidate.location)) continue;
            if (!isBudgetCompatible(requirement.rent, candidate.rent)) continue;
            if (!isPropertyTypeCompatible(requirement.propertyType, candidate.propertyType)) continue;
            if (!isAvailabilityCompatible(requirement.availableFrom, candidate.availableFrom)) continue;
            if (!isFurnishingCompatible(requirement.furnishing, candidate.furnishing)) continue;
            if (!isGenderCompatible(requirement.genderPreference, candidate.genderPreference)) continue;
            if (!isOccupationCompatible(requirement.occupationPreference, candidate.occupationPreference)) continue;

            summary.matchesFound++;

            const dedupKey = getDeduplicationKey(requirement._id, candidate._id, candidate.userId);

            await createNotification({
              recipientType: 'USER',
              recipientId: candidate.userId,
              eventType: 'PROPERTY_MATCH_FOUND',
              category: 'PROPERTY_MATCH',
              title: 'New Flatmate Match Found!',
              message: `A new flatmate listing "${requirement.title}" is looking for a flatmate matching your preferences.`,
              actionUrl: `/listing/${requirement.slug || requirement._id}`,
              data: {
                sourceListingId: requirement._id.toString(),
                sourceListingType: 'flatmate_requirement',
                matchedListingId: candidate._id.toString(),
                matchedListingType: 'flatmate_requirement',
                matchType: 'partner_to_seeker',
              },
              priority: 'NORMAL',
              deduplicationKey: dedupKey,
            });

            summary.notificationsSent++;
          } catch (candidateErr) {
            logger.warn(
              `[PropertyMatch] Error processing candidate seeker requirement ${candidate._id} for partner requirement ${requirement._id}:`,
              candidateErr
            );
          }
        }

        logger.info(
          `[PropertyMatch] Case B completed for partner requirement ${requirement._id}: ${summary.candidatesEvaluated} evaluated, ${summary.matchesFound} matched, ${summary.notificationsSent} notified.`
        );
      } else if (requirement.postType === 'property') {
        // Case C: Approved Requirement (property) -> Matching Requirements (partner) + Matching Properties -> Notify both groups

        // Group 1: Partner requirements looking for flatmates
        const partnerCandidates = await FlatmateRequirement.find({
          status: 'approved',
          postType: 'partner',
          userId: { $ne: requirement.userId },
        }).populate('location').lean();

        // Group 2: Property listings
        const propertyCandidates = await Property.find({
          status: 'approved',
          userId: { $ne: requirement.userId },
        }).populate('location').lean();

        summary.candidatesEvaluated = partnerCandidates.length + propertyCandidates.length;

        // Evaluate Group 1 (Partner requirements)
        for (const candidate of partnerCandidates) {
          try {
            if (!isLocationCompatible(candidate.location, requirement.location)) continue;
            if (!isBudgetCompatible(candidate.rent, requirement.rent)) continue;
            if (!isPropertyTypeCompatible(candidate.propertyType, requirement.propertyType)) continue;
            if (!isAvailabilityCompatible(candidate.availableFrom, requirement.availableFrom)) continue;
            if (!isFurnishingCompatible(candidate.furnishing, requirement.furnishing)) continue;
            if (!isGenderCompatible(candidate.genderPreference, requirement.genderPreference)) continue;
            if (!isOccupationCompatible(candidate.occupationPreference, requirement.occupationPreference)) continue;

            summary.matchesFound++;

            const dedupKey = getDeduplicationKey(requirement._id, candidate._id, candidate.userId);

            await createNotification({
              recipientType: 'USER',
              recipientId: candidate.userId,
              eventType: 'PROPERTY_MATCH_FOUND',
              category: 'PROPERTY_MATCH',
              title: 'New Flatmate Seeker Match!',
              message: `A new seeker "${requirement.title}" is looking for a place matching your flatmate listing.`,
              actionUrl: `/listing/${requirement.slug || requirement._id}`,
              data: {
                sourceListingId: requirement._id.toString(),
                sourceListingType: 'flatmate_requirement',
                matchedListingId: candidate._id.toString(),
                matchedListingType: 'flatmate_requirement',
                matchType: 'seeker_to_partner',
              },
              priority: 'NORMAL',
              deduplicationKey: dedupKey,
            });

            summary.notificationsSent++;
          } catch (candidateErr) {
            logger.warn(
              `[PropertyMatch] Error processing candidate partner requirement ${candidate._id} for seeker requirement ${requirement._id}:`,
              candidateErr
            );
          }
        }

        // Evaluate Group 2 (Property listings)
        for (const candidate of propertyCandidates) {
          try {
            if (!isLocationCompatible(candidate.location, requirement.location)) continue;
            if (!isBudgetCompatible(candidate.rent, requirement.rent)) continue;
            if (!isPropertyTypeCompatible(candidate.propertyType, requirement.propertyType)) continue;
            if (!isAvailabilityCompatible(candidate.availableFrom, requirement.availableFrom)) continue;
            if (!isFurnishingCompatible(candidate.furnishing, requirement.furnishing)) continue;
            if (!isGenderCompatible(candidate.genderPreference, requirement.genderPreference)) continue;
            if (!isOccupationCompatible(candidate.occupationPreference, requirement.occupationPreference)) continue;

            summary.matchesFound++;

            const dedupKey = getDeduplicationKey(requirement._id, candidate._id, candidate.userId);

            await createNotification({
              recipientType: 'USER',
              recipientId: candidate.userId,
              eventType: 'PROPERTY_MATCH_FOUND',
              category: 'PROPERTY_MATCH',
              title: 'New Tenant Match for Your Property!',
              message: `A new seeker "${requirement.title}" is looking for a property matching your listing "${candidate.title}".`,
              actionUrl: `/listing/${requirement.slug || requirement._id}`,
              data: {
                sourceListingId: requirement._id.toString(),
                sourceListingType: 'flatmate_requirement',
                matchedListingId: candidate._id.toString(),
                matchedListingType: 'property',
                matchType: 'seeker_to_property',
              },
              priority: 'NORMAL',
              deduplicationKey: dedupKey,
            });

            summary.notificationsSent++;
          } catch (candidateErr) {
            logger.warn(
              `[PropertyMatch] Error processing candidate property ${candidate._id} for seeker requirement ${requirement._id}:`,
              candidateErr
            );
          }
        }

        logger.info(
          `[PropertyMatch] Case C completed for seeker requirement ${requirement._id}: ${summary.candidatesEvaluated} evaluated (${partnerCandidates.length} partners + ${propertyCandidates.length} properties), ${summary.matchesFound} matched, ${summary.notificationsSent} notified.`
        );
      }
    }
  } catch (err) {
    logger.error(
      `[PropertyMatch] Unexpected error processing matches for ${listingType} ${listingId}:`,
      err
    );
  }

  return summary;
};

