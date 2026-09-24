'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Alert } from '@/components/UIComponents';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Building, Plus, Users, DollarSign, Calendar, AlertCircle, Trash2, UserPlus, Home } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PropertiesPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);

  useEffect(() => { loadData(); }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const [propertiesRes, tenantsRes] = await Promise.all([
        fetch('http://localhost:5001/api/properties', { headers: { Authorization: `Bearer ${token}` }}),
        fetch('http://localhost:5001/api/users/tenants', { headers: { Authorization: `Bearer ${token}` }}),
      ]);
      if (propertiesRes.ok) { const data = await propertiesRes.json(); setProperties(data.properties || []); }
      if (tenantsRes.ok) { const data = await tenantsRes.json(); setTenants(data.tenants || []); }
    } catch (error) { console.error('Error:', error); } finally { setIsLoading(false); }
  };

  const handleCreateProperty = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: formData.get('name'), address: formData.get('address'), units: formData.get('units'), monthlyRent: formData.get('monthlyRent'), description: formData.get('description') }),
      });
      if (response.ok) { setAlert({ type: 'success', message: 'Property created!' }); setIsCreateModalOpen(false); loadData(); }
      else { throw new Error('Failed'); }
    } catch (error: any) { setAlert({ type: 'error', message: error.message || 'Failed to create property' }); }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Delete this property?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/properties/${propertyId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` }});
      if (response.ok) { setAlert({ type: 'success', message: 'Property deleted!' }); loadData(); }
      else { throw new Error('Failed'); }
    } catch (error: any) { setAlert({ type: 'error', message: error.message }); }
  };

  const handleAssignTenant = async (tenantId: string) => {
    if (!selectedProperty) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/properties/assign-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ propertyId: selectedProperty.id, tenantId }),
      });
      if (response.ok) { setAlert({ type: 'success', message: 'Tenant assigned!' }); setIsAssignModalOpen(false); loadData(); }
      else { const error = await response.json(); throw new Error(error.error || 'Failed'); }
    } catch (error: any) { setAlert({ type: 'error', message: error.message }); }
  };

  const handleRemoveTenant = async (tenantId: string) => {
    if (!confirm('Remove tenant?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/properties/tenants/${tenantId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` }});
      if (response.ok) { setAlert({ type: 'success', message: 'Tenant removed!' }); loadData(); }
      else { throw new Error('Failed'); }
    } catch (error: any) { setAlert({ type: 'error', message: error.message }); }
  };

  const isRentOverdue = (nextDueDate: string | null) => {
    if (!nextDueDate) return false;
    return new Date(nextDueDate) < new Date();
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-pulse text-lg font-semibold text-card-text">Loading properties...</div></div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <div><h1 className="text-3xl font-bold text-card-text">Properties</h1><p className="text-card-text/70 mt-1">Manage rental properties</p></div>
        <Button onClick={() => setIsCreateModalOpen(true)} variant="primary"><Plus className="w-5 h-5" />Add Property</Button>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} className="mb-6" />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card-bg border border-border rounded-2xl p-6">
          <div className="flex items-center gap-4"><div className="p-3 bg-primary/10 rounded-xl"><Building className="w-6 h-6 text-primary" /></div>
          <div><p className="text-sm text-card-text/70">Total Properties</p><p className="text-3xl font-bold text-card-text">{properties.length}</p></div></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card-bg border border-border rounded-2xl p-6">
          <div className="flex items-center gap-4"><div className="p-3 bg-green-500/10 rounded-xl"><Users className="w-6 h-6 text-green-500" /></div>
          <div><p className="text-sm text-card-text/70">Total Tenants</p><p className="text-3xl font-bold text-card-text">{properties.reduce((sum, p) => sum + p.tenants.length, 0)}</p></div></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card-bg border border-border rounded-2xl p-6">
          <div className="flex items-center gap-4"><div className="p-3 bg-blue-500/10 rounded-xl"><DollarSign className="w-6 h-6 text-blue-500" /></div>
          <div><p className="text-sm text-card-text/70">Monthly Revenue</p><p className="text-3xl font-bold text-card-text">{formatCurrency(properties.reduce((sum, p) => sum + p.tenants.reduce((s: number, t: any) => s + (t.monthlyRent || 0), 0), 0))}</p></div></div>
        </motion.div>
      </div>

      {properties.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-12 bg-card-bg rounded-2xl border border-border">
          <Building className="w-16 h-16 text-card-text/30 mx-auto mb-4" />
          <p className="text-xl font-semibold text-card-text">No Properties Yet</p>
          <p className="text-card-text/70 mt-2">Create your first property to get started</p>
          <Button onClick={() => setIsCreateModalOpen(true)} variant="primary" className="mt-4"><Plus className="w-5 h-5" />Create Property</Button>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {properties.map((property, index) => (
            <motion.div key={property.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="bg-card-bg border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 bg-primary/10 rounded-xl"><Building className="w-8 h-8 text-primary" /></div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-card-text">{property.name}</h3>
                    <p className="text-card-text/70 mt-1 flex items-center gap-2"><Home className="w-4 h-4" />{property.address}</p>
                    {property.description && <p className="text-sm text-card-text/60 mt-2">{property.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => { setSelectedProperty(property); setIsAssignModalOpen(true); }} variant="secondary" size="sm"><UserPlus className="w-4 h-4" />Assign Tenant</Button>
                  <Button onClick={() => handleDeleteProperty(property.id)} variant="secondary" size="sm"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" /><div><p className="text-xs text-card-text/70">Occupancy</p><p className="font-bold text-card-text">{property.occupancy}</p></div></div>
                <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-primary" /><div><p className="text-xs text-card-text/70">Base Rent</p><p className="font-bold text-card-text">{formatCurrency(property.monthlyRent)}/mo</p></div></div>
                <div className="flex items-center gap-2"><Home className="w-4 h-4 text-primary" /><div><p className="text-xs text-card-text/70">Units</p><p className="font-bold text-card-text">{property.units}</p></div></div>
                <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-green-500" /><div><p className="text-xs text-card-text/70">Total Revenue</p><p className="font-bold text-green-500">{formatCurrency(property.tenants.reduce((s: number, t: any) => s + (t.monthlyRent || 0), 0))}/mo</p></div></div>
              </div>

              {property.tenants.length > 0 && (
                <div className="mt-6 pt-6 border-t border-border">
                  <h4 className="text-lg font-bold text-card-text mb-4 flex items-center gap-2"><Users className="w-5 h-5" />Tenants ({property.tenants.length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {property.tenants.map((tenant: any) => (
                      <div key={tenant.id} className="bg-white/5 border border-border rounded-xl p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1"><p className="font-bold text-card-text">{tenant.name}</p><p className="text-sm text-card-text/70">@{tenant.username}</p></div>
                          <Button onClick={() => handleRemoveTenant(tenant.id)} variant="secondary" size="sm"><Trash2 className="w-3 h-3" /></Button>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between"><span className="text-card-text/70">Rent:</span><span className="font-bold text-card-text">{formatCurrency(tenant.monthlyRent || 0)}</span></div>
                          {tenant.nextDueDate && (<div className="flex items-center justify-between"><span className="text-card-text/70 flex items-center gap-1"><Calendar className="w-3 h-3" />Next Due:</span><span className={`font-bold ${isRentOverdue(tenant.nextDueDate) ? 'text-red-500' : 'text-green-500'}`}>{formatDate(tenant.nextDueDate)}{isRentOverdue(tenant.nextDueDate) && ' ⚠️'}</span></div>)}
                          <div className="flex items-center justify-between"><span className="text-card-text/70 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Late Payments:</span><span className={`font-bold ${tenant.latePaymentCount > 0 ? 'text-red-500' : 'text-green-500'}`}>{tenant.latePaymentCount || 0}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card-bg border border-border rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-card-text mb-6">Create New Property</h2>
            <form onSubmit={handleCreateProperty} className="space-y-4">
              <div><label className="block text-sm font-semibold text-card-text/90 mb-2">Property Name *</label><input name="name" required className="w-full px-4 py-3 bg-white/5 border border-card-text/20 rounded-xl text-card-text focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Sunset Apartments" /></div>
              <div><label className="block text-sm font-semibold text-card-text/90 mb-2">Address *</label><input name="address" required className="w-full px-4 py-3 bg-white/5 border border-card-text/20 rounded-xl text-card-text focus:outline-none focus:ring-2 focus:ring-primary" placeholder="123 Main St" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold text-card-text/90 mb-2">Units *</label><input name="units" type="number" min="1" defaultValue="1" required className="w-full px-4 py-3 bg-white/5 border border-card-text/20 rounded-xl text-card-text focus:outline-none focus:ring-2 focus:ring-primary" /></div>
                <div><label className="block text-sm font-semibold text-card-text/90 mb-2">Base Rent ($) *</label><input name="monthlyRent" type="number" step="0.01" min="0" required className="w-full px-4 py-3 bg-white/5 border border-card-text/20 rounded-xl text-card-text focus:outline-none focus:ring-2 focus:ring-primary" placeholder="1200" /></div>
              </div>
              <div><label className="block text-sm font-semibold text-card-text/90 mb-2">Description</label><textarea name="description" rows={3} className="w-full px-4 py-3 bg-white/5 border border-card-text/20 rounded-xl text-card-text focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Optional notes..." /></div>
              <div className="flex gap-3 pt-4"><Button type="submit" variant="primary" fullWidth>Create Property</Button><Button type="button" variant="secondary" fullWidth onClick={() => setIsCreateModalOpen(false)}>Cancel</Button></div>
            </form>
          </motion.div>
        </div>
      )}

      {isAssignModalOpen && selectedProperty && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card-bg border border-border rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-card-text mb-2">Assign Tenant to {selectedProperty.name}</h2>
            <p className="text-card-text/70 mb-6">Select a tenant to assign</p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {tenants.filter(t => !t.propertyId).map((tenant) => (
                <button key={tenant.id} onClick={() => handleAssignTenant(tenant.id)} className="w-full p-4 bg-white/5 hover:bg-white/10 border border-border rounded-xl text-left transition-colors"><p className="font-bold text-card-text">{tenant.name}</p><p className="text-sm text-card-text/70">@{tenant.username} • {tenant.email}</p></button>
              ))}
              {tenants.filter(t => !t.propertyId).length === 0 && (<p className="text-center text-card-text/70 py-8">No unassigned tenants</p>)}
            </div>
            <Button type="button" variant="secondary" fullWidth className="mt-4" onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

