# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Core Development
```bash
# Start development server with Turbopack (fast)
npm run dev              # or npm run juno:dev

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint

# Format code with Prettier
npm run format
```

### Project Setup
```bash
# Install dependencies (includes auth worker setup)
npm install

# Start Juno emulator for local development
juno emulator start

# Deploy to Juno satellite
juno hosting deploy
```

### Testing Specific Components
```bash
# Run single test file (if tests exist)
npm test -- --testPathPattern="filename"

# Check build success
npm run build
```

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15 (App Router) with React 19 and TypeScript
- **Backend**: Juno (Internet Computer blockchain) with Rust satellite
- **Authentication**: Internet Identity (ICP native auth)
- **Styling**: Tailwind CSS with custom gradients and professional UI
- **State Management**: React Context + Custom Hooks
- **Data Layer**: Juno Datastore (NoSQL collections)

### High-Level Architecture

This is a **Waqf Protocol** - an Islamic endowment platform built on the Internet Computer. The architecture follows a multi-role system:

#### Core Roles
1. **Admin Role** (`/admin/*`): Platform administration, cause management, user oversight
2. **Waqf Creator Role** (`/waqf/*`): Personal endowment creation and management
3. **Public Interface** (`/`): Landing page and authentication

#### Data Architecture
The platform uses **6 Juno collections**:
- `waqfs` (Documents): Waqf endowment profiles
- `causes` (Documents): Charitable causes available for funding
- `donations` (Documents): Donation tracking and history  
- `allocations` (Documents): Investment return allocation records
- `admins` (Documents): Admin user management
- `cause_images` (Assets): Image storage for cause management

#### Authentication Flow
- **Internet Identity only** - no passkey/webauthn support
- Role-based routing: admins → `/admin`, users → `/waqf`
- Anonymous, privacy-first authentication via ICP blockchain

### Project Structure Deep Dive

#### `/src/app/` - Next.js App Router
- **`admin/`**: Complete admin dashboard with causes, users, reports, settings
- **`auth/`**: Authentication UI with Internet Identity integration
- **`waqf/`**: Waqf creator dashboard for endowment management
- **`page.tsx`**: Landing page with role-based redirects

#### `/src/components/` - React Components
- **`admin/`**: Admin-specific components (cause management, user management, reports)
- **`auth/`**: Authentication components (AuthSection, AuthProvider)
- **`ui/`**: Reusable UI components
- **`waqf/`**: Waqf creator components

#### `/src/lib/` - Business Logic
- **`waqf-utils.ts`**: Core Waqf operations (CRUD, donations, allocations)
- **`cause-utils.ts`**: Cause management operations
- **`admin-utils.ts`**: Admin operations and user management
- **`auth-utils.ts`**: Authentication helpers
- **`juno.ts`**: Juno SDK initialization

#### `/src/hooks/` - Custom React Hooks
- **`useAuth.ts`**: Authentication state management
- **`useWaqfStorage.ts`**: Waqf data operations with offline handling
- **`useAdminCheck.ts`**: Admin route protection
- **`useWaqfCreatorCheck.ts`**: User route protection
- **`useNetworkStatus.ts`**: Network connectivity monitoring

#### `/src/context/` - React Context
- **`AuthContext.tsx`**: Global authentication state
- **`JunoContext.tsx`**: Juno SDK state and initialization
- **`WaqfProvider.tsx`**: Waqf-specific state management

#### `/src/satellite/` - Rust Backend
- Rust canister code for custom blockchain logic
- Extends Juno's built-in capabilities
- `Cargo.toml` specifies junobuild dependencies

### Key Patterns and Conventions

#### Error Handling
- Network-aware error handling with offline detection
- User-friendly error messages with actionable suggestions
- Consistent error state management across hooks

#### Data Flow
1. **Authentication**: Internet Identity → AuthContext → Role-based routing
2. **Data Operations**: UI → Custom Hooks → Utility Functions → Juno SDK → ICP Blockchain
3. **State Management**: Local component state + React Context for global state

#### UI/UX Patterns
- **Gradient-based design system**: Blue-to-purple gradients throughout
- **Professional card layouts**: Rounded corners, shadows, hover effects
- **Loading states**: Skeleton screens and spinners for better UX
- **Responsive design**: Mobile-first with desktop enhancements

## Development Workflow

### First-Time Setup
1. **Collections Setup**: Follow `COLLECTION_SETUP_CHECKLIST.md` to create 6 Juno collections
2. **Environment**: Set `NEXT_PUBLIC_SATELLITE_ID` in `.env.local`
3. **Dependencies**: Run `npm install` (auto-copies auth workers)

### Common Development Tasks

#### Adding New Cause
1. Navigate to `/admin/causes`
2. Use markdown editor for descriptions
3. Upload images via drag-and-drop
4. Set approval status and category

#### Testing Authentication
- Use Internet Identity anchor for testing
- Admin detection: `user.owner === true`
- Role-based redirects happen automatically

#### Working with Waqf Data
```typescript
// Use the custom hook
const { createWaqf, getWaqf, loading, error } = useWaqfStorage();

// All operations include offline handling
await createWaqf(waqfData);
```

#### Debugging Collection Issues
- Check Juno Console: https://console.juno.build/
- Verify satellite ID in environment variables
- Ensure all 6 collections are created with correct permissions

### Important Files for Development

#### Configuration Files
- `juno.config.mjs`: Juno deployment configuration
- `next.config.mjs`: Next.js configuration with Juno plugin
- `eslint.config.mjs`: Linting rules (Next.js + TypeScript)
- `tsconfig.json`: TypeScript configuration

#### Key Utilities
- `/src/lib/waqf-utils.ts`: Core business logic for Waqf operations
- `/src/lib/cause-utils.ts`: Cause management operations
- `/src/hooks/useWaqfStorage.ts`: Main data access hook with error handling

## Deployment

### Local Development
```bash
npm run dev                    # Start dev server on localhost:3000
juno emulator start           # Optional: local Juno emulator
```

### Production Deployment
```bash
npm run build                 # Build static export
juno hosting deploy           # Deploy to ICP via Juno
```

### Environment Variables Required
```env
NEXT_PUBLIC_SATELLITE_ID=your-satellite-id
NEXT_PUBLIC_JUNO_SATELLITE_ID=your-satellite-id  # Alternative naming
```

## Troubleshooting

### Common Issues
1. **"Collections not found"**: Run collection setup from `COLLECTION_SETUP_CHECKLIST.md`
2. **Build failures**: Check `BUILD_SUCCESS_SUMMARY.md` for known solutions
3. **Network errors**: App includes offline detection and user-friendly messaging
4. **Authentication issues**: Verify satellite ID and Internet Identity setup

### Debugging Tips
- Check browser console for detailed Juno errors
- Use React DevTools to inspect authentication state
- Network tab shows ICP canister communication
- All data operations include comprehensive error handling

## Documentation

### Key Documentation Files
- `QUICK_START.md`: Complete setup and testing guide
- `JUNO_SETUP_GUIDE.md`: Detailed Juno configuration
- `COLLECTION_SETUP_CHECKLIST.md`: Required database setup
- Various `*_SUMMARY.md` files: Feature-specific documentation

### External Resources
- [Juno Documentation](https://juno.build/docs)
- [Internet Computer Developer Docs](https://internetcomputer.org/docs)
- [Next.js App Router Guide](https://nextjs.org/docs/app)

## Code Quality

### Linting & Formatting
- ESLint with Next.js and TypeScript rules
- Prettier with Tailwind CSS plugin
- Automatic formatting on save recommended

### Type Safety
- Full TypeScript coverage
- Comprehensive type definitions in `/src/types/`
- Juno SDK types imported and extended

### Testing Strategy
- Focus on integration testing with Juno collections
- Test authentication flows with Internet Identity
- Verify role-based routing and access control

## Performance Considerations

### Optimization Features
- **Turbopack**: Fast development builds with `--turbopack` flag
- **Offline Handling**: Network-aware operations with graceful degradation
- **Loading States**: Skeleton screens for better perceived performance
- **Lazy Loading**: Components loaded as needed

### Monitoring
- Network status monitoring via `useNetworkStatus` hook
- Error tracking through context and toast notifications
- Performance insights available through browser dev tools

## Security

### Authentication Security
- Internet Identity provides cryptographic security
- No passwords or biometric data stored
- Anonymous authentication preserves privacy

### Data Security
- All data encrypted on ICP blockchain
- Role-based access control enforced
- Admin operations require owner-level permissions

### Best Practices
- Environment variables for sensitive configuration
- Proper error handling without exposing internals
- Input validation on all user-facing forms
