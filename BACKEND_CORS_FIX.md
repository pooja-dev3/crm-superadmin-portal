# Laravel Backend CORS Fix - Required for 192.168.1.22:8000

## Problem
Frontend: http://localhost:5173
Backend: http://192.168.1.22:8000
Error: CORS policy blocks cross-origin requests

## Solution: Configure Laravel Backend CORS

### Step 1: Install CORS Package (if not already installed)
```bash
composer require fruitcake/laravel-cors
```

### Step 2: Update config/cors.php
```php
<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    
    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    
    'allowed_origins' => [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',  // Alternative dev port
    ],
    
    'allowed_origins_patterns' => [],
    
    'allowed_headers' => [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Request-Method',
        'Access-Control-Request-Headers',
    ],
    
    'exposed_headers' => [],
    
    'max_age' => 0,
    
    'supports_credentials' => true,
];
```

### Step 3: Update app/Http/Kernel.php
```php
<?php

namespace App\Http;

use Illuminate\Foundation\Http\Kernel as HttpKernel;

class Kernel extends HttpKernel
{
    /**
     * The application's global HTTP middleware stack.
     *
     * These middleware are run during every request to your application.
     *
     * @var array<int, class-string|string>
     */
    protected $middleware = [
        // \App\Http\Middleware\TrustHosts::class,
        \App\Http\Middleware\TrustProxies::class,
        \Illuminate\Http\Middleware\HandleCors::class,  // ← ENSURE THIS IS HERE
        \Fruitcake\Cors\HandleCors::class,             // ← OR THIS ONE
        \App\Http\Middleware\PreventRequestsDuringMaintenance::class,
        \Illuminate\Foundation\Http\Middleware\ValidatePostSize::class,
        \App\Http\Middleware\TrimStrings::class,
        \Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull::class,
    ];

    /**
     * The application's route middleware groups.
     *
     * @var array<string, array<int, class-string|string>>
     */
    protected $middlewareGroups = [
        'web' => [
            \App\Http\Middleware\EncryptCookies::class,
            \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
            \Illuminate\Session\Middleware\StartSession::class,
            \Illuminate\View\Middleware\ShareErrorsFromSession::class,
            \App\Http\Middleware\VerifyCsrfToken::class,
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ],

        'api' => [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
            \Illuminate\Routing\Middleware\ThrottleRequests::class.':api',
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
            \Fruitcake\Cors\HandleCors::class,  // ← ADD THIS TO API GROUP
        ],
    ];

    // ... rest of the file
}
```

### Step 4: Update config/app.php (if using fruitcake/cors)
```php
'providers' => [
    // ...
    Fruitcake\Cors\CorsServiceProvider::class,
],
```

### Step 5: Alternative - Add CORS Middleware to Routes
If the above doesn't work, add CORS middleware directly to your routes:

```php
// routes/api.php
use Illuminate\Http\Middleware\HandleCors;

// Add CORS to all API routes
Route::middleware([HandleCors::class])->group(function () {
    // Your existing API routes
    Route::post('/superadmin/customers', [CustomerController::class, 'store']);
    Route::post('/superadmin/parts', [PartController::class, 'store']);
    Route::post('/superadmin/orders', [OrderController::class, 'store']);
    Route::post('/superadmin/delivery-challans', [DeliveryChallanController::class, 'store']);
    Route::post('/superadmin/companies', [CompanyController::class, 'store']);
});

// OR add to specific routes
Route::middleware(['cors', 'auth:sanctum'])->group(function () {
    Route::post('/superadmin/customers', [CustomerController::class, 'store']);
    // ... other POST routes
});
```

### Step 6: Clear Laravel Caches
```bash
php artisan config:clear
php artisan route:clear
php artisan cache:clear
php artisan view:clear
```

### Step 7: Restart Laravel Server
```bash
php artisan serve --host=0.0.0.0 --port=8000
```

### Step 8: Test CORS Headers
Test with curl to verify CORS headers are working:

```bash
# Test OPTIONS request (preflight)
curl -X OPTIONS http://192.168.1.22:8000/api/superadmin/customers \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization" \
  -v

# Expected response should include:
# Access-Control-Allow-Origin: http://localhost:5173
# Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
# Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
```

### Step 9: Debug Laravel CORS
Add this to a controller method to debug:

```php
public function store(Request $request)
{
    // Debug CORS headers
    return response()->json([
        'message' => 'CORS test',
        'headers' => $request->headers->all()
    ], 200)
    ->header('Access-Control-Allow-Origin', 'http://localhost:5173')
    ->header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    ->header('Access-Control-Allow-Credentials', 'true');
}
```

### Step 10: Nginx/Apache CORS (if using web server)
If using Nginx, add to server block:
```nginx
location /api {
    add_header 'Access-Control-Allow-Origin' 'http://localhost:5173' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-Requested-With' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;
    
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' 'http://localhost:5173';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-Requested-With';
        add_header 'Access-Control-Allow-Credentials' 'true';
        add_header 'Content-Length' 0;
        add_header 'Content-Type' 'text/plain';
        return 204;
    }
}
```

If using Apache, add to .htaccess:
```apache
Header always set Access-Control-Allow-Origin "http://localhost:5173"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
Header always set Access-Control-Allow-Credentials "true"
```

## Quick Test
After applying fixes:
1. Clear Laravel caches
2. Restart Laravel server
3. Try creating a customer/delivery challan from frontend
4. Check browser Network tab - should see 200 response, no CORS error

## Most Common Issues
1. **Missing HandleCors in Kernel.php** - Add it to global middleware
2. **Wrong origins in config/cors.php** - Must include http://localhost:5173
3. **CORS middleware not applied to routes** - Add to api middleware group
4. **Web server overriding headers** - Check Nginx/Apache configuration
5. **Caches not cleared** - Always clear config cache after CORS changes

The frontend is correctly configured - this is purely a backend CORS configuration issue.
