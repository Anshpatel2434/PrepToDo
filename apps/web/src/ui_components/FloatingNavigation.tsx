// ============================================================================
// FLOATING NAVIGATION COMPONENT
// ============================================================================
import React, { useRef, useState } from "react";
import {
    motion,
    AnimatePresence,
    useMotionValue,
    useSpring,
    useTransform,
    MotionValue
} from "framer-motion";
import {
    Home,
    LayoutGrid,
    CalendarCheck,
    Menu,
    User,
    Sliders,
    LogOut,
    X,
    PieChart
} from "lucide-react";
import { useNavigate } from "react-router-dom";
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
    iconColorLight: string;
    iconColorDark: string;
    path: string;
    description: string;
}

const DockItem = React.memo(function DockItem({
    item,
    mouseY,
    isDark,
    hoveredItem,
    setHoveredItem,
    handleNavigate
}: {
    item: NavigationItem;
    mouseY: MotionValue;
    isDark: boolean;
    hoveredItem: string | null;
    setHoveredItem: (id: string | null) => void;
    handleNavigate: (item: NavigationItem) => void;
}) {
    const ref = useRef<HTMLDivElement>(null);

    const distance = useTransform(mouseY, (val) => {
        const bounds = ref.current?.getBoundingClientRect() ?? { y: 0, height: 0 };
        return val - bounds.y - bounds.height / 2;
    });

    const widthSync = useTransform(distance, [-150, 0, 150], [40, 60, 40]);
    const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

    return (
        <motion.div
            ref={ref}
            style={{ width, height: width }}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
            className="aspect-square flex items-center justify-center relative group"
        >
            <motion.button
                onClick={() => handleNavigate(item)}
                className={`
                    w-full h-full rounded-2xl
                    flex items-center justify-center
                    backdrop-blur-md
                    hover:cursor-pointer focus:outline-none
                    ${isDark
                        ? "bg-bg-tertiary-dark/60 border border-white/5 hover:bg-bg-tertiary-dark"
                        : "bg-white/60 border border-black/5 hover:bg-white"
                    }
                    shadow-sm hover:shadow-md
                `}
                aria-label={item.label}
                whileTap={{ scale: 0.95 }}
            >
                <div
                    className={`
                        ${isDark ? item.iconColorDark : item.iconColorLight}
                    `}
                >
                    {item.icon}
                </div>
            </motion.button>

            {/* Floating tooltip for Dock (Keep this as labels are hidden in dock) */}
            <AnimatePresence>
                {hoveredItem === item.id && (
                    <motion.div
                        className={`
                            absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 rounded-lg
                            text-xs font-medium shadow-xl z-50 whitespace-nowrap pointer-events-none
                            backdrop-blur-md
                            ${isDark
                                ? "bg-black/80 text-white border border-white/10"
                                : "bg-white/80 text-black border border-black/10"
                            }
                        `}
                        initial={{ opacity: 0, x: -10, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -10, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                    >
                        {item.label}
                        <div
                            className={`
                                absolute right-full top-1/2 -translate-y-1/2 w-1.5 h-1.5 rotate-45
                                ${isDark
                                    ? "bg-black/80 border-l border-b border-white/10"
                                    : "bg-white/80 border-l border-b border-black/10"
                                }
                            `}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
});

function DockContainer({
    isOpen,
    isDark,
    navigationItems,
    hoveredItem,
    setHoveredItem,
    handleNavigate
}: {
    isOpen: boolean;
    isDark: boolean;
    navigationItems: NavigationItem[];
    hoveredItem: string | null;
    setHoveredItem: (id: string | null) => void;
    handleNavigate: (item: NavigationItem) => void;
}) {
    const mouseY = useMotionValue(Infinity);

    return (
        <motion.div
            onMouseMove={(e) => mouseY.set(e.clientY)}
            onMouseLeave={() => mouseY.set(Infinity)}
            className={`
                fixed left-4 top-24 z-30 
                flex flex-col gap-3
                px-3 py-4 rounded-[2rem]
            `}
            initial={false}
            animate={{
                x: isOpen ? "-200%" : "0%",
                opacity: isOpen ? 0 : 1,
                pointerEvents: isOpen ? "none" : "auto"
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            {navigationItems.map((item) => (
                <DockItem
                    key={item.id}
                    item={item}
                    mouseY={mouseY}
                    isDark={isDark}
                    hoveredItem={hoveredItem}
                    setHoveredItem={setHoveredItem}
                    handleNavigate={handleNavigate}
                />
            ))}
        </motion.div>
    );
}

const navigationItems: NavigationItem[] = [
    {
        id: "home",
        label: "Home",
        icon: <Home size={20} />,
        iconColorLight: "text-gray-700",
        iconColorDark: "text-gray-300",
        path: "/",
        description: "Dashboard Overview",
    },
    {
        id: "daily",
        label: "Daily Practice",
        icon: <CalendarCheck size={20} />,
        iconColorLight: "text-amber-600",
        iconColorDark: "text-amber-400",
        path: "/daily",
        description: "RC & VA Exercises",
    },
    {
        id: "features",
        label: "All Features",
        icon: <LayoutGrid size={20} />,
        iconColorLight: "text-violet-600",
        iconColorDark: "text-violet-400",
        path: "/home#features",
        description: "Explore Tools",
    },
    {
        id: "dashboard",
        label: "Analytics",
        icon: <PieChart size={20} />,
        iconColorLight: "text-blue-600",
        iconColorDark: "text-blue-400",
        path: "/dashboard",
        description: "Performance Stats",
    },
    {
        id: "customized-mocks",
        label: "Custom Mocks",
        icon: <Sliders size={20} />,
        iconColorLight: "text-emerald-600",
        iconColorDark: "text-emerald-400",
        path: "/customized-mocks",
        description: "Tailored Tests",
    },
];

export const FloatingNavigation: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { isDark } = useTheme();

    const { data: authState } = useFetchUserQuery();
    const user = authState ?? null;
    const isAuthenticated = user !== null;
    const [logout, { isLoading: isLogoutLoading }] = useLogoutMutation();

    async function handleLogout() {
        try {
            const result = await logout().unwrap();
            const success =
                typeof result === "object" &&
                result !== null &&
                "success" in result &&
                Boolean((result as { success?: boolean }).success);

            if (success) toast.success("Logged out successfully!");
            setIsOpen(false);
        } catch (error) {
            const err = error as { data?: string; message?: string };
            toast.error(err.data || "Logout failed");
        }
    }

    const handleAuthAction = (action: "signin" | "signup" | "logout") => {
        if (action === "signin") {
            navigate("/auth?mode=signin");
        } else if (action === "signup") {
            navigate("/auth?mode=signup");
        } else {
            handleLogout();
        }
    };

    const handleNavigate = React.useCallback((item: NavigationItem) => {
        navigate(item.path);
        setIsOpen(false);
    }, [navigate, setIsOpen]);

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    // Animation variants
    const sidebarVariants = {
        hidden: { x: "-100%" },
        visible: {
            x: 0,
            transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] as const },
        },
    };

    const navigationItemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: {
            opacity: 1,
            x: 0,
            transition: { duration: 0.3 },
        },
    };

    return (
        <>
            {/* Sidebar Toggle Button */}
            <motion.button
                onClick={toggleSidebar}
                animate={{
                    left: isOpen ? "19rem" : "1.5rem", // 1.5rem = 6 (tailwind spacing)
                    boxShadow: isOpen ? "none" : "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={`
                    fixed top-6 z-50 w-12 h-12 rounded-full
                    flex items-center justify-center
                    backdrop-blur-md
                    hover:scale-105 active:scale-95
                    ${isDark
                        ? "bg-bg-tertiary-dark/40 border border-white/5 text-white"
                        : "bg-white/40 border border-black/5 text-black"
                    }
                `}
                aria-label="Toggle sidebar"
            >
                <div className="relative flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        {isOpen ? (
                            <motion.div
                                key="close"
                                initial={{ opacity: 0, rotate: -90 }}
                                animate={{ opacity: 1, rotate: 0 }}
                                exit={{ opacity: 0, rotate: 90 }}
                                transition={{ duration: 0.2 }}
                            >
                                <X size={24} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="menu"
                                initial={{ opacity: 0, rotate: 90 }}
                                animate={{ opacity: 1, rotate: 0 }}
                                exit={{ opacity: 0, rotate: -90 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Menu size={24} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.button>

            {/* Sidebar */}
            <motion.div
                ref={containerRef}
                className={`
                    fixed left-0 top-0 h-full z-40 w-80
                    backdrop-blur-2xl shadow-2xl border-r
                    flex flex-col
                    ${isDark
                        ? "bg-bg-primary-dark/90 border-white/5"
                        : "bg-white/90 border-black/5"
                    }
                `}
                variants={sidebarVariants}
                initial="hidden"
                animate={isOpen ? "visible" : "hidden"}
            >
                <div className="flex-1 flex flex-col p-8 pt-24 overflow-y-auto">

                    {/* User Status Section - Minimalist */}
                    <div className="mb-10">
                        {isAuthenticated && user ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className={`
                                    flex items-center gap-4 p-4 rounded-2xl
                                    ${isDark ? "bg-white/5" : "bg-black/5"}
                                `}
                            >
                                <div className={`
                                    w-10 h-10 rounded-full flex items-center justify-center
                                    ${isDark ? "bg-brand-primary-dark/20 text-brand-primary-dark" : "bg-brand-primary-light/10 text-brand-primary-light"}
                                `}>
                                    <User size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className={`font-medium truncate ${isDark ? "text-white" : "text-gray-900"}`}>
                                        {user.email}
                                    </h3>
                                    <p className={`text-xs truncate ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                                        Free Plan
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="flex gap-3"
                            >
                                <button
                                    onClick={() => handleAuthAction?.("signin")}
                                    className={`
                                        flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all
                                        ${isDark
                                            ? "bg-white/10 hover:bg-white/20 text-white"
                                            : "bg-black/5 hover:bg-black/10 text-gray-900"
                                        }
                                    `}
                                >
                                    Sign In
                                </button>
                                <button
                                    onClick={() => handleAuthAction?.("signup")}
                                    className={`
                                        flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all
                                        ${isDark
                                            ? "bg-brand-primary-dark text-white hover:brightness-110"
                                            : "bg-brand-primary-light text-white hover:brightness-110"
                                        }
                                    `}
                                >
                                    Sign Up
                                </button>
                            </motion.div>
                        )}
                    </div>

                    {/* Navigation Items */}
                    <nav className="flex-1 space-y-2">
                        {navigationItems.map((item, index) => (
                            <motion.div
                                key={item.id}
                                variants={navigationItemVariants}
                                initial="hidden"
                                animate={isOpen ? "visible" : "hidden"}
                                transition={{ delay: 0.2 + index * 0.05 }}
                            >
                                <button
                                    onClick={() => handleNavigate(item)}
                                    className={`
                                        group w-full flex items-center gap-4 p-3.5 rounded-xl transition-all
                                        ${isDark
                                            ? "hover:bg-white/5 text-gray-400 hover:text-white"
                                            : "hover:bg-black/5 text-gray-500 hover:text-gray-900"
                                        }
                                    `}
                                >
                                    <div className={`
                                        p-2 rounded-lg transition-colors
                                        ${isDark
                                            ? "group-hover:bg-white/5"
                                            : "group-hover:bg-white"
                                        }
                                    `}>
                                        <div className={`
                                            transition-colors
                                            ${isDark
                                                ? "text-gray-400 group-hover:text-brand-primary-dark"
                                                : "text-gray-500 group-hover:text-brand-primary-light"
                                            }
                                        `}>
                                            {item.icon}
                                        </div>
                                    </div>
                                    <div className="text-left flex-1">
                                        <div className="font-medium text-sm">{item.label}</div>
                                        <div className={`text-[10px] ${isDark ? "text-gray-600" : "text-gray-400"}`}>
                                            {item.description}
                                        </div>
                                    </div>
                                </button>
                                {/* Tooltips removed here as requested */}
                            </motion.div>
                        ))}
                    </nav>

                    {/* Bottom section */}
                    {isAuthenticated && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className={`
                                pt-6 mt-6 border-t
                                ${isDark ? "border-white/5" : "border-black/5"}
                            `}
                        >
                            <button
                                disabled={isLogoutLoading}
                                onClick={handleLogout}
                                className={`
                                    w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all
                                    ${isDark
                                        ? "text-red-400 hover:bg-red-500/10"
                                        : "text-red-600 hover:bg-red-50"
                                    }
                                `}
                            >
                                <LogOut size={16} />
                                {isLogoutLoading ? "Logging out..." : "Sign Out"}
                            </button>
                        </motion.div>
                    )}
                    {/* Beta Badge */}
                    <div className="mt-auto pt-8 flex justify-center pb-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-medium tracking-widest uppercase ${isDark ? "bg-white/5 text-gray-500 border border-white/5" : "bg-black/5 text-gray-400 border border-black/5"
                            }`}>
                            Beta
                        </span>
                    </div>
                </div>
            </motion.div>

            {/* Persistent Fixed Beta Badge (Bottom Right) */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="fixed bottom-6 right-6 z-50 pointer-events-none select-none"
            >
                <div className={`
                    px-4 py-1.5 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase
                    border backdrop-blur-xl
                    transition-all duration-700
                    ${isDark
                        ? "bg-bg-primary-dark/80 border-brand-primary-dark/30 text-brand-primary-dark shadow-[0_0_20px_-5px_rgba(52,211,153,0.4)]"
                        : "bg-white/80 border-brand-primary-light/30 text-brand-primary-light shadow-[0_0_20px_-5px_rgba(5,150,105,0.3)]"
                    }
                `}>
                    Beta
                </div>
            </motion.div>

            {/* Floating Navigation Icons (Dock) */}
            <DockContainer
                isOpen={isOpen}
                isDark={!!isDark}
                navigationItems={navigationItems}
                hoveredItem={hoveredItem}
                setHoveredItem={setHoveredItem}
                handleNavigate={handleNavigate}
            />

            {/* Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black/20 z-30 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                    />
                )}
            </AnimatePresence>
        </>
    );
};
