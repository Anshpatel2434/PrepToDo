import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../hooks/useAdminAuth';


// Icons (using basic SVGs for now to avoid dependency issues, or Lucide if available)
// Use Lucide React if project has it, otherwise simple SVGs
import {
    LayoutDashboard,
    Users,
    DollarSign,
    FileText,
    Database,
    LogOut,
    Menu,
    X
} from 'lucide-react';

export default function AdminLayout() {
    const { logout, admin } = useAdminAuth();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Navigation Items
    const navItems = [
        { name: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Users', path: '/admin/users', icon: Users },
        { name: 'Financials', path: '/admin/financials', icon: DollarSign },
        { name: 'Content', path: '/admin/content', icon: FileText },
        { name: 'System', path: '/admin/system', icon: Database },
    ];

    const isActive = (path: string) => location.pathname.startsWith(path);

    return (
        <div className="flex min-h-screen bg-[#0f1117] text-[#e2e8f0] font-sans">
            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-[#2a2d3a] bg-[#1a1d27] transition-transform duration-200 ease-in-out lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex h-16 items-center border-b border-[#2a2d3a] px-6">
                    <span className="text-xl font-bold tracking-tight text-white">PrepToDo<span className="text-[#6366f1]">Admin</span></span>
                    <button
                        className="ml-auto lg:hidden"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <X className="h-6 w-6 text-[#94a3b8]" />
                    </button>
                </div>

                <nav className="flex-1 space-y-1 px-3 py-4">
                    {navItems.map((item) => {
                        const active = isActive(item.path);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${active
                                    ? 'bg-[#6366f1]/10 text-[#6366f1]'
                                    : 'text-[#94a3b8] hover:bg-[#2a2d3a] hover:text-white'
                                    }`}
                            >
                                <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${active ? 'text-[#6366f1]' : 'text-[#64748b] group-hover:text-white'}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t border-[#2a2d3a] p-4">
                    <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-[#6366f1] flex items-center justify-center text-xs font-bold text-white">
                            A
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-white">Admin</p>
                            <p className="text-xs text-[#94a3b8] truncate w-32">{admin?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="mt-4 flex w-full items-center justify-center rounded-lg border border-[#2a2d3a] bg-[#1a1d27] px-4 py-2 text-sm font-medium text-[#94a3b8] transition-colors hover:bg-[#2a2d3a] hover:text-white"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex flex-1 flex-col lg:pl-64">
                {/* Topheader (Mobile Only) */}
                <header className="sticky top-0 z-30 flex h-16 items-center border-b border-[#2a2d3a] bg-[#0f1117]/80 backdrop-blur lg:hidden px-4">
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="-ml-2 rounded-md p-2 text-[#94a3b8] hover:bg-[#2a2d3a] hover:text-white"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <span className="ml-4 text-lg font-bold text-white">Admin</span>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
