# RentEase Backend

Backend API for the RentEase platform built with Node.js, Express, and Prisma. The API powers authentication, bills, expenses, rent plans, rewards, shop, and dashboard experiences for the RentEase frontend.

## Prerequisites

- Node.js 18+
- PostgreSQL instance (local or remote)

## Environment Variables

Create a `.env` file in the project root:

```
PORT=5000
DATABASE_URL="postgresql://postgres:password@localhost:5432/rentease"
JWT_SECRET="super_secret_jwt_key"
CORS_ORIGIN="http://localhost:3000"
```

## Getting Started

```bash
npm install
npx prisma migrate dev --name init
npm run dev
```

The API will be available at `http://localhost:5000`.

## NPM Scripts

- `npm run dev` – start the API with hot reloading (nodemon)
- `npm start` – start the API in production mode
- `npm run prisma:migrate` – generate and apply database migrations
- `npm run prisma:generate` – regenerate the Prisma client
- `npm run prisma:studio` – open Prisma Studio to inspect data

## Testing Checklist

- Register and login users
- Verify token-based authentication
- Create/view/pay bills
- Add/view/delete expenses
- Submit/approve/reject rent plans
- Track reward points for on-time payments
- Redeem points for shop items
- Load dashboard data for tenant and landlord

## Project Structure

```
rentease-backend/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── Bill.js
│   │   ├── Expense.js
│   │   ├── RentPlan.js
│   │   ├── Redemption.js
│   │   ├── Reward.js
│   │   ├── ShopItem.js
│   │   └── User.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── billController.js
│   │   ├── dashboardController.js
│   │   ├── expenseController.js
│   │   ├── rentPlanController.js
│   │   ├── rewardController.js
│   │   └── shopController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── billRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── expenseRoutes.js
│   │   ├── rentPlanRoutes.js
│   │   ├── rewardRoutes.js
│   │   └── shopRoutes.js
│   ├── utils/
│   │   ├── errorHandler.js
│   │   └── jwt.js
│   └── server.js
├── .env
├── package.json
└── README.md
```

## Remaining Work

- **Database polish** – finish naming and running Prisma migrations for production, configure referential actions (onDelete/onUpdate), and add a repeatable seed script for local onboarding data.
- **Validation layer** – replace inline `if (!field)` checks with a reusable schema validator (e.g., Zod/express-validator) and centralize request sanitization to keep controllers lean.
- **Auth extras** – add password reset/change flows, optional refresh tokens, and rate limiting on auth endpoints to harden security before launch.
- **Domain gaps** – expose management endpoints for linking tenants ↔ landlords, editing/deleting bills and plans, and updating shop inventory so landlords can maintain data without direct DB access.
- **Observability** – introduce structured logging, request tracing, and health/metrics endpoints for production monitoring.
- **Testing & QA** – stand up integration tests (Jest or Vitest) covering the documented flows, plus contract tests against the Next.js frontend to lock response shapes.
