import jwt from 'jsonwebtoken';

const TOKEN_TTL = '7d';

export const generateAccessToken = (user) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
    }

    const payload = {
        sub: user.id,
        role: user.role,
    };

    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: TOKEN_TTL });
};

export const verifyAccessToken = (token) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
    }

    return jwt.verify(token, process.env.JWT_SECRET);
};
