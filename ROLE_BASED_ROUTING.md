# Role-Based Authentication & Routing

## Overview
The Waqf Protocol now implements role-based authentication that automatically redirects users to their appropriate dashboard based on their role.

## User Roles

### 1. **Admin**
- **Role**: `admin`
- **Dashboard**: `/admin`
- **Access**: Full platform administration
- **Identification**: Determined by `user.owner` property (owners are admins)

### 2. **Waqf Creator** (Regular User)
- **Role**: `user` (or no special role)
- **Dashboard**: `/waqf`
- **Access**: Create and manage personal Waqf endowments
- **Identification**: Any authenticated user who is not an admin

## Routing Logic

### Homepage (`/`)
When a user visits the homepage:
```
Unauthenticated → Shows landing page (Hero, Features, etc.)
Authenticated + Admin → Redirects to /admin
Authenticated + Waqf Creator → Redirects to /waqf
```

### Authentication Page (`/auth`)
After successful login:
```
Admin user → Redirects to /admin
Waqf Creator → Redirects to /waqf
```

### Admin Dashboard (`/admin`)
Protected route for admins only:
```
Unauthenticated → Redirects to /auth
Waqf Creator → Redirects to /waqf
Admin → Shows admin dashboard
```

### Waqf Dashboard (`/waqf`)
Protected route for waqf creators:
```
Unauthenticated → Redirects to /auth
Admin → Redirects to /admin
Waqf Creator → Shows waqf dashboard
```

## Implementation Details

### Files Modified

1. **`src/app/page.tsx`**
   - Added role-based redirect logic
   - Checks `isAdmin` flag to determine redirect path

2. **`src/components/auth/AuthSection.tsx`**
   - Automatically redirects after successful authentication
   - Uses `useRouter` to navigate based on role

3. **`src/hooks/useAdminCheck.ts`**
   - Protects admin routes
   - Redirects non-admin users to `/waqf`
   - Redirects unauthenticated users to `/auth`

4. **`src/hooks/useWaqfCreatorCheck.ts`** (NEW)
   - Protects waqf creator routes
   - Redirects admin users to `/admin`
   - Redirects unauthenticated users to `/auth`

5. **`src/app/waqf/page.tsx`**
   - Added `useWaqfCreatorCheck` hook
   - Prevents admin users from accessing waqf dashboard

### Role Detection

Role is determined in `AuthContext.tsx`:
```typescript
role: user.owner ? 'admin' : 'user'
```

- **Admin**: `user.owner === true`
- **Waqf Creator**: `user.owner === false` or `undefined`

## Security Features

✅ **Route Protection**: All dashboards are protected by role checks
✅ **Automatic Redirects**: Users are automatically sent to correct dashboard
✅ **Loading States**: Proper loading indicators during role checks
✅ **Error Handling**: Graceful error messages for unauthorized access

## User Flow Examples

### New User (Waqf Creator)
1. Visits homepage → sees landing page
2. Clicks "Get Started" → goes to `/auth`
3. Authenticates with Internet Identity
4. **Automatically redirected to `/waqf`**
5. Can create and manage their Waqf endowments

### Admin User
1. Visits homepage → sees landing page
2. Clicks "Sign In" → goes to `/auth`
3. Authenticates with Internet Identity (admin account)
4. **Automatically redirected to `/admin`**
5. Can manage platform, users, and all Waqfs

### Returning User
- Admin: Visiting any page → redirected to `/admin`
- Waqf Creator: Visiting any page → redirected to `/waqf`

## Testing Checklist

- [ ] Admin user logs in → redirects to `/admin`
- [ ] Waqf creator logs in → redirects to `/waqf`
- [ ] Admin tries to access `/waqf` → redirects to `/admin`
- [ ] Waqf creator tries to access `/admin` → redirects to `/waqf`
- [ ] Unauthenticated user tries `/admin` → redirects to `/auth`
- [ ] Unauthenticated user tries `/waqf` → redirects to `/auth`
- [ ] Homepage shows landing page when not authenticated
- [ ] Homepage redirects authenticated users to correct dashboard

## Admin Management

To make a user an admin, they need to be set as an "owner" in the Juno platform. This is typically done through:
1. Juno Console (for the platform owner)
2. Admin management interface (for super admins)
3. Direct database/canister management (for development)

## Benefits

1. **Better UX**: Users see relevant content immediately
2. **Security**: Role-based access control enforced
3. **Clarity**: Clear separation between admin and user functions
4. **Scalability**: Easy to add more roles in the future
5. **Maintainability**: Centralized role checking logic

## Future Enhancements

Potential additions:
- More granular roles (e.g., "viewer", "editor", "manager")
- Permission-based access control
- Custom role assignment interface
- Role-based feature flags
- Audit logging for role changes
