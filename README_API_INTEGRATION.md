# Laravel API Integration Guide

This document outlines the integration of the Laravel Customer & Part Management System APIs with the React CRM Super Admin Panel.

## API Configuration

### Base URL
- **Development**: `http://localhost:8000/api`
- **Production**: Update in `src/services/api.ts`

### Authentication
- Uses Laravel Sanctum for token-based authentication
- Token stored in localStorage as `auth_token`
- Automatic token injection for all API requests

## API Services Structure

### Core Files
- `src/services/api.ts` - Base API client configuration
- `src/services/auth.ts` - Authentication endpoints
- `src/services/customers.ts` - Customer management endpoints
- `src/services/parts.ts` - Parts management endpoints
- `src/services/index.ts` - Centralized exports
- `src/types/api.ts` - TypeScript interfaces

### Available Endpoints

#### Authentication
- `POST /login` - User login
- `GET /me` - Get current user
- `POST /logout` - User logout
- `GET /admin-only` - Admin restricted endpoint
- `GET /supervisor-area` - Supervisor/admin endpoint

#### Customers
- `GET /customers` - Get all customers with parts
- `POST /customers` - Create new customer
- `GET /customers/search?name={name}` - Search customers by name

#### Parts
- `GET /parts` - Get all parts with customer info
- `POST /parts` - Create new part
- `GET /parts/search?description={desc}` - Search parts by description

## New Components

### Customer Management
- `src/pages/Customers.tsx` - Customer listing and management
- `src/components/AddCustomerModal.tsx` - Add customer form

### Part Management
- `src/pages/Parts.tsx` - Part listing and management
- `src/components/AddPartModal.tsx` - Add part form

## Features Implemented

### Authentication Flow
1. Login via API with email/password
2. Token storage and automatic injection
3. Token validation on app load
4. Proper logout with API call

### Customer Features
- View all customers with associated parts
- Search customers by name/address/contact/GST
- Add new customers with validation
- Detailed customer view with parts list

### Part Features
- View all parts with customer information
- Search parts by description/drawing/material
- Filter by customer
- Add new parts with comprehensive form
- Detailed part view with all specifications

### UI Enhancements
- Modern card-based layouts
- Responsive design
- Loading states
- Error handling
- Search and filtering
- Modal dialogs for forms

## Usage Examples

### Using Customer API
```typescript
import { customerApi } from '../services'

// Get all customers
const customers = await customerApi.getAllCustomers()

// Create customer
const newCustomer = await customerApi.createCustomer({
  name: 'Test Company',
  address: '123 Test St',
  contact_no: '1234567890',
  gst_no: 'GST123456'
})

// Search customers
const searchResults = await customerApi.searchCustomers('Test')
```

### Using Part API
```typescript
import { partApi } from '../services'

// Get all parts
const parts = await partApi.getAllParts()

// Create part
const newPart = await partApi.createPart({
  customer_id: 1,
  part_description: 'Test Part',
  drawing_no: 'DRG-001',
  raw_material: 'Steel'
})

// Search parts
const searchResults = await partApi.searchParts('Test')
```

### Authentication
```typescript
import { authApi, tokenManager } from '../services'

// Login
const loginResult = await authApi.login('user@example.com', 'password')

// Get current user
const currentUser = await authApi.getCurrentUser()

// Logout
await authApi.logout()

// Token management
tokenManager.setToken(token)
const token = tokenManager.getToken()
tokenManager.removeToken()
```

## Navigation Updates

Added new menu items to sidebar:
- **Customers** - Customer management page
- **Parts** - Parts management page

## Data Models

### Customer
```typescript
interface Customer {
  id: number
  name: string
  address: string
  contact_no: string
  gst_no: string
  created_at: string
  updated_at: string
}
```

### Part
```typescript
interface Part {
  id: number
  customer_id: number
  part_description: string
  drawing_no: string
  rev_no?: string
  net_wt?: string
  thickness?: string
  tool_information?: string
  raw_material?: string
  drawing_location?: string
  operation_sequence?: string
  lead_time?: number
  po_no?: string
  po_date?: string
  po_received?: boolean
  po_qty?: number
  po_drg_rev?: string
  acknowledgement_remarks?: string
  reqd_date_as_per_po?: string
  created_at: string
  updated_at: string
}
```

## Error Handling

All API calls include proper error handling:
- Network errors are logged and re-thrown
- HTTP errors return error messages from API
- Loading states prevent duplicate requests
- User-friendly error messages in UI

## Next Steps

1. Update environment variables for production API URL
2. Add update/delete functionality for customers and parts
3. Implement pagination for large datasets
4. Add file upload capabilities for drawings/documents
5. Add export functionality for reports
6. Implement real-time updates with WebSockets

## Testing

The integration is ready for testing with the Laravel backend:
1. Ensure Laravel server is running on `localhost:8000`
2. Test authentication flow
3. Verify customer and part CRUD operations
4. Test search and filtering functionality
