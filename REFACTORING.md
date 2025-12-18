# Masonry Component Refactoring Plan

## Current State
- **File**: `src/Masonry.vue`
- **Lines**: 1,765
- **Functions**: 35+
- **Concerns**: Multiple (pagination, swipe mode, layout, virtualization, error handling, etc.)

## Refactoring Opportunities

### 1. **Swipe Mode Logic** (~200 lines)
**Extract to**: `useSwipeMode.ts`

**Functions to extract:**
- `handleTouchStart`, `handleTouchMove`, `handleTouchEnd`
- `handleMouseDown`, `handleMouseMove`, `handleMouseUp`
- `goToNextItem`, `goToPreviousItem`, `snapToCurrentItem`
- `handleWindowResize` (swipe-specific parts)
- Swipe state: `currentSwipeIndex`, `swipeOffset`, `isDragging`, `dragStartY`, `dragStartOffset`
- Computed: `currentItem`, `nextItem`, `previousItem`

**Benefits:**
- Isolates mobile-specific behavior
- Reduces main component complexity
- Easier to test independently

---

### 2. **Pagination & Loading Logic** (~400 lines)
**Extract to**: `useMasonryPagination.ts`

**Functions to extract:**
- `loadPage`, `loadNext`, `refreshCurrentPage`
- `getContent`, `fetchWithRetry`, `waitWithProgress`
- `maybeBackfillToTarget`, `cancelLoad`
- `init`, `restoreItems`
- Pagination state: `currentPage`, `paginationHistory`, `hasReachedEnd`, `isLoading`, `loadError`
- Backfill state: `backfillActive`, `cancelRequested`

**Benefits:**
- Centralizes all data fetching logic
- Makes retry/backfill behavior testable
- Separates data concerns from UI concerns

---

### 3. **Item Management** (~200 lines)
**Extract to**: `useMasonryItems.ts`

**Functions to extract:**
- `remove`, `removeMany`, `removeAll`
- `restore`, `restoreMany`
- Item dimension validation: `checkItemDimensions`, `isPositiveNumber`
- State: `invalidDimensionIds`

**Benefits:**
- Groups related item manipulation functions
- Makes undo/redo patterns clearer
- Isolates validation logic

---

### 4. **Viewport & Virtualization** (~150 lines)
**Extract to**: `useMasonryViewport.ts`

**Functions to extract:**
- `updateScrollProgress`
- `visibleMasonry` computed
- Viewport state: `viewportTop`, `viewportHeight`, `virtualizing`
- Scroll progress: `scrollProgress`
- `debouncedScrollHandler` (viewport-specific parts)

**Benefits:**
- Isolates performance-critical virtualization logic
- Makes viewport calculations testable
- Separates rendering optimization from business logic

---

### 5. **Layout Management** (~200 lines)
**Extract to**: `useMasonryLayout.ts`

**Functions to extract:**
- `refreshLayout` (with incremental update logic)
- `calculateHeight`
- Layout state: `columns`, `masonryContentHeight`
- Previous layout cache: `previousLayoutItems`, `previousColumnHeights`

**Benefits:**
- Isolates complex layout calculation logic
- Makes incremental updates easier to optimize
- Separates layout from data management

---

### 6. **Resize Handling** (~100 lines)
**Extract to**: `useMasonryResize.ts`

**Functions to extract:**
- `onResize`
- `handleWindowResize` (resize-specific parts)
- `setFixedDimensions`
- ResizeObserver setup (in watcher)
- State: `containerWidth`, `containerHeight`, `fixedDimensions`, `wrapper`

**Benefits:**
- Centralizes all dimension tracking
- Makes responsive behavior testable
- Isolates ResizeObserver complexity

---

### 7. **Error Handling Pattern** (utility)
**Extract to**: `masonryErrorHandler.ts` or inline utility

**Pattern to extract:**
```typescript
// Repeated pattern:
loadError.value = error instanceof Error ? error : new Error(String(error))
```

**Create utility:**
```typescript
function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}
```

**Benefits:**
- DRY principle
- Consistent error handling
- Easier to change error format later

---

### 8. **Template Duplication**
**Extract to**: Component or slot wrapper

**Duplicated sections:**
- Error message display (lines 1690-1694, 1731-1735)
- End message display (lines 1684-1688, 1725-1729)

**Solution**: Create `<MasonryMessages>` component or use computed slots

**Benefits:**
- Single source of truth for message UI
- Easier to style consistently
- Reduces template complexity

---

### 9. **Transition Wrappers** (~50 lines)
**Current**: Wrapper functions that check `virtualizing.value`
**Options:**
- Keep in main component (they're thin wrappers)
- Or extract to `useMasonryTransitions` with virtualization support

**Recommendation**: Keep in main component since they're just thin wrappers

---

### 10. **State Consolidation**
**Group related refs into objects:**

```typescript
// Instead of:
const currentPage = ref<any>(null)
const paginationHistory = ref<any[]>([])
const hasReachedEnd = ref<boolean>(false)
const isLoading = ref<boolean>(false)
const loadError = ref<Error | null>(null)

// Consider:
const pagination = reactive({
  currentPage: null,
  history: [],
  hasReachedEnd: false,
  isLoading: false,
  error: null
})
```

**Benefits:**
- Related state grouped together
- Easier to pass to composables
- More semantic

---

## Recommended Refactoring Order

1. **Phase 1: Extract Error Handling** (Quick win, low risk)
   - Create error normalization utility
   - Replace all error assignments

2. **Phase 2: Extract Swipe Mode** (Isolated feature)
   - Create `useSwipeMode.ts`
   - Move all swipe-related code
   - Test thoroughly

3. **Phase 3: Extract Pagination** (Core functionality)
   - Create `useMasonryPagination.ts`
   - Move loading/backfill logic
   - Test thoroughly

4. **Phase 4: Extract Item Management** (Independent feature)
   - Create `useMasonryItems.ts`
   - Move remove/restore functions
   - Test thoroughly

5. **Phase 5: Extract Viewport** (Performance-critical)
   - Create `useMasonryViewport.ts`
   - Move virtualization logic
   - Test performance

6. **Phase 6: Extract Layout** (Complex logic)
   - Create `useMasonryLayout.ts`
   - Move layout calculation
   - Test edge cases

7. **Phase 7: Extract Resize** (Infrastructure)
   - Create `useMasonryResize.ts`
   - Move dimension tracking
   - Test responsive behavior

8. **Phase 8: Template Cleanup** (UI polish)
   - Extract message components
   - Reduce duplication

---

## Estimated Impact

**Before:**
- 1,765 lines in single file
- 35+ functions
- Multiple concerns mixed

**After:**
- ~400-500 lines in main component
- 7-8 focused composables
- Clear separation of concerns
- Better testability
- Easier maintenance

---

## Notes

- Keep existing composables (`useMasonryScroll`, `useMasonryTransitions`) as-is
- Maintain backward compatibility with exposed API
- Update tests as composables are extracted
- Consider TypeScript types for better composable interfaces

