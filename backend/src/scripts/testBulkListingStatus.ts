import mongoose, { Types } from 'mongoose';
import { connectDB } from '../config/db';
import { config } from '../config/env';
import { Admin } from '../models/auth/admin.model';
import { User } from '../models/auth/user.model';
import { Location } from '../models/listing/location.model';
import { Property } from '../models/listing/property.model';
import { FlatmateRequirement } from '../models/listing/flatmateRequirements.model';
import { generateAccessToken } from '../utils/token.util';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    passed++;
    console.log(`  ${GREEN}✓ PASS${RESET}: ${testName}`);
  } else {
    failed++;
    console.error(`  ${RED}✗ FAIL${RESET}: ${testName}`);
    if (details) console.error(`    ${YELLOW}Details: ${details}${RESET}`);
  }
}

async function run() {
  console.log(`\n${BOLD}${CYAN}================================================================${RESET}`);
  console.log(`${BOLD}${CYAN}   FlatMate Backend: Bulk Status Update Verification Suite   ${RESET}`);
  console.log(`${BOLD}${CYAN}================================================================${RESET}\n`);

  await connectDB();

  const baseUrl = `http://localhost:${config.port}/api`;
  const timestamp = Date.now();
  const tag = `test_bulk_${timestamp}`;

  // 1. Setup Admin & User tokens
  let admin = await Admin.findOne({ status: 'active', isDeleted: false });
  if (!admin) {
    admin = await Admin.create({
      name: `Admin ${tag}`,
      email: `admin_${tag}@flatmate.local`,
      passwordHash: 'dummy_hash',
      role: 'super_admin',
      status: 'active',
      isDeleted: false,
    });
  }

  const adminToken = generateAccessToken({
    adminId: admin._id.toString(),
    type: 'admin',
    role: admin.role,
  });

  const user = await User.create({
    email: `user_${tag}@flatmate.local`,
    mobile: `+9198${(timestamp % 100000000).toString().padStart(8, '0')}`,
    accountStatus: 'active',
  });

  const userToken = generateAccessToken({
    userId: user._id.toString(),
    type: 'user',
  });

  // Setup location
  const location = await Location.create({
    name: 'Bulk Test Location',
    formattedAddress: '123 Test Street, Cyber City',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    latitude: 17.44,
    longitude: 78.38,
  });

  console.log(`${BOLD}1. Authentication and Authorization Tests${RESET}`);

  // Test 1: Unauthenticated request to Property bulk status
  const unauthRes = await fetch(`${baseUrl}/properties/bulk-status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids: [new Types.ObjectId().toString()], status: 'approved' }),
  });
  assert(unauthRes.status === 401, 'Unauthorized request without token is rejected with 401');

  // Test 2: User token request to Property bulk status
  const userForbiddenRes = await fetch(`${baseUrl}/properties/bulk-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`,
    },
    body: JSON.stringify({ ids: [new Types.ObjectId().toString()], status: 'approved' }),
  });
  assert(
    userForbiddenRes.status === 401 || userForbiddenRes.status === 403,
    'Regular user token cannot access admin bulk-status endpoint'
  );

  console.log(`\n${BOLD}2. Request Validation Tests${RESET}`);

  // Test 3: Empty IDs array
  const emptyIdsRes = await fetch(`${baseUrl}/properties/bulk-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ ids: [], status: 'approved' }),
  });
  assert(emptyIdsRes.status === 400, 'Empty ids array rejected with 400 validation error');

  // Test 4: Invalid ObjectId in array
  const invalidIdRes = await fetch(`${baseUrl}/properties/bulk-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ ids: ['not-a-valid-object-id'], status: 'approved' }),
  });
  assert(invalidIdRes.status === 400, 'Invalid ObjectId rejected with 400 validation error');

  // Test 5: Duplicate IDs in array
  const testObjId = new Types.ObjectId().toString();
  const dupIdsRes = await fetch(`${baseUrl}/properties/bulk-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ ids: [testObjId, testObjId], status: 'approved' }),
  });
  assert(dupIdsRes.status === 400, 'Duplicate IDs in array rejected with 400 validation error');

  // Test 6: Invalid status value
  const invalidStatusRes = await fetch(`${baseUrl}/properties/bulk-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ ids: [testObjId], status: 'non_existent_status' }),
  });
  assert(invalidStatusRes.status === 400, 'Invalid status enum value rejected with 400');

  // Test 7: Status rejected without rejectionReason
  const missingReasonRes = await fetch(`${baseUrl}/properties/bulk-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ ids: [testObjId], status: 'rejected' }),
  });
  assert(missingReasonRes.status === 400, 'Rejection status without rejectionReason rejected with 400');

  // Test 8: Missing records (all non-existent IDs)
  const missingRecordId = new Types.ObjectId().toString();
  const missingRes = await fetch(`${baseUrl}/properties/bulk-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ ids: [missingRecordId], status: 'approved' }),
  });
  assert(missingRes.status === 404, 'All non-existent records handled with 404 Not Found');

  console.log(`\n${BOLD}3. Property Bulk Status Operations${RESET}`);

  // Create test properties
  const prop1 = await Property.create({
    userId: user._id,
    location: location._id,
    title: `Property 1 ${tag}`,
    slug: `prop-1-${tag}`,
    description: 'Test Property 1',
    propertyType: 'flat',
    area: 1200,
    rent: 25000,
    availableFrom: new Date(),
    status: 'pending',
  });

  const prop2 = await Property.create({
    userId: user._id,
    location: location._id,
    title: `Property 2 ${tag}`,
    slug: `prop-2-${tag}`,
    description: 'Test Property 2',
    propertyType: 'room',
    area: 400,
    rent: 10000,
    availableFrom: new Date(),
    status: 'pending',
  });

  // Test 9: Bulk approve both properties
  const bulkApproveRes = await fetch(`${baseUrl}/properties/bulk-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      ids: [prop1._id.toString(), prop2._id.toString()],
      status: 'approved',
    }),
  });
  const bulkApproveJson = await bulkApproveRes.json();
  assert(bulkApproveRes.status === 200, 'Bulk approve properties returned 200 OK');
  assert(bulkApproveJson.data.updatedCount === 2, 'Updated count is 2');

  const refreshedProp1 = await Property.findById(prop1._id);
  const refreshedProp2 = await Property.findById(prop2._id);
  assert(
    refreshedProp1?.status === 'approved' && Boolean(refreshedProp1?.approvedAt),
    'Property 1 status is approved and approvedAt timestamp is set'
  );
  assert(
    refreshedProp2?.status === 'approved' && Boolean(refreshedProp2?.publishedAt),
    'Property 2 status is approved and publishedAt timestamp is set'
  );

  // Test 10: Re-run bulk approve (Status unchanged -> Skipped)
  const reApproveRes = await fetch(`${baseUrl}/properties/bulk-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      ids: [prop1._id.toString(), prop2._id.toString()],
      status: 'approved',
    }),
  });
  const reApproveJson = await reApproveRes.json();
  assert(reApproveRes.status === 200, 'Re-applying same status returns 200 OK');
  assert(reApproveJson.data.updatedCount === 0, 'No updates performed when status is unchanged');
  assert(reApproveJson.data.skippedCount === 2, 'Skipped count is 2');

  // Test: Changing approved property to pending clears approvedAt and publishedAt
  const toPendingRes = await fetch(`${baseUrl}/properties/bulk-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      ids: [prop1._id.toString()],
      status: 'pending',
    }),
  });
  const toPendingJson = await toPendingRes.json();
  assert(toPendingRes.status === 200, 'Changing approved property to pending returns 200 OK');
  assert(toPendingJson.data.updatedCount === 1, 'Updated count is 1 for pending transition');

  const pendingProp1 = await Property.findById(prop1._id);
  assert(
    pendingProp1?.status === 'pending' &&
      !pendingProp1?.approvedAt &&
      !pendingProp1?.publishedAt,
    'ApprovedAt and publishedAt are cleared when property status is changed to pending'
  );

  // Test 11: Bulk reject with reason
  const rejectRes = await fetch(`${baseUrl}/properties/bulk-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      ids: [prop1._id.toString()],
      status: 'rejected',
      rejectionReason: 'Invalid property documentation provided',
    }),
  });
  const rejectJson = await rejectRes.json();
  assert(rejectRes.status === 200, 'Bulk reject property returned 200 OK');
  assert(rejectJson.data.updatedCount === 1, 'Updated count is 1 for rejected property');

  const rejectedProp1 = await Property.findById(prop1._id);
  assert(
    rejectedProp1?.status === 'rejected' &&
      rejectedProp1?.rejectionReason === 'Invalid property documentation provided',
    'Property 1 status is rejected and rejectionReason is stored'
  );

  // Test 12: Mixed eligibility (1 rejected, 1 approved, 1 non-existent)
  const nonExistentId = new Types.ObjectId().toString();
  const mixedRes = await fetch(`${baseUrl}/properties/bulk-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      ids: [prop1._id.toString(), prop2._id.toString(), nonExistentId],
      status: 'approved',
    }),
  });
  const mixedJson = await mixedRes.json();
  assert(mixedRes.status === 200, 'Mixed eligibility bulk update returned 200 OK');
  assert(mixedJson.data.updatedCount === 1, 'prop1 was updated from rejected to approved (updatedCount: 1)');
  assert(mixedJson.data.skippedCount === 1, 'prop2 was already approved (skippedCount: 1)');
  assert(mixedJson.data.notFoundCount === 1, 'nonExistentId was not found (notFoundCount: 1)');

  console.log(`\n${BOLD}4. Flatmate Requirements Bulk Status Operations${RESET}`);

  // Create test flatmate requirements
  const freq1 = await FlatmateRequirement.create({
    userId: user._id,
    location: location._id,
    title: `Requirement 1 ${tag}`,
    slug: `freq-1-${tag}`,
    description: 'Looking for a flatmate',
    postType: 'property',
    propertyType: 'flat',
    rent: 12000,
    availableFrom: new Date(),
    status: 'pending',
  });

  const freq2 = await FlatmateRequirement.create({
    userId: user._id,
    location: location._id,
    title: `Requirement 2 ${tag}`,
    slug: `freq-2-${tag}`,
    description: 'Looking for a roommate',
    postType: 'partner',
    partnerType: 'flatmate',
    rent: 8000,
    availableFrom: new Date(),
    status: 'pending',
  });

  // Test 13: Bulk approve flatmate requirements
  const bulkFreqApproveRes = await fetch(`${baseUrl}/flatmate-requirements/bulk-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      ids: [freq1._id.toString(), freq2._id.toString()],
      status: 'approved',
    }),
  });
  const bulkFreqApproveJson = await bulkFreqApproveRes.json();
  assert(bulkFreqApproveRes.status === 200, 'Bulk approve flatmate requirements returned 200 OK');
  assert(bulkFreqApproveJson.data.updatedCount === 2, 'Flatmate updated count is 2');

  const refreshedFreq1 = await FlatmateRequirement.findById(freq1._id);
  assert(
    refreshedFreq1?.status === 'approved' && Boolean(refreshedFreq1?.approvedAt),
    'Flatmate requirement 1 status is approved and approvedAt timestamp is set'
  );

  // Test 14: Flatmate requirement mixed eligibility (1 approved, 1 to block, 1 non-existent)
  const mixedFreqRes = await fetch(`${baseUrl}/flatmate-requirements/bulk-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      ids: [freq1._id.toString(), nonExistentId],
      status: 'blocked',
    }),
  });
  const mixedFreqJson = await mixedFreqRes.json();
  assert(mixedFreqRes.status === 200, 'Mixed flatmate requirement update returned 200 OK');
  assert(mixedFreqJson.data.updatedCount === 1, 'freq1 was updated to blocked');
  assert(mixedFreqJson.data.notFoundCount === 1, 'nonExistentId reported as not found');

  // Test 15: Cross-type isolation (trying to update a property ID via flatmate requirements endpoint)
  const crossTypeRes = await fetch(`${baseUrl}/flatmate-requirements/bulk-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      ids: [prop1._id.toString()],
      status: 'closed',
    }),
  });
  assert(crossTypeRes.status === 404, 'Property ID is not found on flatmate-requirements endpoint');

  // Cleanup fixtures
  await Property.deleteMany({ _id: { $in: [prop1._id, prop2._id] } });
  await FlatmateRequirement.deleteMany({ _id: { $in: [freq1._id, freq2._id] } });
  await Location.deleteOne({ _id: location._id });
  await User.deleteOne({ _id: user._id });

  console.log(`\n${BOLD}================================================================${RESET}`);
  console.log(`${BOLD}Summary: ${GREEN}${passed} passed${RESET}, ${failed > 0 ? `${RED}${failed} failed` : `${GREEN}0 failed`}${RESET}`);
  console.log(`${BOLD}================================================================${RESET}\n`);

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
