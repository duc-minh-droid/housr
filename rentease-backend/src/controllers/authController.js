import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';
import { asyncHandler } from '../utils/errorHandler.js';
import { generateAccessToken } from '../utils/jwt.js';
import { createUser, findUserByEmail } from '../models/User.js';

const SALT_ROUNDS = 10;

const buildUserResponse = (user) => ({
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name,
    role: user.role,
    points: user.points,
    landlordId: user.landlordId,
});

// Helper function to generate unique username
const generateUsername = (name, role) => {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const prefix = role === 'tenant' ? 't' : 'l';
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}-${cleanName.substring(0, 8)}-${random}`;
};

export const register = asyncHandler(async (req, res) => {
    const { email, password, name, role = 'tenant', landlordId, username } = req.body;

    if (!email || !password || !name) {
        const error = new Error('Missing required fields');
        error.status = 400;
        throw error;
    }

    // Generate username if not provided
    const finalUsername = username || generateUsername(name, role);

    // Check if username is taken
    const existingUsername = await prisma.user.findUnique({
        where: { username: finalUsername },
    });

    if (existingUsername) {
        const error = new Error('Username already taken');
        error.status = 409;
        throw error;
    }

    const existing = await findUserByEmail(email);
    if (existing) {
        const error = new Error('Email already in use');
        error.status = 409;
        throw error;
    }

    if (!['tenant', 'landlord'].includes(role)) {
        const error = new Error('Invalid role');
        error.status = 400;
        throw error;
    }

    if (role === 'tenant' && landlordId) {
        const landlord = await prisma.user.findFirst({
            where: { id: landlordId, role: 'landlord' },
        });

        if (!landlord) {
            const error = new Error('Invalid landlordId');
            error.status = 400;
            throw error;
        }
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await createUser({
        email,
        username: finalUsername,
        password: hashedPassword,
        name,
        role,
        landlordId: role === 'tenant' ? landlordId || null : null,
    });

    const token = generateAccessToken(user);

    res.status(201).json({
        token,
        user: buildUserResponse(user),
    });
});

export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        const error = new Error('Missing email or password');
        error.status = 400;
        throw error;
    }

    const user = await findUserByEmail(email);
    if (!user) {
        const error = new Error('Invalid credentials');
        error.status = 401;
        throw error;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        const error = new Error('Invalid credentials');
        error.status = 401;
        throw error;
    }

    const token = generateAccessToken(user);

    res.json({
        token,
        user: buildUserResponse(user),
    });
});

export const me = asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
    });

    res.json({ user: buildUserResponse(user) });
});
