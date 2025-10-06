# 🚀 Quick Start - Testing Admin Management

## Immediate Setup (5 minutes)

### 1. **Ensure Collections Exist**
In [Juno Console](https://console.juno.build/):
- ✅ `admins` collection  
- ✅ `admin_requests` collection (NEW)
- ✅ `platform_activities` collection

All should be **Document** type with **Controllers only** permissions.

### 2. **Start Development Server**
```bash
npm run dev
```

### 3. **Sign In & Access Admin**
1. Navigate to: `http://localhost:3000/auth`
2. Sign in with Internet Identity
3. Go to: `http://localhost:3000/admin`

## 🎭 Testing Different Roles

### **Role Switcher (Development Only)**
- **Yellow button** appears in top-right corner
- Click to expand and **switch between roles**
- Page refreshes automatically after role change

### **Available Test Roles:**
- 🏛️ **Platform Admin**: Full access + approve admin requests
- 🛡️ **Compliance Officer**: Create admin requests + approve causes  
- 🕌 **Waqf Manager**: Create/edit causes + manage waqfs
- 💰 **Finance Officer**: Financial reports + audit access
- 🛡️ **Content Moderator**: Content moderation + user support
- 🎧 **Support Agent**: Basic user support only

## 🧪 Test Scenarios

### **Scenario 1: Admin Request Workflow**

**Step 1 - As Compliance Officer:**
1. Switch to "🛡️ Compliance Officer" role
2. Go to Admin → Users → **Admin Requests** tab
3. Click "✨ Create Admin Request"
4. Fill in test data:
   - User ID: `test-user-123`
   - Name: `Test User`
   - Email: `test@example.com`
   - Role: `Waqf Manager`
   - Reason: `Testing admin request workflow`
5. Submit request

**Step 2 - As Platform Admin:**
1. Switch to "🏛️ Platform Admin" role
2. Stay on Admin Requests tab (or refresh)
3. See the **pending request** card
4. Click "✅ Approve" or "❌ Reject"
5. Verify the request status changes

### **Scenario 2: Permission Restrictions**

**As Waqf Manager:**
1. Switch to "🕌 Waqf Manager" role  
2. Go to Admin → Users → Administrators tab
3. **Verify**: Cannot add admins directly (shows workflow guidance)
4. Go to Admin → Causes
5. **Verify**: Can create/edit causes

**As Support Agent:**
1. Switch to "🎧 Support Agent" role
2. Go to Admin → Users  
3. **Verify**: View-only access message
4. **Verify**: No admin request tab visible

### **Scenario 3: Cause Approval Workflow**

**As Waqf Manager:**
1. Switch to "🕌 Waqf Manager" role
2. Go to Admin → Causes
3. Create a new cause
4. **Verify**: Cause starts as "Pending" + inactive

**As Compliance Officer:**
1. Switch to "🛡️ Compliance Officer" role
2. Go to Admin → Causes  
3. Find the pending cause
4. **Verify**: Can approve/reject the cause

## 🔍 Verification Points

### **UI Elements Should Show/Hide Based on Role:**
- ✅ Buttons appear only for authorized users
- ✅ Tabs visible based on permissions  
- ✅ Different messaging for each role
- ✅ No access errors when unauthorized

### **Data Persistence:**
- ✅ Admin requests saved in `admin_requests` collection
- ✅ Activity logged in `platform_activities`
- ✅ Role switching persists until page refresh
- ✅ Approved requests actually create admin users

### **Permission Enforcement:**
- ✅ Functions check permissions before execution
- ✅ Server-side validation prevents unauthorized actions
- ✅ Clear error messages for permission failures

## 🛠️ Development Tools

### **Browser Console Commands:**
```javascript
// Check current role override
localStorage.getItem('dev-role-override')

// Clear role override
localStorage.removeItem('dev-role-override')

// Check all localStorage data
Object.keys(localStorage).forEach(key => 
  console.log(key, localStorage.getItem(key))
)
```

### **Network Tab Verification:**
- Watch for Juno API calls to collections
- Verify permission checks in function calls
- Check for proper error responses

## 🚨 Common Issues & Solutions

### **Collections Not Found:**
```bash
Error: Collection 'admin_requests' not found
```
**Solution**: Create missing collection in Juno Console

### **Permission Denied:**
```bash  
Error: Permission denied
```
**Solution**: Verify role override is set correctly in localStorage

### **Role Switcher Not Visible:**
**Solution**: Ensure `NODE_ENV=development` (default with `npm run dev`)

### **Functions Not Working:**
**Solution**: Clear localStorage and refresh page

## ⚡ Quick Reset

If something breaks during testing:

1. **Clear browser data**: `localStorage.clear()` in console
2. **Refresh page**: `Ctrl+R` or `Cmd+R`
3. **Restart server**: Stop and run `npm run dev` again
4. **Clear collections**: Use Juno Console if needed

## 🎯 Success Criteria

You should be able to:

- ✅ **Switch roles** smoothly with the role switcher
- ✅ **Create admin requests** as Compliance Officer  
- ✅ **Approve/reject requests** as Platform Admin
- ✅ **See different UIs** for different roles
- ✅ **Test cause approval** workflow
- ✅ **Verify activity logging** in admin panel
- ✅ **Access appropriate features** per role

This setup lets you test the complete admin management system without needing multiple accounts or complex data setup!