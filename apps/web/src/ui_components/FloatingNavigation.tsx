// ============================================================================
// FLOATING NAVIGATION COMPONENT
// ============================================================================
import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MdHome,
    MdGridView,
    MdQuiz,
    MdInsertChart,
    MdInfo,
    MdContactSupport,
    MdMenu,
    MdPerson,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";
import {
    useFetchUserQuery,
    useLogoutMutation,
} from "../pages/auth/redux_usecases/authApi";
import toast from "react-hot-toast";
import { useTheme } from "../context/useTheme";

interface NavigationItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    path: string;
    description: string;
}

const navigationItems: NavigationItem[] = [
    {
        id: "home",
        label: "Home",
        icon: <MdHome className="text-lg" />,
        path: "/",
        description: "Go to homepage",
    },
    {
        id: "features",
        label: "Features",
        icon: <MdGridView className="text-lg" />,
        path: "/features",
        description: "Explore platform features",
    },
    {
        id: "practice",
        label: "Practice",
        icon: <MdQuiz className="text-lg" />,
        path: "/practice",
        description: "Start practicing",
    },
    {
        id: "dashboard",
        label: "Dashboard",
        icon: <MdInsertChart className="text-lg" />,
        path: "/dashboard",
        description: "Your study overview",
    },
    {
        id: "about",
        label: "About",
        icon: <MdInfo className="text-lg" />,
        path: "/about",
        description: "Learn about us",
    },
    {
        id: "contact",
        label: "Contact",
        icon: <MdContactSupport className="text-lg" />,
        path: "/contact",
        description: "Get in touch",
    },
];

export const FloatingNavigation: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { isDark } = useTheme();

    const { data: authState } = useFetchUserQuery();
    const user = authState;
    const isAuthenticated = user?.role === "authenticated";
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

    // Animation variants
    const sidebarVariants = {
        hidden: { x: "-100%" },
        visible: {
            x: 0,
            transition: { duration: 0.5 },
        },
    };

    const toggleButtonVariants = {
        initial: { scale: 1 },
        hover: { scale: 1.05 },
        tap: { scale: 0.95 },
    };

    const navigationItemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: {
            opacity: 1,
            x: 0,
            transition: { duration: 0.3 },
        },
    };

    const floatingIconVariants = {
        hidden: { opacity: 0, scale: 0.8 },
        visible: (i: number) => ({
            opacity: 1,
            scale: 1,
            transition: {
                delay: i * 0.1,
                duration: 0.5,
            },
        }),
    };

    const onNavigate = (path: string) => {
        navigate(path);
    };

    const handleNavigate = (item: NavigationItem) => {
        onNavigate?.(item.path);
        setIsOpen(false);
    };

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    return (
        <>
            {/* Sidebar Toggle Button */}
            <motion.button
                onClick={toggleSidebar}
                className={`
                    fixed top-6 z-50 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl sm:rounded-3xl
                    flex items-center justify-center
                    transition-all duration-300 ease-out
                    backdrop-blur-3xl 
                    hover:cursor-pointer focus:outline-none
                    ${isOpen ? "left-80 sm:left-96 md:left-80" : "left-6"}
                    ${
                                            isDark
                                                ? "bg-bg-tertiary-dark/80 hover:shadow-[0_0_20px_rgba(0,103,71,0.4)] border border-border-dark/50 focus:ring-brand-accent-dark/30"
                                                : "bg-bg-tertiary-light/80 hover:shadow-[0_0_20px_rgba(0,103,71,0.3)] border border-border-light/50 focus:ring-brand-accent-light/30"
                                        }
                `}
                aria-label="Toggle sidebar"
                variants={toggleButtonVariants}
                initial="initial"
                whileHover="hover"
                whileTap="tap"
            >
                {/* Menu Icon - shown when closed */}
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <MdMenu
                        className={`text-2xl sm:text-2xl ${
                            isDark ? "text-text-primary-dark" : "text-text-primary-light"
                        }`}
                    />
                </motion.div>
            </motion.button>

            {/* Sidebar */}
            <motion.div
                ref={containerRef}
                className={`
                    fixed left-0 top-0 h-full z-40
                    backdrop-blur-xl border-r shadow-2xl
                    ${isOpen ? "w-80 sm:w-96" : "w-0 overflow-hidden"}
                    ${
                                            isDark
                                                ? "bg-bg-primary-dark/95 border-border-dark"
                                                : "bg-bg-primary-light/95 border-border-light"
                                        }
                `}
                variants={sidebarVariants}
                initial="hidden"
                animate={isOpen ? "visible" : "hidden"}
            >
                <div className="p-6 h-full flex flex-col">
                    {/* Logo Section */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <motion.div
                                    className={`
                                                        w-12 h-12 rounded-xl flex items-center justify-center shadow-lg border
                                                        ${
                                                                                                                    isDark
                                                                                                                        ? "bg-bg-secondary-dark border-border-dark"
                                                                                                                        : "bg-bg-secondary-light border-border-light"
                                                                                                                }
                                                    `}
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <img
                                        src="/new_icon.png"
                                        alt="PrepToDo Logo"
                                        className="w-8 h-8 rounded-lg object-cover"
                                    />
                                </motion.div>
                            </div>
                            <div>
                                <h1
                                    className={`text-2xl font-serif font-bold ${
                                        isDark
                                            ? "text-text-primary-dark"
                                            : "text-text-primary-light"
                                    }`}
                                >
                                    PrepToDo
                                </h1>
                                <p
                                    className={`text-sm ${
                                        isDark
                                            ? "text-text-secondary-dark"
                                            : "text-text-secondary-light"
                                    }`}
                                >
                                    AI Study Platform
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* User Status Section */}
                    <div
                        className={`
                                        mb-6 p-4 rounded-xl border-2
                                        ${
                                                                                    isDark
                                                                                        ? "bg-bg-secondary-dark/50 border-border-dark"
                                                                                        : "bg-bg-secondary-light/50 border-border-light"
                                                                                }
                                    `}
                    >
                        {isAuthenticated && user ? (
                            <div className="flex items-center gap-3">
                                <div
                                    className={`
                                                    w-10 h-10 rounded-full flex items-center justify-center
                                                    ${
                                                                                                            isDark
                                                                                                                ? "bg-brand-primary-dark"
                                                                                                                : "bg-brand-primary-light"
                                                                                                        }
                                                `}
                                >
                                    <MdPerson className="text-white" size={20} />
                                </div>
                                <div>
                                    <div
                                        className={`
                                                        font-medium
                                                        ${
                                                                                                                    isDark
                                                                                                                        ? "text-text-primary-dark"
                                                                                                                        : "text-text-primary-light"
                                                                                                                }
                                                    `}
                                    >
                                        Welcome back!
                                    </div>
                                    <div
                                        className={`
                                                        text-sm
                                                        ${
                                                                                                                    isDark
                                                                                                                        ? "text-text-secondary-dark"
                                                                                                                        : "text-text-secondary-light"
                                                                                                                }
                                                    `}
                                    >
                                        {user.email}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center">
                                <div
                                    className={`
                                                    mb-3
                                                    ${
                                                                                                            isDark
                                                                                                                ? "text-text-primary-dark"
                                                                                                                : "text-text-primary-light"
                                                                                                        }
                                                `}
                                >
                                    Join PrepToDo
                                </div>
                                <div className="flex gap-2">
                                    <motion.button
                                        onClick={() => handleAuthAction?.("signin")}
                                        className={`
                                                            flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors hover:cursor-pointer
                                                            ${
                                                                                                                            isDark
                                                                                                                                ? "bg-brand-primary-dark hover:bg-brand-primary-hover-dark text-white"
                                                                                                                                : "bg-brand-primary-light hover:bg-brand-primary-hover-light text-white"
                                                                                                                        }
                                                        `}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        Sign In
                                    </motion.button>
                                    <motion.button
                                        onClick={() => handleAuthAction?.("signup")}
                                        className={`
                                                            flex-1 py-2 px-3 rounded-lg text-sm font-medium border-2 transition-colors hover:cursor-pointer
                                                            ${
                                                                                                                            isDark
                                                                                                                                ? "border-brand-primary-dark text-brand-primary-dark hover:bg-brand-primary-dark hover:text-white"
                                                                                                                                : "border-brand-primary-light text-brand-primary-light hover:bg-brand-primary-light hover:text-white"
                                                                                                                        }
                                                        `}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        Sign Up
                                    </motion.button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Navigation Items */}
                    <nav className="flex-1 space-y-2">
                        {navigationItems.map((item) => (
                            <motion.div
                                key={item.id}
                                className="relative group"
                                onMouseEnter={() => setHoveredItem(item.id)}
                                onMouseLeave={() => setHoveredItem(null)}
                                variants={navigationItemVariants}
                                initial="hidden"
                                animate="visible"
                                whileHover={{ x: 4 }}
                                transition={{ duration: 0.2 }}
                            >
                                <motion.button
                                    onClick={() => handleNavigate(item)}
                                    className={`
                                        w-full flex items-center gap-4 p-4 rounded-xl
                                        hover:cursor-pointer
                                        ${
                                                                                    isDark
                                                                                        ? "hover:bg-bg-tertiary-dark/50 text-text-secondary-dark hover:text-text-primary-dark"
                                                                                        : "hover:bg-bg-tertiary-light/50 text-text-secondary-light hover:text-text-primary-light"
                                                                                }
                                    `}
                                >
                                    <motion.div
                                        className={`
                                            w-10 h-10 rounded-xl flex items-center justify-center
                                            ${
                                                                                            isDark
                                                                                                ? "bg-bg-tertiary-dark/50 text-text-muted-dark group-hover:text-text-primary-dark group-hover:bg-bg-tertiary-dark/80"
                                                                                                : "bg-bg-tertiary-light/50 text-text-muted-light group-hover:text-text-primary-light group-hover:bg-bg-tertiary-light/80"
                                                                                        }
                                            
                                        `}
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        <div className="text-lg">{item.icon}</div>
                                    </motion.div>
                                    <div className="text-left">
                                        <div className="font-medium">{item.label}</div>
                                        <div
                                            className={`text-xs ${
                                                isDark
                                                    ? "text-text-muted-dark"
                                                    : "text-text-muted-light"
                                            }`}
                                        >
                                            {item.description}
                                        </div>
                                    </div>
                                </motion.button>

                                {/* Tooltip for sidebar */}
                                <AnimatePresence>
                                    {hoveredItem === item.id && (
                                        <motion.div
                                            className={`
                                                absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 rounded-lg
                                                text-sm font-medium shadow-lg z-50
                                                ${
                                                                                                    isDark
                                                                                                        ? "bg-bg-secondary-dark text-text-primary-dark border border-border-dark"
                                                                                                        : "bg-bg-secondary-light text-text-primary-light border border-border-light"
                                                                                                }
                                            `}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            {item.label}
                                            <div
                                                className={`
                                                    absolute right-full top-1/2 -translate-y-1/2 w-2 h-2 rotate-45
                                                    ${
                                                                                                            isDark
                                                                                                                ? "bg-bg-secondary-dark border-l border-b border-border-dark"
                                                                                                                : "bg-bg-secondary-light border-l border-b border-border-light"
                                                                                                        }
                                                `}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </nav>

                    {/* Bottom section */}
                    {isAuthenticated && (
                        <div
                            className={`border-t flex flex-col justify-center${
                                isDark ? "border-border-dark" : "border-border-light"
                            }`}
                        >
                            <motion.button
                                type="submit"
                                disabled={isLogoutLoading}
                                onClick={handleLogout}
                                className={`
              flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 hover:cursor-pointer
              ${
                                isLogoutLoading
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : "bg-brand-primary-light hover:bg-brand-primary-hover-light dark:bg-brand-primary-dark dark:hover:bg-brand-primary-hover-dark text-white shadow-lg hover:shadow-xl"
                            }
            `}
                            >
                                {isLogoutLoading ? "Logging out..." : "Log out"}
                            </motion.button>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Floating Navigation Icons */}
            <motion.div
                className={`
                    fixed left-6 top-20 sm:top-24 z-30 
                    flex flex-col gap-4 sm:gap-6
                    hover:cursor-pointer
                    ${
                                            isOpen
                                                ? "translate-x-20 opacity-0 pointer-events-none"
                                                : "translate-x-0 opacity-100 pointer-events-auto"
                                        }
                `}
            >
                {navigationItems.map((item, index) => {
                    return (
                        <motion.div
                            key={item.id}
                            className="relative group"
                            onMouseEnter={() => setHoveredItem(item.id)}
                            onMouseLeave={() => setHoveredItem(null)}
                            variants={floatingIconVariants}
                            initial="hidden"
                            animate="visible"
                            custom={index}
                        >
                            <motion.button
                                onClick={() => handleNavigate(item)}
                                className={`
                                    w-10 h-10 sm:w-12 sm:h-12 rounded-2xl
                                    flex items-center justify-center
                                    backdrop-blur-3xl 
                                    hover:cursor-pointer focus:outline-none
                                    ${
                                                                            isDark
                                                                                ? "bg-bg-tertiary-dark/80 hover:shadow-[0_0_20px_rgba(0,103,71,0.4)] border border-border-dark/50 focus:ring-brand-accent-dark/30"
                                                                                : "bg-bg-tertiary-light/80 hover:shadow-[0_0_20px_rgba(0,103,71,0.3)] border border-border-light/50 focus:ring-brand-accent-light/30"
                                                                        }
                                `}
                                aria-label={item.label}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <motion.div
                                    className={`
                                        ${
                                                                                    isDark
                                                                                        ? "text-text-muted-dark group-hover:text-text-primary-dark"
                                                                                        : "text-text-muted-light group-hover:text-text-primary-light"
                                                                                }
                                        group-hover:scale-110
                                    `}
                                >
                                    {item.icon}
                                </motion.div>
                            </motion.button>

                            {/* Floating tooltip */}
                            <AnimatePresence>
                                {hoveredItem === item.id && (
                                    <motion.div
                                        className={`
                                            absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 rounded-lg
                                            text-sm font-medium shadow-lg z-50 whitespace-nowrap
                                            ${
                                                                                            isDark
                                                                                                ? "bg-bg-secondary-dark text-text-primary-dark border border-border-dark"
                                                                                                : "bg-bg-secondary-light text-text-primary-light border border-border-light"
                                                                                        }
                                        `}
                                        initial={{ opacity: 0, x: -10, scale: 0.8 }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        exit={{ opacity: 0, x: -10, scale: 0.8 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {item.label}
                                        <div
                                            className={`
                                                absolute right-full top-1/2 -translate-y-1/2 w-2 h-2 rotate-45
                                                ${
                                                                                                    isDark
                                                                                                        ? "bg-bg-secondary-dark border-l border-b border-border-dark"
                                                                                                        : "bg-bg-secondary-light border-l border-b border-border-light"
                                                                                                }
                                            `}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* Overlay when sidebar is open */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black/20 z-30 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    />
                )}
            </AnimatePresence>
        </>
    );
};
