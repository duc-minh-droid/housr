# RentEase API Quick Reference

**Base URL:** `http://localhost:5001`

## Authentication

| Endpoint             | Method | Auth | Description       |
| -------------------- | ------ | ---- | ----------------- |
| `/api/auth/register` | POST   | No   | Register new user |
| `/api/auth/login`    | POST   | No   | Login user        |
| `/api/auth/me`       | GET    | Yes  | Get current user  |

## Bills

| Endpoint             | Method | Auth | Role     | Description   |
| -------------------- | ------ | ---- | -------- | ------------- |
| `/api/bills`         | GET    | Yes  | Both     | Get all bills |
| `/api/bills`         | POST   | Yes  | Landlord | Create bill   |
| `/api/bills/:id/pay` | POST   | Yes  | Tenant   | Pay bill      |

## Expenses

| Endpoint                | Method | Auth | Role   | Description    |
| ----------------------- | ------ | ---- | ------ | -------------- |
| `/api/expenses`         | GET    | Yes  | Tenant | Get expenses   |
| `/api/expenses`         | POST   | Yes  | Tenant | Add expense    |
| `/api/expenses/:id`     | DELETE | Yes  | Tenant | Delete expense |
| `/api/expenses/summary` | GET    | Yes  | Tenant | Get summary    |

## Rent Plans

| Endpoint                      | Method | Auth | Role     | Description    |
| ----------------------------- | ------ | ---- | -------- | -------------- |
| `/api/rent-plans`             | GET    | Yes  | Both     | Get rent plans |
| `/api/rent-plans`             | POST   | Yes  | Tenant   | Submit plan    |
| `/api/rent-plans/:id/approve` | POST   | Yes  | Landlord | Approve plan   |
| `/api/rent-plans/:id/reject`  | POST   | Yes  | Landlord | Reject plan    |

## Rewards

| Endpoint               | Method | Auth | Role   | Description        |
| ---------------------- | ------ | ---- | ------ | ------------------ |
| `/api/rewards`         | GET    | Yes  | Tenant | Get reward history |
| `/api/rewards/balance` | GET    | Yes  | Tenant | Get points balance |

## Shop

| Endpoint                     | Method | Auth | Role     | Description     |
| ---------------------------- | ------ | ---- | -------- | --------------- |
| `/api/shop/items`            | GET    | Yes  | Both     | Get shop items  |
| `/api/shop/items`            | POST   | Yes  | Landlord | Create item     |
| `/api/shop/items/:id/redeem` | POST   | Yes  | Tenant   | Redeem item     |
| `/api/shop/redemptions`      | GET    | Yes  | Both     | Get redemptions |

## Dashboards

| Endpoint                  | Method | Auth | Role     | Description        |
| ------------------------- | ------ | ---- | -------- | ------------------ |
| `/api/dashboard/tenant`   | GET    | Yes  | Tenant   | Tenant dashboard   |
| `/api/dashboard/landlord` | GET    | Yes  | Landlord | Landlord dashboard |

## Response Codes

- **200** - OK
- **201** - Created
- **204** - No Content (Delete)
- **400** - Bad Request
- **401** - Unauthorized
- **403** - Forbidden
- **404** - Not Found
- **409** - Conflict
- **500** - Server Error

## Bill Types

- `RENT`
- `UTILITIES`
- `INTERNET`
- Other custom types

## Expense Categories

- `FOOD`
- `UTILITIES`
- `TRANSPORT`
- `ENTERTAINMENT`
- Other custom categories

## Rent Plan Status

- `pending` - Awaiting review
- `approved` - Approved by landlord
- `rejected` - Rejected by landlord

## Points System

- Tenants earn **10% of bill amount** in points when paying on time
- Points can be redeemed for shop items
- `pointsEarned` - Total points ever earned
- `pointsAvailable` - Points available to spend

## Common Request Bodies

### Register

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "tenant",
  "landlordId": "uuid" // Optional for tenants
}
```

### Create Bill

```json
{
  "tenantId": "uuid",
  "type": "RENT",
  "amount": 1500,
  "dueDate": "2025-12-31",
  "description": "Monthly rent" // Optional
}
```

### Create Expense

```json
{
  "category": "FOOD",
  "amount": 150.5,
  "date": "2025-11-09",
  "description": "Groceries" // Optional
}
```

### Submit Rent Plan

```json
{
  "landlordId": "uuid",
  "monthlyRent": 1500,
  "deposit": 3000,
  "duration": 12
}
```

### Create Shop Item

```json
{
  "name": "Gift Card",
  "description": "$25 Gift Card",
  "pointCost": 100,
  "imageUrl": "https://..." // Optional
}
```
