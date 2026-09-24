import prisma from '../config/db.js';
import { asyncHandler } from '../utils/errorHandler.js';
import { verifyAccessToken } from '../utils/jwt.js';

const unauthorizedError = () => {
    const error = new Error('Unauthorized');
    error.status = 401;
    return error;
};

export const authenticate = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('❌ Auth failed: No valid Authorization header');
        throw unauthorizedError();
    }

    const token = authHeader.split(' ')[1];

    let payload;
    try {
        payload = verifyAccessToken(token);
    } catch (err) {
        console.log('❌ Auth failed: Invalid or expired token');
        throw unauthorizedError();
    }

    const user = await prisma.user.findUnique({
        where: { id: payload.sub },
    });

    if (!user) {
        console.log('❌ Auth failed: User not found in database');
        throw unauthorizedError();
    }

    // Remove sensitive data from request-scoped user
    // eslint-disable-next-line no-param-reassign
    delete user.password;

    req.user = user;
    next();
});

export const requireRoles = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        const error = new Error('Forbidden');
        error.status = 403;
        return next(error);
    }

    return next();
};
