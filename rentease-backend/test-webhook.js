/**
 * Test script to simulate Stripe webhook for bill payment
 * Run with: node test-webhook.js <billId>
 * 
 * This bypasses Stripe signature verification and directly calls the webhook logic
 */

import prisma from './src/config/db.js';

const billId = process.argv[2];

if (!billId) {
    console.error('Usage: node test-webhook.js <billId>');
    console.log('\nTo find a bill ID, run:');
    console.log('  npx prisma studio');
    console.log('  or check your database for Bill records');
    process.exit(1);
}

async function testWebhook() {
    try {
        console.log(`🔔 Testing webhook for bill ID: ${billId}`);
        
        const bill = await prisma.bill.findUnique({
            where: { id: billId },
            include: { tenant: true },
        });

        if (!bill) {
            console.error(`❌ Bill ${billId} not found in database`);
            process.exit(1);
        }

        if (bill.isPaid) {
            console.log(`⚠️ Bill ${billId} already marked as paid`);
            console.log(`Paid date: ${bill.paidDate}`);
            return;
        }

        console.log(`📝 Bill details:`, {
            id: bill.id,
            amount: bill.amount,
            dueDate: bill.dueDate,
            tenantId: bill.tenantId,
            tenantName: bill.tenant.name,
        });

        const paidDate = new Date();
        const isOnTime = paidDate <= bill.dueDate;
        const pointsEarned = isOnTime ? Math.max(0, Math.round(bill.amount * 0.1)) : 0;

        console.log(`💰 Payment details:`, {
            paidDate: paidDate.toISOString(),
            isOnTime,
            pointsEarned,
        });

        const operations = [
            prisma.bill.update({
                where: { id: billId },
                data: {
                    isPaid: true,
                    paidDate,
                },
            }),
        ];

        if (pointsEarned > 0) {
            operations.push(
                prisma.reward.create({
                    data: {
                        tenantId: bill.tenantId,
                        billId: bill.id,
                        amount: bill.amount,
                        date: paidDate,
                        isOnTime,
                        pointsEarned,
                    },
                }),
                prisma.user.update({
                    where: { id: bill.tenantId },
                    data: {
                        points: {
                            increment: pointsEarned,
                        },
                    },
                }),
            );
        }

        await prisma.$transaction(operations);

        console.log(`✅ Bill ${billId} successfully marked as paid!`);
        console.log(`✅ Points earned: ${pointsEarned}`);
        console.info(`Bill updated to PAID: ${billId}`);
        
        // Verify the update
        const updatedBill = await prisma.bill.findUnique({
            where: { id: billId },
        });
        console.log(`\n✔️ Verification:`, {
            isPaid: updatedBill.isPaid,
            paidDate: updatedBill.paidDate,
        });
        
    } catch (error) {
        console.error(`❌ Error:`, error);
        console.error('Full error stack:', error.stack);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

testWebhook();

