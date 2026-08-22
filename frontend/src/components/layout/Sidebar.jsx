import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GoldenSKLogo } from '../common/GoldenSKLogo';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  Briefcase, 
  TrendingUp, 
  TrendingDown, 
  CheckSquare, 
  BarChart3, 
  Award, 
  ShieldCheck, 
  Settings, 
  PartyPopper,
  FileText,
  Clock,
  RefreshCw,
  User,
  LogOut
} from 'lucide-react';

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'USER'] },
    { label: 'Special Days & Wishes', path: '/special-days', icon: PartyPopper, roles: ['SUPER_ADMIN', 'ADMIN', 'GREETINGS_OFFICER', 'MANAGER'] },
    { label: 'Client Follow-ups', path: '/followups', icon: Clock, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'USER'] },
    { label: 'Customer 360', path: '/customers', icon: UserCheck, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'USER'] },
    { label: 'Insurance Policies', path: '/policies', icon: FileText, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'USER'] },
    { label: 'Investments Register', path: '/investments', icon: Briefcase, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'USER'] },
    { label: 'Claims Desk', path: '/claims', icon: ShieldCheck, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'USER'] },
    { label: 'Policy Renewals', path: '/renewals', icon: RefreshCw, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'USER'] },
    { label: 'Income & Commission', path: '/income', icon: TrendingUp, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { label: 'Expense Tracker', path: '/expenses', icon: TrendingDown, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
    { label: 'Task Management', path: '/tasks', icon: CheckSquare, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'USER'] },
    { label: 'User Management', path: '/users', icon: Award, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
    { label: 'Staff Management', path: '/staff-management', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
    { label: 'Reports & Analytics', path: '/reports', icon: BarChart3, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
    { label: 'Audit Logs', path: '/audit-logs', icon: ShieldCheck, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
    { label: 'My Profile', path: '/profile', icon: User, roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
    { label: 'System Settings', path: '/settings', icon: Settings, roles: ['SUPER_ADMIN', 'ADMIN'] },
  ];

  const userRole = user?.role || 'EMPLOYEE';

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 border-r border-slate-800 shadow-xl shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center space-x-3 bg-white">
        <GoldenSKLogo className="h-10 w-10 shrink-0" />
        <div className="flex flex-col space-y-0.5">
          <h1 className="font-black text-red-600 text-xs tracking-tight leading-snug uppercase whitespace-nowrap">
            SK SMART INVESTMENTS
          </h1>
          <p className="text-[10px] font-black text-black leading-tight whitespace-nowrap">
            Insurance and Investments Specialist
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin">
        {navItems
          .filter(item => item.roles.includes(userRole))
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50 space-y-3">
        <div className="flex items-center justify-between">
          <div className="truncate">
            <p className="text-xs font-black text-white truncate">{user?.name || 'Admin'}</p>
            <span className="badge badge-brand text-[9px] px-2 py-0.5 mt-0.5">{user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' ? 'Admin' : user?.role === 'MANAGER' ? 'Manager' : user?.role === 'GREETINGS_OFFICER' ? 'Greetings Officer' : 'Staff Advisor'}</span>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
