# Expense Receipt & Expense Type Implementation Summary

## Changes Completed

### Frontend Updates

#### 1. **ExpenseEntryModal.js** - Enhanced with file upload and expense type selection
- **Added Imports:**
  - `Upload, Briefcase, User` icons from lucide-react
  
- **New State:**
  - `formData.expense_type` - tracks whether expense is 'work' or 'personal'
  - `formData.receipt` - stores the selected file
  - `receiptFileName` - displays the selected filename to user

- **New Constants:**
  - `EXPENSE_TYPES` array with work/personal options and icons

- **New Functions:**
  - `handleFileSelect()` - validates file type (JPG, PNG, PDF) and size (max 5MB)

- **Updated handleSubmit():**
  - Creates FormData instead of JSON
  - Appends expense_type and receipt file if selected
  - Properly handles multipart/form-data submission

- **New UI Elements:**
  - Expense Type selector (Work/Personal buttons with icons)
  - Receipt file upload input with dashed border
  - Receipt filename display and validation messages

#### 2. **ExpensesManager.js** - New component for viewing and managing expenses
- **Features:**
  - Displays expenses grouped by type (Work/Personal)
  - Shows receipt download links
  - Delete functionality with confirmation modal
  - Displays total amount per category
  - Responsive motion animations
  - Company-based filtering

- **Functions:**
  - `fetchExpenses()` - loads expenses from API
  - `handleDelete()` - deletes expense with confirmation
  - `handleDownloadReceipt()` - opens receipt file in new window

#### 3. **ModernDashboard.js** - Integrated expense features
- **Added Import:**
  - `ExpensesManager` component
  - `DollarSign` icon from lucide-react

- **Added View:**
  - New 'expenses' case in renderView() with back button
  - Navigation to expenses view

- **Added Menu Option:**
  - "View Expenses" button in navigation menu
  - Company selection check before viewing expenses

### Backend Updates

#### 1. **package.json** - Added dependencies
- **New Dependency:**
  - `multer@^1.4.5-lts.1` for handling multipart file uploads

#### 2. **server.js** - Static file serving
- **Added:**
  - Static file serving middleware: `app.use('/uploads', express.static('uploads'))`
  - Allows frontend to access uploaded receipt files

#### 3. **routes/expenses.js** - File upload and expense type handling
- **New Imports:**
  - `multer` for file handling
  - `fs` for file system operations
  - `path` for path operations

- **Multer Configuration:**
  - Upload directory: `./uploads/receipts`
  - File filter: Only JPG, PNG, PDF allowed
  - File size limit: 5MB
  - Unique filename format: `{timestamp}-{userId}-{originalName}`
  - Automatic directory creation if doesn't exist

- **Updated POST /api/expenses:**
  - Middleware: `upload.single('receipt')` for file handling
  - Accepts: `amount, category, description, expense_type, receipt` (file)
  - Validates expense_type (defaults to 'work')
  - Stores receipt_path in database (e.g., `/uploads/receipts/{filename}`)
  - Handles file cleanup on validation errors

- **Request Validation:**
  - File type validation (MIME type check)
  - File size validation (max 5MB)
  - Expense type validation (work/personal)
  - Proper error handling with cleanup

### Database Schema

#### expenses table columns (already in migrate.js):
```sql
- id (SERIAL PRIMARY KEY)
- user_id (INTEGER, REFERENCES users)
- company_id (INTEGER, REFERENCES companies)
- amount (DOUBLE PRECISION)
- category (VARCHAR(50))
- description (TEXT)
- expense_type (VARCHAR(20), DEFAULT 'work')    -- New
- receipt_path (TEXT)                           -- New
- expense_date (TIMESTAMPTZ)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

## How to Use

### Adding an Expense
1. Click "Add Expense" button in the menu
2. Fill in the required fields:
   - **Amount** (required)
   - **Category** (Food, Transport, Tools, Software, Other)
   - **Expense Type** (Work or Personal)
3. Optional: Add a description and/or receipt file
4. Click "Add Expense" to save

### Viewing Expenses
1. Click menu (☰)
2. Select "View Expenses" 
3. Expenses are grouped by type (Work/Personal)
4. Each group shows the total amount
5. Click "View Receipt" to download if file is attached
6. Click trash icon to delete an expense

### Receipt Files
- **Supported formats:** JPG, PNG, PDF
- **Size limit:** 5MB
- **Storage location:** `backend/uploads/receipts/`
- **Access URL:** `/uploads/receipts/{filename}`
- **Automatic cleanup:** Files deleted if upload fails validation

## Data Flow

### Create Expense with Receipt
```
User → ExpenseEntryModal (React)
  ↓
FormData with receipt file
  ↓
POST /api/expenses (multipart/form-data)
  ↓
Backend multer middleware
  ↓
File validation & storage
  ↓
Database insert (expense_type, receipt_path)
  ↓
Success response with receipt URL
```

### View Expenses
```
ExpensesManager component
  ↓
GET /api/expenses (filtered by company_id)
  ↓
Expenses grouped by type
  ↓
Display with receipt links
  ↓
Optional delete functionality
```

## Testing Checklist

- [ ] Add expense with work type and receipt file
- [ ] Add expense with personal type without receipt
- [ ] Verify expense appears in correct category in View Expenses
- [ ] Download receipt file (click View Receipt link)
- [ ] Delete expense (with confirmation)
- [ ] Try uploading invalid file type (should show error)
- [ ] Try uploading file > 5MB (should show error)
- [ ] Switch companies and verify expenses are filtered correctly
- [ ] Verify receipt files accessible at `/uploads/receipts/{filename}`

## File Structure

```
TimeTracker/
├── backend/
│   ├── routes/
│   │   └── expenses.js (UPDATED)
│   ├── server.js (UPDATED)
│   ├── package.json (UPDATED)
│   ├── migrate.js (schema already includes columns)
│   └── uploads/
│       └── receipts/  (auto-created)
└── frontend/
    └── src/
        └── components/
            ├── ExpenseEntryModal.js (UPDATED)
            ├── ExpensesManager.js (NEW)
            └── ModernDashboard.js (UPDATED)
```

## Important Notes

1. **Multer Version:** Using 1.4.5-lts.1 due to npm availability; newer 2.x version available but may require code adjustments
2. **File Cleanup:** Automatic cleanup of uploaded files if validation fails
3. **FormData:** Frontend correctly uses FormData without setting Content-Type header (axios sets it automatically)
4. **Company Isolation:** Expenses are filtered by company_id to ensure multi-tenant data isolation
5. **Receipt URLs:** Stored as relative paths (`/uploads/receipts/{filename}`) for flexibility
6. **Default Expense Type:** Defaults to 'work' if not specified

## Next Steps (Optional Enhancements)

1. Add expense approval workflow
2. Implement expense categorization by project
3. Add expense report generation (PDF)
4. Implement expense reimbursal tracking
5. Add bulk expense upload functionality
6. Implement expense tagging system
7. Add expense filtering and search
8. Generate expense analytics/dashboard
