# CORS Fix for Laravel Backend - POST Requests Not Working

## Problem
- GET requests work fine with `192.168.1.22:8000`
- POST requests fail with CORS error
- Frontend on `localhost:5173` trying to reach `192.168.1.22:8000/api`

## Solution: Update Laravel CORS Configuration

### 1. Update config/cors.php
```php
<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    'allowed_origins' => ['http://localhost:5173', 'http://192.168.1.22:8000'],
    'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With'],
    'supports_credentials' => true,
];
```

### 2. Or Update bootstrap/app.php
```php
// In bootstrap/app.php, add this middleware to API routes:

use Illuminate\Http\Middleware\HandleCors;

// Add this to your API middleware group
->middleware(['api', 'auth:sanctum', HandleCors::class])
```

### 3. Alternative: Create Custom CORS Middleware
```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Middleware\HandleCors;

class CustomCors extends HandleCors
{
    public function handle($request, Closure $next)
    {
        // Add specific handling for POST requests
        $response = parent::handle($request, $next);
        
        // Ensure POST requests are properly handled
        if ($request->isMethod('post')) {
            $response->header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
            $response->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        }
        
        return $response;
    }
}
```

### 4. Update .htaccess (if needed)
```apache
# Add to public/.htaccess
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
```

## Quick Fix for Development

### Option 1: Allow All Origins (Development Only)
```php
// config/cors.php - Quick fix for development
'allowed_origins' => ['*'],  // Allow all origins (development only!)
```

### Option 2: Use Frontend URL in Backend
```php
// config/cors.php
'allowed_origins' => [
    env('FRONTEND_URL', 'http://localhost:5173'),
    'http://192.168.1.22:8000'  // Keep for production
],
```

## Laravel Commands to Apply

```bash
# Clear configuration cache
php artisan config:clear

# Clear route cache
php artisan route:clear

# Restart development server
php artisan serve --host=0.0.0.0 --port=8000
```

## Testing the Fix

1. Apply CORS configuration
2. Clear Laravel caches
3. Restart Laravel server
4. Test POST requests from frontend
5. Check browser Network tab for 200 responses

## Common Issues

### 1. Preflight Requests
- Ensure OPTIONS method is allowed
- Check browser Network tab for preflight requests

### 2. Credentials
- If using authentication, ensure `supports_credentials => true`

### 3. Headers
- Ensure all required headers are in `allowed_headers`

## Frontend Verification

After applying CORS fix, test with:
```javascript
// Test POST request
fetch('http://192.168.1.22:8000/api/superadmin/delivery-challans', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your-token'
    },
    body: JSON.stringify(testData)
})
.then(response => response.json())
.then(data => console.log('Success:', data))
.catch(error => console.error('Error:', error));
```

The issue is likely that POST methods are not included in the CORS allowed_methods or the frontend origin is not properly configured for POST requests.
