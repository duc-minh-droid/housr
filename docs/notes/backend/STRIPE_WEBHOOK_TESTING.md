# Stripe Webhook Testing Guide

## Problem: Bills not moving to Payment History after Stripe payment

This guide helps debug and test the Stripe webhook integration for bill payments.

---

## 🔍 How the Payment Flow Should Work

1. **Tenant clicks "Pay Now"** on a bill
2. Backend creates a Stripe Checkout session with `billId` in metadata
3. User completes payment on Stripe
4. **Stripe sends webhook** to `/api/stripe/webhook` with `checkout.session.completed` event
5. **Webhook handler**:
   - Finds bill by `billId` from metadata
   - Updates `isPaid = true` and sets `paidDate`
   - Awards points if paid on time
   - Creates reward record
6. **User returns to bills page** with `?success=true` param
7. Frontend reloads bills, showing paid bill in "Payment History"

---

## 🐛 Common Issues

### Issue 1: Webhook not being called
**Symptoms:** Payment succeeds on Stripe, but bill stays "Unpaid"

**Causes:**
- Webhook URL not configured in Stripe Dashboard
- Webhook secret not set or incorrect
- Network/firewall blocking webhook

**Solutions:**
1. Check Stripe Dashboard > Developers > Webhooks
2. Ensure webhook points to: `https://your-domain.com/api/stripe/webhook`
3. For local testing, use Stripe CLI or ngrok

### Issue 2: Webhook fails silently
**Symptoms:** Webhook is called but bill doesn't update

**Causes:**
- `billId` missing from session metadata
- Database error during update
- Webhook signature verification failing

**Solutions:**
1. Check backend logs for webhook errors
2. Verify `billId` is passed when creating checkout session
3. Use test script (see below) to bypass Stripe

### Issue 3: Frontend not refreshing
**Symptoms:** Bill is marked paid in DB but UI shows "Unpaid"

**Causes:**
- Frontend using cached data
- Not reloading after Stripe redirect

**Solutions:**
- Added 1-second delay before reload (webhook processing time)
- Force browser refresh (Cmd+Shift+R / Ctrl+F5)

---

## 🧪 Testing Methods

### Method 1: Test Script (Bypass Stripe)

This script directly updates a bill without going through Stripe:

```bash
cd rentease-backend

# Find a bill ID (use Prisma Studio or check database)
npx prisma studio

# Run test script with bill ID
node test-webhook.js <your-bill-id>
```

**Example output:**
```
🔔 Testing webhook for bill ID: abc123
📝 Bill details: { id: 'abc123', amount: 100, ... }
💰 Payment details: { isOnTime: true, pointsEarned: 10 }
✅ Bill abc123 successfully marked as paid!
✅ Points earned: 10
```

### Method 2: Stripe CLI (Real webhook)

Use Stripe CLI to forward webhooks to localhost:

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:5001/api/stripe/webhook

# In another terminal, trigger a test payment
stripe trigger checkout.session.completed
```

### Method 3: Manual Database Update

Directly update the database:

```bash
npx prisma studio

# Find your bill
# Update:
#   isPaid = true
#   paidDate = (current date)

# Manually add points to user if needed
```

---

## 📊 Checking Webhook Logs

The backend now has comprehensive logging. After a payment, check your backend console for:

```
🎯 Stripe webhook received
✅ Webhook signature verified. Event type: checkout.session.completed
💳 Processing checkout.session.completed event
📋 Metadata: rentPlanId=null, billId=abc123
🔔 Processing bill payment for bill ID: abc123
📝 Bill details: {...}
💰 Payment details: paidDate=..., isOnTime=true, pointsEarned=10
✅ Bill abc123 successfully marked as paid. Points earned: 10
Bill updated to PAID: abc123
```

**If you don't see these logs:**
- Webhook isn't reaching your server
- Configure webhook URL in Stripe Dashboard
- Use Stripe CLI or ngrok for local testing

**If logs show errors:**
- Check the error message and stack trace
- Common issues: database connection, invalid bill ID, permissions

---

## 🔧 Development Mode

The webhook now supports **development mode** without signature verification:

- If `STRIPE_WEBHOOK_SECRET` is not set, signature verification is skipped
- Useful for local testing with test scripts
- **⚠️ Never use in production!**

To enable:
```bash
# .env file - comment out or remove:
# STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## ✅ Verification Checklist

After payment, verify:

1. **Backend logs** show webhook processing
2. **Database** shows `isPaid = true` on Bill record
3. **Reward record** created (if on-time payment)
4. **User points** increased
5. **Frontend** shows bill in "Payment History"
6. **Frontend** removed bill from "Unpaid Bills"

---

## 🚨 Emergency Fix

If bills are stuck as unpaid after successful Stripe payments:

```bash
# 1. Find affected bill IDs
npx prisma studio

# 2. Run test script for each bill
node test-webhook.js <bill-id-1>
node test-webhook.js <bill-id-2>

# 3. Verify in frontend - refresh bills page
```

---

## 📝 Environment Variables

Ensure these are set in `.env`:

```bash
# Required
STRIPE_SECRET_KEY=sk_test_...
DATABASE_URL="file:./dev.db"

# Optional (for production webhooks)
STRIPE_WEBHOOK_SECRET=whsec_...

# Frontend URL for success redirect
FRONTEND_URL=http://localhost:3000
```

---

## 🆘 Still Not Working?

1. **Check all logs** (frontend console + backend terminal)
2. **Verify database** state with Prisma Studio
3. **Test webhook** with test script (bypasses Stripe)
4. **Check Stripe Dashboard** > Payments > Events for webhook delivery status
5. **Contact support** with:
   - Backend logs
   - Bill ID that's stuck
   - Stripe event ID
   - Error messages

---

## 📚 Additional Resources

- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Testing Webhooks Locally](https://stripe.com/docs/webhooks/test)

