import prisma from '../config/db.js';

export const createUser = async ({ email, username, password, name, role, landlordId }) => {
    return prisma.user.create({
        data: {
            email,
            username,
            password,
            name,
            role,
            landlordId: landlordId || null,
        },
    });
};

export const findUserByEmail = async (email) => {
    return prisma.user.findUnique({ where: { email } });
};

export const findUserById = async (id) => {
    return prisma.user.findUnique({ where: { id } });
};

export const listTenantsForLandlord = async (landlordId) => {
    return prisma.user.findMany({
        where: { landlordId, role: 'tenant' },
        select: {
            id: true,
            name: true,
            email: true,
            points: true,
        },
    });
};

export const adjustUserPoints = async (userId, pointsDelta) => {
    return prisma.user.update({
        where: { id: userId },
        data: {
            points: {
                increment: pointsDelta,
            },
        },
    });
};
