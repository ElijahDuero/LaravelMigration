# Role-Based Access Control Reference

## Role Definitions

### super_admin
- **Display Name**: Super Admin
- **Badge Color**: Red (`bg-red-600`)
- **Full System Access**: Yes
- **User Management**: Yes
- **Notification Config**: Yes

### admin
- **Display Name**: Admin
- **Badge Color**: Indigo (`bg-indigo-600`)
- **Full System Access**: Yes (except user management)
- **User Management**: No
- **Notification Config**: No

### cyber_security
- **Display Name**: Cyber Security
- **Badge Color**: Violet (`bg-violet-600`)
- **Module Access**: TBD in Phase 5+

### it
- **Display Name**: IT
- **Badge Color**: Blue (`bg-blue-600`)
- **Module Access**: TBD in Phase 5+

### unassigned
- **Display Name**: Unassigned
- **Badge Color**: Gray (`bg-gray-500`)
- **Limited Access**: Dashboard + Incident Reporting only

## Using Roles in Controllers

### Protecting Routes

```php
// In routes/web.php

// Super Admin only
Route::middleware(['auth', 'role:super_admin'])->group(function () {
    Route::resource('users', UserController::class);
    Route::resource('notifications', NotificationController::class);
});

// Admin and Super Admin
Route::middleware(['auth', 'role:super_admin,admin'])->group(function () {
    Route::resource('incidents', IncidentController::class);
    Route::resource('hardware', HardwareController::class);
    Route::resource('risks', RiskController::class);
});

// All authenticated users
Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
});
```

### Checking Roles in Controllers

```php
use Illuminate\Support\Facades\Auth;

class SomeController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        
        if ($user->isSuperAdmin()) {
            // Super admin logic
        }
        
        if ($user->isAdmin()) {
            // Admin or super admin logic
        }
        
        if ($user->isUnassigned()) {
            // Restricted access
            abort(403, 'Access restricted. Please contact administrator.');
        }
    }
}
```

### Using Role Helpers

```php
// Available on User model:

$user->isSuperAdmin();        // Returns bool
$user->isAdmin();             // Returns bool (true for super_admin AND admin)
$user->isUnassigned();        // Returns bool
$user->roleDisplayLabel();    // Returns human-readable role name
$user->roleBadgeColor();      // Returns Tailwind color class
```

## Using Roles in React Components

### Checking Roles in TSX

```tsx
import { usePage } from '@inertiajs/react';
import { User } from '@/types';

export default function SomeComponent() {
  const { auth } = usePage<{ auth: { user: User } }>().props;
  const user = auth.user;

  const isSuperAdmin = user.role === 'super_admin';
  const isAdmin = ['super_admin', 'admin'].includes(user.role);
  const isUnassigned = !user.role || user.role === 'unassigned';

  return (
    <>
      {isSuperAdmin && (
        <button>Super Admin Only Action</button>
      )}
      
      {isAdmin && (
        <div>Admin and Super Admin Content</div>
      )}
      
      {isUnassigned && (
        <div className="text-amber-500">
          Limited Access - Contact Administrator
        </div>
      )}
    </>
  );
}
```

### Conditional Navigation

Already implemented in `Sidebar.tsx`:

```tsx
const isSuperAdmin = user.role === 'super_admin';
const isAdmin = ['super_admin', 'admin'].includes(user.role);

{(isSuperAdmin || isAdmin) && (
  <Link href="/incidents">Incident Reporting</Link>
)}

{isSuperAdmin && (
  <Link href="/users">Users</Link>
)}
```

## Audit Logging with Roles

```php
use App\Services\AuditService;

// In your controller:
AuditService::log(
    module: 'incidents',
    action: 'Created incident #INC-2026-0001',
    target: 'INC-2026-0001',
    detail: 'Severity: Critical, Branch: Main Campus'
);

// The service automatically captures:
// - actor: Auth::user()->name
// - role: Auth::user()->role
// - ip_address: Request::ip()
// - created_at: now()
```

## Changing User Roles

### Via Tinker (Development)

```bash
php artisan tinker
```

```php
$user = User::where('email', 'test@example.com')->first();
$user->role = 'admin';
$user->save();
```

### Via User Management (To Be Implemented)

In Phase 5+, the UserController will handle role changes with proper authorization:

```php
// Only super_admin can change roles
Route::middleware(['auth', 'role:super_admin'])->group(function () {
    Route::patch('users/{user}/role', [UserController::class, 'updateRole']);
});
```

## Testing Role Access

### Manual Testing Checklist

1. **Super Admin** (`superadmin@company.com` / `password`)
   - [ ] Can access all menu items
   - [ ] Can see Users menu
   - [ ] Can see Notifications menu
   - [ ] Can access all modules

2. **Admin** (`admin@company.com` / `password`)
   - [ ] Can access most menu items
   - [ ] Cannot see Users menu
   - [ ] Cannot see Notifications menu
   - [ ] Can access reports and analytics

3. **Unassigned** (create via register)
   - [ ] Limited menu (Dashboard + Incidents only)
   - [ ] Shows "Restricted Access" badge in sidebar
   - [ ] Gets 403 error when accessing restricted routes

### Unit Testing (Future)

```php
// tests/Feature/RoleMiddlewareTest.php

public function test_super_admin_can_access_user_management()
{
    $user = User::factory()->create(['role' => 'super_admin']);
    
    $response = $this->actingAs($user)->get('/users');
    
    $response->assertStatus(200);
}

public function test_admin_cannot_access_user_management()
{
    $user = User::factory()->create(['role' => 'admin']);
    
    $response = $this->actingAs($user)->get('/users');
    
    $response->assertStatus(403);
}
```

## Role Migration Path

If you need to add new roles in the future:

1. Add the role to the User type enum in `resources/js/types/auth.ts`
2. Update `roleDisplayLabel()` and `roleBadgeColor()` in User model
3. Add corresponding Sidebar navigation logic
4. Define module permissions in route middleware
5. Update this reference document

## Security Best Practices

- ✅ Always use middleware for route protection
- ✅ Never rely solely on frontend role checks
- ✅ Log all privileged actions via AuditService
- ✅ Use the smallest privilege necessary for each role
- ❌ Never hardcode passwords in seeders for production
- ❌ Don't expose role-checking logic in API responses
