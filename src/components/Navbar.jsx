import React from 'react';
import { Menu, Bell, Clock, Database, ShieldCheck, Car } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onMenuClick, title = 'TourBee Fleet Manager' }) {
  const { user, isAdmin } = useAuth();
  
  // Current time in IST (Kerala)
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h1>
          <p className="hidden sm:block text-xs text-slate-500 font-medium">
            Kochi & Ernakulam Fleet Operations • Kerala, India
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* PostgreSQL Database status badge */}
        <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <Database className="w-3.5 h-3.5" />
          <span>PostgreSQL Active</span>
        </div>

        {/* Date / Timezone badge */}
        <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{dateFormatted} • IST</span>
        </div>

        {/* Assigned vehicle pill if driver */}
        {user?.driver_profile?.assigned_vehicle_reg && (
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-emerald-700 text-white text-xs font-bold shadow-sm">
            <Car className="w-3.5 h-3.5" />
            <span>{user.driver_profile.assigned_vehicle_reg}</span>
          </div>
        )}
      </div>
    </header>
  );
}
