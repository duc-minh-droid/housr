import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
    getProperties,
    createProperty,
    updateProperty,
    deleteProperty,
    assignTenantToProperty,
    removeTenantFromProperty,
} from '../controllers/propertyController.js';

const router = express.Router();

// Get all properties for landlord
router.get('/', authenticate, getProperties);

// Create a new property
router.post('/', authenticate, createProperty);

// Update a property
router.put('/:propertyId', authenticate, updateProperty);

// Delete a property
router.delete('/:propertyId', authenticate, deleteProperty);

// Assign tenant to property
router.post('/assign-tenant', authenticate, assignTenantToProperty);

// Remove tenant from property
router.delete('/tenants/:tenantId', authenticate, removeTenantFromProperty);

export default router;

