# Dizo Cart — API Reference

## Base URL
```
Production: https://api.dizocart.com/v1
Local Dev:  http://localhost:3000/api
```

## Authentication
Admin endpoints require a Bearer token:
```
Authorization: Bearer <admin_jwt_token>
```

---

## Products API

### List Products
```
GET /products
Query params: ?cat=kitchen&status=active&limit=20&page=1
```
**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Non-Stick Frying Pan",
      "cat": "kitchen",
      "badge": "hot",
      "price": 1299,
      "oldPrice": 2000,
      "emoji": "🍳",
      "image1": "https://...",
      "image2": "https://...",
      "reviews": 245,
      "rating": 4.8,
      "status": "active"
    }
  ],
  "total": 50,
  "page": 1,
  "pages": 3
}
```

### Get Single Product
```
GET /products/:id
```

### Create Product (Admin)
```
POST /products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Product",
  "cat": "kitchen",
  "badge": "new",
  "price": 999,
  "oldPrice": 1500,
  "emoji": "🥘",
  "desc": "Product description",
  "image1": "https://...",
  "section": "trending"
}
```

### Update Product (Admin)
```
PUT /products/:id
Authorization: Bearer <token>
```

### Delete Product (Admin)
```
DELETE /products/:id
Authorization: Bearer <token>
```

---

## Orders API

### Place Order (Public)
```
POST /orders
Content-Type: application/json

{
  "name": "Rahim Uddin",
  "phone": "01712345678",
  "email": "rahim@example.com",
  "address": "House 12, Road 5, Dhanmondi, Dhaka",
  "zone": "insideDhaka",
  "items": [
    { "id": 1, "name": "Non-Stick Pan", "price": 1299, "qty": 2 }
  ],
  "subtotal": 2598,
  "delivery": 60,
  "discount": 0,
  "total": 2658,
  "payment": "cod",
  "coupon": "",
  "notes": "Call before delivery"
}
```
**Response:**
```json
{
  "success": true,
  "orderId": "#DC1023",
  "message": "Order placed successfully"
}
```

### Get Order (Track)
```
GET /orders/:id
```

### List Orders (Admin)
```
GET /orders
Authorization: Bearer <token>
Query: ?status=pending&page=1
```

### Update Order Status (Admin)
```
PUT /orders/:id/status
Authorization: Bearer <token>

{ "status": "shipped" }
```

---

## Auth API

### User Login
```
POST /auth/login
{ "email": "user@example.com", "password": "password" }
```

### User Register
```
POST /auth/register
{ "firstName": "Rahim", "lastName": "Uddin", "email": "...", "phone": "...", "password": "..." }
```

### Admin Login
```
POST /auth/admin/login
{ "password": "admin_password" }
```

---

## Coupons API

### Validate Coupon
```
GET /coupons/:code
```
**Response:**
```json
{
  "valid": true,
  "type": "percent",
  "value": 20,
  "minOrder": 500
}
```

---

## Reviews API

### Submit Review
```
POST /reviews
{ "productId": 1, "name": "Rahim", "rating": 5, "text": "Excellent product!" }
```

### Get Product Reviews
```
GET /reviews?productId=1
```

---

## Error Responses
```json
{ "error": "Unauthorized", "code": 401 }
{ "error": "Not Found", "code": 404 }
{ "error": "Validation failed", "fields": ["name", "phone"], "code": 422 }
{ "error": "Server error", "code": 500 }
```
