import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, UserCircle, MapPin, User, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const NavButton = ({ path, icon: Icon, label }) => (
        <button
            onClick={() => {
                navigate(path);
                setIsMobileMenuOpen(false);
            }}
            className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                location.pathname === path ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-slate-600 hover:bg-slate-50"
            )}>
            <Icon size={18} />
            {label}
        </button>
    );

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            {/* Mobile Header */}
            <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
                    <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent">
                        Home NCD-NHH
                    </h1>
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Backdrop */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden animate-in fade-in"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex flex-col z-40 transition-transform duration-300 ease-in-out md:translate-x-0",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6 border-b border-slate-100 hidden md:block">
                    <div className="flex flex-col items-center gap-2">
                        <img src="/logo.png" alt="Logo" className="w-32 h-auto mb-2" />
                        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent text-center">
                            Home NCD-NHH
                        </h1>
                    </div>
                </div>

                {/* User Info (Visible in sidebar all times) */}
                <div className="px-6 py-4 md:pt-0 md:mt-6">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-900/10">
                        <div className="bg-indigo-600 p-2 rounded-lg shrink-0">
                            <UserCircle size={24} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate">{user?.username}</p>
                            <p className="text-xs text-slate-500 capitalize truncate">
                                {user?.role === 'hc' ? `รพ.สต. ${user?.location}` : (user?.role === 'hospital' ? 'โรงพยาบาล' : 'ผู้ดูแลระบบ')}
                            </p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <NavButton path="/dashboard" icon={LayoutDashboard} label="หน้าหลัก" />
                    <NavButton path="/home-opd" icon={MapPin} label="Home OPD" />

                    {user?.role === 'admin' && (
                        <>
                            <div className="my-2 border-b border-slate-100"></div>
                            <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Admin View</p>
                            <NavButton path="/admin/users" icon={User} label="จัดการ User" />
                            <NavButton path="/dashboard/hospital" icon={LayoutDashboard} label="Hospital View" />
                            <NavButton path="/dashboard/hc" icon={LayoutDashboard} label="HC View" />
                        </>
                    )}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 p-2 text-slate-400 hover:text-red-500 transition-colors"
                        title="ออกจากระบบ"
                    >
                        <LogOut size={20} />
                        ออกจากระบบ
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-4 md:p-8 min-h-[calc(100vh-65px)] md:min-h-screen">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
