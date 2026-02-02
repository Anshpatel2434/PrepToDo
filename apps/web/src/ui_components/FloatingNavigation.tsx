// ============================================================================
// LIQUID MINIMALISM NAVIGATION COMPONENT
// ============================================================================
import React, { useState } from "react";
import {
    motion,
} from "framer-motion";
import {
    Home,
    LayoutGrid,
    CalendarCheck,
    PieChart,
    User,
    LogOut,
    Sliders,
    Menu,
    X,
    ArrowRight
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    useFetchUserQuery,
    useLogoutMutation,
} from "../pages/auth/redux_usecases/authApi";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";

interface NavigationItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    path: string;
    description: string;
    isMobileOnly?: boolean;
}

// ----------------------------------------------------------------------------
// MOBILE DOCK ITEM
// ----------------------------------------------------------------------------
const DockItem = React.memo(function DockItem({
    item,
    // mouseY removed
    isDark,
    isActive,
    onClick
}: {
    item: NavigationItem;
    // mouseY removed
    isDark: boolean;
    isActive: boolean;
    onClick: () => void;
}) {
    return (
        <motion.button
            onClick={onClick}
            className="group relative flex flex-col items-center justify-center w-12 h-12"
            whileTap={{ scale: 0.9 }}
        >
            {/* Active Indicator Background (Pill shape behind) */}
            {isActive && (
                <motion.div
                    layoutId="dockActive"
                    className={`absolute inset-0 rounded-2xl ${isDark ? "bg-white/10" : "bg-black/5"}`}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
            )}

            {/* Icon */}
            <motion.div
                animate={{
                    scale: isActive ? 1.15 : 1,
                    color: isActive
                        ? (isDark ? "#34D399" : "#0F5F53")
                        : (isDark ? "#9CA3AF" : "#6B7280")
                }}
                className="relative z-10 transition-colors duration-300"
            >
                {item.icon}
            </motion.div>

            {/* Active Dot Indicator */}
            {isActive && (
                <motion.div
                    layoutId="dockDot"
                    className={`absolute bottom-1 w-1 h-1 rounded-full ${isDark ? "bg-brand-accent-dark" : "bg-brand-primary-light"}`}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
            )}

            {/* Ripple effect container would go here */}
        </motion.button>
    );
});

// ----------------------------------------------------------------------------
// DESKTOP PILL NAV ITEM
// ----------------------------------------------------------------------------
const DesktopNavItem = ({
    item,
    isActive,
    isDark,
    onClick
}: {
    item: NavigationItem;
    isActive: boolean;
    isDark: boolean;
    onClick: () => void;
}) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`
                relative px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 tracking-wide
                ${isActive
                    ? (isDark ? "text-brand-primary-dark" : "text-brand-primary-light")
                    : (isDark ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-black")
                }
            `}
        >
            {/* Background Hover/Active State */}
            {(isActive || isHovered) && (
                <motion.div
                    layoutId="pillActiveBg"
                    className={`absolute inset-0 rounded-full -z-10 ${isActive
                        ? (isDark ? "bg-white/5 border border-white/5" : "bg-black/5 border border-black/5")
                        : (isDark ? "bg-white/5" : "bg-black/5")
                        }`}
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
            )}

            {item.label}
        </button>
    );
};

// ----------------------------------------------------------------------------
// DATA
// ----------------------------------------------------------------------------
const navigationItems: NavigationItem[] = [
    {
        id: "home",
        label: "Home",
        icon: <Home size={24} strokeWidth={2} />,
        path: "/",
        description: "Dashboard Overview",
    },
    {
        id: "daily",
        label: "Practice",
        icon: <CalendarCheck size={24} strokeWidth={2} />,
        path: "/daily",
        description: "Daily Exercises",
    },
    {
        id: "features",
        label: "Features",
        icon: <LayoutGrid size={24} strokeWidth={2} />,
        path: "/home#features",
        description: "Explore Tools",
    },
    {
        id: "about",
        label: "About",
        icon: <PieChart size={24} strokeWidth={2} />, // Using Chart as placeholder for About/Stats
        path: "/dashboard", // Mapped to dashboard for now as per previous logic
        description: "Analytics",
    },
];

const mobileMenuExtraItems: NavigationItem[] = [
    {
        id: "customized-mocks",
        label: "Custom Mocks",
        icon: <Sliders size={24} strokeWidth={2} />,
        path: "/customized-mocks",
        description: "Tailored Tests",
        isMobileOnly: true
    }
];

// ----------------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------------
export const FloatingNavigation: React.FC = () => {
    const { isDark } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    // Auth State
    const { data: authState } = useFetchUserQuery();
    const user = authState ?? null;
    const isAuthenticated = user !== null;
    const [logout] = useLogoutMutation();

    // Mobile Menu State
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Scroll Logic for Bottom Dock Bounce
    // Scroll Logic for Bottom Dock Bounce
    // Removed unused scrollY mock

    // Handlers
    const handleNavigate = (path: string) => {
        if (path.includes('#')) {
            const [pathname, hash] = path.split('#');
            if (location.pathname === pathname) {
                const element = document.getElementById(hash) || document.querySelector(`[data-section="${hash}"]`);
                element?.scrollIntoView({ behavior: 'smooth' });
            } else {
                navigate(path);
            }
        } else {
            navigate(path);
        }
        setIsMobileMenuOpen(false);
    };

    const handleLogout = async () => {
        try {
            await logout().unwrap();
            toast.success("Logged out successfully");
            navigate('/');
        } catch (e) {
            toast.error("Logout failed");
        }
    };

    // Determine active tab
    const getActiveId = () => {
        if (location.pathname === '/') return 'home';
        if (location.pathname.startsWith('/daily')) return 'daily';
        if (location.pathname.startsWith('/dashboard')) return 'about';
        return '';
    };
    const activeId = getActiveId();

    return (
        <>
            {/* =======================================================================
               DESKTOP NAVIGATION (≥1024px)
               - Fixed Top Pill Navbar
               ======================================================================= */}
            <div className="hidden lg:flex fixed top-0 left-0 right-0 z-50 justify-center pt-6">
                <motion.nav
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className={`
                        h-[68px] px-2 pl-8 pr-2 rounded-full flex items-center gap-4
                        backdrop-blur-xl border-b-[1px] shadow-sm
                        transition-colors duration-500
                        ${isDark
                            ? "bg-bg-tertiary-dark/80 border-white/5 shadow-black/20"
                            : "bg-white/70 border-white/20 shadow-black/5"
                        }
                    `}
                >
                    {/* Logo Area */}
                    <div
                        className="flex items-center gap-3 mr-8 cursor-pointer group"
                        onClick={() => navigate('/')}
                    >
                        {/* Logo Icon Placeholder - simple geometric shape */}
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isDark ? "bg-white text-black" : "bg-black text-white"}`}>
                            <span className="font-bold text-xs">P</span>
                        </div>
                        <span className={`font-medium tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                            PrepToDo
                        </span>
                    </div>

                    {/* Navigation Pills */}
                    <div className="flex items-center gap-1">
                        {navigationItems.map(item => (
                            <DesktopNavItem
                                key={item.id}
                                item={item}
                                isActive={activeId === item.id}
                                isDark={isDark}
                                onClick={() => handleNavigate(item.path)}
                            />
                        ))}
                    </div>

                    {/* CTA Button */}
                    <div className="pl-6 ml-2 border-l border-gray-200/20">
                        {isAuthenticated ? (
                            <div className="flex items-center gap-4">
                                <span className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                    Hi, {user.email?.split('@')[0]}
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className={`
                                        h-10 w-10 rounded-full flex items-center justify-center transition-all
                                        ${isDark ? "bg-white/10 hover:bg-red-500/20 hover:text-red-400" : "bg-black/5 hover:bg-red-50 hover:text-red-600"}
                                    `}
                                >
                                    <LogOut size={16} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => navigate('/auth?mode=signup')}
                                className={`
                                    h-11 px-6 rounded-full font-semibold text-sm transition-all duration-300
                                    shadow-lg hover:-translate-y-0.5
                                    ${isDark
                                        ? "bg-bg-primary-light text-bg-primary-dark hover:shadow-white/10"
                                        : "bg-bg-primary-dark text-white hover:shadow-black/20"
                                    }
                                `}
                            >
                                Get Started
                            </button>
                        )}
                    </div>
                </motion.nav>
            </div>

            {/* =======================================================================
               MOBILE NAVIGATION (<1024px)
               - Fixed Bottom Floating Dock
               ======================================================================= */}
            <div className="lg:hidden fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
                <motion.div
                    className="pointer-events-auto"
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
                >
                    <div className={`
                        flex items-center gap-2 px-4 py-3 rounded-3xl
                        backdrop-blur-2xl shadow-2xl border
                        ${isDark
                            ? "bg-bg-tertiary-dark/90 border-white/10 shadow-black/50"
                            : "bg-white/90 border-white/40 shadow-xl shadow-black/5"
                        }
                    `}>
                        {navigationItems.map((item) => (
                            <DockItem
                                key={item.id}
                                item={item}
                                isDark={isDark}
                                isActive={activeId === item.id}
                                onClick={() => handleNavigate(item.path)}
                            />
                        ))}

                        {/* Mobile Menu Trigger */}
                        <div className={`w-[1px] h-8 mx-1 ${isDark ? "bg-white/10" : "bg-black/5"}`} />

                        <DockItem
                            item={{
                                id: 'menu',
                                label: 'Menu',
                                path: '#',
                                description: 'More',
                                icon: isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />
                            }}
                            isDark={isDark}
                            isActive={isMobileMenuOpen}
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        />
                    </div>
                </motion.div>
            </div>

            {/* Mobile Expanded Menu Overlay */}
            {isMobileMenuOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className={`
                        lg:hidden fixed bottom-28 left-4 right-4 z-40 rounded-3xl p-6
                        backdrop-blur-2xl border shadow-2xl
                        ${isDark
                            ? "bg-bg-secondary-dark/95 border-white/10"
                            : "bg-white/95 border-white/40"
                        }
                    `}
                >
                    <div className="flex flex-col gap-4">
                        {isAuthenticated && (
                            <div className={`p-4 rounded-2xl flex items-center gap-4 ${isDark ? "bg-white/5" : "bg-black/5"}`}>
                                <div className="w-10 h-10 rounded-full bg-brand-primary-light text-white flex items-center justify-center">
                                    <User size={20} />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className={`font-semibold truncate ${isDark ? "text-white" : "text-gray-900"}`}>
                                        {user?.email}
                                    </p>
                                    <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                                        Free Plan
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            {mobileMenuExtraItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => handleNavigate(item.path)}
                                    className={`
                                        p-4 rounded-2xl text-left transition-colors
                                        ${isDark
                                            ? "bg-white/5 hover:bg-white/10 active:bg-white/15"
                                            : "bg-gray-50 hover:bg-gray-100 active:bg-gray-200"
                                        }
                                    `}
                                >
                                    <div className={`mb-2 ${isDark ? "text-brand-primary-dark" : "text-brand-primary-light"}`}>
                                        {item.icon}
                                    </div>
                                    <div className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                                        {item.label}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {isAuthenticated ? (
                            <button
                                onClick={handleLogout}
                                className={`
                                    w-full py-3.5 rounded-xl font-medium flex items-center justify-center gap-2
                                    ${isDark ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-600"}
                                `}
                            >
                                <LogOut size={18} />
                                Sign Out
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate('/auth?mode=signup')}
                                className={`
                                    w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2
                                    ${isDark ? "bg-brand-primary-dark text-black" : "bg-brand-primary-light text-white"}
                                `}
                            >
                                Get Started
                                <ArrowRight size={18} />
                            </button>
                        )}
                    </div>
                </motion.div>
            )}
        </>
    );
};
