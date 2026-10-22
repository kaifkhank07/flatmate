import mongoose, { Types } from 'mongoose';
import { connectDB } from '../config/db';
import { User } from '../models/auth/user.model';
import { UserProfile } from '../models/auth/userProfile.model';
import { UserSession } from '../models/auth/userSession.model';
import { OTP } from '../models/auth/otp.model';
import { Location } from '../models/listing/location.model';
import { Image } from '../models/listing/image.model';
import { Property } from '../models/listing/property.model';
import { FlatmateRequirement } from '../models/listing/flatmateRequirements.model';
import { Wishlist } from '../models/listing/wishlist.model';
import { RecentlyViewed } from '../models/listing/recentlyViewed.model';
import { Review } from '../models/listing/review.model';
import { Report } from '../models/listing/report.model';
import { ChatConversation } from '../models/chats/ChatConversation';
import { ChatMessage } from '../models/chats/ChatMessage';
import { propertyDeletionService } from '../services/deletion/propertyDeletion.service';
import { flatmateRequirementDeletionService } from '../services/deletion/flatmateRequirementDeletion.service';
import { userDeletionService } from '../services/deletion/userDeletion.service';
import { runInTransaction } from '../utils/transaction.util';

// ANSI styling for test output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

let passedCount = 0;
let failedCount = 0;

const assert = (condition: boolean, testName: string, details?: string) => {
  if (condition) {
    passedCount++;
    console.log(`  ${GREEN}✓ PASS${RESET}: ${testName}`);
  } else {
    failedCount++;
    console.error(`  ${RED}✗ FAIL${RESET}: ${testName}`);
    if (details) console.error(`    ${YELLOW}Details: ${details}${RESET}`);
  }
};

async function runTests() {
  console.log(`\n${BOLD}${CYAN}===============================================================${RESET}`);
  console.log(`${BOLD}${CYAN}   FlatMate Backend: Cascading Deletion Verification Suite   ${RESET}`);
  console.log(`${BOLD}${CYAN}===============================================================${RESET}\n`);

  await connectDB();

  const timestamp = Date.now();
  const tag = `test_cascade_${timestamp}`;

  console.log(`[Setup] Initializing isolated test fixtures with tag: ${tag}...`);

  // 1. Create Test Users
  const userAlice = await User.create({
    email: `alice_${tag}@example.com`,
    mobile: `+9199990${timestamp % 100000}`,
    accountStatus: 'active',
  });

  const userBob = await User.create({
    email: `bob_${tag}@example.com`,
    mobile: `+9199991${timestamp % 100000}`,
    accountStatus: 'active',
  });

  const userCharlie = await User.create({
    email: `charlie_${tag}@example.com`,
    mobile: `+9199992${timestamp % 100000}`,
    accountStatus: 'active',
  });

  await UserProfile.create({
    userId: userAlice._id,
    firstName: 'Alice',
    lastName: 'Tester',
  });

  const aliceSession = await UserSession.create({
    userId: userAlice._id,
    refreshTokenHash: 'hash_test_alice',
    expiresAt: new Date(Date.now() + 86400000),
    isRevoked: false,
  });

  const aliceOtp = await OTP.create({
    userId: userAlice._id,
    identifier: userAlice.email,
    type: 'email_login',
    otpHash: 'dummy_hash',
    expiresAt: new Date(Date.now() + 600000),
  });

  // 2. Create Shared and Exclusive Media & Location
  const sharedLocation = await Location.create({
    name: `Shared Loc ${tag}`,
    slug: `shared-loc-${tag}`,
    formattedAddress: '123 Test Street, Bangalore, India',
    latitude: 12.9716,
    longitude: 77.5946,
    address: { city: 'Bangalore', state: 'Karnataka' },
  });

  const sharedImage = await Image.create({
    url: 'https://example.com/shared.jpg',
    key: `test/shared_${tag}.jpg`,
  });

  const exclusiveImageAlice = await Image.create({
    url: 'https://example.com/alice_exclusive.jpg',
    key: `test/alice_${tag}.jpg`,
  });

  // 3. Create Properties
  const aliceProperty = await Property.create({
    userId: userAlice._id,
    location: sharedLocation._id,
    title: `Alice Property ${tag}`,
    slug: `alice-property-${tag}`,
    description: 'Lovely flat',
    propertyType: 'flat',
    area: 950,
    rent: 25000,
    availableFrom: new Date(),
    status: 'approved',
    images: [sharedImage._id, exclusiveImageAlice._id],
    favoriteCount: 2,
  });

  const charlieProperty = await Property.create({
    userId: userCharlie._id,
    location: sharedLocation._id,
    title: `Charlie Property ${tag}`,
    slug: `charlie-property-${tag}`,
    description: 'Charlie private apartment',
    propertyType: 'room',
    area: 400,
    rent: 12000,
    availableFrom: new Date(),
    status: 'approved',
    images: [sharedImage._id],
    favoriteCount: 1,
  });

  // 4. Create Flatmate Requirements
  const aliceRequirement = await FlatmateRequirement.create({
    userId: userAlice._id,
    location: sharedLocation._id,
    title: `Alice Need Flatmate ${tag}`,
    slug: `alice-need-flatmate-${tag}`,
    description: 'Looking for female flatmate',
    postType: 'partner',
    rent: 10000,
    availableFrom: new Date(),
    status: 'approved',
  });

  // 5. Create Cross-References: Wishlists
  const bobWishlistOnAliceProp = await Wishlist.create({
    userId: userBob._id,
    targetType: 'property',
    targetModel: 'Property',
    targetId: aliceProperty._id,
  });

  const bobWishlistOnAliceReq = await Wishlist.create({
    userId: userBob._id,
    targetType: 'flatmaterequirement',
    targetModel: 'FlatmateRequirement',
    targetId: aliceRequirement._id,
  });

  const bobWishlistOnCharlieProp = await Wishlist.create({
    userId: userBob._id,
    targetType: 'property',
    targetModel: 'Property',
    targetId: charlieProperty._id,
  });

  const aliceWishlistOnCharlieProp = await Wishlist.create({
    userId: userAlice._id,
    targetType: 'property',
    targetModel: 'Property',
    targetId: charlieProperty._id,
  });

  // 6. Create Cross-References: RecentlyViewed
  await RecentlyViewed.create({
    userId: userBob._id,
    targetType: 'property',
    targetModel: 'Property',
    targetId: aliceProperty._id,
  });

  await RecentlyViewed.create({
    userId: userAlice._id,
    targetType: 'property',
    targetModel: 'Property',
    targetId: charlieProperty._id,
  });

  // 7. Create Reviews & Reports
  await Review.create({
    reviewerId: userBob._id,
    targetType: 'property',
    targetModel: 'Property',
    targetId: aliceProperty._id,
    rating: 5,
    title: 'Great flat',
  });

  await Report.create({
    userId: userBob._id,
    targetType: 'property',
    targetModel: 'Property',
    targetId: aliceProperty._id,
    reason: 'misleading',
    description: 'Old photos',
  });

  // 8. Create Chat Conversation between Alice & Bob
  const chatConversation = await ChatConversation.create({
    participants: [userAlice._id, userBob._id],
    isActive: true,
  });

  const chatMessage = await ChatMessage.create({
    conversationId: chatConversation._id,
    senderId: userBob._id,
    receiverId: userAlice._id,
    type: 'property',
    text: 'Is this flat still available?',
    property: {
      propertyId: aliceProperty._id,
      title: aliceProperty.title,
      slug: aliceProperty.slug,
      rent: aliceProperty.rent,
    },
  });

  console.log(`[Setup] Fixtures created successfully. Running verification scenarios...\n`);

  // =========================================================================
  // SCENARIO 1: Property Cascade Deletion
  // =========================================================================
  console.log(`${BOLD}Scenario 1: Deleting a property listing removes all its dependent records${RESET}`);
  {
    await propertyDeletionService.deletePropertyCascade(aliceProperty._id, userAlice._id, false);

    const propExists = await Property.exists({ _id: aliceProperty._id });
    const wishlistExists = await Wishlist.exists({ targetType: 'property', targetId: aliceProperty._id });
    const rvExists = await RecentlyViewed.exists({ targetType: 'property', targetId: aliceProperty._id });
    const reviewExists = await Review.exists({ targetType: 'property', targetId: aliceProperty._id });
    const reportExists = await Report.exists({ targetType: 'property', targetId: aliceProperty._id });

    assert(!propExists, 'Primary Property document was deleted');
    assert(!wishlistExists, 'Dependent Wishlists for deleted Property were removed');
    assert(!rvExists, 'Dependent RecentlyViewed records were removed');
    assert(!reviewExists, 'Dependent Reviews on the deleted Property were removed');
    assert(!reportExists, 'Dependent Reports on the deleted Property were removed');
  }

  // =========================================================================
  // SCENARIO 2: Flatmate Requirement Cascade Deletion
  // =========================================================================
  console.log(`\n${BOLD}Scenario 2: Deleting a flatmate requirement removes all its dependent records${RESET}`);
  {
    await flatmateRequirementDeletionService.deleteFlatmateRequirementCascade(aliceRequirement._id, userAlice._id, false);

    const reqExists = await FlatmateRequirement.exists({ _id: aliceRequirement._id });
    const wishlistExists = await Wishlist.exists({ targetType: 'flatmaterequirement', targetId: aliceRequirement._id });

    assert(!reqExists, 'Primary FlatmateRequirement document was deleted');
    assert(!wishlistExists, 'Dependent Wishlists for deleted requirement were removed');
  }

  // =========================================================================
  // SCENARIO 3: Shared Resource Preservation
  // =========================================================================
  console.log(`\n${BOLD}Scenario 3: Shared resources and unrelated users data remain intact${RESET}`);
  {
    const sharedImgStillExists = await Image.exists({ _id: sharedImage._id });
    const sharedLocStillExists = await Location.exists({ _id: sharedLocation._id });
    const charliePropStillExists = await Property.exists({ _id: charlieProperty._id });
    const bobWishlistOnCharliePropExists = await Wishlist.exists({ _id: bobWishlistOnCharlieProp._id });

    assert(Boolean(sharedImgStillExists), 'Shared image document preserved because Charlie still references it');
    assert(Boolean(sharedLocStillExists), 'Shared location document preserved because Charlie still references it');
    assert(Boolean(charliePropStillExists), 'Unrelated user (Charlie) property remains intact');
    assert(Boolean(bobWishlistOnCharliePropExists), 'Bob wishlist on Charlie property remains intact');
  }

  // =========================================================================
  // SCENARIO 4: User Soft-Delete & Zombie Listing Prevention
  // =========================================================================
  console.log(`\n${BOLD}Scenario 4: Soft-deleting a user account transitions listings to closed (No Zombie Listings)${RESET}`);
  {
    // Create an active listing for Alice to test zombie listing prevention on user soft-delete
    const newAliceProp = await Property.create({
      userId: userAlice._id,
      location: sharedLocation._id,
      title: `Alice Second Property ${tag}`,
      slug: `alice-second-property-${tag}`,
      description: 'Second property',
      propertyType: 'pg',
      area: 300,
      rent: 8000,
      availableFrom: new Date(),
      status: 'approved',
    });

    await userDeletionService.softDeleteUserCascade(userAlice._id, userAlice._id);

    const updatedAlice = await User.findById(userAlice._id);
    const updatedProp = await Property.findById(newAliceProp._id);
    const sessionActive = await UserSession.findOne({ userId: userAlice._id, isRevoked: false });

    assert(Boolean(updatedAlice?.isDeleted), 'User is marked isDeleted: true');
    assert(updatedProp?.status === 'closed', 'User listings automatically transitioned to closed status');
    assert(!sessionActive, 'All user active sessions were revoked');

    // Clean up temporary property
    await Property.deleteOne({ _id: newAliceProp._id });
  }

  // =========================================================================
  // SCENARIO 5: User Wishlist & History Cleanup on Soft-Delete
  // =========================================================================
  console.log(`\n${BOLD}Scenario 5: User private Wishlist and Viewed history are cleaned up on soft-delete${RESET}`);
  {
    const aliceWishlistStillExists = await Wishlist.exists({ _id: aliceWishlistOnCharlieProp._id });
    const charliePropAfterAliceDeleted = await Property.findById(charlieProperty._id);

    assert(!aliceWishlistStillExists, 'Deleted user wishlists are purged');
    assert(
      charliePropAfterAliceDeleted?.favoriteCount === 0,
      'Referenced property favoriteCount correctly decremented when user was deleted'
    );
  }

  // =========================================================================
  // SCENARIO 6: Chat History Preservation for Surviving Peer
  // =========================================================================
  console.log(`\n${BOLD}Scenario 6: Chat messages and history for surviving counterpart remain preserved${RESET}`);
  {
    const conversation = await ChatConversation.findById(chatConversation._id);
    const message = await ChatMessage.findById(chatMessage._id);

    assert(Boolean(conversation), 'Chat conversation document is preserved');
    assert(Boolean(message), 'Chat message between users is preserved');
    assert(
      message?.property?.title === aliceProperty.title,
      'Denormalized listing snapshot title preserved on message card'
    );
  }

  // =========================================================================
  // SCENARIO 7: Authorization Enforcement
  // =========================================================================
  console.log(`\n${BOLD}Scenario 7: Unauthorized users cannot delete another user listings${RESET}`);
  {
    let caught403 = false;
    try {
      // Bob attempts to delete Charlie's property
      await propertyDeletionService.deletePropertyCascade(charlieProperty._id, userBob._id, false);
    } catch (err: any) {
      if (err.statusCode === 403 || err.message.includes('Not authorized')) {
        caught403 = true;
      }
    }

    const charliePropStillSafe = await Property.exists({ _id: charlieProperty._id });
    assert(caught403, 'Attempt by non-owner rejected with 403 authorization error');
    assert(Boolean(charliePropStillSafe), 'Target property remained protected and untouched');
  }

  // =========================================================================
  // SCENARIO 8: Idempotency & Missing Records Handling
  // =========================================================================
  console.log(`\n${BOLD}Scenario 8: Missing parent records and repeated deletion requests handled safely${RESET}`);
  {
    let caught404 = false;
    try {
      // Attempting to delete already deleted Alice property
      await propertyDeletionService.deletePropertyCascade(aliceProperty._id, userAlice._id, false);
    } catch (err: any) {
      if (err.message.includes('not found')) {
        caught404 = true;
      }
    }

    assert(caught404, 'Repeated deletion on already-deleted entity safely returns not found');
  }

  // =========================================================================
  // SCENARIO 9: Transaction Rollback on Simulated Failure
  // =========================================================================
  console.log(`\n${BOLD}Scenario 9: Atomic transaction rollback prevents partial / inconsistent state${RESET}`);
  {
    const rollbackTestProp = await Property.create({
      userId: userCharlie._id,
      location: sharedLocation._id,
      title: `Rollback Test ${tag}`,
      slug: `rollback-test-${tag}`,
      description: 'Testing rollback',
      propertyType: 'flat',
      area: 500,
      rent: 15000,
      availableFrom: new Date(),
    });

    const rollbackWishlist = await Wishlist.create({
      userId: userBob._id,
      targetType: 'property',
      targetModel: 'Property',
      targetId: rollbackTestProp._id,
    });

    let rollbackTriggered = false;
    try {
      await runInTransaction(async (session) => {
        const sessionOption = session ? { session } : {};
        // 1. Delete wishlist
        await Wishlist.deleteOne({ _id: rollbackWishlist._id }, sessionOption);
        // 2. Simulate failure before property deletion
        throw new Error('Simulated Database Failure');
      });
    } catch (err: any) {
      rollbackTriggered = true;
    }

    const wishlistAfterRollback = await Wishlist.exists({ _id: rollbackWishlist._id });
    const propAfterRollback = await Property.exists({ _id: rollbackTestProp._id });

    assert(rollbackTriggered, 'Error caught during transaction');
    assert(
      Boolean(wishlistAfterRollback),
      'Wishlist deletion was rolled back (not left in partial state)'
    );
    assert(Boolean(propAfterRollback), 'Property document remained intact');

    // Clean up rollback test docs
    await Wishlist.deleteOne({ _id: rollbackWishlist._id });
    await Property.deleteOne({ _id: rollbackTestProp._id });
  }

  // =========================================================================
  // SCENARIO 10: Permanent Hard Deletion Purge
  // =========================================================================
  console.log(`\n${BOLD}Scenario 10: Complete hard deletion purge cascading${RESET}`);
  {
    // Hard delete Charlie
    await userDeletionService.hardDeleteUserCascade(userCharlie._id);

    const charlieExists = await User.exists({ _id: userCharlie._id });
    const charliePropExists = await Property.exists({ _id: charlieProperty._id });
    const charlieWishlists = await Wishlist.exists({ userId: userCharlie._id });

    assert(!charlieExists, 'User document completely purged on hard delete');
    assert(!charliePropExists, 'User properties cascaded and purged on hard delete');
    assert(!charlieWishlists, 'User wishlists purged');
  }

  // =========================================================================
  // Teardown / Cleanup
  // =========================================================================
  console.log(`\n[Teardown] Cleaning up any remaining test fixtures...`);
  await User.deleteMany({ _id: { $in: [userAlice._id, userBob._id, userCharlie._id] } });
  await UserProfile.deleteMany({ userId: { $in: [userAlice._id, userBob._id, userCharlie._id] } });
  await UserSession.deleteMany({ userId: { $in: [userAlice._id, userBob._id, userCharlie._id] } });
  await OTP.deleteMany({ userId: { $in: [userAlice._id, userBob._id, userCharlie._id] } });
  await Property.deleteMany({ userId: { $in: [userAlice._id, userBob._id, userCharlie._id] } });
  await FlatmateRequirement.deleteMany({ userId: { $in: [userAlice._id, userBob._id, userCharlie._id] } });
  await Wishlist.deleteMany({ userId: { $in: [userAlice._id, userBob._id, userCharlie._id] } });
  await RecentlyViewed.deleteMany({ userId: { $in: [userAlice._id, userBob._id, userCharlie._id] } });
  await Review.deleteMany({ reviewerId: { $in: [userAlice._id, userBob._id, userCharlie._id] } });
  await Report.deleteMany({ userId: { $in: [userAlice._id, userBob._id, userCharlie._id] } });
  await ChatMessage.deleteMany({ conversationId: chatConversation._id });
  await ChatConversation.deleteOne({ _id: chatConversation._id });
  await Image.deleteMany({ _id: { $in: [sharedImage._id, exclusiveImageAlice._id] } });
  await Location.deleteOne({ _id: sharedLocation._id });

  console.log(`\n${BOLD}===============================================================${RESET}`);
  console.log(`${BOLD}                     TEST RESULTS SUMMARY                      ${RESET}`);
  console.log(`${BOLD}===============================================================${RESET}`);
  console.log(`Total Assertions: ${passedCount + failedCount}`);
  console.log(`${GREEN}Passed: ${passedCount}${RESET}`);
  console.log(`${failedCount > 0 ? RED : GREEN}Failed: ${failedCount}${RESET}`);

  if (failedCount === 0) {
    console.log(`\n${BOLD}${GREEN}✔ ALL 10 CASCADING DELETION SCENARIOS PASSED SUCCESSFULLY!${RESET}\n`);
  } else {
    console.error(`\n${BOLD}${RED}✖ SOME TESTS FAILED. CHECK LOGS ABOVE.${RESET}\n`);
    process.exit(1);
  }

  process.exit(0);
}

runTests().catch((err) => {
  console.error('\n[FATAL ERROR in testCascadingDeletion]:', err);
  process.exit(1);
});
