# API Setup Guide

## Current Configuration

The CRM Super Admin Panel supports both mock and real API modes. The current configuration is:

- **API Base URL**: `http://localhost:8000/api`
- **Mock Mode**: `true` (using mock data)
- **Environment**: Development

## Switching to Real API

### Option 1: Using Environment Variables

1. **Disable Mock Mode**:
   ```bash
   # Update .env file
   VITE_USE_MOCK_API=false
   ```

2. **Start the Laravel Backend**:
   ```bash
   cd /path/to/your/laravel-project
   php artisan serve --host=0.0.0.0 --port=8000
   ```

3. **Restart the Frontend**:
   ```bash
   npm run dev
   ```

### Option 2: Manual Configuration

1. **Edit .env file**:
   ```
   VITE_API_BASE_URL=http://localhost:8000/api
   VITE_USE_MOCK_API=false
   ```

2. **Ensure Laravel API is running** on `http://localhost:8000`

## Required API Endpoints

The frontend expects these API endpoints to be implemented:

### Authentication
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user
- `POST /auth/logout` - User logout

### Delivery Challans
- `GET /delivery-challans` - Get all delivery challans (paginated)
- `POST /delivery-challans` - Create new delivery challan
- `GET /delivery-challans/{id}` - Get specific delivery challan
- `PUT /delivery-challans/{id}` - Update delivery challan
- `DELETE /delivery-challans/{id}` - Delete delivery challan

### Orders
- `GET /orders` - Get all orders (paginated)

### Parts
- `GET /parts` - Get all parts

### Customers
- `GET /customers` - Get all customers (paginated)

## Expected Response Format

### Paginated Response
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": {
    "data": [...],
    "current_page": 1,
    "last_page": 1,
    "per_page": 15,
    "total": 10,
    "links": [...]
  }
}
```

### Simple Response
```json
{
  "success": true,
  "data": {...}
}
```

## Troubleshooting

### API Server Not Running
If you see "Unable to connect to the remote server" errors:

1. Check if Laravel is running:
   ```bash
   curl http://localhost:8000/api/health
   ```

2. Start Laravel server:
   ```bash
   php artisan serve --host=0.0.0.0 --port=8000
   ```

3. Check CORS configuration in Laravel:
   ```php
   // in config/cors.php or bootstrap/app.php
   'paths' => ['api/*'],
   'allowed_methods' => ['*'],
   'allowed_origins' => ['http://localhost:3000', 'http://localhost:5173'],
   'allowed_headers' => ['*'],
   ```

### Authentication Issues
1. Ensure Laravel Sanctum is configured
2. Check that `auth:sanctum` middleware is applied to API routes
3. Verify CORS headers allow Authorization header

### Data Not Displaying
1. Check browser console for API errors
2. Verify API response structure matches expected format
3. Ensure mock mode is disabled when using real API

## Development Workflow

### Using Mock API (Development)
```env
VITE_USE_MOCK_API=true
```
- No backend required
- Pre-populated with sample data
- Full CRUD functionality

### Using Real API (Integration/Production)
```env
VITE_USE_MOCK_API=false
```
- Requires Laravel backend
- Real database operations
- Production-ready

## Testing the API

Use these commands to test your API endpoints:

```bash
# Test health endpoint
curl http://localhost:8000/api/health

# Test delivery challans
curl -X GET http://localhost:8000/api/delivery-challans \
  -H "Content-Type: application/json"

# Test authentication (if implemented)
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## Next Steps

1. Implement the required API endpoints in your Laravel backend
2. Set `VITE_USE_MOCK_API=false` in your .env file
3. Start your Laravel server
4. Test the integration
5. Deploy with real API configuration
