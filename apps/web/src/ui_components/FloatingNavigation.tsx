// ============================================================================
// FLOATING NAVIGATION COMPONENT
// ============================================================================
import React, { useState, useRef, useEffect } from "react";
import { MdHome, MdGridView, MdQuiz, MdInsertChart, MdInfo, MdContactSupport, MdMenu, MdClose } from "react-icons/md";

interface NavigationItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    path: string;
    description: string;
}

interface FloatingNavigationProps {
    onNavigate?: (path: string, section: string) => void;
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
        id: "analytics",
        label: "Analytics",
        icon: <MdInsertChart className="text-lg" />,
        path: "/analytics",
        description: "View your progress",
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

export const FloatingNavigation: React.FC<FloatingNavigationProps> = ({
    onNavigate,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);
    const [isDark, setIsDark] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const checkTheme = () => {
            setIsDark(document.documentElement.classList.contains("dark"));
        };
        checkTheme();

        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });

        return () => observer.disconnect();
    }, []);

    const handleNavigate = (item: NavigationItem) => {
        onNavigate?.(item.path, item.id);
        setIsOpen(false);
    };

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    return (
        <>
            {/* Sidebar Toggle Button */}
            <button
                onClick={toggleSidebar}
                className={`
          fixed left-6 top-6 z-50 w-12 h-12 rounded-2xl
          flex items-center justify-center
          transition-all duration-300 ease-out
          hover:scale-110
          backdrop-blur-3xl 
          hover:cursor-pointer
          bg-slate-500/20 hover:shadow-[0_0_20px_rgba(100,116,139,0.4)] focus:ring-slate-400
        `}
                aria-label="Toggle sidebar"
            >
                {/* Menu Icon - shown when closed */}
                {!isOpen && (
                    <MdMenu className="text-slate-600 dark:text-slate-300 text-2xl transition-all duration-300 hover:rotate-90" />
                )}

                {/* Close Icon - shown when open */}
                {isOpen && (
                    <MdClose className="text-slate-600 dark:text-slate-300 text-2xl transition-all duration-300 hover:-rotate-12" />
                )}
            </button>

            {/* Sidebar */}
            <div
                ref={containerRef}
                className={`
          fixed left-0 top-0 h-full z-40 transition-transform duration-500 ease-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          ${
                        isDark
                            ? "bg-slate-900/95 border-slate-700"
                            : "bg-white/95 border-gray-200"
                    }
          backdrop-blur-xl border-r shadow-2xl
          ${isOpen ? "w-80" : "w-0 overflow-hidden"}
        `}
            >
                <div className="p-6 h-full flex flex-col">
                    {/* Logo Section */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                                    <img
                                        src="/new_icon.png"
                                        alt="PrepToDo Logo"
                                        className="w-8 h-8 rounded-lg object-cover"
                                    />
                                </div>
                            </div>
                            <div>
                                <h1
                                    className={`text-2xl font-serif font-bold ${
                                        isDark ? "text-white" : "text-gray-900"
                                    }`}
                                >
                                    PrepToDo
                                </h1>
                                <p
                                    className={`text-sm ${
                                        isDark ? "text-gray-400" : "text-gray-600"
                                    }`}
                                >
                                    AI Study Platform
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Items */}
                    <nav className="flex-1 space-y-2">
                        {navigationItems.map((item) => (
                            <div
                                key={item.id}
                                className="relative group"
                                onMouseEnter={() => setHoveredItem(item.id)}
                                onMouseLeave={() => setHoveredItem(null)}
                            >
                                <button
                                    onClick={() => handleNavigate(item)}
                                    className={`
                    w-full flex items-center gap-4 p-4 rounded-xl
                    transition-all duration-300 ease-out
                    ${
                                            isDark
                                                ? "hover:bg-slate-800/50 text-gray-300 hover:text-white"
                                                : "hover:bg-gray-50 text-gray-600 hover:text-gray-900"
                                        }
                  `}
                                >
                                    <div
                                        className={`
                    w-10 h-10 rounded-xl flex items-center justify-center
                    ${
                                            isDark
                                                ? "bg-slate-800/50 text-gray-400 group-hover:text-white group-hover:bg-slate-700/50"
                                                : "bg-gray-100 text-gray-500 group-hover:text-gray-700 group-hover:bg-gray-200/50"
                                        }
                    transition-all duration-300
                  `}
                                    >
                                        <div className="text-lg">
                                            {item.icon}
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <div className="font-medium">{item.label}</div>
                                        <div
                                            className={`text-xs ${
                                                isDark ? "text-gray-500" : "text-gray-400"
                                            }`}
                                        >
                                            {item.description}
                                        </div>
                                    </div>
                                </button>

                                {/* Tooltip for sidebar */}
                                {hoveredItem === item.id && (
                                    <div
                                        className={`
                    absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 rounded-lg
                    text-sm font-medium shadow-lg z-50
                    ${
                                            isDark
                                                ? "bg-slate-800 text-white border border-slate-600"
                                                : "bg-white text-gray-900 border border-gray-200"
                                        }
                  `}
                                    >
                                        {item.label}
                                        <div
                                            className={`
                      absolute right-full top-1/2 -translate-y-1/2 w-2 h-2 rotate-45
                      ${
                                                isDark
                                                    ? "bg-slate-800 border-l border-b border-slate-600"
                                                    : "bg-white border-l border-b border-gray-200"
                                            }
                    `}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </nav>

                    {/* Bottom section */}
                    <div
                        className={`pt-6 border-t ${
                            isDark ? "border-slate-700" : "border-gray-200"
                        }`}
                    >
                        <div
                            className={`text-center text-sm ${
                                isDark ? "text-gray-400" : "text-gray-500"
                            }`}
                        >
                            v1.0.0 - MVP
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Navigation Icons */}
            <div
                className={`
        fixed left-6 top-20 z-30 
        flex flex-col gap-6
        transition-all duration-500 ease-out
        ${
                    isOpen
                        ? "translate-x-20 opacity-0 pointer-events-none"
                        : "translate-x-0 opacity-100 pointer-events-auto"
                }
      `}
            >
                {navigationItems.map((item) => {
                    // Define contextual colors for each navigation item
                    const getIconColor = (id: string) => {
                        switch (id) {
                            case "home": return "text-blue-600 dark:text-blue-400";
                            case "features": return "text-purple-600 dark:text-purple-400";
                            case "practice": return "text-green-600 dark:text-green-400";
                            case "analytics": return "text-orange-600 dark:text-orange-400";
                            case "about": return "text-teal-600 dark:text-teal-400";
                            case "contact": return "text-indigo-600 dark:text-indigo-400";
                            default: return "text-gray-600 dark:text-gray-400";
                        }
                    };

                    return (
                        <div
                            key={item.id}
                            className="relative group"
                            onMouseEnter={() => setHoveredItem(item.id)}
                            onMouseLeave={() => setHoveredItem(null)}
                        >
                            <button
                                onClick={() => handleNavigate(item)}
                                className={`
                  w-12 h-12 rounded-2xl
                  flex items-center justify-center
                  transition-all duration-300 ease-out
                  hover:scale-110
                  backdrop-blur-3xl 
                  hover:cursor-pointer
                  bg-slate-500/20 hover:shadow-[0_0_20px_rgba(100,116,139,0.4)] focus:ring-slate-400
                `}
                                aria-label={item.label}
                            >
                                <div className={`
                  transition-all duration-300
                  ${getIconColor(item.id)} group-hover:scale-110
                `}>
                                    {item.icon}
                                </div>
                            </button>

                            {/* Floating tooltip */}
                            {hoveredItem === item.id && (
                                <div
                                    className={`
                    absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 rounded-lg
                    text-sm font-medium shadow-lg z-50 whitespace-nowrap
                    transition-all duration-300 ease-out
                    bg-slate-800 text-white border border-slate-600 dark:bg-slate-700 dark:border-slate-500
                  `}
                                >
                                    {item.label}
                                    <div
                                        className={`
                      absolute right-full top-1/2 -translate-y-1/2 w-2 h-2 rotate-45
                      bg-slate-800 border-l border-b border-slate-600 dark:bg-slate-700 dark:border-slate-500
                    `}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Overlay when sidebar is open */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-30 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
};
