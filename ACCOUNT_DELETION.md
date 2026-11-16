# Account Deletion Architecture & OTP Verification

This document outlines the account deletion workflows in FlatMate Marketplace, focusing on the OTP-verified self-deletion process for regular users and administrative deletion workflows.

---

## 1. Overview of Deletion Types

The platform supports two tiers of account deletion:

| Type | Target Audience | Mechanism | Data Retention | OTP Required |
|---|---|---|---|---|
| **User Soft Delete** | Logged-in Users (`/api/users/me`) | Sets `isDeleted: true`, `accountStatus: 'inactive'`, revokes sessions, closes listings | Records preserved for compliance/audit | **Yes (6-digit OTP)** |
| **Admin Soft Delete** | Super Admin / Admin (`/api/users/:userId`) | Cascading soft deletion via admin management panel | Records preserved for compliance/audit | **No (Admin role check only)** |
| **Admin Hard Delete** | Super Admin / Admin (`/api/users/:userId/hard`) | Cascading hard deletion via admin management panel | Permanent purge of user and linked entities | **No (Admin role check only)** |

---

## 2. User Self-Deletion Flow (OTP-Protected)

To prevent accidental deletions and unauthorized account takeover actions, regular users must complete an OTP verification challenge before account soft-deletion proceeds.

### Workflow Sequence

```
[User on ManageProfile UI]
          │
          ▼
1. Clicks "Delete Account"
          │
          ▼
2. Modal opens (Step 1: Confirmation warning)
          │
          ▼ User confirms intent
3. POST /api/users/me/delete-otp
          │
          ├── Generates 6-digit OTP (stored in OTP collection with type "account_deletion")
          ├── Rate-limits requests (1 request per 60 seconds)
          ├── 5-minute expiry, max 5 failed attempts
          └── Dispatches OTP via SMS (MSG91) and/or registered Email (Nodemailer)
          │
          ▼ Modal switches to Step 2 (OTP Input)
4. Displays 6-digit verification code input & masked destination
          │
          ▼ User enters 6-digit OTP
5. DELETE /api/users/me  (or POST /api/users/me/verify-delete) with { otp: "..." }
          │
          ├── Validates OTP against database (hash, expiry, attempts, type: "account_deletion")
          ├── If invalid: Increments attempt counter (rejects with 400)
          ├── If valid: Marks OTP used / purged
          ├── Calls userDeletionService.softDeleteUserCascade(userId, deletedBy):
          │     ├── Sets user.isDeleted = true, user.accountStatus = 'inactive'
          │     ├── Closes all active user Property listings
          │     ├── Closes all active Flatmate requirement posts
          │     ├── Revokes all active user sessions
          │     └── Purges user OTP records
          ├── Clears accessToken and refreshToken HTTP-only cookies
          └── Dispatches internal system notification to administrators
          │
          ▼
6. Frontend receives success, resets auth store, and redirects to home page "/"
```

---

## 3. API Endpoints Specification

### 3.1 Request Account Deletion OTP
- **Route:** `POST /api/users/me/delete-otp`
- **Authentication:** Required (`authenticate` middleware)
- **Role:** Regular users (`user`, `admin`, etc.)
- **Rate Limit:** 60 seconds cooldown between requests
- **Request Body:** Empty `{}`
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Verification code sent to your registered mobile number and email",
    "data": {
      "channel": "sms_and_email",
      "destination": "******9268 and t***@example.com"
    }
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Not logged in.
  - `429 Too Many Requests`: `A verification code was already sent recently. Please wait 45 seconds before requesting a new code.`

---

### 3.2 Verify OTP and Soft-Delete Account
- **Route:** `DELETE /api/users/me` OR `POST /api/users/me/verify-delete`
- **Authentication:** Required (`authenticate` middleware)
- **Request Payload:**
  - Headers: `x-otp: <6-digit-otp>` (optional)
  - Body: `{ "otp": "123456" }` (recommended)
  - Query: `?otp=123456` (supported fallback)
- **Validation:**
  - OTP must be a valid 6-digit string (`verifyDeleteUserSchema`).
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Your account has been deleted successfully",
    "data": {
      "deletedAt": "2026-11-14T09:44:00.521Z"
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`:
    - `"OTP verification is required to delete your account. Please request a verification code."`
    - `"Invalid verification code. Please check and try again."`
    - `"Verification code has expired. Please request a new one."`
    - `"Maximum verification attempts exceeded. Please request a new code."`
  - `401 Unauthorized`: Session invalid or expired.

---

## 4. Admin Deletion Endpoints (Unchanged & No OTP Required)

Administrative endpoints are designed for administrative moderation and data management. They enforce strict role-based access control (`authorize('admin', 'super_admin')`) and do **not** require OTP verification.

### 4.1 Admin Soft-Delete
- **Route:** `DELETE /api/users/:userId`
- **Controller:** `deleteUserByAdmin`
- **Behavior:** Executes `userDeletionService.softDeleteUserCascade(targetUserId, adminId)` without OTP.

### 4.2 Admin Hard-Delete
- **Route:** `DELETE /api/users/:userId/hard`
- **Controller:** `hardDeleteUserByAdmin`
- **Behavior:** Executes `userDeletionService.hardDeleteUserCascade(targetUserId, adminId)` permanently purging records without OTP.

---

## 5. Security and Data Integrity Safeguards

1. **Cryptographic OTP Hashing:** OTP codes are hashed with SHA-256 before database storage (`otpHash`).
2. **Attempt Limiting:** Maximum 5 attempts allowed per OTP before forced invalidation.
3. **Time-To-Live (TTL):** OTP expires in 5 minutes (`expiresAt`).
4. **Cooldown Throttling:** 60-second cooldown enforced on requesting new OTPs to mitigate SMS/email flooding.
5. **Cascading Soft-Deletion:**
   - Properties owned by the user are set to `status: 'closed'` and `isAvailable: false`.
   - Flatmate posts owned by the user are set to `status: 'closed'`.
   - All active user refresh tokens / sessions are revoked (`isRevoked: true`).
   - All OTP records belonging to the user are purged.
6. **Cookie Cleanup:** `accessToken` and `refreshToken` HTTP-only cookies are cleared from the client on deletion.
7. **Audit Notifications:** System administrators receive an automated notification when any user account is soft-deleted.

---

## 6. Frontend Components and State

- **`frontend/src/store/useAuthStore.ts`**:
  - `requestAccountDeletionOTP()`: Dispatches the API request and returns destination info.
  - `deleteAccountWithOTP(otp: string)`: Sends the verification code to execute deletion, clears auth state, and redirects to `/`.
- **`frontend/src/components/dashboard/profile/ManageProfile.tsx`**:
  - Modal Step 1: Warning and Confirmation Dialog with "Proceed to Verify" button.
  - Modal Step 2: 6-digit OTP entry with individual digit focus navigation, paste support, 60-second resend countdown timer, inline error handling, and cancellation back to Step 1.
