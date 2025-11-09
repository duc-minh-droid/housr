# Migration Guide: Old API to New API Client

This guide helps you migrate from the old `lib/api.ts` to the new `lib/apiClient.ts`.

## Key Changes

### 1. Port Changed: 5000 → 5001

The backend now runs on **port 5001** instead of 5000.

### 2. Response Structure

The new API wraps responses in consistent structures:

**Old:**

```typescript
const bills = await billsApi.getBills(); // Returns Bill[]
```

**New:**

```typescript
const { bills } = await apiClient.getBills(); // Returns { bills: Bill[] }
```

### 3. Token Management

The new API client handles token management automatically:

**Old:**

```typescript
const { token, user } = await authApi.login(email, password);
localStorage.setItem("token", token);
```

**New:**

```typescript
const { token, user } = await apiClient.login(email, password);
apiClient.setToken(token); // Automatically saves to localStorage
```

### 4. Field Name Changes

#### Authentication

**Old:**

```typescript
{
  first_name: 'John',
  last_name: 'Doe',
  // Returns: access_token
}
```

**New:**

```typescript
{
  name: 'John Doe',
  // Returns: token
}
```

#### Bills

**Old:**

```typescript
{
  title: 'Rent',
  category: 'rent',
  due_date: '2025-12-31',
  user_id: 123
}
```

**New:**

```typescript
{
  tenantId: 'uuid',
  type: 'RENT',
  amount: 1500,
  dueDate: '2025-12-31'
}
```

#### Rent Plans

**Old:**

```typescript
{
  rent_amount: 1500,
  deposit_amount: 3000,
  duration_months: 12,
  start_date: '2025-01-01',
  landlord_id: 123
}
// Response: rent_plan or rent_plans
```

**New:**

```typescript
{
  landlordId: 'uuid',
  monthlyRent: 1500,
  deposit: 3000,
  duration: 12
}
// Response: plan or plans
```

#### Shop Items

**Old:**

```typescript
{
  point_cost: 100,
  available: true
}
```

**New:**

```typescript
{
  pointCost: 100,
  imageUrl: 'https://...'
}
```

## Migration Steps

### Step 1: Update Imports

**Old:**

```typescript
import { authApi, billsApi, expensesApi } from "@/lib/api";
```

**New:**

```typescript
import { apiClient } from "@/lib/apiClient";
```

### Step 2: Update Authentication

**Old:**

```typescript
// Login
const { token, user } = await authApi.login(email, password);
localStorage.setItem("token", token);
localStorage.setItem("user", JSON.stringify(user));

// Signup
await authApi.signup(firstName, lastName, email, password, role);

// Get profile
const user = await authApi.getProfile();
```

**New:**

```typescript
// Login
const { token, user } = await apiClient.login(email, password);
apiClient.setToken(token);
localStorage.setItem("user", JSON.stringify(user));

// Signup
await apiClient.register({
  name: `${firstName} ${lastName}`,
  email,
  password,
  role,
});

// Get profile
const { user } = await apiClient.getCurrentUser();
```

### Step 3: Update Bill Operations

**Old:**

```typescript
// Get bills
const bills = await billsApi.getBills();
const tenantBills = await billsApi.getTenantBills();
const landlordBills = await billsApi.getLandlordBills();

// Create bill
await billsApi.createBill({
  title: "Rent",
  amount: 1500,
  category: "rent",
  due_date: "2025-12-31",
  user_id: 123,
});

// Pay bill
await billsApi.payBill(billId, paidDate);
```

**New:**

```typescript
// Get bills (works for both roles)
const { bills } = await apiClient.getBills();

// Create bill
const { bill } = await apiClient.createBill({
  tenantId: "uuid",
  type: "RENT",
  amount: 1500,
  dueDate: "2025-12-31",
  description: "Monthly rent",
});

// Pay bill (no date parameter)
const response = await apiClient.payBill(billId);
console.log("Points earned:", response.reward?.pointsEarned);
```

### Step 4: Update Expenses

**Old:**

```typescript
// Get expenses
const expenses = await expensesApi.getExpenses();
const tenantExpenses = await expensesApi.getTenantExpenses();

// Create expense
await expensesApi.createExpense({
  category: "FOOD",
  amount: 150,
  date: "2025-11-09",
  description: "Groceries",
});

// Delete expense
await expensesApi.deleteExpense(expenseId);

// Get summary
const summary = await expensesApi.getSummary();
```

**New:**

```typescript
// Get expenses
const { expenses } = await apiClient.getExpenses();

// Create expense (same structure)
const { expense } = await apiClient.createExpense({
  category: "FOOD",
  amount: 150,
  date: "2025-11-09",
  description: "Groceries",
});

// Delete expense (same)
await apiClient.deleteExpense(expenseId);

// Get summary
const { summary } = await apiClient.getExpenseSummary();
```

### Step 5: Update Rent Plans

**Old:**

```typescript
// Get plans
const plans = await rentPlansApi.getRentPlans();
const tenantPlan = await rentPlansApi.getTenantPlan();
const landlordPlans = await rentPlansApi.getLandlordPlans();

// Create plan
await rentPlansApi.createPlan({
  rent_amount: 1500,
  deposit_amount: 3000,
  duration_months: 12,
  start_date: "2025-01-01",
  landlord_id: 123,
});

// Approve/Reject
await rentPlansApi.approvePlan(planId);
await rentPlansApi.rejectPlan(planId);
```

**New:**

```typescript
// Get plans
const { plans } = await apiClient.getRentPlans();
// Note: No separate tenant/landlord methods
const tenantPlan = plans.length > 0 ? plans[0] : null;

// Submit plan
const { plan } = await apiClient.submitRentPlan({
  landlordId: "uuid",
  monthlyRent: 1500,
  deposit: 3000,
  duration: 12,
});

// Approve/Reject
const { plan: approvedPlan } = await apiClient.approveRentPlan(planId);
const { plan: rejectedPlan } = await apiClient.rejectRentPlan(planId);
```

### Step 6: Update Rewards & Shop

**Old:**

```typescript
// Get rewards
const rewards = await rewardsApi.getRewardHistory();
const balance = await rewardsApi.getBalance();
const { points } = await rewardsApi.getTenantPoints();

// Shop
const items = await shopApi.getItems();
const redemption = await shopApi.redeemItem(itemId);
const redemptions = await shopApi.getRedemptions();

// Create item
await shopApi.createItem({
  name: "Gift Card",
  description: "$25 Gift Card",
  point_cost: 100,
  available: true,
});
```

**New:**

```typescript
// Get rewards
const { rewards } = await apiClient.getRewards();
const balance = await apiClient.getRewardBalance();
const points = balance.pointsAvailable;

// Shop
const { items } = await apiClient.getShopItems();
const response = await apiClient.redeemShopItem(itemId);
console.log("Points remaining:", response.pointsBalance);
const { redemptions } = await apiClient.getRedemptions();

// Create item
const { item } = await apiClient.createShopItem({
  name: "Gift Card",
  description: "$25 Gift Card",
  pointCost: 100,
  imageUrl: "https://...",
});
```

### Step 7: Update Dashboards

**Old:**

```typescript
const tenantDashboard = await dashboardApi.getTenantDashboard();
const landlordDashboard = await dashboardApi.getLandlordDashboard();
```

**New:**

```typescript
const tenantDashboard = await apiClient.getTenantDashboard();
const landlordDashboard = await apiClient.getLandlordDashboard();
```

## Component Migration Example

### Before: Login Component

```typescript
"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin() {
    try {
      const { token, user } = await authApi.login(email, password);
      login(token, user);
    } catch (err: any) {
      setError(err.message);
    }
  }

  // ... rest of component
}
```

### After: Login Component

```typescript
"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/apiClient";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin() {
    try {
      const { token, user } = await apiClient.login(email, password);
      apiClient.setToken(token); // Auto-saves to localStorage
      login(token, user);
    } catch (err: any) {
      setError(err.message);
    }
  }

  // ... rest of component
}
```

## Common Pitfalls

### 1. Destructuring Responses

**Wrong:**

```typescript
const bills = await apiClient.getBills(); // TypeError: bills is undefined
```

**Right:**

```typescript
const { bills } = await apiClient.getBills();
```

### 2. IDs are UUIDs (strings), not numbers

**Wrong:**

```typescript
tenantId: parseInt(tenantId); // Don't parse to number
```

**Right:**

```typescript
tenantId: tenantId; // Keep as string UUID
```

### 3. Field Name Case

**Wrong:**

```typescript
{
  monthly_rent: 1500, // Snake case
  deposit_amount: 3000
}
```

**Right:**

```typescript
{
  monthlyRent: 1500, // Camel case
  deposit: 3000
}
```

### 4. Bill Type Format

**Wrong:**

```typescript
type: "rent"; // Lowercase
```

**Right:**

```typescript
type: "RENT"; // Uppercase
```

## Testing Your Migration

1. **Check Environment Variable**

   ```bash
   # In .env.local
   NEXT_PUBLIC_API_URL=http://localhost:5001
   ```

2. **Test Authentication First**

   - Try logging in
   - Check if token is saved
   - Verify authenticated requests work

3. **Test Each Feature**

   - Bills CRUD
   - Expenses CRUD
   - Rent plan submission/approval
   - Shop item redemption

4. **Check Browser Console**

   - Look for network errors
   - Verify response structures
   - Check for CORS issues

5. **Monitor Network Tab**
   - Verify requests go to port 5001
   - Check request/response formats
   - Ensure Authorization header is present

## Rollback Plan

If you need to temporarily rollback:

1. Keep the old `lib/api.ts` file
2. Change `.env.local` back to port 5000
3. Revert your imports
4. The old API will continue to work with mock data

## Benefits of New API Client

✅ Type-safe with TypeScript
✅ Consistent response structures
✅ Automatic token management
✅ Built-in error handling
✅ 401 auto-logout
✅ Cleaner, more maintainable code
✅ Matches backend documentation exactly

## Need Help?

- Check `API_EXAMPLES.md` for usage examples
- See `API_QUICK_REF.md` for endpoint reference
- Read `BACKEND_INTEGRATION.md` for full API docs
