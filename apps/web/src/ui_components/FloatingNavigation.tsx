// ============================================================================
// FLUID MINIMALISM NAVIGATION COMPONENT
// Top-fixed on all screen sizes, always visible text, new logo
// ============================================================================
import React, { useState, useCallback } from "react";
import {
    motion,
    AnimatePresence,
} from "framer-motion";
import {
    LayoutGrid,
    CalendarCheck,
    PieChart,
    User,
    LogOut,
    Sliders,
    Menu,
    X,
    ArrowRight,
    Loader2
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
    authApi,
    useFetchUserQuery,
    useLogoutMutation,
    clearStoredToken,
} from "../pages/auth/redux_usecases/authApi";
import { resetAuth } from "../pages/auth/redux_usecases/authSlice";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";
// Import UserResponse type
import type { UserResponse } from "../services/apiClient";
import logo from "/logo_new.png";

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------
interface NavigationItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    path: string;
    description: string;
    isMobileOnly?: boolean;
}

// ----------------------------------------------------------------------------
// DATA
// ----------------------------------------------------------------------------
const navigationItems: NavigationItem[] = [
    // Home item removed as per request
    {
        id: "daily",
        label: "Daily",
        icon: <CalendarCheck size={20} strokeWidth={2} />,
        path: "/daily",
        description: "Daily Exercises",
    },
    {
        id: "features",
        label: "Features",
        icon: <LayoutGrid size={20} strokeWidth={2} />,
        path: "/home#features",
        description: "Tools",
    },
    {
        id: "about",
        label: "Dashboard",
        icon: <PieChart size={20} strokeWidth={2} />,
        path: "/dashboard",
        description: "Analytics",
    },
    {
        id: "customized-mocks",
        label: "Customized Sectionals",
        icon: <Sliders size={20} strokeWidth={2} />,
        path: "/customized-mocks",
        description: "Tailored Tests",
    }
];

// ----------------------------------------------------------------------------
// DESKTOP NAV ITEM (Static Text)
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

    return (
        <motion.button
            onClick={onClick}
            className={`
                relative flex items-center justify-center gap-2 px-4 py-2.5 rounded-full
                transition-all duration-200 hover:cursor-pointer
                ${isActive
                    ? (isDark ? "bg-white/10 text-white" : "bg-black/5 text-black")
                    : (isDark ? "text-gray-400 hover:text-white hover:bg-white/5" : "text-gray-500 hover:text-black hover:bg-black/5")
                }
            `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            {/* Active Indicator Background (Subtle border for active state) */}
            {isActive && (
                <motion.div
                    layoutId="desktopNavActive"
                    className={`absolute inset-0 rounded-full border ${isDark ? "border-white/10" : "border-black/5"}`}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
            )}

            {/* Icon */}
            <div className="flex items-center justify-center shrink-0">
                {item.icon}
            </div>

            {/* Label (Always Visible) */}
            <span className="whitespace-nowrap font-medium text-sm">
                {item.label}
            </span>
        </motion.button>
    );
};

// ----------------------------------------------------------------------------
// MOBILE NAV ITEM (Icon + Text Below)
// ----------------------------------------------------------------------------
const MobileNavItem = ({
    item,
    isActive,
    isDark,
    onClick
}: {
    item: NavigationItem;
    isActive: boolean;
    isDark: boolean;
    onClick: () => void;
}) => (
    <button
        onClick={onClick}
        className={`
            flex flex-col items-center justify-center w-auto h-auto py-2 px-1 rounded-xl gap-1
            transition-all duration-200 active:scale-95 flex-1 min-w-[60px]
            ${isActive
                ? (isDark ? "text-white bg-white/5" : "text-black bg-black/5")
                : (isDark ? "text-gray-400" : "text-gray-500")
            }
        `}
    >
        <div className={isActive ? "scale-110 transition-transform" : ""}>
            {item.icon}
        </div>
        <span className="text-[10px] font-sm leading-none text-center">
            {item.label}
        </span>
    </button>
);

// ----------------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------------
export const FloatingNavigation: React.FC = () => {
    const { isDark } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();

    // Auth State
    const { data: authState } = useFetchUserQuery();
    const user = authState ?? null;
    const isAuthenticated = user !== null;
    const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

    // Mobile Menu State
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    // Logout Confirmation Modal State
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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

    // Show logout confirmation modal
    const promptLogout = useCallback(() => {
        setShowLogoutConfirm(true);
        setIsMobileMenuOpen(false);
    }, []);

    // Perform actual logout
    const handleLogout = useCallback(async () => {
        try {
            await logout().unwrap();
            clearStoredToken();
            dispatch(resetAuth());
            dispatch(authApi.util.resetApiState());
            toast.success("Logged out successfully");
            setShowLogoutConfirm(false);
            navigate('/');
        } catch (error) {
            console.error("Logout failed", error);
            clearStoredToken();
            dispatch(resetAuth());
            dispatch(authApi.util.resetApiState());
            setShowLogoutConfirm(false);
            navigate('/');
            toast.error("Logged out (session expired)");
        }
    }, [logout, navigate, dispatch]);

    // Determine active tab
    const getActiveId = () => {
        // Home no longer has a dedicated nav item, but we highlight nothing or maybe Features if on home?
        // Actually, if on root and not focused on features, maybe no highlight is correct for this list.
        if (location.pathname === '/' && location.hash === '#features') return 'features';
        // Logic for other paths
        if (location.pathname.startsWith('/daily')) return 'daily';
        if (location.pathname.startsWith('/dashboard')) return 'about';
        if (location.pathname.startsWith('/customized-mocks')) return 'customized-mocks';
        return '';
    };
    const activeId = getActiveId();

    // Mobile Logic: Filter items
    // First 4 items (which is all of them now roughly) + Menu Button if needed
    // We have 4 items. Let's see if we fit them all. 
    // If screen is very small, we might need overflow. But 4 items is standard for mobile nav.
    const mobileVisibleItems = navigationItems;
    // If we add more later, we can re-introduce the hamburger logic for overflow. 
    // For now, let's keep the Hamburger mainly for Profile/Logout if logged in, or just always show it for Profile stuff.
    // The previous code had "First 4 items + Menu Button".
    // Let's stick to showing the 4 items we have, and put the "Menu" button as the 5th item for "More/Profile".

    return (
        <React.Fragment>
            {/* =======================================================================
               UNIFIED TOP NAVIGATION CONTAINER
               ======================================================================= */}
            <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4 pointer-events-none">
                <motion.nav
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className={`
                        pointer-events-auto
                        flex items-center gap-2 px-3 py-2 rounded-full
                        backdrop-blur-2xl border shadow-2xl
                        ${isDark
                            ? "bg-gray-900/80 border-white/10 ring-1 ring-white/5 shadow-black/50"
                            : "bg-white/90 border-white/40 ring-1 ring-black/5 shadow-black/10"
                        }
                    `}
                >
                    {/* 
                      --------------------------
                      DESKTOP LAYOUT (>= 1024px)
                      -------------------------- 
                    */}
                    <div className="hidden lg:flex items-center gap-1">
                        {/* Logo / Brand - Clickable to Home */}
                        <div
                            className="flex items-center pr-4 cursor-pointer select-none"
                            onClick={() => navigate('/')}
                        >
                            {/* Logo Image with Subtle Background */}
                            <div className={`
                                flex items-center justify-center
                                w-11 h-11 rounded-xl p-0.5 transition-all duration-300
                                ${isDark ? "bg-white/10 hover:bg-white/15" : "bg-black/5 hover:bg-black/10"}
                            `}>
                                <img
                                    src={logo}
                                    alt="PrepToDo Logo"
                                    className="w-full h-full object-contain"
                                />
                            </div>

                            {/* Brand Text */}
                            <div className="flex flex-col ml-3 leading-none justify-center">
                                <span className={`
                                    text-lg font-bold tracking-tight
                                    ${isDark ? "text-white" : "text-gray-900"}
                                `}>
                                    PrepToDo
                                </span>
                                <span className={`
                                    text-[10px] font-bold tracking-wide uppercase mt-0.5
                                    ${isDark ? "text-brand-primary-light" : "text-brand-primary-dark"}
                                `}>
                                    Beta Version
                                </span>
                            </div>
                        </div>

                        {/* Navigation Items */}
                        {navigationItems.map(item => (
                            <DesktopNavItem
                                key={item.id}
                                item={item}
                                isActive={activeId === item.id}
                                isDark={isDark}
                                onClick={() => handleNavigate(item.path)}
                            />
                        ))}

                        {/* Divider */}
                        <div className={`w-[1px] h-6 mx-3 ${isDark ? "bg-white/10" : "bg-black/10"}`} />

                        {/* User / CTA */}
                        {isAuthenticated ? (
                            <DropdownProfile user={user} isDark={isDark} onLogout={promptLogout} />
                        ) : (
                            <button
                                onClick={() => navigate('/auth?mode=signup')}
                                className={`
                                    h-10 px-6 rounded-full font-bold text-sm transition-all duration-300
                                    hover:-translate-y-0.5 active:scale-95 shadow-lg
                                    ${isDark
                                        ? "bg-gradient-to-r from-brand-primary-dark to-brand-secondary-dark text-white shadow-brand-primary-dark/20 hover:shadow-brand-primary-dark/40"
                                        : "bg-gradient-to-r from-brand-primary-light to-brand-secondary-light text-white shadow-brand-primary-light/20 hover:shadow-brand-primary-light/40"
                                    }
                                `}
                            >
                                Get Started
                            </button>
                        )}
                    </div>

                    {/* 
                      --------------------------
                      MOBILE LAYOUT (< 1024px)
                      -------------------------- 
                    */}
                    <div className="lg:hidden flex items-center justify-between w-full">
                        {/* Logo on Left */}
                        <div
                            className="p-1 cursor-pointer mr-2"
                            onClick={() => navigate('/')}
                        >
                            <div className={`
                                w-9 h-9 rounded-lg p-1.5 flex items-center justify-center
                                ${isDark ? "bg-white/10" : "bg-black/5"}
                            `}>
                                <img
                                    src={logo}
                                    alt="Logo"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                        </div>

                        {/* Navigation Items (Middle) */}
                        <div className="flex items-center flex-1 justify-center">
                            {mobileVisibleItems.map(item => (
                                <MobileNavItem
                                    key={item.id}
                                    item={item}
                                    isActive={activeId === item.id}
                                    isDark={isDark}
                                    onClick={() => handleNavigate(item.path)}
                                />
                            ))}
                        </div>

                        {/* Profile / Menu on Right */}
                        <MobileNavItem
                            item={{
                                id: 'menu',
                                label: isAuthenticated ? 'Profile' : 'Menu',
                                path: '#',
                                description: 'More',
                                icon: isAuthenticated ? <User size={20} /> : <Menu size={20} />
                            }}
                            isActive={isMobileMenuOpen}
                            isDark={isDark}
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        />
                    </div>
                </motion.nav>
            </div>

            {/* =======================================================================
               MOBILE OVERFLOW MENU OVERLAY
               ======================================================================= */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className={`
                            lg:hidden fixed top-24 left-4 right-4 z-40 rounded-3xl p-6
                            backdrop-blur-2xl border shadow-2xl ring-1
                            ${isDark
                                ? "bg-gray-900/90 border-white/10 ring-white/10"
                                : "bg-white/90 border-white/40 ring-black/5"
                            }
                        `}
                    >
                        <div className="flex flex-col gap-4">
                            {/* Header */}
                            <div className="flex items-center justify-between pb-4 border-b border-gray-500/10">
                                <span className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                                    Menu
                                </span>
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`p-2 rounded-full ${isDark ? "bg-white/10 text-white" : "bg-black/5 text-black"}`}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* User User Info Row */}
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

                            {/* Mobile Auth Actions */}
                            {isAuthenticated ? (
                                <button
                                    onClick={promptLogout}
                                    className={`
                                        w-full py-3.5 rounded-xl font-medium flex items-center justify-center gap-2
                                        ${isDark ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-600"}
                                    `}
                                >
                                    <LogOut size={18} />
                                    Sign Out
                                </button>
                            ) : (
                                <div className="flex flex-col gap-3">
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
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Logout Confirmation Modal */}
            <AnimatePresence>
                {showLogoutConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
                        onClick={() => !isLoggingOut && setShowLogoutConfirm(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className={`
                                relative w-[90%] max-w-sm p-6 rounded-2xl shadow-2xl border
                                ${isDark
                                    ? "bg-bg-secondary-dark border-white/10"
                                    : "bg-white border-gray-200"
                                }
                            `}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="text-center">
                                <div className={`
                                    w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center
                                    ${isDark ? "bg-red-500/20" : "bg-red-100"}
                                `}>
                                    <LogOut className={isDark ? "text-red-400" : "text-red-600"} size={24} />
                                </div>
                                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                                    Sign Out?
                                </h3>
                                <p className={`text-sm mb-6 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                    Are you sure you want to sign out of your account?
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowLogoutConfirm(false)}
                                        disabled={isLoggingOut}
                                        className={`
                                            flex-1 py-2.5 px-4 rounded-xl font-medium transition-colors
                                            ${isDark
                                                ? "bg-white/10 hover:bg-white/15 text-white"
                                                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                                            }
                                            ${isLoggingOut ? "opacity-50 cursor-not-allowed" : ""}
                                        `}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        disabled={isLoggingOut}
                                        className={`
                                            flex-1 py-2.5 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2
                                            ${isDark
                                                ? "bg-red-500/90 hover:bg-red-500 text-white"
                                                : "bg-red-600 hover:bg-red-700 text-white"
                                            }
                                            ${isLoggingOut ? "opacity-75 cursor-not-allowed" : ""}
                                        `}
                                    >
                                        {isLoggingOut ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                <span>Signing Out...</span>
                                            </>
                                        ) : (
                                            "Sign Out"
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </React.Fragment>
    );
};

// ----------------------------------------------------------------------------
// HELPER: DROPDOWN PROFILE (DESKTOP)
// ----------------------------------------------------------------------------
const DropdownProfile = ({ user, isDark, onLogout }: { user: UserResponse, isDark: boolean, onLogout: () => void }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div
            className="relative"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            <button className={`
                w-10 h-10 rounded-full flex items-center justify-center transition-all
                ${isDark ? "bg-white/10 hover:bg-white/20" : "bg-black/5 hover:bg-black/10"}
            `}>
                <User size={18} className={`${isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-black"}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className={`
                            absolute top-full right-0 mt-2 w-56 p-2 rounded-2xl
                            backdrop-blur-xl border shadow-2xl ring-1
                            ${isDark
                                ? "bg-[#1A1A1A]/80 border-white/10 ring-white/10"
                                : "bg-white/80 border-white/40 ring-black/5"
                            }
                        `}
                    >
                        <div className="px-3 py-2 border-b border-gray-500/10 mb-2">
                            <p className="text-sm font-medium truncate opacity-70">
                                <p className={`font-semibold truncate ${isDark ? "text-white" : "text-gray-900"}`}>
                                    {user?.email}
                                </p>
                                <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                                    Free Plan
                                </p>
                            </p>
                        </div>
                        <button
                            onClick={onLogout}
                            className={`
                                w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors
                                flex items-center gap-2
                                ${isDark ? "hover:bg-white/5 text-red-400" : "hover:bg-black/5 text-red-600"}
                            `}
                        >
                            <LogOut size={14} />
                            Log Out
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
