# @mpbhealth/auth

Shared authentication and authorization for all MPB Health applications.

## Installation

```bash
pnpm add @mpbhealth/auth
```

Built with tsup. Output in `dist/`.

## Usage

```tsx
import { AuthProvider, useAuth, ProtectedRoute } from "@mpbhealth/auth";

function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    </AuthProvider>
  );
}
```

## API Reference

### Providers and Components

- `AuthProvider` — top-level auth context
- `ProtectedRoute` — route-level access control
- `RouteGuard` — conditional route rendering
- `SessionTimeoutWarning` — inactivity warning dialog
- `OrgSwitcher` — organization context switcher
- MFA components (setup, verification)

### Hooks

- `useAuth` — current user, login, logout
- `useSession` — session state and refresh
- `useOrg` — current organization context
- `usePermission` — permission checks
- `usePortalAccess` — portal-level access control

### Services

- `secureAuthService` — core auth operations
- `mfaService` — multi-factor authentication
- `passwordSecurityService` — password policy enforcement
- `rateLimitService` — auth rate limiting
- `sessionTimeoutService` — session lifecycle
- `userRolesService` — role checks (`hasRole`, `canAccessAdminPortal`, etc.)
- `orgService` — organization operations
- `permissionService` — permission evaluation
- `auditService` — auth audit logging
- `phiSecurityService` — PHI access controls

### Utilities

- `buildPortalSSOUrl` — construct SSO redirect URLs

## Apps Using This Package

All applications.
