import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import authRoutes from './routes/authRoutes.js';
import billRoutes from './routes/billRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import rentPlanRoutes from './routes/rentPlanRoutes.js';
import rewardRoutes from './routes/rewardRoutes.js';
import shopRoutes from './routes/shopRoutes.js';
import userRoutes from './routes/userRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import { errorHandler } from './utils/errorHandler.js';

dotenv.config();

const app = express();

app.use(cors({
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').replace(/\/$/, ''), // Remove trailing slash
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

// Stripe webhook needs raw body - must be before express.json()
app.use('/api/rent-plans/stripe/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/rent-plans', rentPlanRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);

app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`✅ Financr Backend Server running on port ${PORT}`);
    console.log(`📊 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
    console.log(`🔐 JWT: ${process.env.JWT_SECRET ? 'Configured' : 'Not configured'}`);
    console.log(`💳 Stripe: ${process.env.STRIPE_SECRET_KEY ? 'Configured' : 'Not configured'}`);
    console.log(`🤖 Gemini AI: ${process.env.GEMINI_API_KEY ? 'Configured' : 'Not configured'}`);
    console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
});
