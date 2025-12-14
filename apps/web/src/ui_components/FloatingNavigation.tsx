import React, { useState, useRef, useEffect } from "react";

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
		icon: (
			<div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
				<svg
					className="w-3 h-3 text-white"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
					/>
				</svg>
			</div>
		),
		path: "/",
		description: "Go to homepage",
	},
	{
		id: "features",
		label: "Features",
		icon: (
			<div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
				<svg
					className="w-3 h-3 text-white"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M13 10V3L4 14h7v7l9-11h-7z"
					/>
				</svg>
			</div>
		),
		path: "/features",
		description: "Explore platform features",
	},
	{
		id: "practice",
		label: "Practice",
		icon: (
			<div className="w-5 h-5 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
				<svg
					className="w-3 h-3 text-white"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
					/>
				</svg>
			</div>
		),
		path: "/practice",
		description: "Start practicing",
	},
	{
		id: "analytics",
		label: "Analytics",
		icon: (
			<div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
				<svg
					className="w-3 h-3 text-white"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
					/>
				</svg>
			</div>
		),
		path: "/analytics",
		description: "View your progress",
	},
	{
		id: "about",
		label: "About",
		icon: (
			<div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
				<svg
					className="w-3 h-3 text-white"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			</div>
		),
		path: "/about",
		description: "Learn about us",
	},
	{
		id: "contact",
		label: "Contact",
		icon: (
			<div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
				<svg
					className="w-3 h-3 text-white"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
					/>
				</svg>
			</div>
		),
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
          fixed left-6 top-24 z-50 
          w-12 h-12 rounded-full shadow-lg
          flex items-center justify-center
          transition-all duration-300 ease-out
          focus-ring group overflow-hidden
          ${
						isDark
							? "bg-slate-800/90 hover:bg-slate-700/90 text-white border border-slate-600/50 backdrop-blur-sm"
							: "bg-white/90 hover:bg-slate-50/90 text-gray-800 border border-gray-200/50 backdrop-blur-sm shadow-xl"
					}
        `}
			>
				{/* Background glow */}
				<div
					className={`
          absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300
          ${
						isDark
							? "bg-gradient-to-r from-blue-500/20 to-purple-500/20"
							: "bg-gradient-to-r from-blue-100 to-purple-100"
					}
        `}
				/>

				{/* Hamburger / Close icon */}
				<div className="relative w-5 h-5">
					<div
						className={`
            absolute inset-0 transition-all duration-300 ease-out
            ${isOpen ? "rotate-180 opacity-0" : "rotate-0 opacity-100"}
          `}
					>
						<svg
							className="w-full h-full"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M4 6h16M4 12h16M4 18h16"
							/>
						</svg>
					</div>
					<div
						className={`
            absolute inset-0 transition-all duration-300 ease-out
            ${isOpen ? "rotate-0 opacity-100" : "rotate-180 opacity-0"}
          `}
					>
						<svg
							className="w-full h-full"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</div>
				</div>
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
                    w-10 h-10 rounded-lg flex items-center justify-center
                    ${
											isDark
												? "bg-slate-800/50 text-gray-400 group-hover:text-white group-hover:bg-slate-700/50"
												: "bg-gray-100 text-gray-500 group-hover:text-gray-700 group-hover:bg-gray-200/50"
										}
                    transition-all duration-300
                  `}
									>
										{item.icon}
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
        fixed left-6 top-36 z-30 
        flex flex-col gap-3
        transition-all duration-500 ease-out
        ${
					isOpen
						? "translate-x-20 opacity-0 pointer-events-none"
						: "translate-x-0 opacity-100 pointer-events-auto"
				}
      `}
			>
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
                w-12 h-12 rounded-full shadow-lg backdrop-blur-sm
                flex items-center justify-center
                transition-all duration-300 ease-out
                focus-ring group overflow-hidden
                ${
									isDark
										? "bg-slate-800/90 hover:bg-slate-700/90 text-white border border-slate-600/50"
										: "bg-white/90 hover:bg-slate-50/90 text-gray-800 border border-gray-200/50"
								}
              `}
						>
							{/* Background glow effect */}
							<div
								className={`
                absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300
                blur-xl scale-150
                ${
									isDark
										? "bg-gradient-to-r from-blue-500/30 to-purple-500/30"
										: "bg-gradient-to-r from-blue-300/40 to-purple-300/40"
								}
              `}
							/>

							<div className="relative z-10">{item.icon}</div>
						</button>

						{/* Floating tooltip */}
						{hoveredItem === item.id && (
							<div
								className={`
                absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 rounded-lg
                text-sm font-medium shadow-lg z-50 whitespace-nowrap
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
