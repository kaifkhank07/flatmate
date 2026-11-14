import assert from 'assert';
import { Types } from 'mongoose';
import {
  calculateHaversineDistance,
  getCoordinates,
  isLocationCompatible,
  isBudgetCompatible,
  isPropertyTypeCompatible,
  isAvailabilityCompatible,
  isFurnishingCompatible,
  isGenderCompatible,
  isOccupationCompatible,
  getDeduplicationKey,
} from '../services/listing/propertyMatch.service';

console.log('🧪 Starting Property Matching Service Unit Tests...\n');

// 1. Haversine Distance Calculation
{
  // Mumbai Bandra (19.0596, 72.8295) to Andheri (19.1136, 72.8697) ~ 7.3 km
  const dist = calculateHaversineDistance(19.0596, 72.8295, 19.1136, 72.8697);
  assert(dist > 6 && dist < 9, `Expected distance ~7.3km, got ${dist}`);
  console.log(`✅ 1. Haversine distance calculated accurately: ${dist} km`);
}

// 2. Location Compatibility
{
  const locId = new Types.ObjectId();
  const locA = { _id: locId, latitude: 19.0596, longitude: 72.8295, address: { city: 'Mumbai' } };
  const locB = { _id: locId, latitude: 0, longitude: 0 };
  assert(isLocationCompatible(locA, locB) === true, 'Matching same location ID should be compatible');

  const locC = { _id: new Types.ObjectId(), latitude: 19.1136, longitude: 72.8697, address: { city: 'Mumbai' } };
  assert(isLocationCompatible(locA, locC, 25) === true, 'Locations ~7km apart within 25km radius should be compatible');

  // Delhi (28.6139, 77.2090) to Mumbai > 1000km
  const locDelhi = { _id: new Types.ObjectId(), latitude: 28.6139, longitude: 77.2090, address: { city: 'New Delhi' } };
  assert(isLocationCompatible(locA, locDelhi, 25) === false, 'Mumbai to Delhi should NOT be compatible');

  // Name / City fallback when coordinates are missing
  const locNoCoords1 = { _id: new Types.ObjectId(), address: { city: 'Bengaluru' } };
  const locNoCoords2 = { _id: new Types.ObjectId(), address: { city: 'Bengaluru' } };
  assert(isLocationCompatible(locNoCoords1, locNoCoords2) === true, 'Same city fallback should be compatible');

  const locDiffCity = { _id: new Types.ObjectId(), address: { city: 'Pune' } };
  assert(isLocationCompatible(locNoCoords1, locDiffCity) === false, 'Different cities should NOT be compatible');

  console.log('✅ 2. Location compatibility checks passed (ID, Radius, City fallback).');
}

// 3. Budget & Rent Compatibility
{
  // Rent within budget
  assert(isBudgetCompatible(10000, 15000) === true, 'Space rent 10000 within budget 15000 should match');
  // Rent equal to budget
  assert(isBudgetCompatible(15000, 15000) === true, 'Space rent 15000 equal to budget 15000 should match');
  // Rent within 10% tolerance (16500 vs 15000)
  assert(isBudgetCompatible(16000, 15000) === true, 'Space rent 16000 within 10% tolerance of 15000 should match');
  // Rent exceeds tolerance (20000 vs 15000)
  assert(isBudgetCompatible(20000, 15000) === false, 'Space rent 20000 exceeding budget 15000 should NOT match');
  console.log('✅ 3. Budget and rent compatibility checks passed (Exact, Under, 10% Tolerance).');
}

// 4. Property Type Compatibility
{
  assert(isPropertyTypeCompatible('flat', 'flat') === true, 'Identical types should match');
  assert(isPropertyTypeCompatible('entire_property', 'flat') === true, 'entire_property and flat should match');
  assert(isPropertyTypeCompatible('room', 'shared_apartment') === true, 'room and shared_apartment should match');
  assert(isPropertyTypeCompatible('flat', 'pg') === false, 'flat and pg should NOT match');
  assert(isPropertyTypeCompatible(undefined, 'flat') === true, 'Missing type should act as wildcard');
  console.log('✅ 4. Property type compatibility checks passed.');
}

// 5. Availability Date Compatibility
{
  const now = new Date('2026-11-01');
  const moveInDate = new Date('2026-11-15');
  const availableEarlier = new Date('2026-11-01');
  const availableClose = new Date('2026-11-25'); // 10 days after move-in
  const availableLate = new Date('2027-02-01');  // > 2 months after move-in

  assert(isAvailabilityCompatible(availableEarlier, moveInDate) === true, 'Available before move-in should match');
  assert(isAvailabilityCompatible(availableClose, moveInDate) === true, 'Available within 30 days should match');
  assert(isAvailabilityCompatible(availableLate, moveInDate) === false, 'Available 2.5 months after move-in should NOT match');
  assert(isAvailabilityCompatible(null, moveInDate) === true, 'Missing space date should act as wildcard');
  console.log('✅ 5. Availability date compatibility checks passed.');
}

// 6. Furnishing Compatibility
{
  assert(isFurnishingCompatible('fully_furnished', 'fully_furnished') === true, 'Identical furnishing should match');
  assert(isFurnishingCompatible('fully_furnished', 'semi_furnished') === true, 'Fully furnished space satisfies semi-furnished seeker');
  assert(isFurnishingCompatible('unfurnished', 'fully_furnished') === false, 'Unfurnished space does NOT satisfy fully furnished seeker');
  assert(isFurnishingCompatible(undefined, 'fully_furnished') === true, 'Missing furnishing acts as wildcard');
  console.log('✅ 6. Furnishing compatibility checks passed.');
}

// 7. Gender & Occupation Compatibility
{
  assert(isGenderCompatible('any', 'female') === true, "'any' gender wildcard matches female");
  assert(isGenderCompatible('male', 'any') === true, "male matches 'any' gender wildcard");
  assert(isGenderCompatible('male', 'male') === true, 'Identical gender preferences match');
  assert(isGenderCompatible('male', 'female') === false, 'Conflicting gender preferences do not match');

  assert(isOccupationCompatible('any', 'student') === true, "'any' occupation wildcard matches student");
  assert(isOccupationCompatible('working_professional', 'working_professional') === true, 'Identical occupations match');
  assert(isOccupationCompatible('student', 'business_owner') === false, 'Conflicting occupations do not match');
  console.log('✅ 7. Gender & Occupation preference checks passed.');
}

// 8. Deduplication Key Generation & Idempotency
{
  const id1 = new Types.ObjectId('650000000000000000000001');
  const id2 = new Types.ObjectId('650000000000000000000002');
  const userId = new Types.ObjectId('650000000000000000000099');

  const key1 = getDeduplicationKey(id1, id2, userId);
  const key2 = getDeduplicationKey(id2, id1, userId);

  assert(key1 === key2, 'Key generation must be symmetric regardless of argument order');
  assert(
    key1 === `property_match_650000000000000000000001_650000000000000000000002_650000000000000000000099`,
    `Unexpected key format: ${key1}`
  );

  const anotherUser = new Types.ObjectId('650000000000000000000088');
  const keyAnotherUser = getDeduplicationKey(id1, id2, anotherUser);
  assert(key1 !== keyAnotherUser, 'Keys for different recipients must be distinct');

  console.log('✅ 8. Deduplication key generation passed (deterministic & recipient-scoped).');
}

console.log('\n🎉 All Property Matching Unit Tests Passed Successfully!');

