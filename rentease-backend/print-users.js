import prisma from './src/config/db.js';

async function printAllUsers() {
    try {
        console.log('====================================');
        console.log('Fetching all users from database...');
        console.log('====================================\n');

        // Get all tenants
        const tenants = await prisma.user.findMany({
            where: { role: 'tenant' },
            include: {
                landlord: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Get all landlords
        const landlords = await prisma.user.findMany({
            where: { role: 'landlord' },
            include: {
                tenants: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Print Landlords
        console.log('🏠 LANDLORDS');
        console.log('═'.repeat(80));
        if (landlords.length === 0) {
            console.log('No landlords found.\n');
        } else {
            landlords.forEach((landlord, index) => {
                console.log(`\n${index + 1}. ${landlord.name}`);
                console.log(`   ID: ${landlord.id}`);
                console.log(`   Email: ${landlord.email}`);
                console.log(`   Points: ${landlord.points}`);
                console.log(`   Created: ${new Date(landlord.createdAt).toLocaleString()}`);
                if (landlord.tenants.length > 0) {
                    console.log(`   Tenants (${landlord.tenants.length}):`);
                    landlord.tenants.forEach((tenant) => {
                        console.log(`     - ${tenant.name} (${tenant.email})`);
                    });
                } else {
                    console.log(`   Tenants: None`);
                }
            });
            console.log(`\n📊 Total Landlords: ${landlords.length}\n`);
        }

        // Print Tenants
        console.log('👥 TENANTS');
        console.log('═'.repeat(80));
        if (tenants.length === 0) {
            console.log('No tenants found.\n');
        } else {
            tenants.forEach((tenant, index) => {
                console.log(`\n${index + 1}. ${tenant.name}`);
                console.log(`   ID: ${tenant.id}`);
                console.log(`   Email: ${tenant.email}`);
                console.log(`   Points: ${tenant.points}`);
                console.log(`   Created: ${new Date(tenant.createdAt).toLocaleString()}`);
                if (tenant.landlord) {
                    console.log(`   Landlord: ${tenant.landlord.name} (${tenant.landlord.email})`);
                } else {
                    console.log(`   Landlord: Not assigned`);
                }
            });
            console.log(`\n📊 Total Tenants: ${tenants.length}\n`);
        }

        // Summary
        console.log('═'.repeat(80));
        console.log('📈 SUMMARY');
        console.log('═'.repeat(80));
        console.log(`Total Users: ${landlords.length + tenants.length}`);
        console.log(`  - Landlords: ${landlords.length}`);
        console.log(`  - Tenants: ${tenants.length}`);
        console.log('═'.repeat(80));

    } catch (error) {
        console.error('❌ Error fetching users:', error.message);
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the function
printAllUsers();
