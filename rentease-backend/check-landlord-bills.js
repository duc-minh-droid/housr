import prisma from './src/config/db.js';

async function checkLandlordBills() {
    try {
        const landlord = await prisma.user.findUnique({
            where: { email: 'lord@gmail.com' },
            select: { id: true, name: true, email: true }
        });

        if (!landlord) {
            console.log('Landlord not found!');
            return;
        }

        console.log('========================================');
        console.log(`Bills for ${landlord.name} (${landlord.email})`);
        console.log('========================================\n');

        const bills = await prisma.bill.findMany({
            where: { landlordId: landlord.id },
            include: {
                tenant: {
                    select: { name: true, email: true, points: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        console.log(`Total Bills: ${bills.length}\n`);

        let totalPaid = 0;
        let totalUnpaid = 0;
        let totalAmount = 0;

        bills.forEach((bill, index) => {
            console.log(`${index + 1}. ${bill.type.toUpperCase()} - ${bill.tenant.name}`);
            console.log(`   Amount: $${bill.amount}`);
            console.log(`   Due Date: ${bill.dueDate.toLocaleDateString()}`);
            console.log(`   Status: ${bill.isPaid ? '✓ PAID' : '⏳ UNPAID'}`);
            if (bill.isPaid) {
                console.log(`   Paid Date: ${bill.paidDate.toLocaleDateString()}`);
                totalPaid += bill.amount;
            } else {
                totalUnpaid += bill.amount;
            }
            console.log(`   Tenant Email: ${bill.tenant.email}`);
            console.log(`   Tenant Points: ${bill.tenant.points}`);
            console.log('');
            totalAmount += bill.amount;
        });

        console.log('========================================');
        console.log('SUMMARY');
        console.log('========================================');
        console.log(`Total Amount: $${totalAmount}`);
        console.log(`Paid: $${totalPaid}`);
        console.log(`Unpaid: $${totalUnpaid}`);
        console.log(`Bills Paid: ${bills.filter(b => b.isPaid).length}`);
        console.log(`Bills Unpaid: ${bills.filter(b => !b.isPaid).length}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkLandlordBills();
