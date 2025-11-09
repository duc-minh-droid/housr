import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

// Format date
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

// Check if date is past due
export function isPastDue(dueDate: string): boolean {
  return new Date(dueDate) < new Date();
}

// Check if payment is on time (within due date)
export function isPaymentOnTime(dueDate: string, paidDate: string): boolean {
  return new Date(paidDate) <= new Date(dueDate);
}

// Calculate points for payment
export function calculatePaymentPoints(isOnTime: boolean): number {
  return isOnTime ? 50 : -20;
}

// Calculate total from array of items with amount property
export function calculateTotal(items: { amount: number }[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

// Get status badge color
export function getStatusColor(status: string): string {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
