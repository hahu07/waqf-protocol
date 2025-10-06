# Development Testing Guide - Admin Management Workflow

## 🚀 Quick Setup for Development Testing

### 1. **Start Development Server**
```bash
npm run dev
```

### 2. **Access Admin Panel**
1. Navigate to `http://localhost:3000/auth`
2. Sign in with Internet Identity
3. Go to `http://localhost:3000/admin`

### 3. **Initial Admin Setup (First Time Only)**

Since you need admin access to test everything, we need to bootstrap your user as a Platform Admin. You have two options:

#### Option A: Direct Database Setup (Recommended)
1. **Get Your User ID**: After signing in, check the browser console or network tab for your user ID
2. **Add yourself as Platform Admin**: Use Juno Console or create a script

#### Option B: Development Admin Override (Quick Solution)
Add a development bypass in the code temporarily.

Let me create the development setup script:

## 🧪 Development Admin Bootstrap Script

### Create Development Setup File
Create `scripts/dev-setup.js`:

```javascript
// scripts/dev-setup.js
import { initSatellite } from '@junobuild/core';
import { addAdminDirectly } from '../src/lib/admin-utils.js';

// Your satellite configuration
const satellite = {
  satelliteId: process.env.NEXT_PUBLIC_SATELLITE_ID
};

async function setupDevAdmin() {
  try {
    await initSatellite(satellite);
    
    // Replace with your actual user ID from Internet Identity
    const YOUR_USER_ID = 'your-internet-identity-user-id';
    const YOUR_NAME = 'Developer Admin';
    const YOUR_EMAIL = 'dev@example.com';
    
    // Add yourself as Platform Admin with all permissions
    await addAdminDirectly(
      YOUR_USER_ID,
      'system', // created by system
      'platform_admin',
      YOUR_EMAIL,
      YOUR_NAME,
      [
        'platform_governance',
        'system_administration', 
        'admin_request_approval',
        'admin_request_creation',
        'audit_compliance',
        'financial_oversight',
        'waqf_management',
        'cause_management',
        'cause_approval',
        'content_moderation',
        'user_support'
      ]
    );
    
    console.log('✅ Development admin setup complete!');
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupDevAdmin();
```

## 🎭 Role Testing Strategy

### Method 1: Multiple Internet Identity Accounts
1. **Create separate II accounts** for each role you want to test
2. **Add each account** with different roles via the admin panel
3. **Switch between browser profiles** or incognito windows

### Method 2: Role Switching Component (Development Only)
Create a development role switcher:

```typescript
// src/components/dev/RoleSwitcher.tsx (Development Only)
'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import type { AdminRole } from '@/lib/admin-utils';

const DEV_ROLES: { role: AdminRole; label: string }[] = [
  { role: 'platform_admin', label: '🏛️ Platform Admin' },
  { role: 'compliance_officer', label: '🛡️ Compliance Officer' },
  { role: 'waqf_manager', label: '🕌 Waqf Manager' },
  { role: 'finance_officer', label: '💰 Finance Officer' },
  { role: 'content_moderator', label: '🛡️ Content Moderator' },
  { role: 'support_agent', label: '🎧 Support Agent' }
];

export function DevRoleSwitcher() {
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState<AdminRole>('platform_admin');

  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null;

  const handleRoleSwitch = async (role: AdminRole) => {
    setSelectedRole(role);
    // Update user's role in localStorage for testing
    localStorage.setItem('dev-role-override', role);
    window.location.reload(); // Refresh to apply changes
  };

  return (
    <div className="fixed top-4 right-4 bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 shadow-lg z-50">
      <div className="text-xs font-semibold text-yellow-800 mb-2">
        🧪 DEV MODE - Role Switcher
      </div>
      <select
        value={selectedRole}
        onChange={(e) => handleRoleSwitch(e.target.value as AdminRole)}
        className="text-xs p-1 border rounded"
      >
        {DEV_ROLES.map(({ role, label }) => (
          <option key={role} value={role}>{label}</option>
        ))}
      </select>
    </div>
  );
}
```

### Method 3: Development Permission Override
Add this to your auth utilities for development:

```typescript
// Add to src/lib/admin-utils.ts (Development Override)
const getDevPermissions = (role: AdminRole): AdminPermission[] => {
  if (process.env.NODE_ENV !== 'development') return [];
  
  const devRoleOverride = localStorage.getItem('dev-role-override') as AdminRole;
  if (devRoleOverride) {
    return ROLE_PERMISSIONS[devRoleOverride];
  }
  return [];
};

// Modify hasPermission function for development
export const hasPermission = async (
  userId: string,
  permission: AdminPermission
): Promise<boolean> => {
  // Development override
  if (process.env.NODE_ENV === 'development') {
    const devPermissions = getDevPermissions('platform_admin'); // Default to platform admin in dev
    if (devPermissions.includes(permission)) return true;
  }

  try {
    const admin = await getDoc<AdminUser>({
      collection: ADMIN_COLLECTION,
      key: userId
    });
    return admin?.data?.permissions?.includes(permission) || false;
  } catch (error) {
    console.error('Failed to check permissions:', error);
    return false;
  }
};
```

## 📋 Testing Checklist

### 1. **Platform Admin Testing**
- [ ] Can directly add/remove admins
- [ ] Can approve/reject admin requests  
- [ ] Can create admin requests (optional)
- [ ] Has access to all admin panels
- [ ] Can see all permissions in AddAdminForm

### 2. **Compliance Officer Testing**
- [ ] Cannot directly add/remove admins
- [ ] Can create admin add/remove requests
- [ ] Cannot approve own requests
- [ ] Can approve/reject causes
- [ ] Has limited admin panel access

### 3. **Other Roles Testing**
- [ ] **Waqf Manager**: Can create/edit causes, view-only admin access
- [ ] **Finance Officer**: Financial reports access, no admin changes
- [ ] **Content Moderator**: Content only, no admin access
- [ ] **Support Agent**: Basic support, minimal permissions

### 4. **Admin Request Workflow Testing**
- [ ] Create add admin request as Compliance Officer
- [ ] Verify request appears in Platform Admin view
- [ ] Approve request as Platform Admin
- [ ] Verify admin was actually added
- [ ] Test rejection workflow
- [ ] Verify activity logging

### 5. **UI Permission Testing**
- [ ] Buttons show/hide based on permissions
- [ ] Tab visibility based on roles
- [ ] Error messages for unauthorized actions
- [ ] Role-specific messaging and guidance

## 🛠️ Development Commands

### Reset Development Data
```bash
# Clear local storage (in browser console)
localStorage.clear();

# Restart development server
npm run dev
```

### Quick Admin Check
```javascript
// Browser console - check your current permissions
const user = JSON.parse(localStorage.getItem('auth-user') || '{}');
console.log('User ID:', user.key);
console.log('Admin Status:', user.isAdmin);
```

### Test Collections Setup
```bash
# Make sure these collections exist in Juno:
# - admins
# - admin_requests  
# - platform_activities
# - cause_images
# - causes
# - waqfs
```

## 🚨 Important Development Notes

1. **Environment Variables**: Ensure `NEXT_PUBLIC_SATELLITE_ID` is set
2. **Juno Collections**: All required collections must be created first
3. **Internet Identity**: Use same II account for consistency during testing
4. **Data Persistence**: Development data persists in Juno collections
5. **Clean Reset**: Use Juno Console to clear collections if needed

## 📱 Mobile Testing
```bash
# Test on mobile devices
npm run dev -- --host 0.0.0.0
# Then access via your local IP: http://192.168.x.x:3000
```

## 🔄 Quick Development Cycle

1. **Sign in** with Internet Identity
2. **Bootstrap** yourself as Platform Admin (one-time setup)
3. **Create test users** with different roles
4. **Test workflows** by switching between accounts/roles
5. **Verify UI** shows/hides elements correctly
6. **Test request workflow** end-to-end
7. **Check activity logs** for proper tracking

This setup gives you full control over all roles and permissions during development while maintaining the security model for production.