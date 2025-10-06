# Admin Requests Collection Setup

## Required Collections for Admin Management

You need to ensure these collections exist in your Juno satellite:

### 1. **admin_requests** (NEW - for the admin request workflow)
```javascript
Collection ID: admin_requests
Type: Document
Permissions: 
  - Read: Controllers only
  - Write: Controllers only
```

### 2. **admins** (existing - for admin users)
```javascript
Collection ID: admins  
Type: Document
Permissions:
  - Read: Controllers only
  - Write: Controllers only
```

### 3. **platform_activities** (existing - for activity logging)
```javascript
Collection ID: platform_activities
Type: Document  
Permissions:
  - Read: Controllers only
  - Write: Controllers only
```

## Setup via Juno Console

1. **Go to Juno Console**: https://console.juno.build/
2. **Select your satellite**
3. **Navigate to Datastore**
4. **Click "Create Collection"**
5. **For each missing collection:**
   - Set Collection ID (exact names above)
   - Choose "Document" type
   - Set permissions to "Controllers only" for both read/write
   - Click Create

## Verification

Run this in your browser console after setting up:

```javascript
// Check if collections exist
import { listDocs } from '@junobuild/core';

const collections = ['admins', 'admin_requests', 'platform_activities'];

for (const collection of collections) {
  try {
    const result = await listDocs({ collection });
    console.log(`✅ ${collection}: ${result.items.length} documents`);
  } catch (error) {
    console.error(`❌ ${collection}: Missing or inaccessible`);
  }
}
```

## Quick Development Bootstrap

Once collections are set up, you can test immediately:

1. **Start development server**: `npm run dev`
2. **Sign in with Internet Identity**
3. **Use the Development Role Switcher** (yellow button in top-right)
4. **Switch between roles** to test different permissions
5. **Test the admin request workflow**:
   - Switch to "Compliance Officer"
   - Go to Admin → Users → Admin Requests
   - Create a test admin request
   - Switch to "Platform Admin" 
   - Approve/reject the request

## Development Features Active

✅ **Role Switcher**: Top-right yellow button for switching roles
✅ **Permission Override**: LocalStorage-based role simulation  
✅ **Always Admin**: All users have admin access in development
✅ **Activity Logging**: All actions are logged for testing
✅ **Real Collections**: Data persists in actual Juno collections

## Reset Development Data

If you need to clear test data:

1. **Browser**: Clear localStorage in dev tools
2. **Collections**: Use Juno Console to delete documents
3. **Server**: Restart with `npm run dev`

This setup allows you to test the complete admin management workflow without needing multiple Internet Identity accounts.