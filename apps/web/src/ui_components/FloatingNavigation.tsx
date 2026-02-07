// ============================================================================
// FLUID MINIMALISM NAVIGATION COMPONENT
// Top-fixed on all screen sizes, fluid MacBook dock effect, hover-to-text
// ============================================================================
import React, { useState, useRef, useCallback } from "react";
import {
    motion,
    useMotionValue,
    useTransform,
    useSpring,
    AnimatePresence,
    MotionValue
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
    clearStoredToken,
} from "../pages/auth/redux_usecases/authApi";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";
// Import UserResponse type
import type { UserResponse } from "../services/apiClient";

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
        icon: <Home size={22} strokeWidth={2} />,
        path: "/",
        description: "Dashboard",
    },
    {
        id: "daily",
        label: "Practice",
        icon: <CalendarCheck size={22} strokeWidth={2} />,
        path: "/daily",
        description: "Daily Exercises",
    },
    {
        id: "features",
        label: "Features",
        icon: <LayoutGrid size={22} strokeWidth={2} />,
        path: "/home#features",
        description: "Tools",
    },
    {
        id: "about",
        label: "Analysis",
        icon: <PieChart size={22} strokeWidth={2} />,
        path: "/dashboard",
        description: "Analytics",
    },
    // Adding extra item that might be hidden on mobile depending on logic
    {
        id: "customized-mocks",
        label: "Custom Mocks",
        icon: <Sliders size={22} strokeWidth={2} />,
        path: "/customized-mocks",
        description: "Tailored Tests",
    }
];

// ----------------------------------------------------------------------------
// DESKTOP DOCK ITEM (Fluid + Expandable)
// ----------------------------------------------------------------------------
const DockItem = ({
    item,
    mouseX,
    isActive,
    isDark,
    onClick
}: {
    item: NavigationItem;
    mouseX: MotionValue<number>;
    isActive: boolean;
    isDark: boolean;
    onClick: () => void;
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    // Distance from mouse to center of this icon
    const distance = useTransform(mouseX, (val) => {
        const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
        return val - bounds.x - bounds.width / 2;
    });

    // MacBook Dock Effect logic for SIZE/SCALE of the ICON container
    // When mouse is close, the icon scales up.
    // Range [-150, 0, 150] -> Scale [1, 1.3, 1]
    const widthRaw = useTransform(distance, [-150, 0, 150], [40, 55, 40]);
    const width = useSpring(widthRaw, { mass: 0.1, stiffness: 150, damping: 12 });

    // Text Reveal Logic
    // When hovered, we want the button to expand width to fit text.
    // If not hovered, it stays compact (icon only).

    return (
        <motion.button
            ref={ref}
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            // Animate width of the BUTTON container
            // Base width comes from `width` motion value (icon size), plus extra if hovered (for text)
            // But we can't easily mix MotionValue with state-based animation in generic `style`.
            // Instead, we use `layout` prop given we are in a flex container.
            layout
            className={`
                relative flex items-center justify-center rounded-full
                ${isActive
                    ? (isDark ? "bg-white/10 text-white" : "bg-black/5 text-black")
                    : (isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-black")
                }
            `}
            style={{
                // We apply the fluid width to the height and min-width to keep it roughly square/circular when collapsed
                height: width,
                minWidth: width,
                // If hovered, we override width via standard layout animation properties below, so style might conflict
                // Actually, let's apply the fluid scale to the ICON, and handle container sizing separately.
            }}
            // Framer Motion handling for width expansion
            animate={{
                width: isHovered ? "auto" : undefined, // Let it expand naturally
                paddingLeft: isHovered ? 16 : 0,
                paddingRight: isHovered ? 20 : 0
            }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
            {/* Active Indicator Background */}
            {isActive && (
                <motion.div
                    layoutId="dockActive"
                    className={`absolute inset-0 rounded-full ${isDark ? "bg-white/5 border border-white/5" : "bg-black/5 border border-black/5"}`}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
            )}

            {/* Icon Container - Applies the fluid scaling */}
            <motion.div
                style={{ width, height: width }}
                className="flex items-center justify-center relative z-10"
            >
                {/* We scale the icon inside based on the spring value */}
                {/* Actually, `width` controls the container size. Let's make the icon fill it reasonably. */}
                <div className="flex items-center justify-center w-full h-full">
                    {item.icon}
                </div>
            </motion.div>

            {/* Label (Revealed on Hover) */}
            <AnimatePresence>
                {isHovered && (
                    <motion.span
                        initial={{ opacity: 0, width: 0, x: -10 }}
                        animate={{ opacity: 1, width: "auto", x: 0 }}
                        exit={{ opacity: 0, width: 0, x: -10 }}
                        className="whitespace-nowrap font-medium text-sm ml-1 overflow-hidden"
                    >
                        {item.label}
                    </motion.span>
                )}
            </AnimatePresence>

            {/* Active Dot (Small indicator at bottom if active but not hovered, maybe?) */}
            {/* Keeping it simple as per liquid minimalism - the background pill is enough usually, but let's add the dot for extra flair if desired */}
        </motion.button>
    );
};

// ----------------------------------------------------------------------------
// MOBILE NAV ITEM (Simple Touch Target)
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
            flex flex-col items-center justify-center w-14 h-14 rounded-2xl
            transition-all duration-200 active:scale-95
            ${isActive
                ? (isDark ? "text-white bg-white/10" : "text-black bg-black/5")
                : (isDark ? "text-gray-400" : "text-gray-500")
            }
        `}
    >
        <div className={isActive ? "scale-110 transition-transform" : ""}>
            {item.icon}
        </div>
    </button>
);

// ----------------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------------
export const FloatingNavigation: React.FC = () => {
    const { isDark } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    // Mouse Tracking for Desktop Dock
    const mouseX = useMotionValue(Infinity);

    // Auth State
    const { data: authState } = useFetchUserQuery();
    const user = authState ?? null;
    const isAuthenticated = user !== null;
    const [logout] = useLogoutMutation();

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
            setShowLogoutConfirm(false);
            await logout().unwrap();
            // Also clear the stored token
            clearStoredToken();
            toast.success("Logged out successfully");
            navigate('/');
        } catch {
            toast.error("Logout failed");
        }
    }, [logout, navigate]);

    // Determine active tab
    const getActiveId = () => {
        if (location.pathname === '/') return 'home';
        if (location.pathname.startsWith('/daily')) return 'daily';
        if (location.pathname.startsWith('/dashboard')) return 'about';
        if (location.pathname.startsWith('/customized-mocks')) return 'customized-mocks';
        return '';
    };
    const activeId = getActiveId();

    // Mobile Logic: Filter items
    // First 4 items + Menu Button
    const mobileVisibleItems = navigationItems.slice(0, 4);
    const mobileOverflowItems = navigationItems.slice(4);

    return (
        <React.Fragment>
            {/* =======================================================================
               UNIFIED TOP NAVIGATION CONTAINER
               ======================================================================= */}
            <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 pointer-events-none">
                <motion.nav
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    onMouseMove={(e) => mouseX.set(e.pageX)}
                    onMouseLeave={() => mouseX.set(Infinity)}
                    className={`
                        pointer-events-auto
                        flex items-center gap-2 px-2 py-2 rounded-full
                        backdrop-blur-xl border border-white/10 shadow-lg
                        ${isDark
                            ? "bg-bg-tertiary-dark/80 shadow-black/20"
                            : "bg-white/80 shadow-black/5"
                        }
                    `}
                >
                    {/* 
                      --------------------------
                      DESKTOP LAYOUT (>= 1024px)
                      -------------------------- 
                    */}
                    <div className="hidden lg:flex items-center gap-1">
                        {/* Logo / Brand (Optional, can be first item or separate) */}
                        <div
                            className="flex items-center gap-3 px-4 cursor-pointer group mr-2"
                            onClick={() => navigate('/')}
                        >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-white text-black" : "bg-black text-white"}`}>
                                <span className="font-bold text-sm">P</span>
                            </div>
                        </div>

                        {navigationItems.map(item => (
                            <DockItem
                                key={item.id}
                                item={item}
                                mouseX={mouseX}
                                isActive={activeId === item.id}
                                isDark={isDark}
                                onClick={() => handleNavigate(item.path)}
                            />
                        ))}

                        {/* Divider */}
                        <div className={`w-[1px] h-6 mx-2 ${isDark ? "bg-white/10" : "bg-black/10"}`} />

                        {/* User / CTA */}
                        {isAuthenticated ? (
                            <div className="flex items-center gap-2">
                                {/* Profile (Simplified) */}
                                <DropdownProfile user={user} isDark={isDark} onLogout={promptLogout} />
                            </div>
                        ) : (
                            <button
                                onClick={() => navigate('/auth?mode=signup')}
                                className={`
                                    h-10 px-5 rounded-full font-semibold text-sm transition-all duration-300
                                    hover:-translate-y-0.5
                                    ${isDark
                                        ? "bg-white text-black hover:bg-gray-200"
                                        : "bg-black text-white hover:bg-gray-800"
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
                    <div className="lg:hidden flex items-center gap-1">
                        {/* Logo (Icon only on mobile) */}
                        <div
                            className="bg-transparent p-2 mr-1"
                            onClick={() => navigate('/')}
                        >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-white text-black" : "bg-black text-white"}`}>
                                <span className="font-bold text-xs">P</span>
                            </div>
                        </div>

                        {mobileVisibleItems.map(item => (
                            <MobileNavItem
                                key={item.id}
                                item={item}
                                isActive={activeId === item.id}
                                isDark={isDark}
                                onClick={() => handleNavigate(item.path)}
                            />
                        ))}

                        {/* Hamburger for Overflow */}
                        <MobileNavItem
                            item={{
                                id: 'menu',
                                label: 'Menu',
                                path: '#',
                                description: 'More',
                                icon: isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />
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
                            backdrop-blur-2xl border shadow-2xl
                            ${isDark
                                ? "bg-bg-secondary-dark/95 border-white/10"
                                : "bg-white/95 border-white/40"
                            }
                        `}
                    >
                        <div className="flex flex-col gap-4">
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

                            {/* Overflow Items */}
                            <div className="grid grid-cols-2 gap-3">
                                {mobileOverflowItems.map(item => (
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
            </AnimatePresence>

            {/* Logout Confirmation Modal */}
            <AnimatePresence>
                {showLogoutConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowLogoutConfirm(false)}
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
                                        className={`
                                            flex-1 py-2.5 px-4 rounded-xl font-medium transition-colors
                                            ${isDark
                                                ? "bg-white/10 hover:bg-white/15 text-white"
                                                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                                            }
                                        `}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className={`
                                            flex-1 py-2.5 px-4 rounded-xl font-medium transition-colors
                                            ${isDark
                                                ? "bg-red-500/90 hover:bg-red-500 text-white"
                                                : "bg-red-600 hover:bg-red-700 text-white"
                                            }
                                        `}
                                    >
                                        Sign Out
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
                <User size={18} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className={`
                            absolute top-full right-0 mt-2 w-48 p-2 rounded-2xl
                            backdrop-blur-xl border shadow-xl
                            ${isDark
                                ? "bg-[#1A1A1A]/90 border-white/10"
                                : "bg-white/90 border-black/5"
                            }
                        `}
                    >
                        <div className="px-3 py-2 border-b border-gray-500/10 mb-2">
                            <p className="text-sm font-medium truncate opacity-70">
                                {user.email}
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
