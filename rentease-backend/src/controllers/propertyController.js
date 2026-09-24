import { asyncHandler } from '../utils/errorHandler.js';
import prisma from '../config/db.js';

// Get all properties for current landlord
export const getProperties = asyncHandler(async (req, res) => {
    if (req.user.role !== 'landlord') {
        const error = new Error('Only landlords can view properties');
        error.status = 403;
        throw error;
    }

    const properties = await prisma.property.findMany({
        where: { landlordId: req.user.id },
        include: {
            tenants: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    username: true,
                    latePaymentCount: true,
                },
            },
            _count: {
                select: { tenants: true },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    // For each property, get rent plans to calculate next due dates
    const propertiesWithDetails = await Promise.all(
        properties.map(async (property) => {
            const tenantsWithDueDates = await Promise.all(
                property.tenants.map(async (tenant) => {
                    // Get the active rent plan for this tenant
                    const activePlan = await prisma.rentPlan.findFirst({
                        where: {
                            tenantId: tenant.id,
                            landlordId: req.user.id,
                            status: 'completed',
                        },
                        orderBy: { completedDate: 'desc' },
                    });

                    return {
                        ...tenant,
                        nextDueDate: activePlan?.nextDueDate || null,
                        monthlyRent: activePlan?.monthlyRent || 0,
                    };
                })
            );

            return {
                ...property,
                tenants: tenantsWithDueDates,
                occupancy: `${property.tenants.length}/${property.units}`,
            };
        })
    );

    res.json({ properties: propertiesWithDetails });
});

// Create a new property
export const createProperty = asyncHandler(async (req, res) => {
    if (req.user.role !== 'landlord') {
        const error = new Error('Only landlords can create properties');
        error.status = 403;
        throw error;
    }

    const { name, address, units, monthlyRent, description } = req.body;

    if (!name || !address || !monthlyRent) {
        const error = new Error('Name, address, and monthly rent are required');
        error.status = 400;
        throw error;
    }

    const property = await prisma.property.create({
        data: {
            landlordId: req.user.id,
            name: name.trim(),
            address: address.trim(),
            units: units ? parseInt(units) : 1,
            monthlyRent: parseFloat(monthlyRent),
            description: description || null,
        },
        include: {
            tenants: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    username: true,
                    latePaymentCount: true,
                },
            },
        },
    });

    res.status(201).json({ property });
});

// Update a property
export const updateProperty = asyncHandler(async (req, res) => {
    if (req.user.role !== 'landlord') {
        const error = new Error('Only landlords can update properties');
        error.status = 403;
        throw error;
    }

    const { propertyId } = req.params;
    const { name, address, units, monthlyRent, description } = req.body;

    // Check if property belongs to landlord
    const property = await prisma.property.findFirst({
        where: {
            id: propertyId,
            landlordId: req.user.id,
        },
    });

    if (!property) {
        const error = new Error('Property not found');
        error.status = 404;
        throw error;
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (address) updateData.address = address.trim();
    if (units !== undefined) updateData.units = parseInt(units);
    if (monthlyRent !== undefined) updateData.monthlyRent = parseFloat(monthlyRent);
    if (description !== undefined) updateData.description = description || null;

    const updatedProperty = await prisma.property.update({
        where: { id: propertyId },
        data: updateData,
        include: {
            tenants: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    username: true,
                    latePaymentCount: true,
                },
            },
        },
    });

    res.json({ property: updatedProperty });
});

// Delete a property
export const deleteProperty = asyncHandler(async (req, res) => {
    if (req.user.role !== 'landlord') {
        const error = new Error('Only landlords can delete properties');
        error.status = 403;
        throw error;
    }

    const { propertyId } = req.params;

    // Check if property belongs to landlord
    const property = await prisma.property.findFirst({
        where: {
            id: propertyId,
            landlordId: req.user.id,
        },
        include: {
            tenants: true,
        },
    });

    if (!property) {
        const error = new Error('Property not found');
        error.status = 404;
        throw error;
    }

    // Unlink tenants from this property first
    if (property.tenants.length > 0) {
        await prisma.user.updateMany({
            where: { propertyId: propertyId },
            data: { propertyId: null },
        });
    }

    await prisma.property.delete({
        where: { id: propertyId },
    });

    res.json({ message: 'Property deleted successfully' });
});

// Assign tenant to property
export const assignTenantToProperty = asyncHandler(async (req, res) => {
    if (req.user.role !== 'landlord') {
        const error = new Error('Only landlords can assign tenants to properties');
        error.status = 403;
        throw error;
    }

    const { propertyId, tenantId } = req.body;

    if (!propertyId || !tenantId) {
        const error = new Error('Property ID and Tenant ID are required');
        error.status = 400;
        throw error;
    }

    // Verify property belongs to landlord
    const property = await prisma.property.findFirst({
        where: {
            id: propertyId,
            landlordId: req.user.id,
        },
        include: {
            tenants: true,
        },
    });

    if (!property) {
        const error = new Error('Property not found');
        error.status = 404;
        throw error;
    }

    // Check if property is full
    if (property.tenants.length >= property.units) {
        const error = new Error('Property is at full capacity');
        error.status = 400;
        throw error;
    }

    // Verify tenant belongs to landlord
    const tenant = await prisma.user.findFirst({
        where: {
            id: tenantId,
            landlordId: req.user.id,
            role: 'tenant',
        },
    });

    if (!tenant) {
        const error = new Error('Tenant not found or does not belong to you');
        error.status = 404;
        throw error;
    }

    // Assign tenant to property
    const updatedTenant = await prisma.user.update({
        where: { id: tenantId },
        data: { propertyId: propertyId },
        select: {
            id: true,
            name: true,
            email: true,
            username: true,
            latePaymentCount: true,
            property: {
                select: {
                    id: true,
                    name: true,
                    address: true,
                },
            },
        },
    });

    res.json({ tenant: updatedTenant });
});

// Remove tenant from property
export const removeTenantFromProperty = asyncHandler(async (req, res) => {
    if (req.user.role !== 'landlord') {
        const error = new Error('Only landlords can remove tenants from properties');
        error.status = 403;
        throw error;
    }

    const { tenantId } = req.params;

    // Verify tenant belongs to landlord
    const tenant = await prisma.user.findFirst({
        where: {
            id: tenantId,
            landlordId: req.user.id,
            role: 'tenant',
        },
    });

    if (!tenant) {
        const error = new Error('Tenant not found or does not belong to you');
        error.status = 404;
        throw error;
    }

    // Remove tenant from property
    const updatedTenant = await prisma.user.update({
        where: { id: tenantId },
        data: { propertyId: null },
        select: {
            id: true,
            name: true,
            email: true,
            username: true,
            latePaymentCount: true,
        },
    });

    res.json({ tenant: updatedTenant });
});

