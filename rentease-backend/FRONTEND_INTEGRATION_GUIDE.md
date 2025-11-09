# RentEase Backend - Frontend Integration Guide

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Code Examples](#code-examples)
- [Best Practices](#best-practices)

---

## Overview

RentEase is a rental property management system that connects landlords and tenants. The backend provides REST APIs for:

- User authentication and management
- Bill creation and payment with rewards
- Expense tracking and analytics
- Rent plan submissions and approvals
- Points-based reward system
- Shop items and redemptions
- Role-specific dashboards

**Base URL:** `http://localhost:3001` (development)

**Authentication:** JWT Bearer Token

---

## Getting Started

### Prerequisites

- Backend server running on port 3001
- Valid user account (tenant or landlord)

### Quick Start

```javascript
const API_BASE_URL = "http://localhost:3001";

// 1. Register a user
const registerResponse = await fetch(`${API_BASE_URL}/api/auth/register`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "user@example.com",
    password: "securePassword123",
    name: "John Doe",
    role: "tenant", // or 'landlord'
  }),
});

const { token, user } = await registerResponse.json();

// 2. Use token for authenticated requests
const billsResponse = await fetch(`${API_BASE_URL}/api/bills`, {
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});
```

---

## Authentication

### User Roles

- **`tenant`** - Can pay bills, track expenses, submit rent plans, redeem rewards
- **`landlord`** - Can create bills, approve rent plans, create shop items

### Register New User

**Endpoint:** `POST /api/auth/register`

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "tenant",
  "landlordId": "uuid-of-landlord" // Optional: for tenants
}
```

**Response (201):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "tenant",
    "points": 0,
    "landlordId": null
  }
}
```

### Login

**Endpoint:** `POST /api/auth/login`

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "tenant",
    "points": 150,
    "landlordId": "landlord-uuid"
  }
}
```

### Get Current User

**Endpoint:** `GET /api/auth/me`

**Headers:** `Authorization: Bearer {token}`

**Response (200):**

```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "tenant",
    "points": 150,
    "landlordId": "landlord-uuid"
  }
}
```

---

## API Endpoints

### Bill Management

#### Create Bill (Landlord Only)

**Endpoint:** `POST /api/bills`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**

```json
{
  "tenantId": "tenant-uuid",
  "type": "RENT",
  "amount": 1500.0,
  "dueDate": "2025-12-31",
  "description": "Monthly rent for December" // Optional
}
```

**Response (201):**

```json
{
  "bill": {
    "id": "bill-uuid",
    "tenantId": "tenant-uuid",
    "landlordId": "landlord-uuid",
    "type": "RENT",
    "amount": 1500,
    "dueDate": "2025-12-31T00:00:00.000Z",
    "isPaid": false,
    "paidDate": null,
    "description": "Monthly rent for December",
    "tenant": {
      "id": "tenant-uuid",
      "name": "John Doe",
      "email": "tenant@example.com"
    },
    "landlord": {
      "id": "landlord-uuid",
      "name": "Jane Smith",
      "email": "landlord@example.com"
    }
  }
}
```

#### Get Bills

**Endpoint:** `GET /api/bills`

**Headers:** `Authorization: Bearer {token}`

**Response (200):**

```json
{
  "bills": [
    {
      "id": "bill-uuid",
      "tenantId": "tenant-uuid",
      "landlordId": "landlord-uuid",
      "type": "RENT",
      "amount": 1500,
      "dueDate": "2025-12-31T00:00:00.000Z",
      "isPaid": false,
      "paidDate": null,
      "description": "Monthly rent",
      "tenant": { "id": "...", "name": "...", "email": "..." },
      "landlord": { "id": "...", "name": "...", "email": "..." }
    }
  ]
}
```

#### Pay Bill (Tenant Only)

**Endpoint:** `POST /api/bills/:billId/pay`

**Headers:** `Authorization: Bearer {token}`

**Response (200):**

```json
{
  "bill": {
    "id": "bill-uuid",
    "isPaid": true,
    "paidDate": "2025-11-09T10:30:00.000Z",
    "amount": 1500
  },
  "reward": {
    "id": "reward-uuid",
    "tenantId": "tenant-uuid",
    "billId": "bill-uuid",
    "amount": 1500,
    "pointsEarned": 150,
    "isOnTime": true
  },
  "pointsBalance": 150
}
```

**Note:** Tenants earn 10% of the bill amount in points if paid on time.

---

### Expense Management

#### Add Expense (Tenant Only)

**Endpoint:** `POST /api/expenses`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**

```json
{
  "category": "FOOD",
  "amount": 150.5,
  "date": "2025-11-09",
  "description": "Groceries" // Optional
}
```

**Response (201):**

```json
{
  "expense": {
    "id": "expense-uuid",
    "tenantId": "tenant-uuid",
    "category": "FOOD",
    "amount": 150.5,
    "date": "2025-11-09T00:00:00.000Z",
    "description": "Groceries"
  }
}
```

#### Get Expenses (Tenant Only)

**Endpoint:** `GET /api/expenses`

**Headers:** `Authorization: Bearer {token}`

**Response (200):**

```json
{
  "expenses": [
    {
      "id": "expense-uuid",
      "tenantId": "tenant-uuid",
      "category": "FOOD",
      "amount": 150.5,
      "date": "2025-11-09T00:00:00.000Z",
      "description": "Groceries"
    }
  ]
}
```

#### Get Expense Summary (Tenant Only)

**Endpoint:** `GET /api/expenses/summary`

**Headers:** `Authorization: Bearer {token}`

**Response (200):**

```json
{
  "summary": {
    "total": 500.75,
    "categories": [
      { "category": "FOOD", "amount": 150.5 },
      { "category": "UTILITIES", "amount": 200.25 },
      { "category": "TRANSPORT", "amount": 150.0 }
    ],
    "last30Days": 350.75
  }
}
```

#### Delete Expense (Tenant Only)

**Endpoint:** `DELETE /api/expenses/:expenseId`

**Headers:** `Authorization: Bearer {token}`

**Response:** `204 No Content`

---

### Rent Plan Management

#### Submit Rent Plan (Tenant Only)

**Endpoint:** `POST /api/rent-plans`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**

```json
{
  "landlordId": "landlord-uuid",
  "monthlyRent": 1500.0,
  "deposit": 3000.0,
  "duration": 12
}
```

**Response (201):**

```json
{
  "plan": {
    "id": "plan-uuid",
    "tenantId": "tenant-uuid",
    "landlordId": "landlord-uuid",
    "monthlyRent": 1500,
    "deposit": 3000,
    "duration": 12,
    "status": "pending",
    "proposedDate": "2025-11-09T10:30:00.000Z",
    "reviewedDate": null
  }
}
```

#### Get Rent Plans

**Endpoint:** `GET /api/rent-plans`

**Headers:** `Authorization: Bearer {token}`

**Response (200):**

```json
{
  "plans": [
    {
      "id": "plan-uuid",
      "tenantId": "tenant-uuid",
      "landlordId": "landlord-uuid",
      "monthlyRent": 1500,
      "deposit": 3000,
      "duration": 12,
      "status": "pending",
      "proposedDate": "2025-11-09T10:30:00.000Z",
      "reviewedDate": null
    }
  ]
}
```

#### Approve Rent Plan (Landlord Only)

**Endpoint:** `POST /api/rent-plans/:planId/approve`

**Headers:** `Authorization: Bearer {token}`

**Response (200):**

```json
{
  "plan": {
    "id": "plan-uuid",
    "status": "approved",
    "reviewedDate": "2025-11-09T11:00:00.000Z"
  }
}
```

#### Reject Rent Plan (Landlord Only)

**Endpoint:** `POST /api/rent-plans/:planId/reject`

**Headers:** `Authorization: Bearer {token}`

**Response (200):**

```json
{
  "plan": {
    "id": "plan-uuid",
    "status": "rejected",
    "reviewedDate": "2025-11-09T11:00:00.000Z"
  }
}
```

---

### Rewards System

#### Get Rewards (Tenant Only)

**Endpoint:** `GET /api/rewards`

**Headers:** `Authorization: Bearer {token}`

**Response (200):**

```json
{
  "rewards": [
    {
      "id": "reward-uuid",
      "tenantId": "tenant-uuid",
      "billId": "bill-uuid",
      "amount": 1500,
      "date": "2025-11-09T10:30:00.000Z",
      "isOnTime": true,
      "pointsEarned": 150
    }
  ]
}
```

#### Get Reward Balance (Tenant Only)

**Endpoint:** `GET /api/rewards/balance`

**Headers:** `Authorization: Bearer {token}`

**Response (200):**

```json
{
  "pointsEarned": 300,
  "pointsAvailable": 150
}
```

---

### Shop & Redemptions

#### Get Shop Items

**Endpoint:** `GET /api/shop/items`

**Headers:** `Authorization: Bearer {token}`

**Response (200):**

```json
{
  "items": [
    {
      "id": "item-uuid",
      "name": "Amazon Gift Card",
      "description": "$25 Amazon Gift Card",
      "pointCost": 100,
      "imageUrl": null
    }
  ]
}
```

#### Create Shop Item (Landlord Only)

**Endpoint:** `POST /api/shop/items`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**

```json
{
  "name": "Amazon Gift Card",
  "description": "$25 Amazon Gift Card",
  "pointCost": 100,
  "imageUrl": "https://example.com/image.jpg" // Optional
}
```

**Response (201):**

```json
{
  "item": {
    "id": "item-uuid",
    "name": "Amazon Gift Card",
    "description": "$25 Amazon Gift Card",
    "pointCost": 100,
    "imageUrl": "https://example.com/image.jpg"
  }
}
```

#### Redeem Item (Tenant Only)

**Endpoint:** `POST /api/shop/items/:itemId/redeem`

**Headers:** `Authorization: Bearer {token}`

**Response (200):**

```json
{
  "redemption": {
    "id": "redemption-uuid",
    "tenantId": "tenant-uuid",
    "itemId": "item-uuid",
    "itemName": "Amazon Gift Card",
    "pointsSpent": 100,
    "date": "2025-11-09T11:30:00.000Z"
  },
  "pointsBalance": 50
}
```

**Error Response (400):**

```json
{
  "error": "Not enough points to redeem item"
}
```

#### Get Redemptions

**Endpoint:** `GET /api/shop/redemptions`

**Headers:** `Authorization: Bearer {token}`

**Response (200):**

```json
{
  "redemptions": [
    {
      "id": "redemption-uuid",
      "tenantId": "tenant-uuid",
      "itemId": "item-uuid",
      "itemName": "Amazon Gift Card",
      "pointsSpent": 100,
      "date": "2025-11-09T11:30:00.000Z"
    }
  ]
}
```

---

### Dashboards

#### Tenant Dashboard

**Endpoint:** `GET /api/dashboard/tenant`

**Headers:** `Authorization: Bearer {token}`

**Response (200):**

```json
{
  "bills": {
    "upcoming": [
      {
        "id": "bill-uuid",
        "type": "RENT",
        "amount": 1500,
        "dueDate": "2025-12-31T00:00:00.000Z",
        "isPaid": false
      }
    ],
    "outstandingTotal": 1500
  },
  "expenses": {
    "total": 500.75,
    "categories": [{ "category": "FOOD", "amount": 150.5 }],
    "last30Days": 350.75
  },
  "rewards": {
    "points": 150
  },
  "redemptions": [
    {
      "id": "redemption-uuid",
      "itemName": "Gift Card",
      "pointsSpent": 100,
      "date": "2025-11-09T11:30:00.000Z"
    }
  ]
}
```

#### Landlord Dashboard

**Endpoint:** `GET /api/dashboard/landlord`

**Headers:** `Authorization: Bearer {token}`

**Response (200):**

```json
{
  "tenants": [
    {
      "id": "tenant-uuid",
      "name": "John Doe",
      "email": "john@example.com"
    }
  ],
  "bills": {
    "outstandingTotal": 3000,
    "outstandingCount": 2
  },
  "rentPlans": [
    {
      "id": "plan-uuid",
      "tenant": {
        "id": "tenant-uuid",
        "name": "John Doe"
      },
      "monthlyRent": 1500,
      "status": "pending"
    }
  ],
  "payments": [
    {
      "id": "bill-uuid",
      "tenant": {
        "id": "tenant-uuid",
        "name": "John Doe"
      },
      "amount": 1500,
      "paidDate": "2025-11-09T10:30:00.000Z"
    }
  ]
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
  points: number;
  landlordId: string | null;
}
```

### Bill

```typescript
interface Bill {
  id: string;
  tenantId: string;
  landlordId: string;
  type: string;
  amount: number;
  dueDate: string; // ISO 8601
  isPaid: boolean;
  paidDate: string | null; // ISO 8601
  description: string | null;
  tenant?: {
    id: string;
    name: string;
    email: string;
  };
  landlord?: {
    id: string;
    name: string;
    email: string;
  };
}
```

### Expense

```typescript
interface Expense {
  id: string;
  tenantId: string;
  category: string;
  amount: number;
  date: string; // ISO 8601
  description: string | null;
}
```

### RentPlan

```typescript
interface RentPlan {
  id: string;
  tenantId: string;
  landlordId: string;
  monthlyRent: number;
  deposit: number;
  duration: number;
  status: "pending" | "approved" | "rejected";
  proposedDate: string; // ISO 8601
  reviewedDate: string | null; // ISO 8601
}
```

### Reward

```typescript
interface Reward {
  id: string;
  tenantId: string;
  billId: string;
  amount: number;
  date: string; // ISO 8601
  isOnTime: boolean;
  pointsEarned: number;
}
```

### ShopItem

```typescript
interface ShopItem {
  id: string;
  name: string;
  description: string;
  pointCost: number;
  imageUrl: string | null;
}
```

### Redemption

```typescript
interface Redemption {
  id: string;
  tenantId: string;
  itemId: string;
  itemName: string;
  pointsSpent: number;
  date: string; // ISO 8601
}
```

---

## Error Handling

### Standard Error Response

```json
{
  "error": "Error message"
}
```

### HTTP Status Codes

| Code | Meaning               | When It Occurs                               |
| ---- | --------------------- | -------------------------------------------- |
| 200  | OK                    | Successful GET, PUT, or POST request         |
| 201  | Created               | Successfully created a new resource          |
| 204  | No Content            | Successfully deleted a resource              |
| 400  | Bad Request           | Missing required fields, invalid data        |
| 401  | Unauthorized          | Missing or invalid authentication token      |
| 403  | Forbidden             | User doesn't have permission for this action |
| 404  | Not Found             | Resource not found                           |
| 409  | Conflict              | Resource already exists (e.g., email in use) |
| 500  | Internal Server Error | Server error                                 |

### Common Error Scenarios

#### Authentication Errors

```json
// Missing token
{ "error": "Unauthorized" }

// Invalid credentials
{ "error": "Invalid credentials" }
```

#### Validation Errors

```json
// Missing required fields
{ "error": "Missing required fields" }

// Invalid role
{ "error": "Invalid role" }

// Invalid amount
{ "error": "Invalid amount" }
```

#### Authorization Errors

```json
// Wrong role
{ "error": "Only landlords can create bills" }
{ "error": "Only tenants can pay bills" }
```

#### Business Logic Errors

```json
// Insufficient points
{ "error": "Not enough points to redeem item" }

// Bill already paid
{ "error": "Bill already paid" }

// Rent plan already reviewed
{ "error": "Rent plan already reviewed" }
```

---

## Code Examples

### React Example with Fetch API

```javascript
import { useState, useEffect } from "react";

const API_BASE_URL = "http://localhost:3001";

// Authentication Hook
function useAuth() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);

  const login = async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    const data = await response.json();
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("token", data.token);
    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
  };

  return { token, user, login, logout };
}

// Bills Component
function BillsList() {
  const { token } = useAuth();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBills();
  }, [token]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/bills`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch bills");
      }

      const data = await response.json();
      setBills(data.bills);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const payBill = async (billId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bills/${billId}/pay`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const data = await response.json();
      alert(`Bill paid! You earned ${data.reward?.pointsEarned || 0} points!`);
      fetchBills(); // Refresh the list
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Bills</h2>
      {bills.map((bill) => (
        <div
          key={bill.id}
          style={{ border: "1px solid #ccc", padding: "10px", margin: "10px" }}
        >
          <h3>{bill.type}</h3>
          <p>Amount: ${bill.amount}</p>
          <p>Due: {new Date(bill.dueDate).toLocaleDateString()}</p>
          <p>Status: {bill.isPaid ? "Paid" : "Unpaid"}</p>
          {!bill.isPaid && (
            <button onClick={() => payBill(bill.id)}>Pay Bill</button>
          )}
        </div>
      ))}
    </div>
  );
}
```

### Axios Example

```javascript
import axios from "axios";

const API_BASE_URL = "http://localhost:3001";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// API Methods
export const authAPI = {
  register: (data) => api.post("/api/auth/register", data),
  login: (data) => api.post("/api/auth/login", data),
  me: () => api.get("/api/auth/me"),
};

export const billsAPI = {
  getAll: () => api.get("/api/bills"),
  create: (data) => api.post("/api/bills", data),
  pay: (billId) => api.post(`/api/bills/${billId}/pay`),
};

export const expensesAPI = {
  getAll: () => api.get("/api/expenses"),
  create: (data) => api.post("/api/expenses", data),
  delete: (expenseId) => api.delete(`/api/expenses/${expenseId}`),
  summary: () => api.get("/api/expenses/summary"),
};

export const rentPlansAPI = {
  getAll: () => api.get("/api/rent-plans"),
  submit: (data) => api.post("/api/rent-plans", data),
  approve: (planId) => api.post(`/api/rent-plans/${planId}/approve`),
  reject: (planId) => api.post(`/api/rent-plans/${planId}/reject`),
};

export const rewardsAPI = {
  getAll: () => api.get("/api/rewards"),
  balance: () => api.get("/api/rewards/balance"),
};

export const shopAPI = {
  getItems: () => api.get("/api/shop/items"),
  createItem: (data) => api.post("/api/shop/items", data),
  redeemItem: (itemId) => api.post(`/api/shop/items/${itemId}/redeem`),
  getRedemptions: () => api.get("/api/shop/redemptions"),
};

export const dashboardAPI = {
  tenant: () => api.get("/api/dashboard/tenant"),
  landlord: () => api.get("/api/dashboard/landlord"),
};

// Usage Example
async function example() {
  try {
    // Login
    const { data: loginData } = await authAPI.login({
      email: "user@example.com",
      password: "password123",
    });
    localStorage.setItem("token", loginData.token);

    // Get bills
    const { data: billsData } = await billsAPI.getAll();
    console.log("Bills:", billsData.bills);

    // Pay a bill
    const { data: paymentData } = await billsAPI.pay("bill-uuid");
    console.log("Points earned:", paymentData.reward?.pointsEarned);
  } catch (error) {
    console.error("Error:", error.response?.data?.error || error.message);
  }
}
```

### TypeScript API Client

```typescript
// types.ts
export interface User {
  id: string;
  email: string;
  name: string;
  role: "tenant" | "landlord";
  points: number;
  landlordId: string | null;
}

export interface Bill {
  id: string;
  tenantId: string;
  landlordId: string;
  type: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  paidDate: string | null;
  description: string | null;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// api-client.ts
class RentEaseAPI {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Request failed");
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string): Promise<LoginResponse> {
    return this.request<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: {
    email: string;
    password: string;
    name: string;
    role: "tenant" | "landlord";
    landlordId?: string;
  }): Promise<LoginResponse> {
    return this.request<LoginResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getCurrentUser(): Promise<{ user: User }> {
    return this.request<{ user: User }>("/api/auth/me");
  }

  // Bills
  async getBills(): Promise<{ bills: Bill[] }> {
    return this.request<{ bills: Bill[] }>("/api/bills");
  }

  async createBill(data: {
    tenantId: string;
    type: string;
    amount: number;
    dueDate: string;
    description?: string;
  }): Promise<{ bill: Bill }> {
    return this.request<{ bill: Bill }>("/api/bills", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async payBill(billId: string): Promise<any> {
    return this.request(`/api/bills/${billId}/pay`, {
      method: "POST",
    });
  }

  // ... Add other methods as needed
}

// Usage
const api = new RentEaseAPI("http://localhost:3001");

async function init() {
  const loginResponse = await api.login("user@example.com", "password123");
  api.setToken(loginResponse.token);

  const bills = await api.getBills();
  console.log("Bills:", bills.bills);
}
```

---

## Best Practices

### 1. Token Management

```javascript
// Store token securely
localStorage.setItem('token', token);

// Include in all authenticated requests
headers: {
  'Authorization': `Bearer ${token}`
}

// Clear token on logout
localStorage.removeItem('token');

// Handle token expiration (tokens expire in 7 days)
if (error.response?.status === 401) {
  // Redirect to login
  localStorage.removeItem('token');
  window.location.href = '/login';
}
```

### 2. Error Handling

```javascript
try {
  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.json();
    // Show user-friendly message
    showNotification(error.error || "Something went wrong");
    return;
  }

  const data = await response.json();
  // Handle success
} catch (error) {
  // Handle network errors
  showNotification("Network error. Please check your connection.");
}
```

### 3. Loading States

```javascript
const [loading, setLoading] = useState(false);

const fetchData = async () => {
  setLoading(true);
  try {
    // API call
  } finally {
    setLoading(false);
  }
};
```

### 4. Date Formatting

```javascript
// Parse ISO dates from API
const date = new Date(bill.dueDate);
const formatted = date.toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

// Send dates to API in YYYY-MM-DD format
const dateStr = date.toISOString().split("T")[0];
```

### 5. Role-Based UI

```javascript
function Dashboard() {
  const { user } = useAuth();

  if (user.role === "tenant") {
    return <TenantDashboard />;
  } else {
    return <LandlordDashboard />;
  }
}
```

### 6. Points Display

```javascript
// Show points with proper formatting
function PointsBalance({ points }) {
  return (
    <div>
      <span>{points.toLocaleString()}</span> points
    </div>
  );
}

// Calculate potential rewards
function BillItem({ bill }) {
  const potentialPoints = Math.round(bill.amount * 0.1);

  return (
    <div>
      <p>Amount: ${bill.amount}</p>
      <p>Earn up to {potentialPoints} points if paid on time!</p>
    </div>
  );
}
```

### 7. Optimistic Updates

```javascript
const payBill = async (billId) => {
  // Optimistically update UI
  setBills(
    bills.map((bill) => (bill.id === billId ? { ...bill, isPaid: true } : bill))
  );

  try {
    await billsAPI.pay(billId);
    // Success - refresh to get accurate data
    fetchBills();
  } catch (error) {
    // Revert on error
    fetchBills();
    showError(error.message);
  }
};
```

### 8. API Response Caching

```javascript
// Simple cache implementation
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function fetchWithCache(key, fetchFn) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const data = await fetchFn();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}

// Usage
const bills = await fetchWithCache("bills", () => billsAPI.getAll());
```

---

## Testing Your Integration

### Quick Health Check

```bash
curl http://localhost:3001/health
```

### Test Authentication

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123","name":"Test User","role":"tenant"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}'
```

### Test Authenticated Endpoint

```bash
# Replace YOUR_TOKEN with actual token
curl http://localhost:3001/api/bills \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Support & Resources

- **API Test Script:** Run `./test-apis.sh` to verify all endpoints
- **Test Summary:** See `API_TEST_SUMMARY.md` for detailed test results
- **Backend Source:** Check `/src` directory for implementation details

---

## Common Integration Patterns

### Dashboard Data Loading

```javascript
async function loadTenantDashboard() {
  const [dashboard, rewards, bills] = await Promise.all([
    api.get("/api/dashboard/tenant"),
    api.get("/api/rewards/balance"),
    api.get("/api/bills"),
  ]);

  return {
    ...dashboard.data,
    rewardBalance: rewards.data,
    allBills: bills.data.bills,
  };
}
```

### Form Submission with Validation

```javascript
async function submitExpense(formData) {
  // Client-side validation
  if (!formData.category || !formData.amount || !formData.date) {
    throw new Error("Please fill all required fields");
  }

  if (formData.amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  // Submit to API
  const response = await expensesAPI.create(formData);
  return response.data.expense;
}
```

### Real-time Points Update

```javascript
function PointsWidget() {
  const [points, setPoints] = useState(0);

  const updatePoints = async () => {
    const { data } = await rewardsAPI.balance();
    setPoints(data.pointsAvailable);
  };

  // Update after any point-affecting action
  const handleBillPayment = async (billId) => {
    await billsAPI.pay(billId);
    await updatePoints(); // Refresh points
  };

  return <div>Points: {points}</div>;
}
```

---

## Version Information

- **API Version:** 1.0
- **Last Updated:** November 9, 2025
- **Backend Framework:** Express.js
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT (7-day expiration)

---

For any issues or questions, please check the test scripts and API documentation in the repository.
