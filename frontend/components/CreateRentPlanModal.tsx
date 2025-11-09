'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, User, DollarSign, Calendar, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TenantSearchResult {
  id: string;
  username: string;
  email: string;
  name: string;
}

interface CreateRentPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateRentPlanModal({ isOpen, onClose, onSuccess }: CreateRentPlanModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TenantSearchResult[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<TenantSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchError, setSearchError] = useState('');
  const searchTimeout = useRef<NodeJS.Timeout>();

  const [formData, setFormData] = useState({
    monthlyRent: '',
    deposit: '',
    duration: '',
    description: '',
    startDate: '',
  });

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      setSearchError('');
      return;
    }

    setIsSearching(true);
    setSearchError('');
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `http://localhost:5001/api/users/search?username=${encodeURIComponent(searchQuery)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.users || []);
          if (data.users && data.users.length === 0) {
            setSearchError(`No tenant found with username "${searchQuery}"`);
          }
          setShowDropdown(true);
        } else {
          setSearchError('Failed to search users');
        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchError('Search failed. Please try again.');
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTenant) {
      alert('Please select a tenant from the search results');
      return;
    }

    if (!formData.monthlyRent || parseFloat(formData.monthlyRent) <= 0) {
      alert('Please enter a valid monthly rent amount');
      return;
    }

    if (!formData.deposit || parseFloat(formData.deposit) <= 0) {
      alert('Please enter a valid deposit amount');
      return;
    }

    if (!formData.duration) {
      alert('Please select a lease duration');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const payload = {
        tenantUsername: selectedTenant.username,
        monthlyRent: parseFloat(formData.monthlyRent),
        deposit: parseFloat(formData.deposit),
        duration: parseInt(formData.duration),
        description: formData.description || undefined,
        startDate: formData.startDate || undefined,
      };

      console.log('Sending rent plan:', payload);

      const response = await fetch('http://localhost:5001/api/rent-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Plan created successfully:', data);
        alert(`Rent plan sent to @${selectedTenant.username} successfully!`);
        onSuccess();
        handleClose();
      } else {
        const error = await response.json();
        console.error('API error:', error);
        alert(error.error || 'Failed to create rent plan');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to create rent plan. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedTenant(null);
    setShowDropdown(false);
    setFormData({
      monthlyRent: '',
      deposit: '',
      duration: '',
      description: '',
      startDate: '',
    });
    onClose();
  };

  const selectTenant = (tenant: TenantSearchResult) => {
    setSelectedTenant(tenant);
    setSearchQuery(tenant.username);
    setShowDropdown(false);
    setSearchError('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
            onClick={handleClose}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-card-bg rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-card-text/20">
                <h2 className="text-2xl font-bold text-card-text">Create Rent Plan</h2>
                <button
                  onClick={handleClose}
                  className="w-10 h-10 rounded-full bg-white/10 text-card-text hover:bg-white/20 transition-all flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                {/* Tenant Search */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-card-text/90">Search Tenant by Username</label>
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-card-text/50" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          if (selectedTenant) setSelectedTenant(null);
                        }}
                        placeholder="Type username..."
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-card-text/20 rounded-xl text-card-text placeholder-card-text/50 focus:outline-none focus:ring-2 focus:ring-primary-light"
                        required
                      />
                      {isSearching && (
                        <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-card-text/50 animate-spin" />
                      )}
                    </div>

                    {/* Search Results Dropdown */}
                    {showDropdown && searchResults.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute top-full mt-2 w-full bg-card-bg border border-card-text/20 rounded-xl shadow-xl z-10 max-h-60 overflow-y-auto"
                      >
                        {searchResults.map((tenant) => (
                          <button
                            key={tenant.id}
                            type="button"
                            onClick={() => selectTenant(tenant)}
                            className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left border-b border-card-text/10 last:border-b-0"
                          >
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                              <User className="w-5 h-5 text-card-text" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-card-text">@{tenant.username}</p>
                              <p className="text-sm text-card-text/70 truncate">{tenant.name}</p>
                              <p className="text-xs text-card-text/50 truncate">{tenant.email}</p>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}

                    {searchError && (
                      <div className="absolute top-full mt-2 w-full bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                        <p className="text-red-500 text-sm font-semibold">{searchError}</p>
                        <p className="text-xs text-card-text/60 mt-1">Make sure the username is correct</p>
                      </div>
                    )}
                  </div>

                  {selectedTenant && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-primary-light/30"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary-light/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-card-text" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-card-text">Selected: @{selectedTenant.username}</p>
                        <p className="text-sm text-card-text/70">{selectedTenant.name}</p>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Financial Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-card-text/90">Monthly Rent ($)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-card-text/50" />
                      <input
                        type="number"
                        step="0.01"
                        value={formData.monthlyRent}
                        onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                        placeholder="2000.00"
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-card-text/20 rounded-xl text-card-text placeholder-card-text/50 focus:outline-none focus:ring-2 focus:ring-primary-light"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-card-text/90">Deposit ($)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-card-text/50" />
                      <input
                        type="number"
                        step="0.01"
                        value={formData.deposit}
                        onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                        placeholder="2000.00"
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-card-text/20 rounded-xl text-card-text placeholder-card-text/50 focus:outline-none focus:ring-2 focus:ring-primary-light"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Duration and Start Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-card-text/90">Lease Duration</label>
                    <select
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-card-text/20 rounded-xl text-card-text focus:outline-none focus:ring-2 focus:ring-primary-light cursor-pointer"
                      style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
                      required
                    >
                      <option value="" style={{ backgroundColor: '#1A1F1C', color: '#E8EDE9' }}>Select duration</option>
                      <option value="3" style={{ backgroundColor: '#1A1F1C', color: '#E8EDE9' }}>3 months</option>
                      <option value="6" style={{ backgroundColor: '#1A1F1C', color: '#E8EDE9' }}>6 months</option>
                      <option value="9" style={{ backgroundColor: '#1A1F1C', color: '#E8EDE9' }}>9 months</option>
                      <option value="12" style={{ backgroundColor: '#1A1F1C', color: '#E8EDE9' }}>12 months (1 year)</option>
                      <option value="18" style={{ backgroundColor: '#1A1F1C', color: '#E8EDE9' }}>18 months</option>
                      <option value="24" style={{ backgroundColor: '#1A1F1C', color: '#E8EDE9' }}>24 months (2 years)</option>
                      <option value="36" style={{ backgroundColor: '#1A1F1C', color: '#E8EDE9' }}>36 months (3 years)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-card-text/90">Start Date (Optional)</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-card-text/50" />
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-card-text/20 rounded-xl text-card-text placeholder-card-text/50 focus:outline-none focus:ring-2 focus:ring-primary-light"
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-card-text/90">Description / Terms (Optional)</label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-4 w-5 h-5 text-card-text/50" />
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Additional terms, conditions, or notes..."
                      rows={4}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-card-text/20 rounded-xl text-card-text placeholder-card-text/50 focus:outline-none focus:ring-2 focus:ring-primary-light resize-none"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!selectedTenant || isSubmitting}
                  className={cn(
                    "w-full py-4 rounded-xl font-semibold text-white transition-all shadow-lg flex items-center justify-center gap-2",
                    selectedTenant && !isSubmitting
                      ? "bg-gradient-to-r from-primary to-primary-light hover:from-primary-dark hover:to-primary"
                      : "bg-gray-600 cursor-not-allowed opacity-50"
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending Proposal...
                    </>
                  ) : (
                    'Send Rent Plan Proposal'
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

