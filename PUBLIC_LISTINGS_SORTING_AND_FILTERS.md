# Public Listings: Sorting and Filtering Architecture

This document explains the technical implementation, query parameters, data flow, and user experience for sorting options and additional filters added to the public listings discovery page (`/listing`) in the FlatMate Marketplace project.

---

## 1. Overview & Architecture

Public listing discovery (`GET /api/listings`) is a unified endpoint that aggregates listings across two distinct collections:
- **`Property`**: Full properties, rooms, flats, or PGs posted by owners or seekers.
- **`FlatmateRequirement`**: Flatmate/roommate requirement posts (postType: `property` or `partner`).

Both collections are filtered at the database level, combined in memory as an indexed projection (`SlicedIndexItem`), sorted according to user selection, sliced for pagination (`limit`, `skip`), and then populated with rich details (user profiles, media, locations, amenities).

```
               [Frontend: ListingFilterBar & ListingManager]
                                     │
                                     ▼
                     GET /api/listings?sortBy=...&minBudget=...
                                     │
                                     ▼
        ┌────────────────────────────────────────────────────────┐
        │  Listing Controller (backend)                           │
        │  1. Validate Query Params with Zod                     │
        │  2. Build propertyFilter & flatmateFilter              │
        │  3. Fetch projected items (_id, createdAt, rent, loc)  │
        │  4. Combine into unified index                         │
        │  5. Sort combined index (Relevance, Price, Recent)     │
        │  6. Slicing for current page (pagination)              │
        │  7. Populate current page documents with full details  │
        │  8. Return unified response                            │
        └────────────────────────────────────────────────────────┘
```

---

## 2. Supported Sorting Options

Sorting operates on the unified index before pagination occurs, ensuring that all listings (both Properties and Flatmate Requirements) are compared consistently.

| Option Label | Parameter (`sortBy`) | Parameter (`order`) | Description & Behavior |
|---|---|---|---|
| **Relevance** (Default) | `relevance` (or omitted) | `asc` / `desc` | **Geographic Search Active:** Sorts nearest listings first by calculated distance (`distA - distB`), tie-broken by `createdAt` desc.<br>**Non-Geographic Search:** Sorts by newest listing creation date (`createdAt` desc). |
| **Most Recent** | `recent` (or `createdAt`) | `desc` | Displays newest listings first (`createdAt` desc). |
| **Price: Low to High** | `price_low_high` (or `rent`/`price` with `asc`) | `asc` | Displays lowest applicable monthly rent first.<br>**Safe unpriced handling:** Listings with invalid or missing prices (`rent <= 0` or missing) are placed at the end of the results. |
| **Price: High to Low** | `price_high_low` (or `rent`/`price` with `desc`) | `desc` | Displays highest applicable monthly rent first.<br>**Safe unpriced handling:** Listings with invalid or missing prices are placed at the end. |

### Missing / Invalid Price Handling
To prevent unpriced or zero-rent listings from incorrectly appearing at the top of Price Low to High results:
- Valid prices are numbers where `item.rent > 0`.
- Listings with valid prices appear first in order.
- Listings with missing or `0` prices are safely deferred to the end.
- Same-price ties are broken by recency (`createdAt` desc) followed by document ID.

---

## 3. Budget Range Filter

Both `Property` and `FlatmateRequirement` store monthly cost in the `rent: number` field.

### Query Parameters
- `minBudget` (alias: `minPrice`): Minimum monthly rent (₹). Must be `>= 0`.
- `maxBudget` (alias: `maxPrice`): Maximum monthly rent (₹). Must be `>= 0`.
- Backward Compatibility: `budget` or `rent` as a single parameter is also supported.

### Backend Validation
- Enforces non-negative values via Zod (`z.number().min(0)`).
- Validates that `minBudget <= maxBudget`. If `minBudget > maxBudget`, returns `400 Bad Request` with message: `"Minimum budget cannot be greater than maximum budget"`.

### Database Filtering
Applies to both models:
```ts
if (minBudget !== undefined || maxBudget !== undefined) {
  const rentQuery: any = {};
  if (minBudget !== undefined) rentQuery.$gte = minBudget;
  if (maxBudget !== undefined) rentQuery.$lte = maxBudget;
  propertyFilter.rent = rentQuery;
  flatmateFilter.rent = rentQuery;
}
```

---

## 4. Furnishing Filter

Matches the database enum values defined in both `Property` and `FlatmateRequirement` models.

### Supported Enum Values
- `all`: All listings (does not filter).
- `fully_furnished`: Fully furnished listings.
- `semi_furnished`: Semi furnished listings.
- `unfurnished`: Unfurnished listings.

### Backend Behavior
Applies the filter to both `propertyFilter` and `flatmateFilter`:
```ts
if (query.furnishing && query.furnishing !== 'all') {
  propertyFilter.furnishing = query.furnishing;
  flatmateFilter.furnishing = query.furnishing;
}
```
When `furnishing` is `all` or omitted, no filter is applied, allowing listings with any furnishing status to be returned.

---

## 5. Gender Preference Filter ("Any" Support)

The platform schema uses `genderPreference: 'any'` as the universal default.

### Supported Filter Options
- **Any** (Default): Includes listings of all gender preferences (`male`, `female`, `other`, `any`).
- **Male**: Returns only listings with `genderPreference: 'male'`.
- **Female**: Returns only listings with `genderPreference: 'female'`.

### Backend Implementation
```ts
const rawGender = query.genderPreference as string | undefined;
const genderPref = rawGender ? rawGender.trim().toLowerCase() : undefined;
if (genderPref && genderPref !== 'all' && genderPref !== 'any') {
  propertyFilter.genderPreference = genderPref;
  flatmateFilter.genderPreference = genderPref;
}
```
- When `genderPreference=any` or omitted, neither filter restricts the query, returning all listings.
- When `genderPreference=male`, only listings specifying `male` are returned.
- When `genderPreference=female`, only listings specifying `female` are returned.

---

## 6. Frontend Implementation

### 6.1 `ListingFilterBar.tsx`
- **Responsive Presentation:**
  - **Desktop (`lg:` >= 1024px):** Uses floating dropdown menus positioned directly under filter pills (`hidden lg:block absolute`).
  - **Mobile & Tablet (< `lg` < 1024px):** When a filter pill (`Sort`, `Budget`, `Furnishing`, or `Gender`) is opened, it displays as an anchored dialog modal / bottom sheet (`lg:hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs`) to prevent clipping or horizontal overflow on smaller screens.
- **Location & Search:** Search bar with Google Places autocomplete (`placeId`, `latitude`, `longitude`, `radius`) and text search fallback (`q`).
- **Category Tabs:** `All Listing`, `Flat`, `Flatmate`, `Property`.
- **Sort Dropdown:** Dropdown pill with options: Relevance, Most Recent, Price: Low to High, Price: High to Low.
- **Budget Popover:**
  - Compact button displaying active range (e.g. `₹10k - ₹25k`, `₹15k+`, `Up to ₹30k`, or `Budget`).
  - Inputs for Min and Max budget in ₹.
  - Quick range preset chips (`Under ₹10k`, `₹10k - ₹20k`, `₹20k - ₹35k`, `Above ₹35k`).
  - Real-time client validation preventing `min > max`.
- **Furnishing Dropdown:** Dropdown pill with options: All Furnishing, Fully Furnished, Semi Furnished, Unfurnished.
- **Gender Dropdown:** Blue pill with options: Any, Male, Female (default: `Any`).
- **Reset Button:** Displays when any filter or non-default sort is active to quickly restore all defaults.

### 6.2 `ListingManager.tsx`
- Manages state for `selectedSort`, `selectedFurnishing`, `minBudget`, `maxBudget`, `selectedGender`, `selectedCategory`, and `searchQuery`.
- Synchronizes with URL query parameters (`city`, `category`, `propertyType`).
- Automatically resets `page: 1` whenever any filter or sorting option changes.
- Preserves "Load More" pagination behavior without duplicating items.
- Resets all filters to defaults on page navigation or clicking Reset Filters.

### 6.3 `useListingStore.ts`
- State includes `filters: ListingQueryParams` with initial values:
  ```ts
  const initialFilters: ListingQueryParams = {
    page: 1,
    limit: 10,
    sourceType: 'all',
    genderPreference: 'any',
    furnishing: 'all',
    minBudget: undefined,
    maxBudget: undefined,
    sortBy: 'relevance',
    order: 'desc',
  };
  ```
- `fetchListings`: Cleans empty / `all` parameters while preserving `minBudget`, `maxBudget`, `sortBy`, `genderPreference`, `furnishing`, and pagination.
- `setFilters`: Merges new filter values and triggers refetching on page 1.
- `resetFilters`: Restores `initialFilters` and refetches.

---

## 7. API Request Examples

### 7.1 Default Relevance Discovery
```http
GET /api/listings?page=1&limit=10&sortBy=relevance
```

### 7.2 Price Sorted (Low to High) with Budget Range
```http
GET /api/listings?minBudget=10000&maxBudget=25000&sortBy=price_low_high&page=1&limit=10
```

### 7.3 Multi-Filter Combination
```http
GET /api/listings?sourceType=all&genderPreference=female&furnishing=fully_furnished&minBudget=15000&sortBy=price_low_high&page=1&limit=10
```

### 7.4 Location Search with Most Recent Sorting
```http
GET /api/listings?latitude=19.0760&longitude=72.8777&radius=15&sortBy=recent&page=1&limit=10
```

---

## 8. Verification & Test Summary

- Automated backend test suite verified 20 test cases including sort order, budget boundaries, furnishing combinations, gender "Any" behavior, safe missing price handling, and 400 validation error handling.
- TypeScript check passed on backend (`npm run typecheck --prefix backend`).
- Next.js Turbopack production build passed on frontend (`npm run build --prefix frontend`).
- TypeScript check passed on admin (`npx tsc --noEmit`).
