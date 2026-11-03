# FlatMate Notification Architecture & System Documentation (v3.0)

This document provides a comprehensive technical audit and reference for the **multi-channel notification subsystem** of the FlatMate platform across the **Backend Architecture**, **Frontend UI**, and **Admin Panel**.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Project Structure](#2-project-structure)
3. [Notification Architecture](#3-notification-architecture)
4. [Notification Types, Enums & Categories](#4-notification-types-enums--categories)
5. [Database Models & Indexes](#5-database-models--indexes)
6. [Notification Preferences](#6-notification-preferences)
7. [Notification Creation & Multi-Channel Delivery](#7-notification-creation--multi-channel-delivery)
8. [API Endpoints Reference](#8-api-endpoints-reference)
9. [Frontend Notification Flow](#9-frontend-notification-flow)
10. [Event Triggers & Codebase Usage](#10-event-triggers--codebase-usage)
11. [Property Match Notifications Status](#11-property-match-notifications-status)
12. [Cron Jobs & Background Tasks](#12-cron-jobs--background-tasks)
13. [Error Handling & Known Limitations](#13-error-handling--known-limitations)
14. [Testing & Verification](#14-testing--verification)

---

## 1. Overview

The FlatMate Notification System manages user and staff alerts across four independent delivery channels:
- **In-App**: Persistent inbox notifications stored in MongoDB, displayed with an unread badge counter in the navigation bar and an inbox feed.
- **Email**: Transactional and informational HTML emails dispatched via Nodemailer SMTP.
- **SMS**: Mobile text messages (reserved for security OTPs; general notification SMS is currently commented out).
- **WhatsApp**: Direct messaging alerts (currently implemented as an internal logging stub).

The system supports two distinct recipient domains:
1. **Regular Users (`USER`)**: Receive notifications for account registration, listing submissions, moderation approvals/rejections, reports, and communication.
2. **Platform Administrators (`ADMIN`)**: Receive alerts for moderation queues, user registrations, listing reports, and self-deactivations/deletions.
   > **Note on Super Admins**: Accounts with `role === 'super_admin'` are completely excluded from notifications by default; notification generation suppresses delivery for super admins in `createNotification()`.

### Post-Audit Architectural Change
In v3.0, the legacy user-configurable **Property Match Preferences** (which previously stored search criteria such as cities, localities, rent budget, property types, and roommate preferences inside the notification preference document) has been **completely removed** from the schema, validation schemas, controllers, routes, Zustand store, and UI.

Notification preferences now exclusively manage **delivery channel controls** (global kill switches and per-category channel settings). Matching criteria will be derived directly from active listings in a separate, dedicated service.

---

## 2. Project Structure

The notification subsystem consists strictly of the following existing files:

```
d:/MyWork/Buzzlink/flatmate/
├── backend/
│   └── src/
│       ├── models/
│       │   └── notification/
│       │       ├── notification.types.ts          # Core enums, categories, events, channel interfaces & defaults
│       │       ├── notification.model.ts          # Notification Mongoose schema, methods, compound & TTL indexes
│       │       └── notificationPreference.model.ts# NotificationPreference Mongoose schema & isChannelEnabled() logic
│       ├── controllers/
│       │   └── notification/
│       │       └── notification.controller.ts     # Request handlers for feed, unread count, read, preferences, & dispatch
│       ├── routes/
│       │   └── notification/
│       │       └── notification.routes.ts         # Express route definitions mounted at /api/notifications
│       ├── services/
│       │   ├── notification/
│       │   │   └── notification.service.ts        # Core notification engine, preference resolution, & channel dispatch
│       │   ├── deletion/
│       │   │   ├── userDeletion.service.ts        # Purges user notifications & preferences during account deletion
│       │   │   └── adminDeletion.service.ts       # Purges admin notifications & preferences during staff deletion
│       │   └── dashboard/
│       │       └── dashboard.service.ts           # Queries user unread count and latest notification alerts
│       └── validations/
│           └── notification/
│               └── notification.validation.ts     # Zod schemas for query params, preferences, and payload validation
├── frontend/
│   └── src/
│       ├── app/(dashboard)/
│       │   └── notifications/
│       │       └── page.tsx                       # Dashboard notification page route (/notifications)
│       ├── components/dashboard/notification/
│       │   ├── NotificationsManager.tsx           # Container component managing active views (inbox, channels)
│       │   ├── NotificationList.tsx               # Paginated feed, category filtering, and read actions
│       │   ├── NotificationItem.tsx               # Individual alert card with icon, status dot, and action links
│       │   ├── NotificationPreferences.tsx        # Master channel switches and per-category delivery matrix
│       │   ├── NotificationBell.tsx               # Navbar bell icon with real-time unread badge counter
│       │   └── DeleteNotificationDialog.tsx       # Confirmation modal for notification deletion
│       ├── services/
│       │   └── notification.service.ts            # Axios API client functions for notification endpoints
│       ├── store/
│       │   └── useNotificationStore.ts            # Zustand global state store for notifications & preferences
│       └── types/
│           └── notification.types.ts              # TypeScript interfaces, enums, and category display metadata
└── admin/
    ├── app/
    │   ├── admin/notifications/page.tsx           # Admin staff notification page route
    │   └── super-admin/notifications/page.tsx     # Super admin notification page route
    ├── components/my/notification/
    │   ├── AdminNotificationsManager.tsx          # Admin notification container
    │   ├── AdminNotificationList.tsx              # Admin notification feed and filtering
    │   ├── AdminNotificationItem.tsx              # Admin notification card with priority indicator
    │   ├── AdminNotificationPreferences.tsx       # Admin channel & category preference toggles
    │   └── DeleteNotificationDialog.tsx           # Admin delete confirmation dialog
    └── types/
        └── notification.types.ts                  # Admin TypeScript interfaces & category metadata
```

---

## 3. Notification Architecture

The end-to-end lifecycle of a notification from trigger to delivery:

```
[ Application Event ] (e.g. Listing Submitted, Report Created, User Registration)
       │
       ▼
[ createNotification() / notifyAdmins() ]
       │
       ├─► Check Super Admin: If recipient is 'ADMIN' with role 'super_admin' ──► SUPPRESS & EXIT
       │
       ├─► Idempotency Check: If deduplicationKey provided and exists ─────────► RETURN EXISTING
       │
       ├─► Preference Evaluation:
       │     1. Is eventType in MANDATORY_TRANSACTIONAL_EVENTS?
       │        - YES ──► Always enable mandatory channels (bypasses opt-outs)
       │        - NO  ──► Check global channels[channel] AND category[channel]
       │
       ├─► MongoDB Persistence:
       │     Save document in `notifications` collection with channel states
       │     (IN_APP marked 'DELIVERED', external channels marked 'PENDING')
       │
       ├─► Asynchronous External Channel Dispatch:
       │     - EMAIL: Asynchronously fetched recipient email ──► Nodemailer SMTP dispatch
       │              (Success: status='SENT', Failure: status='FAILED' + error log)
       │     - SMS:   (Currently commented out; FlatMate uses dedicated OTP service)
       │     - WHATSAPP: Logged queue stub, status='SENT'
       │
       ▼
[ Frontend Display ]
  - Navbar bell requests `GET /api/notifications/unread-count` (displays badge)
  - Notifications page requests `GET /api/notifications` (renders paginated feed)
  - User updates read status via `PATCH /api/notifications/:id/read` or `/read-all`
```

---

## 4. Notification Types, Enums & Categories

### Recipient Types
```typescript
export type RecipientType = 'USER' | 'ADMIN';
```

### Notification Priorities
```typescript
export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
```

### Delivery Channels
```typescript
export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS' | 'WHATSAPP';
```

### Channel Delivery Statuses
```typescript
export type ChannelDeliveryStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SENT'
  | 'DELIVERED'
  | 'READ'
  | 'FAILED'
  | 'SKIPPED';
```

### Notification Categories (8 Categories)
```typescript
export type NotificationCategory =
  | 'ACCOUNT_AND_VERIFICATION'
  | 'LISTING_UPDATES'
  | 'PROPERTY_MATCH'
  | 'CHAT'
  | 'INQUIRIES_AND_REQUESTS'
  | 'REPORTS_AND_REVIEWS'
  | 'ADMINISTRATIVE'
  | 'SYSTEM';
```

### Complete 30-Event Catalogue & Category Mapping

| Category | Event Type (`NotificationEventType`) | Intended Recipient | Description |
| :--- | :--- | :--- | :--- |
| **`ACCOUNT_AND_VERIFICATION`** | `USER_REGISTERED` | `USER` | Welcome alert sent to user upon registration |
| | `EMAIL_VERIFICATION` | `USER` | Email verification link or token dispatched |
| | `OTP_NOTIFICATION` | `USER` | Mobile authentication OTP dispatched |
| | `PROFILE_VERIFICATION_UPDATED` | `USER` | ID verification / KYC badge status updated |
| **`LISTING_UPDATES`** | `LISTING_SUBMITTED` | `USER` | Listing submission confirmation under review |
| | `LISTING_APPROVED` | `USER` | Listing approved by admin and published live |
| | `LISTING_REJECTED` | `USER` | Listing rejected with feedback reason |
| | `LISTING_EXPIRY_REMINDER` | `USER` | Reminder that listing expires in 3 days |
| | `LISTING_EXPIRED` | `USER` | Listing duration has ended |
| | `LISTING_UNPUBLISHED` | `USER` | Listing blocked or closed by moderation |
| **`PROPERTY_MATCH`** | `PROPERTY_MATCH_FOUND` | `USER` | New listing matches criteria (listing-based) |
| **`CHAT`** | `NEW_CHAT_MESSAGE` | `USER` | Direct chat message received |
| **`INQUIRIES_AND_REQUESTS`** | `PROPERTY_INQUIRY_RECEIVED` | `USER` | Prospective tenant lead received |
| | `CONTACT_REQUEST_RECEIVED` | `USER` | Contact reveal / phone request received |
| | `INQUIRY_STATUS_UPDATED` | `USER` | Landlord updated property inquiry status |
| | `CONTACT_US_CONFIRMATION` | `USER` | Support inquiry receipt acknowledgment |
| **`REPORTS_AND_REVIEWS`** | `REPORT_SUBMITTED_CONFIRMATION` | `USER` | Confirmation sent to user who filed a report |
| | `REPORT_STATUS_UPDATED` | `USER` | Resolution notice on filed report |
| | `REVIEW_SUBMITTED_CONFIRMATION` | `USER` | Review submitted confirmation |
| | `REVIEW_APPROVED` | `USER` | Review approved and published |
| | `REVIEW_REJECTED` | `USER` | Review rejected during moderation |
| **`ADMINISTRATIVE`** | `ADMIN_NEW_USER_REGISTERED` | `ADMIN` | Staff alert on new user registration |
| | `ADMIN_LISTING_AWAITING_MODERATION` | `ADMIN` | New or edited listing submitted for approval |
| | `ADMIN_INQUIRY_RECEIVED` | `ADMIN` | Platform inquiry received |
| | `ADMIN_CONTACT_US_SUBMITTED` | `ADMIN` | Contact form submission for admin staff |
| | `ADMIN_REPORT_SUBMITTED` | `ADMIN` | Safety or fraud report filed on a listing |
| | `ADMIN_USER_DELETED` | `ADMIN` | User self-deleted their account |
| | `ADMIN_PROFILE_VERIFICATION_REQUESTED` | `ADMIN` | User submitted documents for ID badge |
| | `ADMIN_REVIEW_AWAITING_MODERATION` | `ADMIN` | User review requires content moderation |
| **`SYSTEM`** | `ADMIN_SYSTEM_ERROR` | `ADMIN` | Server exception or operational failure |
| | `ADMIN_OPERATIONAL_ALERT` | `ADMIN` | System storage, database, or infrastructure alert |

---

## 5. Database Models & Indexes

### 1. `Notification` Model (`notifications` collection)

| Field Name | Type | Rules & Defaults | Description |
| :--- | :--- | :--- | :--- |
| `recipientType` | `String` | Enum: `['USER', 'ADMIN']`, Required | Recipient discriminator |
| `recipientModel` | `String` | Enum: `['User', 'Admin']`, auto-derived | Dynamic `refPath` target |
| `recipientId` | `ObjectId` | Required, Ref to User or Admin | Recipient document ID |
| `eventType` | `String` | Enum: `NOTIFICATION_EVENT_TYPES`, Required | Specific event key |
| `category` | `String` | Enum: `NOTIFICATION_CATEGORIES`, Required | Auto-derived from `EVENT_CATEGORY_MAP` |
| `title` | `String` | Trim, Required, max 250 chars | Alert headline |
| `message` | `String` | Trim, Required, max 2000 chars | Alert body text |
| `data` | `Mixed` | Default: `{}` | Context metadata (ids, slugs, reasons) |
| `actionUrl` | `String` | Optional, Trim | Click-through route link |
| `priority` | `String` | Enum: `NOTIFICATION_PRIORITIES`, Default: `'NORMAL'` | Priority level |
| `channels` | `[ChannelDeliverySchema]` | Subdocuments per channel | Multi-channel delivery records |
| `isRead` | `Boolean` | Default: `false` | In-app read status |
| `readAt` | `Date` | Default: `null` | Read timestamp |
| `deduplicationKey` | `String` | Optional, Trim | Prevents duplicate alerts |
| `expiresAt` | `Date` | Default: `null` | Eviction timestamp for TTL index |
| `createdAt` / `updatedAt` | `Date` | Timestamps: `true` | Creation & update dates |

#### `channels` Subdocument Schema
- `channel`: `'IN_APP' | 'EMAIL' | 'SMS' | 'WHATSAPP'`
- `status`: `'PENDING' | 'PROCESSING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'SKIPPED'` (Default: `'PENDING'`)
- `attemptCount`: Number (Default: `0`)
- `providerMessageId`: String
- `lastAttemptAt`: Date
- `sentAt`: Date
- `deliveredAt`: Date
- `readAt`: Date
- `errorMessage`: String
- `providerMetadata`: Mixed

#### Indexes on `notifications`
1. `{ recipientType: 1, recipientId: 1, createdAt: -1 }`: Feed pagination and chronological sorting.
2. `{ recipientType: 1, recipientId: 1, isRead: 1, createdAt: -1 }`: Unread count badge and unread-only feed filtering.
3. `{ recipientType: 1, recipientId: 1, category: 1, createdAt: -1 }`: Category-filtered feed queries.
4. `{ recipientType: 1, recipientId: 1, eventType: 1, createdAt: -1 }`: Event-specific queries.
5. `{ recipientType: 1, recipientId: 1, deduplicationKey: 1 }` (`unique: true, partialFilterExpression: { deduplicationKey: { $type: 'string' } }`): Scoped deduplication preventing duplicate key collisions while completely ignoring documents where `deduplicationKey` is null or missing.
6. `{ expiresAt: 1 }` (`expireAfterSeconds: 0, sparse: true`): MongoDB TTL index for automatic expiration cleanup.
7. `{ 'channels.channel': 1, 'channels.status': 1 }`: Channel status lookups.

---

### 2. `NotificationPreference` Model (`notificationpreferences` collection)

| Field Name | Type | Rules & Defaults | Description |
| :--- | :--- | :--- | :--- |
| `ownerType` | `String` | Enum: `['USER', 'ADMIN']`, Required | Preference owner type |
| `ownerModel` | `String` | Enum: `['User', 'Admin']`, auto-derived | Dynamic `refPath` target |
| `ownerId` | `ObjectId` | Required, Ref to User or Admin | Preference owner document ID |
| `channels` | `ChannelPreferencesSchema` | Master kill-switches | Global channel toggles |
| `categories` | `CategoryPreferencesSchema` | Matrix per category | Granular channel toggles per category |
| `createdAt` / `updatedAt` | `Date` | Timestamps: `true` | Record timestamps |

> **Removed in v3.0**: The `propertyMatch` matching criteria field (`enabled`, `cities`, `localities`, `budget`, `propertyTypes`, `furnishing`, etc.) has been completely removed from this schema and interface.

#### Indexes on `notificationpreferences`
1. `{ ownerType: 1, ownerId: 1 }` (`unique: true`): Enforces strictly one preference record per user or admin.
2. Self-healing hook: Automatically drops legacy `user_1` index from previous non-polymorphic schema versions.

---

## 6. Notification Preferences

### 1. Two-Tier Hierarchy

Every notification delivery decision follows a 2-tier check:

```
[ Incoming Notification ]
           │
           ▼
[ Is Event Mandatory? ] ──► (EMAIL_VERIFICATION, OTP_NOTIFICATION, ADMIN_SYSTEM_ERROR)
     │            │
     │ No         └─► YES: Bypass preference opt-outs ──► DELIVER
     ▼
[ Tier 1: Master Channel Switch ]
     │ (e.g. channels.email === false)
     ├─► Disabled globally ──► SKIP
     │
     ▼
[ Tier 2: Granular Category Switch ]
     │ (e.g. categories.listingUpdates.email === false)
     ├─► Disabled for this category ──► SKIP
     │
     ▼
[ DELIVER CHANNEL ]
```

### 2. Instance Method `isChannelEnabled()`

Defined on `notificationPreferenceSchema`:
```typescript
notificationPreferenceSchema.methods.isChannelEnabled = function (
  category: NotificationCategory,
  channel: NotificationChannel,
  eventType?: NotificationEventType
): boolean {
  // 1. Mandatory security & transactional events bypass opt-outs
  if (eventType && MANDATORY_TRANSACTIONAL_EVENTS.includes(eventType)) {
    return true;
  }

  const channelKey = CHANNEL_KEY_MAP[channel];
  if (!channelKey) return false;

  // 2. Global master kill switch
  if (this.channels && this.channels[channelKey] === false) {
    return false;
  }

  // 3. Category-level channel toggle
  const categoryKey = CATEGORY_KEY_MAP[category];
  if (this.categories && categoryKey && this.categories[categoryKey]) {
    const categoryChannelValue = this.categories[categoryKey][channelKey];
    if (typeof categoryChannelValue === 'boolean') {
      return categoryChannelValue;
    }
  }

  return true;
};
```

### 3. Default Settings Matrix

- **Super Admins (`role === 'super_admin'`)**:
  - All channels: `inApp: false, email: false, sms: false, whatsapp: false`
  - All categories: `inApp: false, email: false, sms: false, whatsapp: false`
  - In addition, `createNotification()` explicitly short-circuits and skips notification generation entirely for super admin accounts.
- **Regular Users (`USER`) & Staff Admins (`ADMIN`)**:
  - `getOrCreateNotificationPreferences()` initializes:
    - `channels`: `inApp: true, email: false, sms: false, whatsapp: false`
    - `categories`: all 8 categories default to `inApp: true, email: false, sms: false, whatsapp: false`.
    *(Users can independently enable Email, SMS, or WhatsApp in settings).*

### 4. Mandatory Transactional Events
```typescript
export const MANDATORY_TRANSACTIONAL_EVENTS: readonly NotificationEventType[] = [
  'EMAIL_VERIFICATION',
  'OTP_NOTIFICATION',
  'ADMIN_SYSTEM_ERROR',
];
```

---

## 7. Notification Creation & Multi-Channel Delivery

### 1. `createNotification(payload)`
Defined in `backend/src/services/notification/notification.service.ts`:
- **Parameters**: `recipientType`, `recipientId`, `eventType`, `category` (optional, auto-mapped), `title`, `message`, `data`, `actionUrl`, `priority`, `channels` (explicit overrides), `deduplicationKey`, `expiresAt`, `sendExternalEmail`, `sendExternalSMS`, `sendExternalWhatsApp`.
- **Super Admin Suppression**: If recipient is an Admin with `role === 'super_admin'`, exits immediately with `null`.
- **Deduplication Check**: If `deduplicationKey` is present and an existing notification matches `{ recipientType, recipientId, deduplicationKey }`, returns the existing record.
- **Preference Evaluation**: Evaluates `inAppEnabled`, `emailEnabled`, `smsEnabled`, `whatsappEnabled` via `preferences.isChannelEnabled()`.
- **Persistence**: Creates `Notification` document. In-App is marked `DELIVERED` (or `SKIPPED`). External channels are initialized as `PENDING`.
- **Asynchronous External Dispatch**:
  - **Email**: Dispatches HTML email using `sendEmail` (Nodemailer SMTP). Updates status to `SENT` or `FAILED`.
  - **SMS**: Normal notification SMS is disabled/commented out (`FlatMate uses OTP only`).
  - **WhatsApp**: Internal logging stub; logs to console and sets status to `SENT`.

### 2. `notifyAdmins(payload)`
Broadcast helper for staff administration:
- Queries active non-deleted staff admins: `Admin.find({ status: 'active', isDeleted: false, ...(superAdminOnly ? { role: 'super_admin' } : {}) })`.
- Iterates through matching staff admins and dispatches via `createNotification({ ...payload, recipientType: 'ADMIN', recipientId: admin._id })`.

---

## 8. API Endpoints Reference

All notification endpoints require authentication via `authenticateUserOrAdmin` and are mounted at `/api/notifications`:

| Method | Path | Auth Required | Parameters / Body | Response Shape |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | User or Admin | Query: `page`, `limit`, `category`, `eventType`, `priority`, `isRead` | `{ success: true, data: { notifications: INotification[], pagination: { page, limit, total, totalPages }, unreadCount } }` |
| `GET` | `/unread-count` | User or Admin | None | `{ success: true, data: { unreadCount: number } }` |
| `PATCH` | `/read-all` | User or Admin | None | `{ success: true, data: { updatedCount: number, readAt: Date } }` |
| `PATCH` | `/:notificationId/read` | User or Admin | Path: `notificationId` (24-hex ObjectId) | `{ success: true, data: INotification }` |
| `DELETE` | `/:notificationId` | User or Admin | Path: `notificationId` (24-hex ObjectId) | `{ success: true, message: 'Notification deleted successfully' }` |
| `GET` | `/preferences` | User or Admin | None | `{ success: true, data: INotificationPreference }` |
| `PATCH` | `/preferences` | User or Admin | Body: `{ channels?: Partial<IChannelPreferences>, categories?: Partial<Record<CategoryKey, Partial<IChannelPreferences>>> }` | `{ success: true, data: INotificationPreference }` |
| `POST` | `/` | User or Admin | Body: `CreateNotificationPayload` (validated via Zod) | `{ success: true, data: INotification }` (201 Created) |

> **Removed in v3.0**: `PATCH /api/notifications/preferences/property-match` has been removed.

---

## 9. Frontend Notification Flow

The user notification UI is located at `/notifications`:

### 1. Component Hierarchy
- **`NotificationsManager.tsx`**: Main dashboard container.
  - Controls view switching via `activeTab` (`'inbox'` or `'channels'`).
  - Header displays dynamic title and subtitle depending on the active view.
  - Dropdown settings menu provides quick navigation between **Inbox** and **Channels & Alerts**.
- **`NotificationList.tsx`**: The primary notification inbox.
  - Displays All vs. Unread filter pill buttons.
  - Category dropdown filter (All, Property Matches, Chat, Listings, Inquiries, Account, Reviews, System).
  - "Mark all as read" bulk action button.
  - Paginated list with "Load More" functionality.
  - Empty states with contextual iconography.
- **`NotificationItem.tsx`**: Single notification feed card.
  - Visual category icon with background styling.
  - Blue unread dot indicator for unread items.
  - Relative timestamp display (e.g. "5m ago", "2d ago").
  - Deep-link redirect (`actionUrl`).
  - Dropdown menu with "Mark as read" and "Delete" actions.
- **`NotificationPreferences.tsx`**: Configuration screen for delivery settings.
  - **Master Channels Card**: Global switches for In-App, Email, SMS, and WhatsApp.
  - **Category Notification Rules Matrix**: Per-category toggles for all 7 active user-facing categories.
  - Disables category toggles automatically if master channel switch is turned OFF.
  - "Back to Inbox" navigation button.
  - Save button with dirty state detection and loading feedback.
- **`NotificationBell.tsx`**: Mounted in the top navbar.
  - Displays bell icon with animated pulse counter badge for `unreadCount > 0`.
  - Clicking navigates directly to `/notifications`.

### 2. Zustand State Store (`useNotificationStore`)
Maintains reactive client state across the dashboard:
- `notifications`: Current list of fetched notification items.
- `unreadCount`: Active unread notification count.
- `preferences`: Cached `INotificationPreferences` document (`channels`, `categories`).
- `pagination`: `{ page, limit, total, totalPages }`.
- `filters`: Active query filters (`page`, `limit`, `category`, `isRead`).
- Actions: `fetchNotifications()`, `loadMoreNotifications()`, `fetchUnreadCount()`, `markAsRead()`, `markAllAsRead()`, `deleteNotification()`, `fetchPreferences()`, `updatePreferences()`.

---

## 10. Event Triggers & Codebase Usage

The following table traces every verified event trigger across the codebase:

| Event Type | Triggering Controller / Service | Function | Recipient Target | Verified Status in Code |
| :--- | :--- | :--- | :--- | :--- |
| `USER_REGISTERED` | `controllers/auth/mobileAuth.controller.ts` | `registerWithMobile` | `USER` (`user._id`) | **Active** (Sends user welcome notification) |
| `ADMIN_NEW_USER_REGISTERED` | `controllers/auth/mobileAuth.controller.ts` | `registerWithMobile` | `ADMIN` (via `notifyAdmins`) | **Active** (Alerts staff admins of new registration) |
| `ADMIN_USER_DELETED` | `controllers/auth/user.controller.ts` | `softDeleteUserSelf` | `ADMIN` (via `notifyAdmins`) | **Active** (Alerts admins when user self-deletes account) |
| `LISTING_SUBMITTED` | `controllers/listing/property.controller.ts` | `createProperty` | `USER` (`property.userId`) | **Active** (Submission confirmation for pending property) |
| `LISTING_SUBMITTED` | `controllers/listing/flatmateRequirements.controller.ts` | `createFlatmateRequirement` | `USER` (`requirement.userId`) | **Active** (Submission confirmation for requirement) |
| `ADMIN_LISTING_AWAITING_MODERATION` | `controllers/listing/property.controller.ts` | `createProperty` / `updateProperty` (if rejected) | `ADMIN` (via `notifyAdmins`) | **Active** (Moderation alert on new/resubmitted property) |
| `ADMIN_LISTING_AWAITING_MODERATION` | `controllers/listing/flatmateRequirements.controller.ts` | `createFlatmateRequirement` / `updateFlatmateRequirement` (if rejected) | `ADMIN` (via `notifyAdmins`) | **Active** (Moderation alert on new/resubmitted requirement) |
| `LISTING_APPROVED` | `controllers/listing/property.controller.ts` | `createProperty` (auto-approved) / `updateProperty` / `updatePropertyStatus` / `bulkUpdatePropertyStatus` | `USER` (`property.userId`) | **Active** (Notice that property listing is approved/live) |
| `LISTING_APPROVED` | `controllers/listing/flatmateRequirements.controller.ts` | `createFlatmateRequirement` (auto-approved) / `updateFlatmateRequirement` / `updateFlatmateRequirementStatus` / `bulkUpdateRequirementStatus` | `USER` (`requirement.userId`) | **Active** (Notice that requirement listing is approved/live) |
| `LISTING_REJECTED` | `controllers/listing/property.controller.ts` | `updateProperty` / `updatePropertyStatus` / `bulkUpdatePropertyStatus` | `USER` (`property.userId`) | **Active** (Rejection notice with reason) |
| `LISTING_REJECTED` | `controllers/listing/flatmateRequirements.controller.ts` | `updateFlatmateRequirement` / `updateFlatmateRequirementStatus` / `bulkUpdateRequirementStatus` | `USER` (`requirement.userId`) | **Active** (Rejection notice with reason) |
| `LISTING_UNPUBLISHED` | `controllers/listing/property.controller.ts` | `updateProperty` / `updatePropertyStatus` / `bulkUpdatePropertyStatus` | `USER` (`property.userId`) | **Active** (Notice when property is blocked/closed) |
| `LISTING_UNPUBLISHED` | `controllers/listing/flatmateRequirements.controller.ts` | `updateFlatmateRequirement` / `updateFlatmateRequirementStatus` / `bulkUpdateRequirementStatus` | `USER` (`requirement.userId`) | **Active** (Notice when requirement is blocked/closed) |
| `ADMIN_REPORT_SUBMITTED` | `controllers/listing/report.controller.ts` | `createReport` | `ADMIN` (via `notifyAdmins`) | **Active** (Staff alert when listing report submitted) |
| `REPORT_SUBMITTED_CONFIRMATION` | `controllers/listing/report.controller.ts` | `createReport` | `USER` (`userId`) | **Active** (Confirmation to reporter) |
| `REPORT_STATUS_UPDATED` | `controllers/listing/report.controller.ts` | `updateStatus` | `USER` (`report.userId`) | **Commented Out** (Lines 610-627 commented out in source) |
| `USER_REGISTERED` | `controllers/auth/user.controller.ts` | `registerUser` | `USER` | **Commented Out** (Lines 72-81 commented out in source) |
| `ADMIN_NEW_USER_REGISTERED` | `controllers/auth/user.controller.ts` | `registerUser` | `ADMIN` | **Commented Out** (Lines 84-92 commented out in source) |
| All other events (e.g. `NEW_CHAT_MESSAGE`, `PROPERTY_MATCH_FOUND`, `OTP_NOTIFICATION`, `EMAIL_VERIFICATION`) | Defined in types / categories | N/A | Dynamic | **Catalogue Registered** (Events are defined in schema and category maps; direct triggers are pending integration or handled by dedicated standalone services such as OTP) |

---

## 11. Property Match Notifications Status

1. **Preference Form Removed**: The Property Match Preferences form, its subdocument schema, and its dedicated endpoint (`/preferences/property-match`) have been completely removed from both backend and frontend.
2. **Category Preserved**: The `PROPERTY_MATCH` category remains an active notification category. Users can still toggle whether they want Property Match notifications delivered via In-App, Email, SMS, or WhatsApp in `NotificationPreferences`.
3. **Event Preserved**: `PROPERTY_MATCH_FOUND` remains a valid event type in `NotificationEventType` and mapped to `PROPERTY_MATCH`.
4. **Trigger Status**: No code currently calls `createNotification({ eventType: 'PROPERTY_MATCH_FOUND', ... })`.
5. **Future Matching Implementation**: Automatic matching will be built in a subsequent phase where matching criteria will be derived directly from published listings (`Property` and `FlatmateRequirement`), rather than stored in user notification preferences.

---

## 12. Cron Jobs & Background Tasks

- **Scheduled Cron Jobs**: **None**. There are no cron jobs, scheduled tasks, or `node-cron` runners currently configured in the backend.
- **MongoDB TTL Daemon**: The only background eviction task is executed natively by the MongoDB engine via the TTL index `{ expiresAt: 1 }` (`expireAfterSeconds: 0`), which automatically purges expired notification documents.

---

## 13. Error Handling & Known Limitations

During the audit of the notification subsystem, the following observations and discrepancies were identified:

1. **Frontend Settings Button Commented Out in Header**:
   In `frontend/src/components/dashboard/notification/NotificationsManager.tsx`, the settings button (`id="notification-settings-btn"`) in the JSX header was found commented out. While the settings dropdown logic is functional, users on `/notifications` currently cannot access the settings view from the header without uncommenting this button or navigating directly to tabs.
2. **In-App Realtime Push vs Polling**:
   Earlier documentation claimed In-App alerts used WebSocket/Socket.io. In the actual implementation, `createNotification()` writes to MongoDB only. There is no Socket.io `emit` in `notification.service.ts`; alerts appear on page refresh or navigation.
3. **SMS Dispatch Commented Out**:
   In `backend/src/services/notification/notification.service.ts`, general SMS dispatch via MSG91 is commented out ("FlatMate uses OTP only"). Only OTPs sent via the dedicated auth OTP controller actually dispatch SMS.
4. **WhatsApp Delivery is a Stub**:
   In `backend/src/services/notification/notification.service.ts`, WhatsApp dispatch merely logs to the console and immediately marks the delivery record as `SENT`. No third-party WhatsApp Business API provider is integrated.
5. **Report Resolution Notification Disabled**:
   In `backend/src/controllers/listing/report.controller.ts`, notification dispatch on report resolution (`REPORT_STATUS_UPDATED`) is commented out at lines 610-627.
6. **Mongoose Schema Category Defaults vs Service Defaults**:
   The `notificationPreferenceSchema` defines granular category defaults with various channel combinations (e.g. WhatsApp: true for chat), but `getOrCreateNotificationPreferences()` in `notification.service.ts` overrides categories on creation using `DEFAULT_USER_CATEGORY_PREFERENCES` (which sets all channels except `inApp` to `false`).

---

## 14. Testing & Verification

The following verification steps were executed across the project:

| Component / Task | Tool / Command | Result | Notes |
| :--- | :--- | :--- | :--- |
| **Backend Type Check** | `npm run typecheck --prefix backend` (`tsc --noEmit`) | **Passed (0 errors)** | Verified all types and model imports |
| **Backend Compilation** | `npm run build --prefix backend` (`tsc`) | **Passed (0 errors)** | Full compilation into `dist/` |
| **Frontend Type Check** | `cd frontend; npx tsc --noEmit` | **Passed (0 errors)** | Verified all component and store types |
| **Admin Type Check** | `cd admin; npx tsc --noEmit` | **Passed (0 errors)** | Verified admin types and components |
| **Reference Search** | `git grep -i "PropertyMatchPreferences"` | **0 occurrences found** | Confirmed complete removal of old preferences |
| **Property Match Key Check** | `git grep -n "propertyMatch"` | **Category references only** | Confirmed only `PROPERTY_MATCH` category key remains |
| **Preservation Check** | `git grep "PROPERTY_MATCH_FOUND"` | **Preserved** | Confirmed event remains in types & category map |
| **Frontend Linter** | `npm --prefix frontend run lint` | Preexisting ESLint rules | Found preexisting `no-explicit-any` warnings in unrelated files; zero issues introduced by notification changes |

