'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Receipt, 
  Wallet, 
  Home, 
  Gift, 
  Users, 
  FileText,
  LogOut,
  Sparkles,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface SidebarProps {
  role: 'tenant' | 'landlord';
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const tenantLinks = [
    { href: '/dashboard/tenant', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { href: '/dashboard/tenant/bills', label: 'Bills', icon: Receipt, badge: null },
    { href: '/dashboard/tenant/expenses', label: 'Expenses', icon: Wallet, badge: null },
    { href: '/dashboard/tenant/rent-plan', label: 'Rent Plan', icon: Home, badge: null },
    { href: '/dashboard/tenant/shop', label: 'Rewards', icon: Gift, badge: null },
    { href: '/dashboard/tenant/ai-chat', label: 'AI Chat', icon: MessageCircle, badge: 'BETA' },
  ];

  const landlordLinks = [
    { href: '/dashboard/landlord', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { href: '/dashboard/landlord/tenants', label: 'Tenants', icon: Users, badge: null },
    { href: '/dashboard/landlord/bills', label: 'Bills', icon: Receipt, badge: null },
    { href: '/dashboard/landlord/rent-plans', label: 'Plans', icon: FileText, badge: null },
  ];

  const links = role === 'tenant' ? tenantLinks : landlordLinks;

  // Auto-collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* Collapsible Sidebar for all devices */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ 
          x: 0, 
          opacity: 1,
          width: isCollapsed ? '80px' : '288px'
        }}
        transition={{ duration: 0.3, type: "spring" }}
        className="fixed left-0 top-0 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col z-50 shadow-lg"
      >
        {/* Toggle Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-6 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-700 transition-colors z-10"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </motion.button>

        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white whitespace-nowrap">RentEase</h1>
                  <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {role === 'tenant' ? 'Tenant Portal' : 'Landlord Portal'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Navigation - Fixed height, no scroll */}
        <nav className="flex-1 p-4 space-y-2 overflow-hidden">
          {links.map((link, index) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            
            return (
              <Link key={link.href} href={link.href}>
                <motion.div
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05, type: "spring" }}
                  whileHover={{ x: 6, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all cursor-pointer group',
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
                    isCollapsed && 'justify-center'
                  )}
                  title={isCollapsed ? link.label : undefined}
                >
                  <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'animate-pulse-slow')} />
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="font-medium whitespace-nowrap flex items-center gap-2"
                      >
                        {link.label}
                        {link.badge && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="px-1.5 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-400 text-yellow-900 text-[10px] font-bold rounded uppercase tracking-wide"
                          >
                            {link.badge}
                          </motion.span>
                        )}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {isActive && !isCollapsed && !link.badge && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto w-2 h-2 rounded-full bg-white flex-shrink-0"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* User info and logout - Fixed at bottom */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-3 px-4 py-4 bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-2xl overflow-hidden"
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5">{user?.email}</p>
                {user?.role === 'tenant' && (
                  <motion.div 
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Reward Points</p>
                      <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{user.points || 0}</p>
                    </div>
                    <Gift className="w-8 h-8 text-emerald-600 dark:text-emerald-400 opacity-20" />
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className={cn(
              "w-full px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all flex items-center gap-2",
              isCollapsed ? "justify-center" : "justify-center"
            )}
            title={isCollapsed ? "Sign Out" : undefined}
          >
            <LogOut className="w-4 h-4" />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="whitespace-nowrap"
                >
                  Sign Out
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.div>

      {/* Spacer to push content */}
      <div 
        style={{ 
          width: isCollapsed ? '80px' : '288px',
          transition: 'width 0.3s'
        }} 
        className="flex-shrink-0"
      />
    </>
  );
}
