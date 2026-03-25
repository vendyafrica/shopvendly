# Apps/Web API Architecture Redesign

Refactor `apps/web` to establish consistent module boundaries, eliminate code duplication, and standardize the service + repo pattern across all features.

---

## Current Issues Identified

### 1. Layer Violations & Duplication
- `toCanonicalUploadThingUrl` duplicated in `app/api/storefront/[slug]/route.ts` and `modules/storefront/data/storefront-service.ts`
- `normalizeMediaUrls` duplicated in same files
- API routes sometimes bypass services and call repos directly
- `DEFAULT_STORE_LOGO` constant duplicated across files

### 2. Scattered Data Access Patterns
- Top-level `/repo` folder with 21 files (legacy pattern)
- `modules/storefront/data/` folder (newer pattern)
- `modules/admin/services/` folder (another pattern)
- No clear convention for where data access belongs

### 3. Inconsistent Module Structure
| Module | components | hooks | lib | models | services | data | repo |
|--------|------------|-------|-----|--------|----------|------|------|
| storefront | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| admin | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ |
| products | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| orders | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |
| cart | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

---

## Target Architecture

### Standard Module Contract
```
modules/[feature]/
├── components/     # React components (optional)
├── hooks/          # React hooks (optional)
├── lib/
│   ├── [feature]-service.ts   # Business logic
│   ├── [feature]-repo.ts      # Raw DB queries
│   └── [feature]-models.ts    # Zod schemas & types
├── utils/          # Feature-specific utilities (optional)
└── index.ts        # Public exports
```

### Layering Rules
1. **API Routes** → thin handlers that validate input, call services, return responses
2. **Services** → business logic, orchestration, calls repos
3. **Repos** → raw database queries only, no business logic
4. **Models** → Zod schemas, TypeScript types, validation

### Shared Utilities
- Create `apps/web/lib/media/` for shared media URL utilities
- Create `apps/web/lib/constants/` for shared constants

---

## Implementation Phases

### Phase 1: Shared Utilities Extraction
- [ ] Create `lib/media/url-utils.ts` with `toCanonicalUploadThingUrl`, `normalizeMediaUrls`, `resolveMediaUrl`
- [ ] Create `lib/constants/defaults.ts` with `DEFAULT_STORE_LOGO` and other shared constants
- [ ] Update all consumers to import from shared locations

### Phase 2: Storefront Module Cleanup
- [ ] Rename `modules/storefront/data/` to `modules/storefront/lib/`
- [ ] Split `storefront-service.ts` into `storefront-service.ts` (business logic) and `storefront-repo.ts` (DB queries)
- [ ] Move `modules/storefront/models/` contents into `lib/storefront-models.ts`
- [ ] Update API routes to be thin handlers calling the service

### Phase 3: Products Module Standardization
- [ ] Create `modules/products/lib/product-repo.ts` (migrate from `/repo/product-repo.ts`)
- [ ] Ensure `product-service.ts` only contains business logic
- [ ] Verify `product-models.ts` has all schemas

### Phase 4: Orders Module Standardization
- [ ] Create `modules/orders/lib/order-repo.ts` (migrate from `/repo/orders-repo.ts`)
- [ ] Create `modules/orders/lib/order-service.ts`
- [ ] Ensure `order-models.ts` has all schemas

### Phase 5: Admin Module Cleanup
- [ ] Rename `modules/admin/services/` to `modules/admin/lib/`
- [ ] Create `admin-repo.ts` (migrate from `/repo/admin-repo.ts`)
- [ ] Consolidate `access-service.ts`, `admin-service.ts`, `dashboard-service.ts`

### Phase 6: Cart Module Standardization
- [ ] Create `modules/cart/lib/cart-service.ts`
- [ ] Create `modules/cart/lib/cart-repo.ts` (migrate from `/repo/cart-repo.ts`)
- [ ] Create `modules/cart/lib/cart-models.ts`

### Phase 7: Remaining Repos Migration
- [ ] Migrate `store-repo.ts` → `modules/stores/lib/store-repo.ts`
- [ ] Migrate `analytics-repo.ts` → `modules/admin/lib/analytics-repo.ts`
- [ ] Migrate remaining repos to appropriate modules
- [ ] Delete empty `/repo` folder

### Phase 8: API Routes Cleanup
- [ ] Audit all `/app/api/` routes for direct DB access
- [ ] Ensure all routes follow: validate → service call → response pattern
- [ ] Remove duplicated utility functions from route files

---

## Files to Create/Modify

### New Shared Files
- `apps/web/lib/media/url-utils.ts`
- `apps/web/lib/media/index.ts`
- `apps/web/lib/constants/defaults.ts`

### Module Restructures
- `modules/storefront/lib/storefront-repo.ts` (new)
- `modules/products/lib/product-repo.ts` (migrated)
- `modules/orders/lib/order-repo.ts` (migrated)
- `modules/orders/lib/order-service.ts` (new)
- `modules/cart/lib/` (new folder)
- `modules/stores/` (new module)

### Files to Delete (after migration)
- `apps/web/repo/*.ts` (incrementally)

---

## Success Criteria
- [ ] No utility function duplication across files
- [ ] All modules follow standard contract
- [ ] API routes are thin handlers (< 50 lines typically)
- [ ] Clear separation: routes → services → repos
- [ ] Top-level `/repo` folder eliminated
- [ ] All Zod schemas in `*-models.ts` files
