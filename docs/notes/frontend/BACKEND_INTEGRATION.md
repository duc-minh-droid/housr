# Backend Integration Guide

This document provides comprehensive information for integrating a backend API with the RentEase frontend application.

## Table of Contents

1. [Overview](#overview)
2. [Configuration](#configuration)
3. [Authentication](#authentication)
4. [API Endpoints](#api-endpoints)
5. [Data Models](#data-models)
6. [CORS Configuration](#cors-configuration)
7. [Error Handling](#error-handling)
8. [Testing](#testing)

---

## Overview

The frontend is built with Next.js 14+ and TypeScript. It communicates with the backend via RESTful API endpoints. The application supports both **mock mode** (for demo users) and **real backend mode** (for production users).

### Architecture

- **Frontend**: Next.js 14+ with TypeScript
- **State Management**: React Context API
- **API Layer**: `lib/api.ts` (main API client)
- **Mock Layer**: `lib/mockApi.ts` (for demo/testing)
- **Data Types**: `types/index.ts`

---

## Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000

# Optional: Other environment variables
# NEXT_PUBLIC_ENVIRONMENT=development
```

### Default Configuration

If `NEXT_PUBLIC_API_URL` is not set, the frontend defaults to:

- **Base URL**: `http://localhost:5000`

---

## Authentication

### Overview

The application uses **JWT (JSON Web Token)** authentication with Bearer token authorization.

### Token Storage

- Tokens are stored in `localStorage` with key: `token`
- User data is stored in `localStorage` with key: `user`

### Authentication Flow

1. User submits login credentials
2. Backend validates and returns access token + user data
3. Frontend stores token in localStorage
4. All subsequent requests include token in Authorization header

### Headers

All authenticated requests include:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

---

## API Endpoints

### 1. Authentication Endpoints

#### POST `/api/auth/login`

Login with email and password.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "tenant",
    "points": 250,
    "landlordId": "landlord-1"
  }
}
```

---

#### POST `/api/auth/register`

Register a new user account.

**Request Body:**

```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "role": "tenant"
}
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1",
    "email": "newuser@example.com",
    "name": "John Doe",
    "role": "tenant",
    "points": 0,
    "landlordId": null
  }
}
```

---

#### GET `/api/auth/me`

Get current authenticated user profile.

**Headers:**

```http
Authorization: Bearer <token>
```

**Response:**

```json
{
  "user": {
    "id": "1",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "tenant",
    "points": 250,
    "landlordId": "landlord-1"
  }
}
```

---

### 2. Bills Endpoints

#### GET `/api/bills`

Get bills for the authenticated user.

- **For Tenants**: Returns bills assigned to them
- **For Landlords**: Returns all bills they've created

**Headers:**

```http
Authorization: Bearer <token>
```

**Response:**

```json
{
  "bills": [
    {
      "id": "1",
      "tenantId": "tenant-1",
      "landlordId": "landlord-1",
      "type": "rent",
      "amount": 1500.0,
      "dueDate": "2025-12-01T00:00:00Z",
      "isPaid": false,
      "description": "Monthly Rent - December 2025"
    }
  ]
}
```

---

#### POST `/api/bills`

Create a new bill (landlord only).

**Headers:**

```http
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "title": "Monthly Rent - December 2025",
  "amount": 1500.0,
  "category": "rent",
  "due_date": "2025-12-01",
  "user_id": 5
}
```

**Response:**

```json
{
  "bill": {
    "id": "1",
    "tenantId": "5",
    "landlordId": "landlord-1",
    "type": "rent",
    "amount": 1500.0,
    "dueDate": "2025-12-01T00:00:00Z",
    "isPaid": false,
    "description": "Monthly Rent - December 2025"
  }
}
```

**Valid Categories:**

- `rent`
- `utilities`
- `internet`
- `other`

---

#### POST `/api/bills/:billId/pay`

Mark a bill as paid (tenant only).

**Headers:**

```http
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "paid_date": "2025-11-08T10:30:00Z"
}
```

**Response:**

```json
{
  "bill": {
    "id": "1",
    "tenantId": "tenant-1",
    "landlordId": "landlord-1",
    "type": "rent",
    "amount": 1500.0,
    "dueDate": "2025-12-01T00:00:00Z",
    "isPaid": true,
    "paidDate": "2025-11-08T10:30:00Z",
    "description": "Monthly Rent - December 2025"
  }
}
```

---

### 3. Expenses Endpoints

#### GET `/api/expenses`

Get expenses for the authenticated tenant.

**Headers:**

```http
Authorization: Bearer <token>
```

**Query Parameters:**

- `month` (optional): Filter by month (0-11)
- `year` (optional): Filter by year (e.g., 2025)

**Example:**

```
GET /api/expenses?month=10&year=2025
```

**Response:**

```json
{
  "expenses": [
    {
      "id": "1",
      "tenantId": "tenant-1",
      "category": "Food",
      "amount": 125.75,
      "date": "2025-11-01T00:00:00Z",
      "description": "Weekly groceries"
    }
  ]
}
```

---

#### POST `/api/expenses`

Create a new expense (tenant only).

**Headers:**

```http
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "category": "Food",
  "amount": 125.75,
  "date": "2025-11-01",
  "description": "Weekly groceries"
}
```

**Response:**

```json
{
  "expense": {
    "id": "1",
    "tenantId": "tenant-1",
    "category": "Food",
    "amount": 125.75,
    "date": "2025-11-01T00:00:00Z",
    "description": "Weekly groceries"
  }
}
```

---

#### DELETE `/api/expenses/:expenseId`

Delete an expense (tenant only).

**Headers:**

```http
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true
}
```

---

#### GET `/api/expenses/summary`

Get expense summary for the authenticated tenant.

**Headers:**

```http
Authorization: Bearer <token>
```

**Query Parameters:**

- `month` (optional): Filter by month (0-11)
- `year` (optional): Filter by year (e.g., 2025)

**Response:**

```json
{
  "total": 850.5,
  "byCategory": {
    "Food": 450.0,
    "Transportation": 200.0,
    "Entertainment": 200.5
  },
  "count": 15
}
```

---

### 4. Rent Plans Endpoints

#### GET `/api/rent-plans`

Get rent plans for the authenticated user.

- **For Tenants**: Returns their rent plans
- **For Landlords**: Returns all plans they need to review

**Headers:**

```http
Authorization: Bearer <token>
```

**Response:**

```json
{
  "rent_plans": [
    {
      "id": "1",
      "tenantId": "tenant-1",
      "landlordId": "landlord-1",
      "monthlyRent": 1500.0,
      "deposit": 3000.0,
      "duration": 12,
      "status": "pending",
      "proposedDate": "2025-11-01T00:00:00Z"
    }
  ]
}
```

**Status Values:**

- `pending`: Awaiting landlord approval
- `approved`: Approved by landlord
- `rejected`: Rejected by landlord

---

#### POST `/api/rent-plans`

Create a new rent plan (tenant only).

**Headers:**

```http
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "rent_amount": 1500.0,
  "deposit_amount": 3000.0,
  "duration_months": 12,
  "start_date": "2026-01-01",
  "landlord_id": 5
}
```

**Response:**

```json
{
  "rent_plan": {
    "id": "1",
    "tenantId": "tenant-1",
    "landlordId": "5",
    "monthlyRent": 1500.0,
    "deposit": 3000.0,
    "duration": 12,
    "status": "pending",
    "proposedDate": "2025-11-08T10:30:00Z"
  }
}
```

---

#### POST `/api/rent-plans/:planId/approve`

Approve a rent plan (landlord only).

**Headers:**

```http
Authorization: Bearer <token>
```

**Response:**

```json
{
  "rent_plan": {
    "id": "1",
    "tenantId": "tenant-1",
    "landlordId": "landlord-1",
    "monthlyRent": 1500.0,
    "deposit": 3000.0,
    "duration": 12,
    "status": "approved",
    "proposedDate": "2025-11-01T00:00:00Z",
    "reviewedDate": "2025-11-08T10:30:00Z"
  }
}
```

---

#### POST `/api/rent-plans/:planId/reject`

Reject a rent plan (landlord only).

**Headers:**

```http
Authorization: Bearer <token>
```

**Response:**

```json
{
  "rent_plan": {
    "id": "1",
    "tenantId": "tenant-1",
    "landlordId": "landlord-1",
    "monthlyRent": 1500.0,
    "deposit": 3000.0,
    "duration": 12,
    "status": "rejected",
    "proposedDate": "2025-11-01T00:00:00Z",
    "reviewedDate": "2025-11-08T10:30:00Z"
  }
}
```

---

### 5. Rewards Endpoints

#### GET `/api/rewards`

Get reward payment history for tenant.

**Headers:**

```http
Authorization: Bearer <token>
```

**Response:**

```json
{
  "rewards": [
    {
      "id": "1",
      "tenantId": "tenant-1",
      "billId": "bill-1",
      "amount": 1500.0,
      "date": "2025-11-01T00:00:00Z",
      "isOnTime": true,
      "pointsEarned": 50
    }
  ]
}
```

---

#### GET `/api/rewards/balance`

Get current points balance for tenant.

**Headers:**

```http
Authorization: Bearer <token>
```

**Response:**

```json
{
  "points": 250
}
```

---

### 6. Shop/Redemption Endpoints

#### GET `/api/shop/items`

Get all available shop items for redemption.

**Headers:**

```http
Authorization: Bearer <token>
```

**Response:**

```json
{
  "items": [
    {
      "id": "1",
      "name": "$25 Amazon Gift Card",
      "description": "Redeem for a $25 Amazon gift card",
      "pointCost": 100,
      "imageUrl": "🎁"
    }
  ]
}
```

---

#### POST `/api/shop/items/:itemId/redeem`

Redeem a shop item with points (tenant only).

**Headers:**

```http
Authorization: Bearer <token>
```

**Response:**

```json
{
  "redemption": {
    "id": "1",
    "tenantId": "tenant-1",
    "itemId": "item-1",
    "itemName": "$25 Amazon Gift Card",
    "pointsSpent": 100,
    "date": "2025-11-08T10:30:00Z"
  }
}
```

**Error Response (Insufficient Points):**

```json
{
  "error": "Insufficient points"
}
```

---

#### GET `/api/shop/redemptions`

Get redemption history for tenant.

**Headers:**

```http
Authorization: Bearer <token>
```

**Response:**

```json
{
  "redemptions": [
    {
      "id": "1",
      "tenantId": "tenant-1",
      "itemId": "item-1",
      "itemName": "$25 Amazon Gift Card",
      "pointsSpent": 100,
      "date": "2025-11-08T10:30:00Z"
    }
  ]
}
```

---

#### POST `/api/shop/items`

Create a new shop item (landlord only).

**Headers:**

```http
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "name": "$50 Grocery Voucher",
  "description": "Use at major grocery stores",
  "point_cost": 150,
  "available": true
}
```

**Response:**

```json
{
  "item": {
    "id": "1",
    "name": "$50 Grocery Voucher",
    "description": "Use at major grocery stores",
    "pointCost": 150,
    "imageUrl": null
  }
}
```

---

### 7. Dashboard Endpoints

#### GET `/api/dashboard/tenant`

Get dashboard data for tenant.

**Headers:**

```http
Authorization: Bearer <token>
```

**Response:**

```json
{
  "user": {
    "id": "tenant-1",
    "email": "tenant@example.com",
    "name": "John Doe",
    "role": "tenant",
    "points": 250
  },
  "points": 250,
  "unpaidBills": 3,
  "totalDue": 2730.0,
  "monthlyExpenses": 850.5,
  "rentPlan": {
    "id": "1",
    "monthlyRent": 1500.0,
    "status": "approved"
  }
}
```

---

#### GET `/api/dashboard/landlord`

Get dashboard data for landlord.

**Headers:**

```http
Authorization: Bearer <token>
```

**Response:**

```json
{
  "totalTenants": 7,
  "totalReceived": 15000.0,
  "pendingPlans": 3,
  "approvedPlans": 7,
  "unpaidBills": 12,
  "paidBills": 20
}
```

---

## Data Models

### User

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: "tenant" | "landlord";
  points?: number; // Only for tenants
  landlordId?: string; // Only for tenants
}
```

---

### Bill

```typescript
interface Bill {
  id: string;
  tenantId: string;
  landlordId: string;
  type: "rent" | "utilities" | "internet" | "other";
  amount: number;
  dueDate: string; // ISO 8601 format
  isPaid: boolean;
  paidDate?: string; // ISO 8601 format
  description: string;
}
```

---

### Expense

```typescript
interface Expense {
  id: string;
  tenantId: string;
  category: string;
  amount: number;
  date: string; // ISO 8601 format
  description: string;
}
```

---

### Rent Plan

```typescript
interface RentPlan {
  id: string;
  tenantId: string;
  landlordId: string;
  monthlyRent: number;
  deposit: number;
  duration: number; // in months
  status: "pending" | "approved" | "rejected";
  proposedDate: string; // ISO 8601 format
  reviewedDate?: string; // ISO 8601 format
}
```

---

### Shop Item

```typescript
interface ShopItem {
  id: string;
  name: string;
  description: string;
  pointCost: number;
  imageUrl?: string;
}
```

---

### Redemption

```typescript
interface Redemption {
  id: string;
  tenantId: string;
  itemId: string;
  itemName: string;
  pointsSpent: number;
  date: string; // ISO 8601 format
}
```

---

### Payment

```typescript
interface Payment {
  id: string;
  tenantId: string;
  billId: string;
  amount: number;
  date: string; // ISO 8601 format
  isOnTime: boolean;
  pointsEarned: number;
}
```

---

## CORS Configuration

The backend must allow CORS requests from the frontend origin.

### Required CORS Headers

```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

### Example: Flask CORS Configuration

```python
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"], supports_credentials=True)
```

### Example: Express.js CORS Configuration

```javascript
const cors = require("cors");

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
```

---

## Error Handling

### Standard Error Response

All errors should return a JSON response with this structure:

```json
{
  "error": "Error message describing what went wrong"
}
```

### HTTP Status Codes

| Status Code | Meaning                              |
| ----------- | ------------------------------------ |
| 200         | Success                              |
| 201         | Created                              |
| 400         | Bad Request (invalid input)          |
| 401         | Unauthorized (missing/invalid token) |
| 403         | Forbidden (insufficient permissions) |
| 404         | Not Found                            |
| 500         | Internal Server Error                |

### Example Error Responses

**401 Unauthorized:**

```json
{
  "error": "Invalid or expired token"
}
```

**403 Forbidden:**

```json
{
  "error": "Landlord access required"
}
```

**404 Not Found:**

```json
{
  "error": "Bill not found"
}
```

**400 Bad Request:**

```json
{
  "error": "Invalid email format"
}
```

---

## Testing

### Testing with Mock Mode

The frontend includes a mock API layer for testing without a backend.

**Demo Users:**

- **Tenant**: `demo@example.com` (any password)
- **Landlord**: `landlord@example.com` (any password)
- **Other Mock Users**: See `lib/mockData.ts`

### Testing with Real Backend

1. Set `NEXT_PUBLIC_API_URL` in `.env.local`
2. Create a test user account (not using demo emails)
3. Login and test all features

### Recommended Test Cases

1. **Authentication**

   - ✅ User registration
   - ✅ User login
   - ✅ Token persistence
   - ✅ Profile retrieval

2. **Bills (Tenant)**

   - ✅ View bills
   - ✅ Pay bills
   - ✅ Filter bills

3. **Bills (Landlord)**

   - ✅ View all tenant bills
   - ✅ Create new bills
   - ✅ View bill statistics

4. **Expenses (Tenant)**

   - ✅ View expenses
   - ✅ Create expenses
   - ✅ Delete expenses
   - ✅ View expense summary

5. **Rent Plans (Tenant)**

   - ✅ View rent plan
   - ✅ Create rent proposal

6. **Rent Plans (Landlord)**

   - ✅ View pending plans
   - ✅ Approve plans
   - ✅ Reject plans

7. **Rewards (Tenant)**
   - ✅ View points balance
   - ✅ View reward history
   - ✅ View shop items
   - ✅ Redeem items

---

## Quick Start Checklist

- [ ] Set up backend server on port 5000 (or configure `NEXT_PUBLIC_API_URL`)
- [ ] Configure CORS to allow `http://localhost:3000`
- [ ] Implement all required authentication endpoints
- [ ] Implement all Bills endpoints
- [ ] Implement all Expenses endpoints
- [ ] Implement all Rent Plans endpoints
- [ ] Implement all Rewards/Shop endpoints
- [ ] Implement all Dashboard endpoints
- [ ] Test with Postman or similar tool
- [ ] Test with frontend application
- [ ] Handle all error cases properly
- [ ] Implement JWT token validation
- [ ] Set up database with proper schema

---

## Support

For questions or issues with frontend integration:

1. Check the API implementation in `lib/api.ts`
2. Review mock implementations in `lib/mockApi.ts` for reference
3. Check data types in `types/index.ts`
4. Test with mock mode first to isolate backend issues

---

## Additional Notes

### Date Format

- All dates should be in **ISO 8601 format**: `YYYY-MM-DDTHH:mm:ssZ`
- Example: `2025-11-08T10:30:00Z`

### ID Format

- IDs can be strings or numbers
- Frontend converts and handles both types

### Points System

- Points are earned when tenants pay bills on time
- Points can be redeemed for shop items
- Points balance is maintained by the backend

### Role-Based Access

- Tenants can only access their own data
- Landlords can access all their tenants' data
- Backend must validate user role for protected endpoints

---

**Last Updated**: November 8, 2025
