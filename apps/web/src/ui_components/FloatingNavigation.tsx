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
    CalendarCheck,
    PieChart,
    User,
    LogOut,
    Loader2,
    MessageSquare,
    Home,
    Target,
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
// import logo from "/logo_new.png";
import logo from "../assets/logo_final_2d_round.png";
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
    {
        id: "home",
        label: "Home",
        icon: <Home size={20} strokeWidth={2} />,
        path: "/home",
        description: "Home Page",
    },
    {
        id: "daily",
        label: "Daily",
        icon: <CalendarCheck size={20} strokeWidth={2} />,
        path: "/daily",
        description: "Daily Exercises",
    },
    {
        id: "practice",
        label: "Practice",
        icon: <Target size={20} strokeWidth={2} />,
        path: "/practice",
        description: "Practice Hub",
    },
    {
        id: "dashboard",
        label: "Dashboard",
        icon: <PieChart size={20} strokeWidth={2} />,
        path: "/dashboard",
        description: "Analytics",
    },
    {
        id: "forum",
        label: "Forum",
        icon: <MessageSquare size={20} strokeWidth={2} />,
        path: "/forum",
        description: "AI Tutor's Desk",
    },
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
// MOBILE TOP NAV ITEM (Icon Only for space saving)
// ----------------------------------------------------------------------------
const MobileTopNavItem = ({
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
            flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full
            transition-all duration-200 active:scale-95
            ${isActive
                ? (isDark ? "bg-white/10 text-white" : "bg-black/5 text-black")
                : (isDark ? "text-gray-400 hover:text-white hover:bg-white/5" : "text-gray-500 hover:text-black hover:bg-black/5")
            }
        `}
    >
        {React.isValidElement<{ strokeWidth?: number }>(item.icon) && isActive
            ? React.cloneElement(item.icon, { strokeWidth: 2.5 })
            : item.icon}
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
    const { data: authState } = useFetchUserQuery(undefined, {
        refetchOnMountOrArgChange: true,
        refetchOnFocus: true,
    });
    // Auth is cookie-based: if /me returns a user, they're authenticated
    const user = authState ?? null;
    const isAuthenticated = user !== null;
    const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

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
    };

    // Show logout confirmation modal
    const promptLogout = useCallback(() => {
        setShowLogoutConfirm(true);
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
        if (location.pathname.startsWith('/home')) return 'home';
        if (location.pathname.startsWith('/daily')) return 'daily';
        if (location.pathname.startsWith('/practice')) return 'practice';
        if (location.pathname.startsWith('/dashboard')) return 'dashboard';
        if (location.pathname.startsWith('/forum')) return 'forum';
        return '';
    };
    const activeId = getActiveId();

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
                        flex items-center justify-between lg:justify-center gap-1 lg:gap-2 px-2 lg:px-3 py-2 rounded-full
                        w-[96%] max-w-[450px] lg:w-auto lg:max-w-none
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
                                w-11 h-11 transition-all duration-300
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
                            className="flex items-center justify-center w-9 h-9 cursor-pointer"
                            onClick={() => navigate('/')}
                        >
                            <img
                                src={logo}
                                alt="Logo"
                                className="w-full h-full object-contain"
                            />
                        </div>

                        {/* Navigation Icons (Middle) */}
                        <div className="flex items-center gap-0.5 sm:gap-1">
                            {navigationItems.map(item => (
                                <MobileTopNavItem
                                    key={item.id}
                                    item={item}
                                    isActive={activeId === item.id}
                                    isDark={isDark}
                                    onClick={() => handleNavigate(item.path)}
                                />
                            ))}
                        </div>

                        {/* Profile/CTA on Right */}
                        <div className="flex items-center">
                            {isAuthenticated ? (
                                <DropdownProfile user={user!} isDark={isDark} onLogout={promptLogout} />
                            ) : (
                                <button
                                    onClick={() => navigate('/auth?mode=signup')}
                                    className={`
                                        h-8 px-3 rounded-full font-bold text-[11px] sm:text-xs transition-all duration-300
                                        ${isDark
                                            ? "bg-brand-primary-dark text-black"
                                            : "bg-brand-primary-light text-white"
                                        }
                                    `}
                                >
                                    Login
                                </button>
                            )}
                        </div>
                    </div>
                </motion.nav>
            </div>

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
