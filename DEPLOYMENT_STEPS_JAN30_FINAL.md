# TimeTracker Enterprise Features - Deployment Guide
## January 30, 2026 - Final Integration Complete

---

## 🎯 What's Been Done

### ✅ All Integration Complete!

**Frontend Components Integrated:**
- CompanySelector modal added to ModernDashboard
- MessagePreview modal added to ModernDashboard  
- Locked state UI implemented in ClockInDashboard
- Company selection state management with localStorage
- Selected company display banner
- "Generate Timesheet" button added to menu
- All buttons disabled until company is selected

**Backend Services Ready:**
- Fortnightly calculation utilities (14-day cycles)
- Message generator (text + HTML templates)
- SMTP email service (nodemailer)
- 4 new API endpoints for timesheets
- Database schema updates ready

**Files Modified:**
- `frontend/src/components/ModernDashboard.js` - Company selection & message preview integration
- `frontend/src/components/ClockInDashboard.js` - Locked state UI & company display
- `frontend/src/components/CompanySelector.js` - Modal wrapper added
- `frontend/src/components/CompanySelector.css` - Modal overlay styles
- `backend/services/messageGenerator.js` - Fixed function name typo
- `backend/routes/fortnightly.js` - Fixed import/calls

---

## 📋 Pre-Deployment Checklist

### Local Testing
- [ ] Run `npm install` in backend folder (installs nodemailer)
- [ ] Test company creation in UI
- [ ] Test company selection (UI should unlock)
- [ ] Test locked state (no company = disabled buttons)
- [ ] Test clock in/out with company selected
- [ ] Test fortnight summary generation
- [ ] Test message preview modal
- [ ] Configure SMTP settings in UI
- [ ] Test email sending

### Backend Dependencies
```bash
cd backend
npm install
# This will install nodemailer ^6.9.7
```

---

## 🚀 Production Deployment

### Step 1: Commit and Push Changes
```bash
# On Windows (your local machine)
cd "c:\VS Projects\TimeTracker"

git add .
git commit -m "feat: integrate enterprise features - company workflow, fortnightly timesheets, email generation

- Added CompanySelector modal to dashboard with forced selection
- Added MessagePreview modal for timesheet generation
- Implemented locked UI state (disabled until company selected)
- Updated ClockInDashboard with company display and lock warning
- Fixed messageGenerator function name typo
- All time entries now require company selection
- Added 'Generate Timesheet' menu button
- Company selection persists in localStorage
- Current company syncs with backend on selection"

git push origin main
```

### Step 2: Deploy to Ubuntu Server
```bash
# SSH into your server
ssh shah@192.168.1.155

# Navigate to project
cd /home/shah/TimeTracker

# Pull latest changes
git pull origin main

# Install backend dependencies
cd backend
npm install
# This installs nodemailer

# Go to docker folder
cd ../docker

# Rebuild and restart containers
docker-compose down
docker-compose up -d --build

# Wait 30 seconds for containers to start
sleep 30

# Run database migrations (creates email_log table, updates companies)
docker exec timetracker-api node migrate.js
```

### Step 3: Verify Deployment
```bash
# Check containers are running
docker ps

# Should see:
# - timetracker-frontend (port 3000)
# - timetracker-api (port 5000)
# - timetracker-db (port 5432)

# Check backend logs
docker logs timetracker-api --tail 50

# Check frontend logs
docker logs timetracker-frontend --tail 50

# Check database connection
docker exec timetracker-db psql -U timetracker_user -d timetracker_db -c "\dt"

# Verify email_log table exists
docker exec timetracker-db psql -U timetracker_user -d timetracker_db -c "SELECT * FROM email_log LIMIT 1;"

# Verify companies table updated
docker exec timetracker-db psql -U timetracker_user -d timetracker_db -c "\d companies"
```

### Step 4: Test Production Features

**Access the app:**
```
http://192.168.1.155:3000
```

**Test Flow:**
1. **Login** to TimeTracker
2. **CompanySelector Modal** should appear automatically (if no company selected)
3. **Create a company:**
   - Name: Test Company
   - Pay Rate: 50
   - Manager Email: manager@test.com
4. **Company is selected** - UI unlocks
5. **Clock In** - Button should now work
6. **Clock Out** after a few seconds
7. **Open Menu** → Click "Generate Timesheet"
8. **MessagePreview Modal** appears with 3 tabs:
   - Preview: HTML email preview
   - Edit: Editable text version
   - Send: Email form
9. **Configure Email Settings:**
   - Menu → Email Settings
   - Enter SMTP details (use Gmail, Mailtrap, or SendGrid)
   - Test connection
10. **Send Email** from MessagePreview Send tab
11. **Check email_log table:**
    ```bash
    docker exec timetracker-db psql -U timetracker_user -d timetracker_db -c "SELECT * FROM email_log;"
    ```

---

## 🔧 Configuration

### SMTP Settings (Required for Email Features)

**Gmail (Recommended for testing):**
```
Host: smtp.gmail.com
Port: 587
Username: your-email@gmail.com
Password: [App Password - not regular password]
TLS: Enabled
```

**Mailtrap (For testing):**
```
Host: smtp.mailtrap.io
Port: 587
Username: [from mailtrap.io]
Password: [from mailtrap.io]
TLS: Enabled
```

**SendGrid (For production):**
```
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: [Your SendGrid API Key]
TLS: Enabled
```

### Environment Variables (Optional)
Add to `docker/docker-compose.yml` if you want pre-configured SMTP:
```yaml
environment:
  - SMTP_HOST=smtp.gmail.com
  - SMTP_PORT=587
  - SMTP_USER=your-email@gmail.com
  - SMTP_PASSWORD=your-app-password
```

---

## 🎨 User Experience Flow

### New User Journey:
1. **Register/Login** → Redirected to Dashboard
2. **CompanySelector Modal** appears (forced, can't close if locked)
3. **Red Warning:** "You must select a company to use TimeTracker"
4. **Create Company** → Form expands inline
5. **Company Created** → Auto-selected, UI unlocks
6. **Green Banner:** "Tracking for: [Company Name]"
7. **Clock In/Out** now enabled
8. **All features** (manual entries, expenses) now work

### Returning User Journey:
1. **Login** → Company remembered from localStorage
2. **Dashboard** → Clock In/Out immediately available
3. **Company Banner** shows current company
4. **Menu** → Can switch companies or generate timesheets

---

## 🐛 Troubleshooting

### Issue: "Company not selected" error when clocking in
**Solution:** 
- Ensure company is selected in UI
- Check browser console for errors
- Clear localStorage: `localStorage.clear()` in browser console
- Refresh page and select company again

### Issue: Email not sending
**Solutions:**
- Verify SMTP settings in UI
- Click "Test Connection" button
- Check docker logs: `docker logs timetracker-api`
- Check email_log table for error messages
- Gmail: Use App Password, not regular password
- Check spam folder

### Issue: CompanySelector modal won't close
**Solution:**
- This is by design when `isLocked=true` (no company selected)
- Select a company to close modal
- Once company is selected, `isLocked` becomes false

### Issue: Database migration didn't run
**Solution:**
```bash
docker exec timetracker-api node migrate.js
```

### Issue: nodemailer module not found
**Solution:**
```bash
docker exec -it timetracker-api sh
cd /app
npm install nodemailer
exit
docker-compose restart api
```

---

## 📊 Database Schema Changes

### New Table: email_log
```sql
CREATE TABLE email_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  company_id INTEGER REFERENCES companies(id),
  recipient TEXT NOT NULL,
  subject TEXT,
  status TEXT DEFAULT 'sent',
  sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### Updated Table: companies
```sql
ALTER TABLE companies 
  ADD COLUMN user_id INTEGER REFERENCES users(id),
  ADD COLUMN pay_rate DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN manager_email TEXT;
```

---

## 🎯 Feature Summary

### 1. Company-Based Workflow ✅
- **Gate:** All features locked until company selected
- **UI:** Modal appears on login if no company
- **Selection:** Persists across sessions (localStorage)
- **Display:** Green banner shows current company
- **Backend:** All time entries linked to company_id

### 2. Fortnightly Message Generator ✅
- **Calculation:** Auto-detects 14-day cycles (Mon-Sun)
- **Summary:** Groups time entries by fortnight
- **Format:** Professional text + HTML templates
- **Daily Breakdown:** Shows hours per day
- **Expenses:** Itemized expense list included
- **UI:** 3-tab modal (Preview, Edit, Send)

### 3. SMTP Email Sending ✅
- **Configuration:** Stored securely in database
- **Testing:** "Test Connection" button validates SMTP
- **Sending:** Professional HTML emails
- **Logging:** All emails recorded in email_log
- **Recipients:** Defaults to company manager email
- **Transporter:** Auto-initialized on settings save

---

## ✅ Post-Deployment Verification

```bash
# 1. Check all services running
docker ps | grep timetracker

# 2. Verify database tables
docker exec timetracker-db psql -U timetracker_user -d timetracker_db -c "\dt"

# 3. Test API endpoints
curl http://192.168.1.155:5000/api/fortnightly/sample

# 4. Check frontend build
curl http://192.168.1.155:3000

# 5. Monitor logs
docker logs -f timetracker-api
```

---

## 📞 Support & Next Steps

### If Everything Works:
✅ All enterprise features deployed successfully!  
✅ Users can now create companies, track time by company, and generate/email fortnightly timesheets.

### Next Enhancements (Future):
- Email queue system for background processing
- PDF timesheet attachments
- Custom email templates
- Bulk email sending
- Email open tracking
- Calendar integration (Google Calendar, Outlook)
- Mobile app (React Native)
- Multi-language support

---

## 🎉 Success Criteria

- [ ] Can create companies with pay rate and manager email
- [ ] UI locks when no company selected (red warning)
- [ ] UI unlocks after company selection (green banner)
- [ ] Clock in/out works with company_id
- [ ] Manual entries work with company_id
- [ ] Expenses work with company_id
- [ ] Can generate fortnightly summary
- [ ] HTML preview renders correctly in iframe
- [ ] Can edit message text
- [ ] Can copy message to clipboard
- [ ] Can configure SMTP settings
- [ ] SMTP connection test works
- [ ] Can send email from app
- [ ] Email received successfully
- [ ] email_log table records send

**All features implemented and tested = DEPLOYMENT SUCCESS! 🚀**

