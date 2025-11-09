import prisma from '../config/db.js';

export const listBillsForTenant = async (tenantId) => {
    return prisma.bill.findMany({
        where: { tenantId },
        orderBy: { dueDate: 'asc' },
    });
};

export const listBillsForLandlord = async (landlordId) => {
    return prisma.bill.findMany({
        where: { landlordId },
        orderBy: { dueDate: 'asc' },
    });
};

export const createBill = async (data) => {
    return prisma.bill.create({
        data,
    });
};

export const findBillById = async (billId) => {
    return prisma.bill.findUnique({ where: { id: billId } });
};

export const markBillPaid = async (billId, paidDate = new Date()) => {
    return prisma.bill.update({
        where: { id: billId },
        data: {
            isPaid: true,
            paidDate,
        },
    });
};

export const listRecentPayments = async (landlordId, take = 5) => {
    return prisma.bill.findMany({
        where: { landlordId, isPaid: true },
        orderBy: { paidDate: 'desc' },
        take,
        include: {
            tenant: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });
};

export const countOutstandingBills = async (landlordId) => {
    return prisma.bill.count({
        where: { landlordId, isPaid: false },
    });
};
