# Demo Tenant Setup

## Overview

The demo tenant account is fully loaded with mock data and does NOT require any backend integration. Everything works completely offline using local mock data.

## Demo Account Credentials

- **Email**: `demo@example.com`
- **Password**: Any password works (e.g., `demo`)

## What's Pre-loaded for Demo Tenant

### 1. **User Profile**

- Name: Demo Tenant
- Email: demo@example.com
- Points Balance: 350 points
- Role: Tenant

### 2. **Bills** (8 bills total)

- **October 2025**:

  - Rent: $1,800 (Paid on Sep 28)
  - Utilities: $165 (Paid on Oct 3)
  - Internet: $90 (Paid on Oct 9)

- **November 2025**:

  - Rent: $1,800 (Paid on Sep 30)
  - Utilities: $158 (Paid on Nov 4)
  - Internet: $90 (Unpaid - Due Nov 10)
  - Parking Fee: $250 (Unpaid - Due Nov 15)

- **December 2025**:
  - Rent: $1,800 (Unpaid - Due Dec 1)

### 3. **Expenses** (14 expenses total)

Covering multiple categories:

- **Food**: Groceries, restaurants, dining out
- **Transportation**: Gas, Uber rides
- **Entertainment**: Movies, concerts, streaming services
- **Healthcare**: Pharmacy, prescriptions
- **Shopping**: Clothing and accessories
- **Utilities**: Phone bills

Total expenses span across October and November 2025.

### 4. **Rent Plan**

- Monthly Rent: $1,800
- Deposit: $3,600
- Duration: 12 months
- Status: Approved
- Start Date: September 2025

### 5. **Shop Items** (8 items available)

- $10 Starbucks Gift Card (50 points)
- Movie Night Package (80 points)
- $25 Amazon Gift Card (100 points)
- Gym Membership - 1 Month (120 points)
- $50 Grocery Voucher (150 points)
- Free Cleaning Service (200 points)
- $100 Uber Credit (250 points)
- Spa Day Package (300 points)

### 6. **Redemption History** (3 redemptions)

- Movie Night Package (80 points) - Oct 15, 2025
- $25 Amazon Gift Card (100 points) - Oct 22, 2025
- $10 Starbucks Gift Card (50 points) - Nov 2, 2025

### 7. **Payment History** (5 payments)

All payments made on time, earning bonus points:

- October Rent payment: +50 points
- October Utilities: +25 points
- October Internet: +15 points
- November Rent: +50 points
- November Utilities: +25 points

**Total Points Earned**: 165 points from on-time payments
**Total Points Spent**: 230 points on redemptions
**Current Balance**: 350 points

## How to Use Demo Tenant

### Option 1: Quick Login Button

1. Go to the login page
2. Click the "Demo Tenant" button
3. Automatically logs in with full mock data

### Option 2: Manual Login

1. Go to the login page
2. Enter email: `demo@example.com`
3. Enter any password
4. Click "Sign In"

## Features Available (No Backend Required)

### ✅ Dashboard

- View all unpaid bills
- See monthly expense summary
- Check points balance
- View rent plan details

### ✅ Bills Page

- View all bills (paid and unpaid)
- Filter by status
- See payment history
- Mark bills as paid (updates mock data)

### ✅ Expenses Page

- View all expenses by category
- See spending breakdown
- Add new expenses (saved to mock data)
- Delete expenses
- Filter by month/year
- View expense charts and summaries

### ✅ Rent Plan Page

- View current rent plan details
- See approval status
- Check payment schedule

### ✅ Shop Page

- Browse all reward items
- Redeem items with points
- View redemption history
- Points automatically deducted

## Technical Details

### Mock Data Location

- `/lib/mockData.ts` - Contains all mock data arrays
- `/lib/mockApi.ts` - Mock API functions that return mock data

### API Integration

- `/lib/api.ts` - Checks if user is demo tenant
- If demo tenant → uses mock API
- If regular user → calls real backend API

### How It Works

1. User logs in with `demo@example.com`
2. System detects demo tenant via `isDemoTenant()` function
3. All API calls are intercepted and routed to mock API
4. Mock data is returned instantly (with simulated delay for realism)
5. Changes (like redemptions, new expenses) are stored in memory
6. Points are updated in localStorage and sync across pages

### Key Functions

```typescript
// Check if email is demo tenant
isDemoTenant(email: string): boolean

// Check if current logged-in user is demo
isCurrentUserDemo(): boolean
```

## Benefits of Demo Mode

1. **No Backend Required**: Works completely offline
2. **Instant Demo**: No database setup or API configuration needed
3. **Realistic Data**: Pre-populated with meaningful, realistic data
4. **Full Functionality**: All features work as if connected to real backend
5. **Safe Testing**: Changes only affect local mock data, not real database

## Extending Mock Data

To add more data for demo tenant:

1. Edit `/lib/mockData.ts`
2. Add new items with `tenantId: 'demo-tenant'`
3. Mock data will automatically be available

Example:

```typescript
{
  id: 'demo-bill-9',
  tenantId: 'demo-tenant',
  landlordId: 'landlord-1',
  type: 'other',
  amount: 100,
  dueDate: new Date(2025, 11, 15).toISOString(),
  isPaid: false,
  description: 'New Bill Item',
}
```

## Notes

- Demo tenant data is separate from regular tenant data
- Changes persist only in browser session (localStorage)
- Refresh page to reset to default mock data
- All API calls have realistic 300ms delay for better UX
- Points system works exactly like production
