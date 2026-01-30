# 🚀 QUICK REFERENCE GUIDE - Expense Receipt Feature

## For Developers Getting Started

### Key Files at a Glance

```
FRONTEND:
├── src/components/ExpenseEntryModal.js
│   └── Form to add expenses with receipt
├── src/components/ExpensesManager.js
│   └── Component to view and manage expenses
└── src/components/ModernDashboard.js
    └── Integrated both above components

BACKEND:
├── routes/expenses.js
│   └── API endpoints with multer file handling
├── server.js
│   └── Static file middleware for receipts
└── package.json
    └── Added multer dependency

DATABASE:
└── migrate.js (unchanged - already has fields)
    ├── expense_type column
    └── receipt_path column

UPLOADS:
└── uploads/receipts/ (auto-created by server)
    └── Stores receipt files
```

---

## API Quick Reference

### Create Expense with Receipt
```javascript
const formData = new FormData();
formData.append('amount', '25.50');
formData.append('category', 'Food');
formData.append('description', 'Team lunch');
formData.append('expense_type', 'work'); // or 'personal'
formData.append('receipt', fileObject);   // Optional

const response = await axios.post('/api/expenses', formData, {
  headers: {
    Authorization: `Bearer ${token}`
    // Don't set Content-Type - axios sets it!
  }
});
```

### Get Expenses
```javascript
const response = await axios.get('/api/expenses', {
  headers: { Authorization: `Bearer ${token}` }
});

// Returns:
// {
//   success: true,
//   expenses: [
//     {
//       id, user_id, company_id, amount, category,
//       description, expense_type, receipt_path,
//       expense_date, created_at, updated_at
//     }
//   ]
// }
```

### Delete Expense
```javascript
await axios.delete(`/api/expenses/${id}`, {
  headers: { Authorization: `Bearer ${token}` }
});
// Files auto-deleted from disk
```

---

## Key Implementation Details

### File Upload
- **Handler:** Multer middleware in `POST /api/expenses`
- **Storage:** `./uploads/receipts/` (auto-created)
- **Naming:** `{timestamp}-{userId}-{originalFilename}`
- **Limits:** 5MB max, JPG/PNG/PDF only
- **Access:** `/uploads/receipts/{filename}`

### Expense Type
- **Database:** `VARCHAR(20)` in expenses table
- **Values:** `'work'` or `'personal'`
- **Default:** `'work'`
- **UI:** Two buttons with icons in ExpenseEntryModal

### Company Isolation
- **Filtering:** All expenses queried with `company_id`
- **User Field:** `current_company_id` from auth token
- **Multi-tenant:** Each company sees only their expenses

---

## Common Code Snippets

### Validate File on Frontend
```javascript
const validateFile = (file) => {
  if (file.size > 5 * 1024 * 1024) {
    return 'File must be less than 5MB';
  }
  
  const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!validTypes.includes(file.type)) {
    return 'Only JPG, PNG, or PDF allowed';
  }
  
  return null; // Valid
};
```

### Download Receipt
```javascript
const downloadReceipt = (receiptPath) => {
  const fullUrl = `http://localhost:5000${receiptPath}`;
  window.open(fullUrl, '_blank');
};
```

### Filter Expenses by Type
```javascript
const workExpenses = expenses.filter(e => e.expense_type === 'work');
const personalExpenses = expenses.filter(e => e.expense_type === 'personal');
```

---

## Testing Scenarios

### Test 1: Basic Upload
```javascript
// Add expense with receipt
// Verify file saved to uploads/receipts/
// Verify path in database
// ✅ File accessible at /uploads/receipts/{filename}
```

### Test 2: Type Grouping
```javascript
// Add 2 work + 2 personal expenses
// View expenses
// ✅ Shows Work section with 2 items
// ✅ Shows Personal section with 2 items
// ✅ Totals calculated correctly
```

### Test 3: File Validation
```javascript
// Try upload: .exe file → ❌ Error
// Try upload: 10MB file → ❌ Error
// Try upload: valid PDF → ✅ Success
```

### Test 4: Company Isolation
```javascript
// Add expense to Company A
// Switch to Company B
// View expenses → ❌ Don't see Company A expense
// Switch back to A → ✅ See expense again
```

---

## Debugging Tips

### File Not Saving?
```javascript
// Check:
// 1. uploads/receipts/ directory exists
// 2. File is valid type (JPG, PNG, PDF)
// 3. File < 5MB
// 4. Backend server.js has: app.use('/uploads', express.static('uploads'))
// 5. Multer configuration correct in routes/expenses.js
```

### Receipt URL Not Working?
```javascript
// Check:
// 1. receipt_path in database looks like: /uploads/receipts/filename
// 2. File actually exists in ./uploads/receipts/
// 3. Accessing: http://localhost:5000/uploads/receipts/{filename}
// 4. Server is running and /uploads static route enabled
```

### Expenses Not Filtering by Company?
```javascript
// Check:
// 1. GET /api/expenses uses company_id from req.user.current_company_id
// 2. User selected a company (check localStorage selectedCompanyId)
// 3. Database has expenses with matching company_id
// 4. ExpensesManager receives selectedCompanyId prop
```

---

## Database Queries

### Check Expense with Receipt
```sql
SELECT id, amount, category, expense_type, receipt_path 
FROM expenses 
WHERE receipt_path IS NOT NULL 
LIMIT 5;
```

### Check File Integrity
```sql
SELECT id, receipt_path, company_id 
FROM expenses 
WHERE receipt_path IS NOT NULL 
ORDER BY created_at DESC;
```

### Check by Type
```sql
SELECT expense_type, COUNT(*) as count, SUM(amount) as total
FROM expenses
WHERE user_id = 1
GROUP BY expense_type;
```

---

## Configuration Checklist

Before running:
- [ ] Backend: `npm install` (installs multer)
- [ ] Frontend: Has lucide-react (Briefcase, User icons)
- [ ] Database: migrate.js includes expense_type and receipt_path
- [ ] Environment: DATABASE_URL configured
- [ ] Ports: Backend 5000, Frontend 3000

---

## Performance Notes

### File Upload
- **Time:** Usually < 1 second for receipts
- **Network:** Multipart upload slightly larger than JSON
- **Disk:** 5MB limit prevents abuse

### Expense Queries
- **Speed:** Fast with company_id indexing
- **Load:** Filters at database level (efficient)

### File Serving
- **Speed:** Express static middleware very fast
- **Caching:** Consider enabling browser caching
- **CDN:** Optional for production

---

## Security Checklist

- ✅ File type validation (MIME check)
- ✅ File size limits (5MB)
- ✅ User ID in filename
- ✅ Company isolation enforced
- ✅ Authentication required
- ✅ Error cleanup implemented
- ⚠️ Consider: File access control (not currently auth-protected)

---

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `ENOENT: no such file or directory` | uploads dir missing | Restart server (auto-creates) |
| `Invalid file type` | Wrong file format | Use JPG, PNG, or PDF |
| `File too large` | File > 5MB | Reduce file size |
| `Cannot find receipts` | Static route missing | Check server.js line 18 |
| `404 on receipt URL` | File not saved | Check multer setup |
| `undefined expense_type` | Field not sent | Ensure form includes it |
| `Receipt not showing` | Wrong path in DB | Check database record |

---

## Quick Start for New Developers

1. **Read:** EXPENSE_RECEIPT_IMPLEMENTATION.md
2. **Review:** ExpenseEntryModal.js (see form structure)
3. **Review:** ExpensesManager.js (see display logic)
4. **Review:** routes/expenses.js (see backend logic)
5. **Test:** Add expense with receipt
6. **Verify:** File saved to uploads/receipts/
7. **Check:** Path in database
8. **Access:** via /uploads/receipts/{filename}

---

## Module Exports

```javascript
// Frontend components export as default
export default function ExpenseEntryModal() { ... }
export default function ExpensesManager() { ... }

// Backend routes export as default
export default router;

// Can be imported as:
import ExpenseEntryModal from './ExpenseEntryModal';
import ExpensesManager from './ExpensesManager';
import expensesRoutes from './routes/expenses.js';
```

---

## Useful Commands

```bash
# Backend
cd backend
npm install              # Install dependencies
npm start               # Start server
npm run dev             # Start with nodemon
node migrate.js         # Run migrations (or auto on startup)

# Frontend
cd frontend
npm start               # Start React dev server
npm run build           # Build for production

# Database (psql)
SELECT * FROM expenses WHERE receipt_path IS NOT NULL;
SELECT COUNT(*) FROM expenses WHERE expense_type = 'work';
```

---

## Documentation Files

| File | Purpose |
|------|---------|
| EXPENSE_RECEIPT_IMPLEMENTATION.md | Technical deep dive |
| EXPENSE_API_DOCUMENTATION.md | API endpoint reference |
| IMPLEMENTATION_COMPLETE.md | Status & testing guide |
| FEATURE_VISUAL_SUMMARY.md | Workflows & diagrams |
| FINAL_IMPLEMENTATION_CHECKLIST.md | Complete checklist |
| QUICK_REFERENCE.md | This file |

---

**Last Updated:** January 2024
**Status:** Ready for Use
**Questions?** Check the appropriate documentation file above.
