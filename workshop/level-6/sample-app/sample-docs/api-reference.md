# API Reference

## Authentication

### POST /api/auth/login
Login with email and password.

**Request:**
```json
{ "email": "user@example.com", "password": "secret" }
```

**Response:**
```json
{ "token": "eyJhbG...", "refreshToken": "abc123", "expiresIn": 3600 }
```

### POST /api/auth/refresh
Refresh an expired JWT token.

### POST /api/auth/logout
Invalidate the current session.

## Users

### GET /api/users
List all users (admin only). Supports pagination with `?page=1&limit=20`.

### GET /api/users/:id
Get a specific user by ID.

### PUT /api/users/:id
Update user profile. Requires authentication.

## Products

### GET /api/products
List products with optional filters: `?category=electronics&minPrice=10&maxPrice=100`.

### POST /api/products
Create a new product (admin only).

### DELETE /api/products/:id
Soft-delete a product (admin only).

## Error Responses

All errors follow this format:
```json
{ "error": { "code": "NOT_FOUND", "message": "Resource not found" } }
```

| Code | HTTP Status | Description |
|------|------------|-------------|
| UNAUTHORIZED | 401 | Missing or invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource does not exist |
| VALIDATION_ERROR | 422 | Invalid request body |
| RATE_LIMITED | 429 | Too many requests |
