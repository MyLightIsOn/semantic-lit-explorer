# Document Deletion Feature Design

**Date:** January 28, 2026
**Status:** Approved
**Author:** Claude (with user collaboration)

## Overview

Add the ability to delete documents from the vector database through the DocumentList UI. This reuses the existing selection system (checkboxes) and provides a safe, confirmed deletion workflow.

## User Requirements

- Delete one or more selected documents
- Confirmation before permanent deletion
- Clear visual feedback during and after deletion
- Maintain non-deleted selections after operation
- Simple implementation without audit trails

## User Flow

1. User selects one or more documents using existing checkboxes
2. User clicks "Delete Selected" button (only enabled when ≥1 document selected)
3. Confirmation dialog appears showing:
   - Number of documents to delete
   - List of document titles (max 5 shown, "+N more" if exceeds)
   - Warning about permanent deletion
   - Cancel / Confirm Delete buttons
4. On confirm: deletion proceeds with loading state
5. On success:
   - Document list refreshes automatically
   - Deleted documents removed from selection array
   - Remaining selections preserved

## Technical Design

### New Server Action

**File:** `app/actions/deleteDocuments.ts`

**Function Signature:**
```typescript
export async function deleteDocuments(
  sourceFiles: string[]
): Promise<DeleteDocumentsResult>
```

**Return Type:**
```typescript
export type DeleteDocumentsResult = {
  success: boolean
  deletedCount?: number
  error?: string
}
```

**Implementation:**
- Use Supabase client to delete from `documents` table
- Filter: `WHERE source_file IN (...)` for provided source files
- Single batch query for efficiency
- Return count of rows deleted

### Component Updates

**File:** `app/query/DocumentList.tsx`

**New UI Elements:**
1. "Delete Selected" button in controls section (next to Select All/Deselect All)
   - Red/danger styling
   - Disabled when `selectedDocuments.length === 0`
   - Shows count: "Delete Selected (N)"

2. Confirmation dialog (inline modal)
   - Dark overlay background
   - White centered card
   - Warning icon
   - Document titles list (max 5, then "+N more")
   - Two buttons: "Cancel" (gray), "Delete" (red)

**New State:**
```typescript
const [showDeleteDialog, setShowDeleteDialog] = useState(false)
const [deletionInProgress, setDeletionInProgress] = useState(false)
const [deleteError, setDeleteError] = useState<string | null>(null)
```

**Delete Flow:**
1. User clicks "Delete Selected"
2. Set `showDeleteDialog = true`
3. User confirms in dialog
4. Set `deletionInProgress = true`
5. Call `deleteDocuments(selectedDocuments)`
6. On success:
   - Call `fetchDocuments()` to refresh list
   - Filter deleted files from `selectedDocuments`
   - Set `showDeleteDialog = false`
7. On error:
   - Set `deleteError` with message
   - Keep dialog open so user can retry or cancel

### Database Operation

**Table:** `documents` (Supabase/pgvector)

**Query:**
```sql
DELETE FROM documents
WHERE source_file IN ('file1.pdf', 'file2.pdf', ...)
```

**Cascading:** None needed (single table)

**Transaction:** Single atomic delete operation

## Edge Cases & Error Handling

### Edge Cases
1. **Delete all documents on current page:** Move to previous page if exists, otherwise show empty state
2. **Delete while on last page:** Adjust `currentPage` if it exceeds new `totalPages`
3. **Delete all documents:** Show "No documents" empty state
4. **Partial selection deletion:** Remaining selections stay selected

### Error Scenarios
1. **Network failure:** Show error message, keep selection, allow retry
2. **Database error:** Display error details, keep dialog open
3. **Partial deletion:** Report which documents failed (if distinguishable)

## Implementation Steps

### Step 1: Create Server Action
- Create `app/actions/deleteDocuments.ts`
- Implement batch deletion with Supabase client
- Add error handling and return deleted count

### Step 2: Update DocumentList Component
- Add "Delete Selected" button with proper styling
- Implement confirmation dialog UI
- Add state management for dialog and deletion flow
- Wire up server action call

### Step 3: Handle Post-Deletion State
- Refresh document list after successful deletion
- Update selection array (filter out deleted files)
- Adjust pagination if needed (currentPage bounds check)

### Step 4: Testing Checklist
- [ ] Single document deletion
- [ ] Bulk deletion (2+ documents)
- [ ] Select All + delete all documents
- [ ] Delete with pagination (verify page adjustment)
- [ ] Error handling (network failure simulation)
- [ ] Canceling confirmation dialog
- [ ] Deletion in progress UI state
- [ ] Selection preservation after partial deletion

## Out of Scope

- Undo/soft delete functionality
- Deletion audit trail or metadata tracking
- Bulk delete from separate UI (uses existing selection)
- Delete button in table rows (only bulk delete button)

## Success Criteria

1. User can delete selected documents with confirmation
2. UI updates correctly after deletion
3. Error states are handled gracefully
4. Selection state is managed properly
5. Code is simple and maintainable
