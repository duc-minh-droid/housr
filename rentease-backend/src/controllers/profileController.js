import { asyncHandler } from '../utils/errorHandler.js';
import prisma from '../config/db.js';
import bcrypt from 'bcryptjs';

// Update user profile (username, name, email)
export const updateProfile = asyncHandler(async (req, res) => {
    const { username, name, email } = req.body;
    const userId = req.user.id;

    // Build update data object
    const updateData = {};

    if (username && username.trim()) {
        // Check if username is already taken by another user
        const existingUser = await prisma.user.findFirst({
            where: {
                username: username.trim(),
                NOT: { id: userId },
            },
        });

        if (existingUser) {
            const error = new Error('Username is already taken');
            error.status = 409;
            throw error;
        }

        updateData.username = username.trim();
    }

    if (name && name.trim()) {
        updateData.name = name.trim();
    }

    if (email && email.trim()) {
        // Check if email is already taken by another user
        const existingUser = await prisma.user.findFirst({
            where: {
                email: email.trim(),
                NOT: { id: userId },
            },
        });

        if (existingUser) {
            const error = new Error('Email is already taken');
            error.status = 409;
            throw error;
        }

        updateData.email = email.trim();
    }

    if (Object.keys(updateData).length === 0) {
        const error = new Error('No fields to update');
        error.status = 400;
        throw error;
    }

    // Update user
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
            id: true,
            username: true,
            name: true,
            email: true,
            role: true,
            points: true,
        },
    });

    res.json({
        message: 'Profile updated successfully',
        user: updatedUser,
    });
});

// Update password
export const updatePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
        const error = new Error('Current password and new password are required');
        error.status = 400;
        throw error;
    }

    if (newPassword.length < 6) {
        const error = new Error('New password must be at least 6 characters');
        error.status = 400;
        throw error;
    }

    // Get user with password
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            password: true,
        },
    });

    if (!user) {
        const error = new Error('User not found');
        error.status = 404;
        throw error;
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        const error = new Error('Current password is incorrect');
        error.status = 401;
        throw error;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
    });

    res.json({
        message: 'Password updated successfully',
    });
});

