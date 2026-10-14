import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Car,
  FileSpreadsheet,
  CheckCircle2,
  Wrench,
  DollarSign,
  BarChart3,
  LogOut,
  ShieldAlert,
  Fuel,
  Receipt,
  Sparkles,
  CalendarDays,
  Calculator,
  Wallet
} from 'lucide-react';

export default function Sidebar({ mobileOpen, setMobileOpen, pendingCount = 0 }) {
  const { user, isAdmin, isDriver, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isFixedRent = user?.driver_profile?.driver_type === 'DAILY_RENT' || user?.driver_profile?.payment_mode === 'FIXED_RENT';

  const adminLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Driver Management', path: '/drivers', icon: Users },
    { name: '50% Daily Submissions', path: '/submissions', icon: FileSpreadsheet },
    { name: 'Fixed Daily Rent', path: '/rent', icon: CalendarDays },
    { name: 'Driver Salary', path: '/driver-salary', icon: Wallet },
    { name: 'Live Calculator', path: '/daily-calculation', icon: Calculator },
    { name: 'Fleet Vehicles', path: '/vehicles', icon: Car },
    { name: 'Maintenance', path: '/maintenance', icon: Wrench },
    { name: 'Financial Reports', path: '/reports', icon: BarChart3 },
  ];

  const driver50Links = [
    { name: 'My Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Daily Uber Submission', path: '/submissions', icon: FileSpreadsheet },
    { name: 'Calculation & GPay', path: '/daily-calculation', icon: Calculator },
    { name: 'My Salary', path: '/my-salary', icon: Wallet },
    { name: 'Vehicle & Service', path: '/maintenance', icon: Wrench },
  ];

  const driverRentLinks = [
    { name: 'My Rent Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Daily Rent Submission', path: '/rent', icon: CalendarDays },
    { name: 'Rent Payment History', path: '/rent', icon: Receipt },
    { name: 'Vehicle & Service', path: '/maintenance', icon: Wrench },
  ];

  const links = isAdmin ? adminLinks : (isFixedRent ? driverRentLinks : driver50Links);

  const content = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-5 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-950/40 font-black text-xl tracking-wider">
            TB
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-lg text-white tracking-tight">TourBee</span>
              <span className="text-[10px] uppercase font-extrabold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">Kerala</span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Uber Fleet Manager</p>
          </div>
        </div>
      </div>

      {/* User Info Capsule */}
      <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-900/50">
        <div className="flex items-center space-x-3 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
          <div className="w-9 h-9 rounded-lg bg-emerald-700 text-emerald-100 flex items-center justify-center font-bold text-sm">
            {user?.first_name ? user.first_name[0] : (user?.username ? user.username[0].toUpperCase() : 'U')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-100 truncate">
              {user?.full_name || user?.username}
            </p>
            <div className="flex items-center space-x-1 mt-0.5">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
              <span className="text-[11px] font-medium text-slate-400 truncate">
                {isAdmin ? 'Fleet Owner (Admin)' : (user?.driver_profile?.driver_type === 'DAILY_RENT' ? 'Driver (Daily Rent)' : 'Driver (50% Profit Share)')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          {isAdmin ? 'Fleet Management' : 'Driver Portal'}
        </div>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.path}
              to={link.path}
              onClick={() => setMobileOpen && setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{link.name}</span>
              </div>
              {link.badge !== undefined && link.badge !== null && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${link.badgeColor || 'bg-emerald-500 text-white'}`}>
                  {link.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/30">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-colors border border-rose-900/30"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 z-30 shadow-xl">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          ></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 z-10 shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
