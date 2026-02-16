# CORS Troubleshooting - Specific Endpoints Still Failing

## Issue: CORS configured but specific endpoints still failing

### Common Causes & Solutions

## 1. Route-Specific Middleware Override

**Problem**: Some routes have their own middleware that overrides global CORS.

**Check your routes/api.php**:
```php
// Look for routes like this:
Route::middleware(['auth:sanctum'])->group(function () {
    // These routes might not have CORS applied
    Route::post('/delivery-challans', [DeliveryChallanController::class, 'store']);
    Route::post('/companies', [CompanyController::class, 'store']);
});

// Should be:
Route::middleware(['auth:sanctum', 'cors'])->group(function () {
    // OR ensure global CORS is applied
});
```

## 2. Laravel Sanctum CORS Conflict

**Problem**: Sanctum middleware can interfere with CORS.

**Solution**: Update bootstrap/app.php:
```php
// In bootstrap/app.php
$app->middleware([
    \Illuminate\Http\Middleware\HandleCors::class, // ← ADD THIS FIRST
    // ... other middleware
]);

// For API routes specifically:
Route::middleware([
    \Illuminate\Http\Middleware\HandleCors::class, // ← ENSURE THIS IS INCLUDED
    'auth:sanctum'
])->group(function () {
    // Your API routes
});
```

## 3. Kernel Configuration Issue

**Check app/Http/Kernel.php**:
```php
protected $middleware = [
    // \Fruitcake\Cors\HandleCors::class, // ← ENSURE THIS IS NOT COMMENTED
    \Illuminate\Http\Middleware\HandleCors::class, // ← OR USE THIS
    // ... other middleware
];

protected $middlewareGroups = [
    'api' => [
        \Illuminate\Http\Middleware\HandleCors::class, // ← ENSURE THIS IS HERE
        'throttle:api',
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
    ],
];
```

## 4. Specific Endpoint Debugging

**Add CORS headers manually to problematic controllers**:

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DeliveryChallanController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        // Add explicit CORS headers for debugging
        return response()->json([
            'message' => 'Delivery challan created successfully'
        ], 201)
        ->header('Access-Control-Allow-Origin', 'http://localhost:5173')
        ->header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        ->header('Access-Control-Allow-Credentials', 'true');
    }
}
```

## 5. Preflight Request Issues

**Problem**: OPTIONS requests not being handled properly.

**Add explicit OPTIONS route handling**:
```php
// routes/api.php
Route::options('/{any}', function () {
    return response('', 200)
        ->header('Access-Control-Allow-Origin', 'http://localhost:5173')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        ->header('Access-Control-Allow-Credentials', 'true');
})->where('any', '.*');
```

## 6. Apache/Nginx CORS Override

**If using Apache (.htaccess)**:
```apache
# public/.htaccess
Header always set Access-Control-Allow-Origin "http://localhost:5173"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
Header always set Access-Control-Allow-Credentials "true"
```

**If using Nginx**:
```nginx
# nginx.conf
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

## 7. Debug Steps

### Step 1: Check Laravel Routes
```bash
php artisan route:list --name=delivery-challans
php artisan route:list --name=companies
```

### Step 2: Check Applied Middleware
```php
// Add to your controller temporarily
public function store(Request $request)
{
    dd(request()->route()->middleware());
    // ... rest of method
}
```

### Step 3: Test with curl
```bash
# Test OPTIONS request
curl -X OPTIONS http://192.168.1.22:8000/api/superadmin/delivery-challans \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization" \
  -v

# Test POST request
curl -X POST http://192.168.1.22:8000/api/superadmin/delivery-challans \
  -H "Origin: http://localhost:5173" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{"test": "data"}' \
  -v
```

## 8. Laravel CORS Package Alternative

**Install dedicated CORS package**:
```bash
composer require fruitcake/laravel-cors
```

**Update config/app.php**:
```php
'providers' => [
    // ...
    Fruitcake\Cors\CorsServiceProvider::class,
],
```

## 9. Force CORS on All Responses

**Add this to AppServiceProvider**:
```php
<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Http\Response;

class AppServiceProvider extends ServiceProvider
{
    public function boot()
    {
        Response::macro('cors', function ($content = '', $status = 200, array $headers = []) {
            $headers = array_merge($headers, [
                'Access-Control-Allow-Origin' => 'http://localhost:5173',
                'Access-Control-Allow-Methods' => 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers' => 'Content-Type, Authorization, X-Requested-With',
                'Access-Control-Allow-Credentials' => 'true',
            ]);
            
            return response($content, $status, $headers);
        });
    }
}
```

## Quick Fix: Add CORS to Specific Routes

```php
// routes/api.php - Add CORS middleware to specific routes
Route::middleware(['cors', 'auth:sanctum'])->group(function () {
    Route::post('/superadmin/delivery-challans', [DeliveryChallanController::class, 'store']);
    Route::post('/superadmin/companies', [CompanyController::class, 'store']);
    // Add other problematic routes here
});
```

## Most Likely Solutions

1. **Check route middleware** - Specific routes might be missing CORS middleware
2. **Update Kernel.php** - Ensure CORS is in global middleware
3. **Add explicit OPTIONS handling** - Preflight requests might be failing
4. **Check web server config** - Apache/Nginx might be overriding headers

Try these in order, and the issue should be resolved.
