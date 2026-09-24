# API Integration Examples

This document provides practical examples for integrating with the RentEase backend API (port 5001).

## Using the New API Client

The new API client (`lib/apiClient.ts`) provides a type-safe, clean interface to the backend.

### Authentication

```typescript
import { apiClient } from "@/lib/apiClient";

// Register a new user
async function registerUser() {
  try {
    const { token, user } = await apiClient.register({
      email: "user@example.com",
      password: "securePassword123",
      name: "John Doe",
      role: "tenant",
      landlordId: "landlord-uuid", // Optional: for tenants
    });

    // Token is automatically saved
    apiClient.setToken(token);
    console.log("User registered:", user);
  } catch (error) {
    console.error("Registration failed:", error.message);
  }
}

// Login
async function loginUser() {
  try {
    const { token, user } = await apiClient.login(
      "user@example.com",
      "password123"
    );

    apiClient.setToken(token);
    console.log("Logged in:", user);
    return { token, user };
  } catch (error) {
    console.error("Login failed:", error.message);
  }
}

// Get current user
async function getCurrentUser() {
  try {
    const { user } = await apiClient.getCurrentUser();
    console.log("Current user:", user);
    return user;
  } catch (error) {
    console.error("Failed to get user:", error.message);
  }
}

// Logout
function logout() {
  apiClient.clearToken();
  // Redirect to login page
  window.location.href = "/login";
}
```

### Bills Management

```typescript
import { apiClient } from "@/lib/apiClient";

// Get all bills (works for both landlord and tenant)
async function fetchBills() {
  try {
    const { bills } = await apiClient.getBills();
    console.log("Bills:", bills);
    return bills;
  } catch (error) {
    console.error("Failed to fetch bills:", error.message);
  }
}

// Create a bill (Landlord only)
async function createBill() {
  try {
    const { bill } = await apiClient.createBill({
      tenantId: "tenant-uuid",
      type: "RENT",
      amount: 1500.0,
      dueDate: "2025-12-31",
      description: "Monthly rent for December",
    });

    console.log("Bill created:", bill);
    return bill;
  } catch (error) {
    console.error("Failed to create bill:", error.message);
  }
}

// Pay a bill (Tenant only)
async function payBill(billId: string) {
  try {
    const response = await apiClient.payBill(billId);
    const { bill, reward, pointsBalance } = response;

    console.log("Bill paid:", bill);
    console.log("Points earned:", reward?.pointsEarned || 0);
    console.log("Points balance:", pointsBalance);

    return response;
  } catch (error) {
    console.error("Failed to pay bill:", error.message);
  }
}
```

### Expenses Management

```typescript
import { apiClient } from "@/lib/apiClient";

// Get all expenses (Tenant only)
async function fetchExpenses() {
  try {
    const { expenses } = await apiClient.getExpenses();
    console.log("Expenses:", expenses);
    return expenses;
  } catch (error) {
    console.error("Failed to fetch expenses:", error.message);
  }
}

// Add an expense (Tenant only)
async function addExpense() {
  try {
    const { expense } = await apiClient.createExpense({
      category: "FOOD",
      amount: 150.5,
      date: "2025-11-09",
      description: "Groceries",
    });

    console.log("Expense added:", expense);
    return expense;
  } catch (error) {
    console.error("Failed to add expense:", error.message);
  }
}

// Get expense summary (Tenant only)
async function getExpenseSummary() {
  try {
    const { summary } = await apiClient.getExpenseSummary();
    console.log("Total expenses:", summary.total);
    console.log("By category:", summary.categories);
    console.log("Last 30 days:", summary.last30Days);
    return summary;
  } catch (error) {
    console.error("Failed to get summary:", error.message);
  }
}

// Delete an expense (Tenant only)
async function deleteExpense(expenseId: string) {
  try {
    await apiClient.deleteExpense(expenseId);
    console.log("Expense deleted");
  } catch (error) {
    console.error("Failed to delete expense:", error.message);
  }
}
```

### Rent Plans

```typescript
import { apiClient } from "@/lib/apiClient";

// Get all rent plans
async function fetchRentPlans() {
  try {
    const { plans } = await apiClient.getRentPlans();
    console.log("Rent plans:", plans);
    return plans;
  } catch (error) {
    console.error("Failed to fetch plans:", error.message);
  }
}

// Submit a rent plan (Tenant only)
async function submitRentPlan() {
  try {
    const { plan } = await apiClient.submitRentPlan({
      landlordId: "landlord-uuid",
      monthlyRent: 1500.0,
      deposit: 3000.0,
      duration: 12,
    });

    console.log("Rent plan submitted:", plan);
    return plan;
  } catch (error) {
    console.error("Failed to submit plan:", error.message);
  }
}

// Approve a rent plan (Landlord only)
async function approveRentPlan(planId: string) {
  try {
    const { plan } = await apiClient.approveRentPlan(planId);
    console.log("Rent plan approved:", plan);
    return plan;
  } catch (error) {
    console.error("Failed to approve plan:", error.message);
  }
}

// Reject a rent plan (Landlord only)
async function rejectRentPlan(planId: string) {
  try {
    const { plan } = await apiClient.rejectRentPlan(planId);
    console.log("Rent plan rejected:", plan);
    return plan;
  } catch (error) {
    console.error("Failed to reject plan:", error.message);
  }
}
```

### Rewards System

```typescript
import { apiClient } from "@/lib/apiClient";

// Get reward history (Tenant only)
async function getRewardHistory() {
  try {
    const { rewards } = await apiClient.getRewards();
    console.log("Reward history:", rewards);
    return rewards;
  } catch (error) {
    console.error("Failed to get rewards:", error.message);
  }
}

// Get reward balance (Tenant only)
async function getRewardBalance() {
  try {
    const balance = await apiClient.getRewardBalance();
    console.log("Points earned:", balance.pointsEarned);
    console.log("Points available:", balance.pointsAvailable);
    return balance;
  } catch (error) {
    console.error("Failed to get balance:", error.message);
  }
}
```

### Shop & Redemptions

```typescript
import { apiClient } from "@/lib/apiClient";

// Get all shop items
async function fetchShopItems() {
  try {
    const { items } = await apiClient.getShopItems();
    console.log("Shop items:", items);
    return items;
  } catch (error) {
    console.error("Failed to fetch items:", error.message);
  }
}

// Create a shop item (Landlord only)
async function createShopItem() {
  try {
    const { item } = await apiClient.createShopItem({
      name: "Amazon Gift Card",
      description: "$25 Amazon Gift Card",
      pointCost: 100,
      imageUrl: "https://example.com/image.jpg", // Optional
    });

    console.log("Shop item created:", item);
    return item;
  } catch (error) {
    console.error("Failed to create item:", error.message);
  }
}

// Redeem a shop item (Tenant only)
async function redeemItem(itemId: string) {
  try {
    const response = await apiClient.redeemShopItem(itemId);
    console.log("Item redeemed:", response.redemption);
    console.log("Points remaining:", response.pointsBalance);
    return response;
  } catch (error) {
    console.error("Failed to redeem item:", error.message);
    // Handle insufficient points error
    if (error.message.includes("Not enough points")) {
      alert("You do not have enough points to redeem this item.");
    }
  }
}

// Get redemption history
async function getRedemptions() {
  try {
    const { redemptions } = await apiClient.getRedemptions();
    console.log("Redemptions:", redemptions);
    return redemptions;
  } catch (error) {
    console.error("Failed to get redemptions:", error.message);
  }
}
```

### Dashboards

```typescript
import { apiClient } from "@/lib/apiClient";

// Get tenant dashboard (Tenant only)
async function getTenantDashboard() {
  try {
    const dashboard = await apiClient.getTenantDashboard();
    console.log("Upcoming bills:", dashboard.bills.upcoming);
    console.log("Outstanding total:", dashboard.bills.outstandingTotal);
    console.log("Expense summary:", dashboard.expenses);
    console.log("Points:", dashboard.rewards.points);
    console.log("Recent redemptions:", dashboard.redemptions);
    return dashboard;
  } catch (error) {
    console.error("Failed to get dashboard:", error.message);
  }
}

// Get landlord dashboard (Landlord only)
async function getLandlordDashboard() {
  try {
    const dashboard = await apiClient.getLandlordDashboard();
    console.log("Tenants:", dashboard.tenants);
    console.log("Outstanding bills:", dashboard.bills);
    console.log("Pending rent plans:", dashboard.rentPlans);
    console.log("Recent payments:", dashboard.payments);
    return dashboard;
  } catch (error) {
    console.error("Failed to get dashboard:", error.message);
  }
}
```

## React Hook Examples

### useAuth Hook with API Client

```typescript
import { useState, useEffect, createContext, useContext } from "react";
import { apiClient } from "@/lib/apiClient";
import { User } from "@/types";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const { user } = await apiClient.getCurrentUser();
      setUser(user);
    } catch (error) {
      console.error("Not authenticated");
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const { token, user } = await apiClient.login(email, password);
    apiClient.setToken(token);
    setUser(user);
  }

  function logout() {
    apiClient.clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
```

### useBills Hook

```typescript
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/apiClient";
import { Bill } from "@/types";

export function useBills() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBills();
  }, []);

  async function fetchBills() {
    try {
      setIsLoading(true);
      setError(null);
      const { bills } = await apiClient.getBills();
      setBills(bills);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function payBill(billId: string) {
    try {
      const response = await apiClient.payBill(billId);
      await fetchBills(); // Refresh the list
      return response;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }

  async function createBill(billData: {
    tenantId: string;
    type: string;
    amount: number;
    dueDate: string;
    description?: string;
  }) {
    try {
      const { bill } = await apiClient.createBill(billData);
      await fetchBills(); // Refresh the list
      return bill;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }

  return {
    bills,
    isLoading,
    error,
    payBill,
    createBill,
    refresh: fetchBills,
  };
}
```

## Error Handling Best Practices

```typescript
import { apiClient } from "@/lib/apiClient";

async function handleApiCall<T>(
  apiCall: () => Promise<T>,
  successMessage?: string
): Promise<T | null> {
  try {
    const result = await apiCall();

    if (successMessage) {
      // Show success toast/notification
      console.log(successMessage);
    }

    return result;
  } catch (error: any) {
    // Handle specific error cases
    if (error.message.includes("Unauthorized")) {
      // Redirect to login
      window.location.href = "/login";
    } else if (error.message.includes("Not enough points")) {
      // Show insufficient points message
      alert("You do not have enough points for this action.");
    } else if (error.message.includes("Network error")) {
      // Show network error
      alert("Network error. Please check your connection.");
    } else {
      // Show generic error
      alert(`Error: ${error.message}`);
    }

    return null;
  }
}

// Usage
async function payBillWithErrorHandling(billId: string) {
  const result = await handleApiCall(
    () => apiClient.payBill(billId),
    "Bill paid successfully!"
  );

  if (result) {
    console.log("Points earned:", result.reward?.pointsEarned);
  }
}
```

## Component Example: Bill Payment

```typescript
"use client";

import { useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { Bill } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

interface BillCardProps {
  bill: Bill;
  onPaymentSuccess: () => void;
}

export function BillCard({ bill, onPaymentSuccess }: BillCardProps) {
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePayBill() {
    setIsPaying(true);
    setError(null);

    try {
      const response = await apiClient.payBill(bill.id);

      // Show success message with points earned
      alert(
        `Bill paid! You earned ${response.reward?.pointsEarned || 0} points!`
      );

      // Trigger parent refresh
      onPaymentSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsPaying(false);
    }
  }

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-bold">{bill.type}</h3>
      <p>Amount: {formatCurrency(bill.amount)}</p>
      <p>Due: {formatDate(bill.dueDate)}</p>
      <p>Status: {bill.isPaid ? "Paid" : "Unpaid"}</p>

      {error && <div className="text-red-600 text-sm mt-2">{error}</div>}

      {!bill.isPaid && (
        <button
          onClick={handlePayBill}
          disabled={isPaying}
          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded"
        >
          {isPaying ? "Processing..." : "Pay Bill"}
        </button>
      )}
    </div>
  );
}
```

## Migration from Old API

If you're migrating from the old `lib/api.ts` to the new `lib/apiClient.ts`:

### Before:

```typescript
import { authApi, billsApi } from "@/lib/api";

const { token, user } = await authApi.login(email, password);
const bills = await billsApi.getBills();
```

### After:

```typescript
import { apiClient } from "@/lib/apiClient";

const { token, user } = await apiClient.login(email, password);
apiClient.setToken(token);
const { bills } = await apiClient.getBills();
```

## Testing the Integration

1. Make sure the backend is running on port 5001
2. Check environment variable: `NEXT_PUBLIC_API_URL=http://localhost:5001`
3. Test authentication flow first
4. Use browser dev tools to inspect network requests
5. Check for CORS issues if running on different domains

## Troubleshooting

- **401 Unauthorized**: Token expired or invalid - login again
- **403 Forbidden**: User doesn't have permission for this action
- **404 Not Found**: Resource not found - check IDs
- **409 Conflict**: Resource already exists (e.g., email in use)
- **Network Error**: Backend not running or wrong URL
