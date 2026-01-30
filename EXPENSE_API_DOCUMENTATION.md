# Expense API Documentation

## Endpoints

### Get All Expenses
**GET** `/api/expenses`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "expenses": [
    {
      "id": 1,
      "user_id": 1,
      "company_id": 1,
      "amount": 25.50,
      "category": "Food",
      "description": "Team lunch",
      "expense_type": "work",
      "receipt_path": "/uploads/receipts/1704067200000-1-receipt.pdf",
      "expense_date": "2024-01-01T12:00:00.000Z",
      "created_at": "2024-01-01T12:00:00.000Z",
      "updated_at": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

---

### Create Expense with Receipt
**POST** `/api/expenses`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body (multipart/form-data):**
```
amount: 25.50
category: Food
description: Team lunch
expense_type: work
receipt: <FILE>
```

**JavaScript Example:**
```javascript
const formData = new FormData();
formData.append('amount', '25.50');
formData.append('category', 'Food');
formData.append('description', 'Team lunch');
formData.append('expense_type', 'work');
formData.append('receipt', fileInput.files[0]); // file object

const response = await axios.post('/api/expenses', formData, {
  headers: {
    Authorization: `Bearer ${token}`
    // Don't set Content-Type - axios will set it with boundary
  }
});
```

**Success Response (201):**
```json
{
  "success": true,
  "expense": {
    "id": 1,
    "user_id": 1,
    "company_id": 1,
    "amount": 25.50,
    "category": "Food",
    "description": "Team lunch",
    "expense_type": "work",
    "receipt_path": "/uploads/receipts/1704067200000-1-receipt.pdf",
    "expense_date": "2024-01-01T12:00:00.000Z",
    "created_at": "2024-01-01T12:00:00.000Z",
    "updated_at": "2024-01-01T12:00:00.000Z"
  },
  "message": "Expense added successfully"
}
```

**Error Responses:**

**400 - Invalid amount:**
```json
{
  "success": false,
  "error": "Amount must be greater than 0"
}
```

**400 - Invalid file type:**
```json
{
  "success": false,
  "error": "Invalid file type. Only JPG, PNG, or PDF are allowed."
}
```

**400 - File too large:**
```json
{
  "success": false,
  "error": "File too large"
}
```

---

### Get Single Expense
**GET** `/api/expenses/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "expense": {
    "id": 1,
    "user_id": 1,
    "company_id": 1,
    "amount": 25.50,
    "category": "Food",
    "description": "Team lunch",
    "expense_type": "work",
    "receipt_path": "/uploads/receipts/1704067200000-1-receipt.pdf",
    "expense_date": "2024-01-01T12:00:00.000Z",
    "created_at": "2024-01-01T12:00:00.000Z",
    "updated_at": "2024-01-01T12:00:00.000Z"
  }
}
```

---

### Update Expense
**PUT** `/api/expenses/:id`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "amount": 30.00,
  "category": "Transport",
  "description": "Updated description"
}
```

**Note:** `expense_type` and `receipt_path` cannot be updated through this endpoint. To change receipt, delete and recreate.

**Success Response:**
```json
{
  "success": true,
  "expense": {
    "id": 1,
    "user_id": 1,
    "company_id": 1,
    "amount": 30.00,
    "category": "Transport",
    "description": "Updated description",
    "expense_type": "work",
    "receipt_path": "/uploads/receipts/1704067200000-1-receipt.pdf",
    "expense_date": "2024-01-01T12:00:00.000Z",
    "created_at": "2024-01-01T12:00:00.000Z",
    "updated_at": "2024-01-01T12:30:00.000Z"
  },
  "message": "Expense updated successfully"
}
```

---

### Delete Expense
**DELETE** `/api/expenses/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Expense deleted successfully"
}
```

**Note:** Receipt file is automatically deleted from disk when expense is deleted.

**Error Response (404):**
```json
{
  "success": false,
  "error": "Expense not found"
}
```

---

### Get Expense Summary
**GET** `/api/expenses/summary`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "total": 150.50,
    "byType": {
      "work": 100.00,
      "personal": 50.50
    }
  },
  "byCategory": [
    {
      "category": "Food",
      "total": 75.25,
      "count": 3
    },
    {
      "category": "Transport",
      "total": 50.00,
      "count": 2
    },
    {
      "category": "Tools",
      "total": 25.25,
      "count": 1
    }
  ]
}
```

---

## File Upload Details

### Supported File Types
- JPEG (.jpg, .jpeg)
- PNG (.png)
- PDF (.pdf)

### Constraints
- **Max file size:** 5 MB
- **Storage location:** `backend/uploads/receipts/`
- **File naming:** `{timestamp}-{userId}-{originalName}`
- **Access URL:** `/uploads/receipts/{filename}`

### Example File Path
```
Uploaded: my-receipt.pdf by user 5
Stored as: 1704067200000-5-my-receipt.pdf
Access URL: http://localhost:5000/uploads/receipts/1704067200000-5-my-receipt.pdf
```

---

## Expense Types

### Supported Types
- **work** - Expense related to work/business
- **personal** - Personal expense

### Default
- Defaults to 'work' if not specified

---

## Categories

### Standard Categories
- Food
- Transport
- Tools
- Software
- Other

---

## Request Examples

### cURL Examples

**Create Expense with Receipt:**
```bash
curl -X POST http://localhost:5000/api/expenses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "amount=25.50" \
  -F "category=Food" \
  -F "description=Team lunch" \
  -F "expense_type=work" \
  -F "receipt=@/path/to/receipt.pdf"
```

**Get All Expenses:**
```bash
curl -X GET http://localhost:5000/api/expenses \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Delete Expense:**
```bash
curl -X DELETE http://localhost:5000/api/expenses/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Error Handling

### Common Errors

| Status | Error | Solution |
|--------|-------|----------|
| 400 | Invalid category | Use one of: Food, Transport, Tools, Software, Other |
| 400 | Amount must be greater than 0 | Provide a positive amount |
| 400 | Invalid file type | Upload JPG, PNG, or PDF only |
| 400 | File too large | Keep file under 5 MB |
| 401 | Unauthorized | Provide valid authorization token |
| 404 | Expense not found | Verify expense ID exists |
| 500 | Failed to create expense | Check server logs |

---

## Multi-Tenant Considerations

- All expenses are automatically associated with the user's current company (`company_id`)
- Users can only view/manage expenses for their selected company
- Receipt files are stored with user ID to maintain isolation
- Company-based filtering happens on the backend

---

## Receipt Access

### Direct Download
```
GET /uploads/receipts/{filename}
```

### In Frontend
```javascript
const fullUrl = `${API_BASE}/uploads/receipts/${filename}`;
window.open(fullUrl, '_blank');
```

### Behind Authentication
Receipt files are served statically and are not protected by authentication. 
Consider implementing access control if needed for sensitive data.
