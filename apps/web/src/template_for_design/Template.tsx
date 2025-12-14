import { useState } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// VARC LEARNING PLATFORM - COMPLETE DESIGN SYSTEM
// Theme: Academic Soft | Mixed Fonts (Serif + Sans) | Gray-based Dark Mode
// ═══════════════════════════════════════════════════════════════════════════════

// Color constants for reliable text rendering
const colors = {
    light: {
        textPrimary: "#0F172A",
        textSecondary: "#334155",
        textMuted: "#64748B",
        bgPrimary: "#FAFBFC",
        bgCard: "#FFFFFF",
        bgHover: "#F1F5F9",
        border: "#E2E8F0",
    },
    dark: {
        textPrimary: "#F8FAFC",
        textSecondary: "#CBD5E1",
        textMuted: "#64748B",
        bgPrimary: "#0F0F12",
        bgCard: "#1A1A1F",
        bgHover: "#252529",
        border: "#2E2E35",
    },
};

// Helper function to get text color
const getTextColor = (theme: "light" | "dark", type: "primary" | "secondary" | "muted" = "primary") => {
    const colorMap = {
        primary: theme === "dark" ? colors.dark.textPrimary : colors.light.textPrimary,
        secondary: theme === "dark" ? colors.dark.textSecondary : colors.light.textSecondary,
        muted: theme === "dark" ? colors.dark.textMuted : colors.light.textMuted,
    };
    return colorMap[type];
};

const DesignSystem = () => {
    const [theme, setTheme] = useState<"light" | "dark">("light");
    const [activeTab, setActiveTab] = useState("colors");

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        document.documentElement.classList.toggle("dark");
    };

    const tabs = [
        { id: "colors", label: "Colors" },
        { id: "typography", label: "Typography" },
        { id: "buttons", label: "Buttons" },
        { id: "cards", label: "Cards" },
        { id: "inputs", label: "Inputs" },
        { id: "badges", label: "Badges" },
        { id: "alerts", label: "Alerts" },
        { id: "progress", label: "Progress" },
        { id: "showcase", label: "Showcase" },
    ];

    return (
        <div
            className={`min-h-screen transition-colors duration-300 ${
                theme === "dark"
                    ? "bg-surface-900"
                    : "bg-surface-100"
            }`}
            style={{ color: theme === "dark" ? "#F8FAFC" : "#0F172A" }}
        >
            {/* ═══════════════════════════════════════════════════════════════════
                HEADER
                ═══════════════════════════════════════════════════════════════════ */}
            <header
                className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-colors ${
                    theme === "dark"
                        ? "bg-surface-900/90 border-surface-700"
                        : "bg-surface-100/90 border-surface-200"
                }`}
            >
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 via-violet-500 to-secondary-500 flex items-center justify-center shadow-btn-primary">
                                <span className="text-white font-bold text-lg">V</span>
                            </div>
                            <div>
                                <h1 
                                    className="font-serif text-xl font-semibold"
                                    style={{ color: theme === "dark" ? "#F8FAFC" : "#0F172A" }}
                                >
                                    VARC Platform
                                </h1>
                                <p
                                    className="text-xs"
                                    style={{ color: theme === "dark" ? "#64748B" : "#64748B" }}
                                >
                                    Design System v1.0
                                </p>
                            </div>
                        </div>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 active:scale-95 ${
                                theme === "dark"
                                    ? "bg-surface-800 hover:bg-surface-700 shadow-dark-card"
                                    : "bg-white hover:shadow-card-md shadow-card"
                            }`}
                            style={{ color: theme === "dark" ? "#F8FAFC" : "#0F172A" }}
                        >
                            {theme === "light" ? (
                                <>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </svg>
                                    Dark Mode
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    Light Mode
                                </>
                            )}
                        </button>
                    </div>

                    {/* Navigation Tabs */}
                    <nav className="mt-4 -mb-px flex gap-1 overflow-x-auto scrollbar-hide">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap active:scale-95 ${
                                    activeTab === tab.id
                                        ? theme === "dark"
                                            ? "bg-primary-500/20 text-primary-400"
                                            : "bg-primary-100 text-primary-700"
                                        : theme === "dark"
                                        ? "hover:bg-surface-800"
                                        : "hover:bg-surface-150"
                                }`}
                                style={{ 
                                    color: activeTab === tab.id 
                                        ? (theme === "dark" ? "#818CF8" : "#4338CA")
                                        : (theme === "dark" ? "#CBD5E1" : "#334155")
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </header>

            {/* ═══════════════════════════════════════════════════════════════════
                MAIN CONTENT
                ═══════════════════════════════════════════════════════════════════ */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Color Palette Section */}
                {activeTab === "colors" && <ColorPaletteSection theme={theme} />}

                {/* Typography Section */}
                {activeTab === "typography" && <TypographySection theme={theme} />}

                {/* Buttons Section */}
                {activeTab === "buttons" && <ButtonsSection theme={theme} />}

                {/* Cards Section */}
                {activeTab === "cards" && <CardsSection theme={theme} />}

                {/* Inputs Section */}
                {activeTab === "inputs" && <InputsSection theme={theme} />}

                {/* Badges Section */}
                {activeTab === "badges" && <BadgesSection theme={theme} />}

                {/* Alerts Section */}
                {activeTab === "alerts" && <AlertsSection theme={theme} />}

                {/* Progress Section */}
                {activeTab === "progress" && <ProgressSection theme={theme} />}

                {/* Showcase Section */}
                {activeTab === "showcase" && <ShowcaseSection theme={theme} />}
            </main>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// COLOR PALETTE SECTION
// ═══════════════════════════════════════════════════════════════════════════════

interface SectionProps {
    theme: "light" | "dark";
}

interface ColorItem {
    name: string;
    light: string;
    hex: string;
    desc?: string;
    main?: boolean;
}

interface ColorGroup {
    name: string;
    description: string;
    colors: ColorItem[];
}

const ColorPaletteSection = ({ theme }: SectionProps) => {
    const colorGroups: ColorGroup[] = [
        {
            name: "Surface Colors",
            description: "Background and container colors",
            colors: [
                { name: "50", light: "bg-surface-50", hex: "#FEFEFE", desc: "Pure white cards" },
                { name: "100", light: "bg-surface-100", hex: "#FAFBFD", desc: "Main background" },
                { name: "150", light: "bg-surface-150", hex: "#F5F7FA", desc: "Elevated areas" },
                { name: "200", light: "bg-surface-200", hex: "#EEF1F6", desc: "Borders, dividers" },
                { name: "700", light: "bg-surface-700", hex: "#3F3F46", desc: "Dark elevated" },
                { name: "800", light: "bg-surface-800", hex: "#27272A", desc: "Dark cards" },
                { name: "900", light: "bg-surface-900", hex: "#18181B", desc: "Dark background" },
            ],
        },
        {
            name: "Primary - Indigo",
            description: "Trust, Focus, Intelligence",
            colors: [
                { name: "50", light: "bg-primary-50", hex: "#EEF2FF" },
                { name: "100", light: "bg-primary-100", hex: "#E0E7FF" },
                { name: "200", light: "bg-primary-200", hex: "#C7D2FE" },
                { name: "300", light: "bg-primary-300", hex: "#A5B4FC" },
                { name: "400", light: "bg-primary-400", hex: "#818CF8" },
                { name: "500", light: "bg-primary-500", hex: "#6366F1", main: true },
                { name: "600", light: "bg-primary-600", hex: "#4F46E5" },
                { name: "700", light: "bg-primary-700", hex: "#4338CA" },
            ],
        },
        {
            name: "Secondary - Teal",
            description: "Calm, Focus, Concentration",
            colors: [
                { name: "50", light: "bg-secondary-50", hex: "#F0FDFA" },
                { name: "100", light: "bg-secondary-100", hex: "#CCFBF1" },
                { name: "200", light: "bg-secondary-200", hex: "#99F6E4" },
                { name: "300", light: "bg-secondary-300", hex: "#5EEAD4" },
                { name: "400", light: "bg-secondary-400", hex: "#2DD4BF" },
                { name: "500", light: "bg-secondary-500", hex: "#14B8A6", main: true },
                { name: "600", light: "bg-secondary-600", hex: "#0D9488" },
                { name: "700", light: "bg-secondary-700", hex: "#0F766E" },
            ],
        },
        {
            name: "Accent - Amber",
            description: "Achievement, Celebration, Motivation",
            colors: [
                { name: "50", light: "bg-accent-50", hex: "#FFFBEB" },
                { name: "100", light: "bg-accent-100", hex: "#FEF3C7" },
                { name: "200", light: "bg-accent-200", hex: "#FDE68A" },
                { name: "300", light: "bg-accent-300", hex: "#FCD34D" },
                { name: "400", light: "bg-accent-400", hex: "#FBBF24" },
                { name: "500", light: "bg-accent-500", hex: "#F59E0B", main: true },
                { name: "600", light: "bg-accent-600", hex: "#D97706" },
                { name: "700", light: "bg-accent-700", hex: "#B45309" },
            ],
        },
        {
            name: "Rose - Warm Accent",
            description: "Engagement, Hearts, Premium",
            colors: [
                { name: "50", light: "bg-rose-50", hex: "#FFF1F2" },
                { name: "100", light: "bg-rose-100", hex: "#FFE4E6" },
                { name: "200", light: "bg-rose-200", hex: "#FECDD3" },
                { name: "300", light: "bg-rose-300", hex: "#FDA4AF" },
                { name: "400", light: "bg-rose-400", hex: "#FB7185" },
                { name: "500", light: "bg-rose-500", hex: "#F43F5E", main: true },
                { name: "600", light: "bg-rose-600", hex: "#E11D48" },
            ],
        },
    ];

    const semanticColors = [
        { name: "Success", bg: "bg-success", hex: "#10B981" },
        { name: "Warning", bg: "bg-warning", hex: "#F59E0B" },
        { name: "Error", bg: "bg-error", hex: "#EF4444" },
        { name: "Info", bg: "bg-info", hex: "#3B82F6" },
    ];

    return (
        <div className="space-y-12">
            <div>
                <h2 className="font-serif text-display-sm mb-2" style={{ color: getTextColor(theme) }}>
                    Color Palette
                </h2>
                <p style={{ color: getTextColor(theme, "secondary") }}>
                    A carefully crafted color system designed for focus, calm, and celebration.
                </p>
            </div>

            {colorGroups.map((group) => (
                <div key={group.name} className="space-y-4">
                    <div>
                        <h3 className="font-serif text-heading-lg" style={{ color: getTextColor(theme) }}>
                            {group.name}
                        </h3>
                        <p className="text-body-sm" style={{ color: getTextColor(theme, "muted") }}>
                            {group.description}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                        {group.colors.map((color) => (
                            <div key={color.name} className="space-y-2">
                                <div
                                    className={`h-16 rounded-xl ${color.light} ${
                                        color.main ? "ring-2 ring-offset-2 ring-primary-500" : ""
                                    } shadow-card transition-transform hover:scale-105 cursor-pointer`}
                                />
                                <div>
                                    <p className="text-label-md font-medium" style={{ color: getTextColor(theme) }}>
                                        {color.name}
                                    </p>
                                    <p className="text-body-xs" style={{ color: getTextColor(theme, "muted") }}>
                                        {color.hex}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* Semantic Colors */}
            <div className="space-y-4">
                <div>
                    <h3 className="font-serif text-heading-lg" style={{ color: getTextColor(theme) }}>
                        Semantic Colors
                    </h3>
                    <p className="text-body-sm" style={{ color: getTextColor(theme, "muted") }}>
                        Status and feedback colors
                    </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {semanticColors.map((color) => (
                        <div
                            key={color.name}
                            className={`${color.bg} rounded-xl p-6 flex flex-col items-center justify-center text-white shadow-card-md transition-transform hover:scale-105 cursor-pointer`}
                        >
                            <span className="font-semibold text-lg">{color.name}</span>
                            <span className="text-sm opacity-90">{color.hex}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Gradients */}
            <div className="space-y-4">
                <div>
                    <h3 className="font-serif text-heading-lg" style={{ color: getTextColor(theme) }}>
                        Gradients
                    </h3>
                    <p className="text-body-sm" style={{ color: getTextColor(theme, "muted") }}>
                        Beautiful gradients for buttons, badges, and highlights
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-primary rounded-xl p-6 text-white shadow-btn-primary transition-transform hover:scale-[1.02] cursor-pointer">
                        <span className="font-semibold">Primary Gradient</span>
                        <p className="text-sm opacity-90 mt-1">Indigo → Violet</p>
                    </div>
                    <div className="bg-gradient-secondary rounded-xl p-6 text-white shadow-btn-secondary transition-transform hover:scale-[1.02] cursor-pointer">
                        <span className="font-semibold">Secondary Gradient</span>
                        <p className="text-sm opacity-90 mt-1">Teal → Cyan</p>
                    </div>
                    <div className="bg-gradient-accent rounded-xl p-6 text-white shadow-btn-accent transition-transform hover:scale-[1.02] cursor-pointer">
                        <span className="font-semibold">Accent Gradient</span>
                        <p className="text-sm opacity-90 mt-1">Amber → Orange</p>
                    </div>
                    <div className="bg-gradient-gold rounded-xl p-6 text-white shadow-btn-accent transition-transform hover:scale-[1.02] cursor-pointer">
                        <span className="font-semibold">Gold Achievement</span>
                        <p className="text-sm opacity-90 mt-1">For badges & trophies</p>
                    </div>
                    <div className="bg-gradient-silver rounded-xl p-6 text-slate-800 transition-transform hover:scale-[1.02] cursor-pointer">
                        <span className="font-semibold">Silver Achievement</span>
                        <p className="text-sm opacity-80 mt-1">For badges & trophies</p>
                    </div>
                    <div className="bg-gradient-bronze rounded-xl p-6 text-white transition-transform hover:scale-[1.02] cursor-pointer">
                        <span className="font-semibold">Bronze Achievement</span>
                        <p className="text-sm opacity-90 mt-1">For badges & trophies</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TYPOGRAPHY SECTION
// ═══════════════════════════════════════════════════════════════════════════════

const TypographySection = ({ theme }: SectionProps) => {
    const textPrimary = getTextColor(theme);
    const textSecondary = getTextColor(theme, "secondary");
    const textMuted = getTextColor(theme, "muted");
    const cardBg = theme === "dark" ? colors.dark.bgCard : colors.light.bgCard;

    return (
        <div className="space-y-12">
            <div>
                <h2 className="font-serif text-display-sm mb-2" style={{ color: textPrimary }}>
                    Typography
                </h2>
                <p style={{ color: textSecondary }}>
                    Mixed font system with Fraunces (serif) for headings and Plus Jakarta Sans (sans-serif) for body text.
                </p>
            </div>

            {/* Font Families */}
            <div
                className="rounded-2xl p-8 shadow-card-md"
                style={{ backgroundColor: cardBg }}
            >
                <h3 className="font-serif text-heading-lg mb-6" style={{ color: textPrimary }}>
                    Font Families
                </h3>
                <div className="space-y-8">
                    <div className="space-y-2">
                        <p className="font-serif text-display-md" style={{ color: textPrimary }}>
                            Fraunces — Serif Headings
                        </p>
                        <p className="text-body-sm" style={{ color: textMuted }}>
                            Used for display text, headings, and editorial content. Adds an academic, sophisticated feel.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <p className="font-sans text-heading-xl" style={{ color: textPrimary }}>
                            Plus Jakarta Sans — Sans-Serif Body
                        </p>
                        <p className="text-body-sm" style={{ color: textMuted }}>
                            Used for body text, UI elements, and labels. Clean, modern, and highly readable.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <p className="font-mono text-heading-md" style={{ color: textPrimary }}>
                            JetBrains Mono — Monospace
                        </p>
                        <p className="text-body-sm" style={{ color: textMuted }}>
                            Used for code snippets, technical content, and timers.
                        </p>
                    </div>
                </div>
            </div>

            {/* Display Sizes */}
            <div
                className={`rounded-2xl p-8 ${
                    theme === "dark" ? "bg-surface-800" : "bg-white"
                } shadow-card-md`}
            >
                <h3 className="font-serif text-heading-lg mb-6">Display Sizes (Serif)</h3>
                <div className="space-y-6">
                    <div>
                        <p className="font-serif text-display-2xl">Display 2XL</p>
                        <p className={`text-body-xs ${theme === "dark" ? "text-text-dark-muted" : "text-text-muted"}`}>
                            72px / Bold / Line-height: 1.1
                        </p>
                    </div>
                    <div>
                        <p className="font-serif text-display-xl">Display XL</p>
                        <p className={`text-body-xs ${theme === "dark" ? "text-text-dark-muted" : "text-text-muted"}`}>
                            60px / Bold / Line-height: 1.1
                        </p>
                    </div>
                    <div>
                        <p className="font-serif text-display-lg">Display Large</p>
                        <p className={`text-body-xs ${theme === "dark" ? "text-text-dark-muted" : "text-text-muted"}`}>
                            48px / Bold / Line-height: 1.15
                        </p>
                    </div>
                    <div>
                        <p className="font-serif text-display-md">Display Medium</p>
                        <p className={`text-body-xs ${theme === "dark" ? "text-text-dark-muted" : "text-text-muted"}`}>
                            36px / Semibold / Line-height: 1.2
                        </p>
                    </div>
                    <div>
                        <p className="font-serif text-display-sm">Display Small</p>
                        <p className={`text-body-xs ${theme === "dark" ? "text-text-dark-muted" : "text-text-muted"}`}>
                            30px / Semibold / Line-height: 1.25
                        </p>
                    </div>
                </div>
            </div>

            {/* Heading Sizes */}
            <div
                className={`rounded-2xl p-8 ${
                    theme === "dark" ? "bg-surface-800" : "bg-white"
                } shadow-card-md`}
            >
                <h3 className="font-serif text-heading-lg mb-6">Heading Sizes</h3>
                <div className="space-y-4">
                    <div>
                        <p className="text-heading-xl">Heading XL — 28px</p>
                        <p className={`text-body-xs ${theme === "dark" ? "text-text-dark-muted" : "text-text-muted"}`}>
                            Semibold / Line-height: 1.3
                        </p>
                    </div>
                    <div>
                        <p className="text-heading-lg">Heading Large — 24px</p>
                        <p className={`text-body-xs ${theme === "dark" ? "text-text-dark-muted" : "text-text-muted"}`}>
                            Semibold / Line-height: 1.35
                        </p>
                    </div>
                    <div>
                        <p className="text-heading-md">Heading Medium — 20px</p>
                        <p className={`text-body-xs ${theme === "dark" ? "text-text-dark-muted" : "text-text-muted"}`}>
                            Semibold / Line-height: 1.4
                        </p>
                    </div>
                    <div>
                        <p className="text-heading-sm">Heading Small — 18px</p>
                        <p className={`text-body-xs ${theme === "dark" ? "text-text-dark-muted" : "text-text-muted"}`}>
                            Semibold / Line-height: 1.45
                        </p>
                    </div>
                </div>
            </div>

            {/* Body Sizes */}
            <div
                className={`rounded-2xl p-8 ${
                    theme === "dark" ? "bg-surface-800" : "bg-white"
                } shadow-card-md`}
            >
                <h3 className="font-serif text-heading-lg mb-6">Body Text Sizes</h3>
                <div className="space-y-4">
                    <div>
                        <p className="text-body-xl">Body XL — The quick brown fox jumps over the lazy dog.</p>
                        <p className={`text-body-xs ${theme === "dark" ? "text-text-dark-muted" : "text-text-muted"}`}>
                            20px / Regular / Line-height: 1.6
                        </p>
                    </div>
                    <div>
                        <p className="text-body-lg">Body Large — The quick brown fox jumps over the lazy dog.</p>
                        <p className={`text-body-xs ${theme === "dark" ? "text-text-dark-muted" : "text-text-muted"}`}>
                            18px / Regular / Line-height: 1.65
                        </p>
                    </div>
                    <div>
                        <p className="text-body-md">Body Medium — The quick brown fox jumps over the lazy dog.</p>
                        <p className={`text-body-xs ${theme === "dark" ? "text-text-dark-muted" : "text-text-muted"}`}>
                            16px / Regular / Line-height: 1.6
                        </p>
                    </div>
                    <div>
                        <p className="text-body-sm">Body Small — The quick brown fox jumps over the lazy dog.</p>
                        <p className={`text-body-xs ${theme === "dark" ? "text-text-dark-muted" : "text-text-muted"}`}>
                            14px / Regular / Line-height: 1.55
                        </p>
                    </div>
                    <div>
                        <p className="text-body-xs">Body XS — The quick brown fox jumps over the lazy dog.</p>
                        <p className={`text-body-xs ${theme === "dark" ? "text-text-dark-muted" : "text-text-muted"}`}>
                            12px / Regular / Line-height: 1.5
                        </p>
                    </div>
                </div>
            </div>

            {/* Reading Content */}
            <div
                className={`rounded-2xl p-8 ${
                    theme === "dark" ? "bg-surface-800" : "bg-white"
                } shadow-card-md`}
            >
                <h3 className="font-serif text-heading-lg mb-4">Reading Content (RC Passages)</h3>
                <p className={`text-body-sm mb-6 ${theme === "dark" ? "text-text-dark-muted" : "text-text-muted"}`}>
                    Optimized for extended reading sessions with generous line-height
                </p>
                <div
                    className={`p-6 rounded-xl ${
                        theme === "dark" ? "bg-surface-850" : "bg-surface-100"
                    }`}
                >
                    <p className="text-reading-md">
                        The concept of deliberate practice, first introduced by psychologist Anders Ericsson, 
                        revolutionized our understanding of expertise development. Unlike mere repetition or 
                        casual engagement with a skill, deliberate practice involves highly structured activities 
                        specifically designed to improve performance. This methodological approach requires 
                        immediate feedback, concentration, and the continuous refinement of techniques based 
                        on that feedback. Studies have shown that experts across diverse fields—from chess 
                        grandmasters to Olympic athletes—share this common thread of systematic, purposeful 
                        practice in their developmental journeys.
                    </p>
                </div>
                <p className={`text-body-xs mt-4 ${theme === "dark" ? "text-text-dark-muted" : "text-text-muted"}`}>
                    18px / Regular / Line-height: 1.75 — Optimal for comprehension and reduced eye strain
                </p>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// BUTTONS SECTION
// ═══════════════════════════════════════════════════════════════════════════════

const ButtonsSection = ({ theme }: SectionProps) => {
    const textPrimary = getTextColor(theme);
    const textSecondary = getTextColor(theme, "secondary");
    const cardBg = theme === "dark" ? colors.dark.bgCard : colors.light.bgCard;

    return (
        <div className="space-y-12">
            <div>
                <h2 className="font-serif text-display-sm mb-2" style={{ color: textPrimary }}>
                    Buttons
                </h2>
                <p style={{ color: textSecondary }}>
                    Elevated buttons with soft shadows and smooth hover transitions.
                </p>
            </div>

            {/* Primary Buttons */}
            <div className="rounded-2xl p-8 shadow-card-md" style={{ backgroundColor: cardBg }}>
                <h3 className="font-serif text-heading-lg mb-6" style={{ color: textPrimary }}>
                    Primary Buttons
                </h3>
                <div className="flex flex-wrap gap-4">
                    <button className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl shadow-btn-primary hover:shadow-btn-primary-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-95">
                        Start Practice
                    </button>
                    <button className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg shadow-btn-primary transition-all duration-200 hover:-translate-y-0.5 active:scale-95 text-body-sm">
                        Medium Button
                    </button>
                    <button className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg shadow-btn transition-all duration-200 active:scale-95 text-body-sm">
                        Small Button
                    </button>
                    <button className="px-6 py-3 bg-primary-500 text-white font-medium rounded-xl opacity-50 cursor-not-allowed" disabled>
                        Disabled
                    </button>
                </div>
            </div>

            {/* Secondary Buttons */}
            <div
                className={`rounded-2xl p-8 ${
                    theme === "dark" ? "bg-surface-800" : "bg-white"
                } shadow-card-md`}
            >
                <h3 className="font-serif text-heading-lg mb-6">Secondary Buttons</h3>
                <div className="flex flex-wrap gap-4">
                    <button className="px-6 py-3 bg-secondary-500 hover:bg-secondary-600 text-white font-medium rounded-xl shadow-btn-secondary hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                        Continue Learning
                    </button>
                    <button
                        className={`px-6 py-3 border-2 font-medium rounded-xl transition-all duration-200 hover:-translate-y-0.5 ${
                            theme === "dark"
                                ? "border-surface-700 text-text-dark-primary hover:bg-surface-700 hover:shadow-dark-card"
                                : "border-surface-200 text-text-primary hover:bg-surface-100 hover:shadow-card-md"
                        }`}
                    >
                        View Progress
                    </button>
                    <button
                        className={`px-5 py-2.5 border-2 font-medium rounded-lg transition-all duration-200 text-body-sm ${
                            theme === "dark"
                                ? "border-primary-500/50 text-primary-400 hover:bg-primary-500/10"
                                : "border-primary-200 text-primary-600 hover:bg-primary-50"
                        }`}
                    >
                        Outlined Primary
                    </button>
                </div>
            </div>

            {/* Action Buttons */}
            <div
                className={`rounded-2xl p-8 ${
                    theme === "dark" ? "bg-surface-800" : "bg-white"
                } shadow-card-md`}
            >
                <h3 className="font-serif text-heading-lg mb-6">Action Buttons</h3>
                <div className="flex flex-wrap gap-4">
                    <button className="px-6 py-3 bg-success hover:bg-success-dark text-white font-medium rounded-xl shadow-btn-success transition-all duration-200 hover:-translate-y-0.5">
                        ✓ Submit Answer
                    </button>
                    <button className="px-6 py-3 bg-gradient-accent text-white font-medium rounded-xl shadow-btn-accent transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                        🔥 Continue Streak
                    </button>
                    <button className="px-6 py-3 bg-error hover:bg-error-dark text-white font-medium rounded-xl shadow-btn-error transition-all duration-200">
                        End Session
                    </button>
                    <button className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white font-medium rounded-xl transition-all duration-200">
                        ❤️ Save Word
                    </button>
                </div>
            </div>

            {/* Ghost & Text Buttons */}
            <div
                className={`rounded-2xl p-8 ${
                    theme === "dark" ? "bg-surface-800" : "bg-white"
                } shadow-card-md`}
            >
                <h3 className="font-serif text-heading-lg mb-6">Ghost & Text Buttons</h3>
                <div className="flex flex-wrap gap-4 items-center">
                    <button
                        className={`px-6 py-3 font-medium rounded-xl transition-all duration-200 ${
                            theme === "dark"
                                ? "text-text-dark-secondary hover:text-text-dark-primary hover:bg-surface-700"
                                : "text-text-secondary hover:text-text-primary hover:bg-surface-100"
                        }`}
                    >
                        Skip for now
                    </button>
                    <button className="px-6 py-3 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 font-medium rounded-xl transition-all duration-200">
                        Learn More →
                    </button>
                    <button className="text-primary-500 hover:text-primary-600 font-medium transition-colors underline underline-offset-4">
                        View all
                    </button>
                </div>
            </div>

            {/* Icon Buttons */}
            <div
                className={`rounded-2xl p-8 ${
                    theme === "dark" ? "bg-surface-800" : "bg-white"
                } shadow-card-md`}
            >
                <h3 className="font-serif text-heading-lg mb-6">Icon Buttons</h3>
                <div className="flex flex-wrap gap-4 items-center">
                    <button className="w-12 h-12 bg-primary-500 hover:bg-primary-600 text-white rounded-xl shadow-btn-primary transition-all duration-200 flex items-center justify-center hover:-translate-y-0.5">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </button>
                    <button
                        className={`w-12 h-12 rounded-xl transition-all duration-200 flex items-center justify-center ${
                            theme === "dark"
                                ? "bg-surface-700 text-text-dark-primary hover:bg-surface-600"
                                : "bg-surface-100 text-text-primary hover:bg-surface-200 shadow-card"
                        }`}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </button>
                    <button
                        className={`w-10 h-10 rounded-lg transition-all duration-200 flex items-center justify-center ${
                            theme === "dark"
                                ? "text-text-dark-secondary hover:text-text-dark-primary hover:bg-surface-700"
                                : "text-text-secondary hover:text-text-primary hover:bg-surface-100"
                        }`}
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                        </svg>
                    </button>
                    <button className="w-14 h-14 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 text-white shadow-btn-accent hover:shadow-lg transition-all duration-200 flex items-center justify-center hover:scale-105">
                        <span className="text-xl">🏆</span>
                    </button>
                </div>
            </div>

            {/* Button with Loading State */}
            <div
                className={`rounded-2xl p-8 ${
                    theme === "dark" ? "bg-surface-800" : "bg-white"
                } shadow-card-md`}
            >
                <h3 className="font-serif text-heading-lg mb-6">Loading States</h3>
                <div className="flex flex-wrap gap-4">
                    <button className="px-6 py-3 bg-primary-500 text-white font-medium rounded-xl shadow-btn-primary flex items-center gap-2 opacity-75 cursor-wait">
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Loading...
                    </button>
                    <button className="px-6 py-3 bg-success text-white font-medium rounded-xl shadow-btn-success flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Submitted!
                    </button>
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// CARDS SECTION
// ═══════════════════════════════════════════════════════════════════════════════

const CardsSection = ({ theme }: SectionProps) => {
    return (
        <div className="space-y-12">
            <div>
                <h2 className="font-serif text-display-sm mb-2">Cards</h2>
                <p className={theme === "dark" ? "text-text-dark-secondary" : "text-text-secondary"}>
                    Elevated cards with subtle shadows for a clean, modern look.
                </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Basic Card */}
                <div
                    className={`rounded-2xl p-6 ${
                        theme === "dark" ? "bg-surface-800 shadow-dark-card" : "bg-white shadow-card"
                    }`}
                >
                    <h3 className="font-serif text-heading-md mb-2">Basic Card</h3>
                    <p className={theme === "dark" ? "text-text-dark-secondary" : "text-text-secondary"}>
                        Standard card with subtle shadow and rounded corners.
                    </p>
                </div>

                {/* Elevated Card */}
                <div
                    className={`rounded-2xl p-6 ${
                        theme === "dark" ? "bg-surface-800 shadow-dark-card-lg" : "bg-white shadow-card-md"
                    }`}
                >
                    <h3 className="font-serif text-heading-md mb-2">Elevated Card</h3>
                    <p className={theme === "dark" ? "text-text-dark-secondary" : "text-text-secondary"}>
                        More prominent shadow for important content.
                    </p>
                </div>

                {/* Interactive Card */}
                <div
                    className={`rounded-2xl p-6 cursor-pointer transition-all duration-200 ${
                        theme === "dark"
                            ? "bg-surface-800 shadow-dark-card hover:shadow-dark-card-lg hover:-translate-y-1"
                            : "bg-white shadow-card hover:shadow-card-lg hover:-translate-y-1"
                    }`}
                >
                    <h3 className="font-serif text-heading-md mb-2">Interactive Card</h3>
                    <p className={theme === "dark" ? "text-text-dark-secondary" : "text-text-secondary"}>
                        Hover me for elevation effect!
                    </p>
                </div>

                {/* Primary Tinted Card */}
                <div
                    className={`rounded-2xl p-6 ${
                        theme === "dark" ? "bg-primary-500/10 border border-primary-500/20" : "bg-primary-50 border border-primary-100"
                    }`}
                >
                    <h3 className={`font-serif text-heading-md mb-2 ${theme === "dark" ? "text-primary-300" : "text-primary-700"}`}>
                        Info Card
                    </h3>
                    <p className={theme === "dark" ? "text-primary-200" : "text-primary-600"}>
                        Used for tips, hints, and informational content.
                    </p>
                </div>

                {/* Success Card */}
                <div
                    className={`rounded-2xl p-6 ${
                        theme === "dark" ? "bg-success/10 border border-success/20" : "bg-green-50 border border-green-100"
                    }`}
                >
                    <h3 className={`font-serif text-heading-md mb-2 ${theme === "dark" ? "text-success-light" : "text-green-700"}`}>
                        Success Card
                    </h3>
                    <p className={theme === "dark" ? "text-green-300" : "text-green-600"}>
                        Displays achievements and completed tasks.
                    </p>
                </div>

                {/* Achievement Card */}
                <div
                    className={`rounded-2xl p-6 ${
                        theme === "dark" ? "bg-accent-500/10 border border-accent-500/20" : "bg-accent-50 border border-accent-100"
                    }`}
                >
                    <h3 className={`font-serif text-heading-md mb-2 ${theme === "dark" ? "text-accent-300" : "text-accent-700"}`}>
                        🏆 Achievement Card
                    </h3>
                    <p className={theme === "dark" ? "text-accent-200" : "text-accent-600"}>
                        Highlights streaks and milestone celebrations.
                    </p>
                </div>
            </div>

            {/* Feature Card with Border Accent */}
            <div className="grid md:grid-cols-2 gap-6">
                <div
                    className={`rounded-2xl p-6 border-l-4 border-primary-500 ${
                        theme === "dark" ? "bg-surface-800 shadow-dark-card" : "bg-white shadow-card"
                    }`}
                >
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center text-primary-500">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-serif text-heading-md mb-1">Reading Comprehension</h3>
                            <p className={`text-body-sm ${theme === "dark" ? "text-text-dark-secondary" : "text-text-secondary"}`}>
                                Practice with AI-generated passages tailored to your level.
                            </p>
                        </div>
                    </div>
                </div>

                <div
                    className={`rounded-2xl p-6 border-l-4 border-secondary-500 ${
                        theme === "dark" ? "bg-surface-800 shadow-dark-card" : "bg-white shadow-card"
                    }`}
                >
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-secondary-100 dark:bg-secondary-500/20 flex items-center justify-center text-secondary-500">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-serif text-heading-md mb-1">Vocabulary Builder</h3>
                            <p className={`text-body-sm ${theme === "dark" ? "text-text-dark-secondary" : "text-text-secondary"}`}>
                                Build your word bank with spaced repetition learning.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Glassmorphism Card */}
            <div
                className="rounded-2xl p-8 relative overflow-hidden"
                style={{
                    background: theme === "dark"
                        ? "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(20, 184, 166, 0.1) 100%)"
                        : "linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(20, 184, 166, 0.05) 100%)",
                }}
            >
                <div className="glass rounded-xl p-6 relative z-10">
                    <h3 className="font-serif text-heading-lg mb-2">Glassmorphism Card</h3>
                    <p className={theme === "dark" ? "text-text-dark-secondary" : "text-text-secondary"}>
                        Frosted glass effect for modern, premium UI elements.
                    </p>
                </div>
                {/* Decorative blobs */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-secondary-500/20 rounded-full blur-3xl" />
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// INPUTS SECTION
// ═══════════════════════════════════════════════════════════════════════════════

const InputsSection = ({ theme }: SectionProps) => {
    return (
        <div className="space-y-12">
            <div>
                <h2 className="font-serif text-display-sm mb-2">Form Inputs</h2>
                <p className={theme === "dark" ? "text-text-dark-secondary" : "text-text-secondary"}>
                    Clean, accessible form elements with clear focus states.
                </p>
            </div>

            <div className="max-w-2xl space-y-8">
                {/* Text Input */}
                <div
                    className={`rounded-2xl p-8 ${
                        theme === "dark" ? "bg-surface-800 shadow-dark-card" : "bg-white shadow-card-md"
                    }`}
                >
                    <h3 className="font-serif text-heading-md mb-6">Text Inputs</h3>
                    <div className="space-y-4">
                        <div>
                            <label className={`block text-label-lg mb-2 ${theme === "dark" ? "text-text-dark-primary" : "text-text-primary"}`}>
                                Default Input
                            </label>
                            <input
                                type="text"
                                placeholder="Enter your answer..."
                                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                                    theme === "dark"
                                        ? "bg-surface-850 border-surface-700 text-text-dark-primary placeholder:text-text-dark-muted focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20"
                                        : "bg-surface-50 border-surface-200 text-text-primary placeholder:text-text-muted focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                                }`}
                            />
                        </div>
                        <div>
                            <label className={`block text-label-lg mb-2 ${theme === "dark" ? "text-text-dark-primary" : "text-text-primary"}`}>
                                With Icon
                            </label>
                            <div className="relative">
                                <svg className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${theme === "dark" ? "text-text-dark-muted" : "text-text-muted"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search words..."
                                    className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                                        theme === "dark"
                                            ? "bg-surface-850 border-surface-700 text-text-dark-primary placeholder:text-text-dark-muted focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20"
                                            : "bg-surface-50 border-surface-200 text-text-primary placeholder:text-text-muted focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                                    }`}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Textarea */}
                <div
                    className={`rounded-2xl p-8 ${
                        theme === "dark" ? "bg-surface-800 shadow-dark-card" : "bg-white shadow-card-md"
                    }`}
                >
                    <h3 className="font-serif text-heading-md mb-6">Textarea</h3>
                    <label className={`block text-label-lg mb-2 ${theme === "dark" ? "text-text-dark-primary" : "text-text-primary"}`}>
                        Your explanation
                    </label>
                    <textarea
                        rows={4}
                        placeholder="Write your summary of the passage..."
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 resize-none ${
                            theme === "dark"
                                ? "bg-surface-850 border-surface-700 text-text-dark-primary placeholder:text-text-dark-muted focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20"
                                : "bg-surface-50 border-surface-200 text-text-primary placeholder:text-text-muted focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                        }`}
                    />
                </div>

                {/* Select */}
                <div
                    className={`rounded-2xl p-8 ${
                        theme === "dark" ? "bg-surface-800 shadow-dark-card" : "bg-white shadow-card-md"
                    }`}
                >
                    <h3 className="font-serif text-heading-md mb-6">Select Dropdown</h3>
                    <label className={`block text-label-lg mb-2 ${theme === "dark" ? "text-text-dark-primary" : "text-text-primary"}`}>
                        Difficulty Level
                    </label>
                    <select
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                            theme === "dark"
                                ? "bg-surface-850 border-surface-700 text-text-dark-primary focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20"
                                : "bg-surface-50 border-surface-200 text-text-primary focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                        }`}
                    >
                        <option>Easy — Beginner friendly</option>
                        <option>Medium — Standard CAT level</option>
                        <option>Hard — 99%ile questions</option>
                    </select>
                </div>

                {/* Multiple Choice */}
                <div
                    className={`rounded-2xl p-8 ${
                        theme === "dark" ? "bg-surface-800 shadow-dark-card" : "bg-white shadow-card-md"
                    }`}
                >
                    <h3 className="font-serif text-heading-md mb-6">Multiple Choice (Radio)</h3>
                    <p className={`text-body-sm mb-4 ${theme === "dark" ? "text-text-dark-secondary" : "text-text-secondary"}`}>
                        Select the best answer:
                    </p>
                    <div className="space-y-2">
                        {["The author primarily argues for environmental reform", "The passage criticizes industrial growth", "The text advocates for balanced development", "None of the above"].map((opt, i) => (
                            <label
                                key={opt}
                                className={`flex items-center p-4 rounded-xl cursor-pointer border-2 transition-all duration-200 ${
                                    theme === "dark"
                                        ? "border-surface-700 hover:border-primary-500/50 hover:bg-surface-700/50"
                                        : "border-surface-200 hover:border-primary-300 hover:bg-primary-50/50"
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="answer"
                                    className="w-5 h-5 text-primary-500 focus:ring-primary-500 focus:ring-offset-0"
                                />
                                <span className={`ml-3 ${theme === "dark" ? "text-text-dark-primary" : "text-text-primary"}`}>
                                    <span className="font-medium text-primary-500 mr-2">{String.fromCharCode(65 + i)}.</span>
                                    {opt}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Checkbox */}
                <div
                    className={`rounded-2xl p-8 ${
                        theme === "dark" ? "bg-surface-800 shadow-dark-card" : "bg-white shadow-card-md"
                    }`}
                >
                    <h3 className="font-serif text-heading-md mb-6">Checkboxes</h3>
                    <div className="space-y-3">
                        <label className={`flex items-center cursor-pointer ${theme === "dark" ? "text-text-dark-primary" : "text-text-primary"}`}>
                            <input
                                type="checkbox"
                                className="w-5 h-5 text-primary-500 rounded focus:ring-primary-500 border-2"
                            />
                            <span className="ml-3">Remember my preferences</span>
                        </label>
                        <label className={`flex items-center cursor-pointer ${theme === "dark" ? "text-text-dark-primary" : "text-text-primary"}`}>
                            <input
                                type="checkbox"
                                defaultChecked
                                className="w-5 h-5 text-primary-500 rounded focus:ring-primary-500 border-2"
                            />
                            <span className="ml-3">Enable streak reminders</span>
                        </label>
                        <label className={`flex items-center cursor-pointer ${theme === "dark" ? "text-text-dark-primary" : "text-text-primary"}`}>
                            <input
                                type="checkbox"
                                className="w-5 h-5 text-primary-500 rounded focus:ring-primary-500 border-2"
                            />
                            <span className="ml-3">Show on leaderboard</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// BADGES SECTION
// ═══════════════════════════════════════════════════════════════════════════════

const BadgesSection = ({ theme }: SectionProps) => {
    return (
        <div className="space-y-12">
            <div>
                <h2 className="font-serif text-display-sm mb-2">Badges & Tags</h2>
                <p className={theme === "dark" ? "text-text-dark-secondary" : "text-text-secondary"}>
                    Status indicators, difficulty tags, and achievement badges.
                </p>
            </div>

            {/* Status Badges */}
            <div
                className={`rounded-2xl p-8 ${
                    theme === "dark" ? "bg-surface-800 shadow-dark-card" : "bg-white shadow-card-md"
                }`}
            >
                <h3 className="font-serif text-heading-md mb-6">Status Badges</h3>
                <div className="flex flex-wrap gap-3">
                    <span className={`px-3 py-1.5 text-label-md font-medium rounded-full ${
                        theme === "dark" ? "bg-success/20 text-success-light" : "bg-green-100 text-green-700"
                    }`}>
                        ● Active
                    </span>
                    <span className={`px-3 py-1.5 text-label-md font-medium rounded-full ${
                        theme === "dark" ? "bg-primary-500/20 text-primary-300" : "bg-primary-100 text-primary-700"
                    }`}>
                        ● In Progress
                    </span>
                    <span className={`px-3 py-1.5 text-label-md font-medium rounded-full ${
                        theme === "dark" ? "bg-accent-500/20 text-accent-300" : "bg-accent-100 text-accent-700"
                    }`}>
                        ● Pending Review
                    </span>
                    <span className={`px-3 py-1.5 text-label-md font-medium rounded-full ${
                        theme === "dark" ? "bg-surface-700 text-text-dark-secondary" : "bg-surface-200 text-text-secondary"
                    }`}>
                        ● Completed
                    </span>
                </div>
            </div>

            {/* Difficulty Tags */}
            <div
                className={`rounded-2xl p-8 ${
                    theme === "dark" ? "bg-surface-800 shadow-dark-card" : "bg-white shadow-card-md"
                }`}
            >
                <h3 className="font-serif text-heading-md mb-6">Difficulty Tags</h3>
                <div className="flex flex-wrap gap-3">
                    <span className="px-4 py-1.5 bg-success text-white text-label-md font-medium rounded-lg shadow-btn-success">
                        Easy
                    </span>
                    <span className="px-4 py-1.5 bg-warning text-white text-label-md font-medium rounded-lg shadow-btn-accent">
                        Medium
                    </span>
                    <span className="px-4 py-1.5 bg-error text-white text-label-md font-medium rounded-lg shadow-btn-error">
                        Hard
                    </span>
                    <span className="px-4 py-1.5 bg-gradient-to-r from-rose-500 to-primary-600 text-white text-label-md font-medium rounded-lg shadow-lg">
                        99%ile Challenge
                    </span>
                </div>
            </div>

            {/* Category Tags */}
            <div
                className={`rounded-2xl p-8 ${
                    theme === "dark" ? "bg-surface-800 shadow-dark-card" : "bg-white shadow-card-md"
                }`}
            >
                <h3 className="font-serif text-heading-md mb-6">Category Tags</h3>
                <div className="flex flex-wrap gap-2">
                    <span className={`px-3 py-1 text-body-sm rounded-lg border ${
                        theme === "dark" ? "border-surface-700 text-text-dark-secondary" : "border-surface-200 text-text-secondary"
                    }`}>
                        Reading Comprehension
                    </span>
                    <span className={`px-3 py-1 text-body-sm rounded-lg border ${
                        theme === "dark" ? "border-surface-700 text-text-dark-secondary" : "border-surface-200 text-text-secondary"
                    }`}>
                        Para Jumbles
                    </span>
                    <span className={`px-3 py-1 text-body-sm rounded-lg border ${
                        theme === "dark" ? "border-surface-700 text-text-dark-secondary" : "border-surface-200 text-text-secondary"
                    }`}>
                        Vocabulary
                    </span>
                    <span className={`px-3 py-1 text-body-sm rounded-lg border ${
                        theme === "dark" ? "border-surface-700 text-text-dark-secondary" : "border-surface-200 text-text-secondary"
                    }`}>
                        Critical Reasoning
                    </span>
                    <span className={`px-3 py-1 text-body-sm rounded-lg border ${
                        theme === "dark" ? "border-surface-700 text-text-dark-secondary" : "border-surface-200 text-text-secondary"
                    }`}>
                        Odd One Out
                    </span>
                </div>
            </div>

            {/* Achievement Badges */}
            <div
                className={`rounded-2xl p-8 ${
                    theme === "dark" ? "bg-surface-800 shadow-dark-card" : "bg-white shadow-card-md"
                }`}
            >
                <h3 className="font-serif text-heading-md mb-6">Achievement Badges</h3>
                <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-gold text-white rounded-xl shadow-btn-accent">
                        <span className="text-xl">🔥</span>
                        <span className="font-semibold">7 Day Streak</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-primary text-white rounded-xl shadow-btn-primary">
                        <span className="text-xl">⭐</span>
                        <span className="font-semibold">100 Questions</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-secondary text-white rounded-xl shadow-btn-secondary">
                        <span className="text-xl">🏆</span>
                        <span className="font-semibold">Top 10%</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl shadow-lg">
                        <span className="text-xl">💎</span>
                        <span className="font-semibold">Premium Member</span>
                    </div>
                </div>
            </div>

            {/* Word Mastery Badges */}
            <div
                className={`rounded-2xl p-8 ${
                    theme === "dark" ? "bg-surface-800 shadow-dark-card" : "bg-white shadow-card-md"
                }`}
            >
                <h3 className="font-serif text-heading-md mb-6">Word Mastery Levels</h3>
                <div className="flex flex-wrap gap-3">
                    <span className={`px-3 py-1.5 text-label-md font-medium rounded-full border-2 ${
                        theme === "dark" ? "border-surface-600 text-text-dark-muted" : "border-surface-300 text-text-muted"
                    }`}>
                        New
                    </span>
                    <span className={`px-3 py-1.5 text-label-md font-medium rounded-full ${
                        theme === "dark" ? "bg-primary-500/20 text-primary-300" : "bg-primary-100 text-primary-600"
                    }`}>
                        Learning
                    </span>
                    <span className={`px-3 py-1.5 text-label-md font-medium rounded-full ${
                        theme === "dark" ? "bg-secondary-500/20 text-secondary-300" : "bg-secondary-100 text-secondary-600"
                    }`}>
                        Familiar
                    </span>
                    <span className={`px-3 py-1.5 text-label-md font-medium rounded-full ${
                        theme === "dark" ? "bg-success/20 text-success-light" : "bg-green-100 text-green-600"
                    }`}>
                        ✓ Mastered
                    </span>
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ALERTS SECTION
// ═══════════════════════════════════════════════════════════════════════════════

const AlertsSection = ({ theme }: SectionProps) => {
    return (
        <div className="space-y-12">
            <div>
                <h2 className="font-serif text-display-sm mb-2">Alerts & Notifications</h2>
                <p className={theme === "dark" ? "text-text-dark-secondary" : "text-text-secondary"}>
                    Feedback messages for user actions and system status.
                </p>
            </div>

            <div className="max-w-2xl space-y-4">
                {/* Success Alert */}
                <div
                    className={`p-4 rounded-xl border-l-4 border-success ${
                        theme === "dark" ? "bg-success/10" : "bg-green-50"
                    }`}
                    role="alert"
                >
                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <h4 className={`font-semibold ${theme === "dark" ? "text-success-light" : "text-green-800"}`}>
                                Correct Answer!
                            </h4>
                            <p className={`text-body-sm mt-1 ${theme === "dark" ? "text-green-300" : "text-green-700"}`}>
                                Great job! You&apos;re on a 5-question streak. Keep it up!
                            </p>
                        </div>
                    </div>
                </div>

                {/* Info Alert */}
                <div
                    className={`p-4 rounded-xl border-l-4 border-info ${
                        theme === "dark" ? "bg-info/10" : "bg-blue-50"
                    }`}
                    role="alert"
                >
                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-info flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className={`font-semibold ${theme === "dark" ? "text-blue-300" : "text-blue-800"}`}>
                                Pro Tip
                            </h4>
                            <p className={`text-body-sm mt-1 ${theme === "dark" ? "text-blue-200" : "text-blue-700"}`}>
                                Take breaks every 30 minutes for better retention. Your brain consolidates learning during rest.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Warning Alert */}
                <div
                    className={`p-4 rounded-xl border-l-4 border-warning ${
                        theme === "dark" ? "bg-warning/10" : "bg-amber-50"
                    }`}
                    role="alert"
                >
                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-warning flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className={`font-semibold ${theme === "dark" ? "text-accent-300" : "text-amber-800"}`}>
                                Time Running Low
                            </h4>
                            <p className={`text-body-sm mt-1 ${theme === "dark" ? "text-accent-200" : "text-amber-700"}`}>
                                You have only 5 minutes remaining. Consider submitting your current answers.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Error Alert */}
                <div
                    className={`p-4 rounded-xl border-l-4 border-error ${
                        theme === "dark" ? "bg-error/10" : "bg-red-50"
                    }`}
                    role="alert"
                >
                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-error flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <div>
                            <h4 className={`font-semibold ${theme === "dark" ? "text-red-300" : "text-red-800"}`}>
                                Incorrect Answer
                            </h4>
                            <p className={`text-body-sm mt-1 ${theme === "dark" ? "text-red-200" : "text-red-700"}`}>
                                The correct answer was option C. Review the explanation to understand the reasoning.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Toast Notification Style */}
                <div className="pt-8">
                    <h3 className="font-serif text-heading-md mb-6">Toast Notifications</h3>
                    <div className="space-y-3">
                        <div
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-card-md ${
                                theme === "dark" ? "bg-surface-800" : "bg-white"
                            }`}
                        >
                            <span className="text-xl">🔥</span>
                            <span className="font-medium">Streak extended! 7 days and counting!</span>
                        </div>
                        <div
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-card-md ${
                                theme === "dark" ? "bg-surface-800" : "bg-white"
                            }`}
                        >
                            <span className="text-xl">🏆</span>
                            <span className="font-medium">New achievement unlocked: Speed Reader!</span>
                        </div>
                        <div
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-card-md ${
                                theme === "dark" ? "bg-surface-800" : "bg-white"
                            }`}
                        >
                            <span className="text-xl">📚</span>
                            <span className="font-medium">New word added to your vocabulary list.</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRESS SECTION
// ═══════════════════════════════════════════════════════════════════════════════

const ProgressSection = ({ theme }: SectionProps) => {
    return (
        <div className="space-y-12">
            <div>
                <h2 className="font-serif text-display-sm mb-2">Progress Indicators</h2>
                <p className={theme === "dark" ? "text-text-dark-secondary" : "text-text-secondary"}>
                    Visual feedback for progress, completion, and loading states.
                </p>
            </div>

            {/* Linear Progress Bars */}
            <div
                className={`rounded-2xl p-8 ${
                    theme === "dark" ? "bg-surface-800 shadow-dark-card" : "bg-white shadow-card-md"
                }`}
            >
                <h3 className="font-serif text-heading-md mb-6">Progress Bars</h3>
                <div className="space-y-6">
                    {/* Standard Progress */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <span className="text-label-lg">Course Progress</span>
                            <span className="text-label-lg text-primary-500">65%</span>
                        </div>
                        <div className={`h-3 rounded-full overflow-hidden ${theme === "dark" ? "bg-surface-700" : "bg-surface-200"}`}>
                            <div className="h-full bg-gradient-primary rounded-full" style={{ width: "65%" }} />
                        </div>
                    </div>

                    {/* Colored Progress */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <span className="text-label-lg">Vocabulary Mastery</span>
                            <span className="text-label-lg text-secondary-500">82%</span>
                        </div>
                        <div className={`h-3 rounded-full overflow-hidden ${theme === "dark" ? "bg-surface-700" : "bg-surface-200"}`}>
                            <div className="h-full bg-gradient-secondary rounded-full" style={{ width: "82%" }} />
                        </div>
                    </div>

                    {/* Achievement Progress */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <span className="text-label-lg">🔥 Weekly Streak Goal</span>
                            <span className="text-label-lg text-accent-500">5/7 days</span>
                        </div>
                        <div className={`h-3 rounded-full overflow-hidden ${theme === "dark" ? "bg-surface-700" : "bg-surface-200"}`}>
                            <div className="h-full bg-gradient-accent rounded-full" style={{ width: "71%" }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Circular Progress */}
            <div
                className={`rounded-2xl p-8 ${
                    theme === "dark" ? "bg-surface-800 shadow-dark-card" : "bg-white shadow-card-md"
                }`}
            >
                <h3 className="font-serif text-heading-md mb-6">Circular Progress</h3>
                <div className="flex flex-wrap gap-8">
                    {/* Primary Circular */}
                    <div className="flex items-center gap-4">
                        <div className="relative w-24 h-24">
                            <svg className="w-24 h-24 transform -rotate-90">
                                <circle
                                    cx="48"
                                    cy="48"
                                    r="40"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="transparent"
                                    className={theme === "dark" ? "text-surface-700" : "text-surface-200"}
                                />
                                <circle
                                    cx="48"
                                    cy="48"
                                    r="40"
                                    stroke="url(#primaryGradient)"
                                    strokeWidth="8"
                                    fill="transparent"
                                    strokeDasharray="251.2"
                                    strokeDashoffset="62.8"
                                    strokeLinecap="round"
                                />
                                <defs>
                                    <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#6366F1" />
                                        <stop offset="100%" stopColor="#8B5CF6" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-heading-lg font-bold">75%</span>
                            </div>
                        </div>
                        <div>
                            <p className="font-semibold">RC Accuracy</p>
                            <p className={`text-body-sm ${theme === "dark" ? "text-text-dark-muted" : "text-text-muted"}`}>
                                Last 30 days
                            </p>
                        </div>
                    </div>

                    {/* Secondary Circular */}
                    <div className="flex items-center gap-4">
                        <div className="relative w-24 h-24">
                            <svg className="w-24 h-24 transform -rotate-90">
                                <circle
                                    cx="48"
                                    cy="48"
                                    r="40"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="transparent"
                                    className={theme === "dark" ? "text-surface-700" : "text-surface-200"}
                                />
                                <circle
                                    cx="48"
                                    cy="48"
                                    r="40"
                                    stroke="url(#secondaryGradient)"
                                    strokeWidth="8"
                                    fill="transparent"
                                    strokeDasharray="251.2"
                                    strokeDashoffset="125.6"
                                    strokeLinecap="round"
                                />
                                <defs>
                                    <linearGradient id="secondaryGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#14B8A6" />
                                        <stop offset="100%" stopColor="#06B6D4" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-heading-lg font-bold">50%</span>
                            </div>
                        </div>
                        <div>
                            <p className="font-semibold">Words Mastered</p>
                            <p className={`text-body-sm ${theme === "dark" ? "text-text-dark-muted" : "text-text-muted"}`}>
                                250 / 500 words
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Step Progress */}
            <div
                className={`rounded-2xl p-8 ${
                    theme === "dark" ? "bg-surface-800 shadow-dark-card" : "bg-white shadow-card-md"
                }`}
            >
                <h3 className="font-serif text-heading-md mb-6">Step Progress</h3>
                <div className="flex items-center justify-between">
                    {["Setup", "Practice", "Review", "Complete"].map((step, i) => (
                        <div key={step} className="flex items-center">
                            <div className="flex flex-col items-center">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                                        i < 2
                                            ? "bg-gradient-primary text-white shadow-btn-primary"
                                            : theme === "dark"
                                            ? "bg-surface-700 text-text-dark-muted"
                                            : "bg-surface-200 text-text-muted"
                                    }`}
                                >
                                    {i < 2 ? "✓" : i + 1}
                                </div>
                                <span className={`mt-2 text-label-md ${theme === "dark" ? "text-text-dark-secondary" : "text-text-secondary"}`}>
                                    {step}
                                </span>
                            </div>
                            {i < 3 && (
                                <div
                                    className={`w-16 sm:w-24 h-1 mx-2 rounded ${
                                        i < 1 ? "bg-gradient-primary" : theme === "dark" ? "bg-surface-700" : "bg-surface-200"
                                    }`}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Loading States */}
            <div
                className={`rounded-2xl p-8 ${
                    theme === "dark" ? "bg-surface-800 shadow-dark-card" : "bg-white shadow-card-md"
                }`}
            >
                <h3 className="font-serif text-heading-md mb-6">Loading States</h3>
                <div className="flex flex-wrap gap-8 items-center">
                    {/* Spinner */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-label-md">Spinner</span>
                    </div>

                    {/* Dots */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex gap-1">
                            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                        <span className="text-label-md">Dots</span>
                    </div>

                    {/* Skeleton */}
                    <div className="flex flex-col gap-2">
                        <div className={`h-4 w-48 rounded skeleton ${theme === "dark" ? "bg-surface-700" : "bg-surface-200"}`} />
                        <div className={`h-4 w-32 rounded skeleton ${theme === "dark" ? "bg-surface-700" : "bg-surface-200"}`} />
                        <span className="text-label-md mt-1">Skeleton</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SHOWCASE SECTION - Real UI Examples
// ═══════════════════════════════════════════════════════════════════════════════

const ShowcaseSection = ({ theme }: SectionProps) => {
    return (
        <div className="space-y-12">
            <div>
                <h2 className="font-serif text-display-sm mb-2">UI Showcase</h2>
                <p className={theme === "dark" ? "text-text-dark-secondary" : "text-text-secondary"}>
                    Real-world examples of the design system in action.
                </p>
            </div>

            {/* Dashboard Stats Cards */}
            <div>
                <h3 className="font-serif text-heading-lg mb-6">Dashboard Stats</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div
                        className={`rounded-2xl p-6 ${
                            theme === "dark" ? "bg-surface-800 shadow-dark-card" : "bg-white shadow-card"
                        }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center">
                                <span className="text-2xl">🔥</span>
                            </div>
                            <div>
                                <p className={`text-body-sm ${theme === "dark" ? "text-text-dark-muted" : "text-text-muted"}`}>
                                    Current Streak
                                </p>
                                <p className="text-heading-xl font-bold">12 days</p>
                            </div>
                        </div>
                    </div>

                    <div
                        className={`rounded-2xl p-6 ${
                            theme === "dark" ? "bg-surface-800 shadow-dark-card" : "bg-white shadow-card"
                        }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-secondary-100 dark:bg-secondary-500/20 flex items-center justify-center">
                                <span className="text-2xl">📚</span>
                            </div>
                            <div>
                                <p className={`text-body-sm ${theme === "dark" ? "text-text-dark-muted" : "text-text-muted"}`}>
                                    Words Learned
                                </p>
                                <p className="text-heading-xl font-bold">1,248</p>
                            </div>
                        </div>
                    </div>

                    <div
                        className={`rounded-2xl p-6 ${
                            theme === "dark" ? "bg-surface-800 shadow-dark-card" : "bg-white shadow-card"
                        }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-accent-100 dark:bg-accent-500/20 flex items-center justify-center">
                                <span className="text-2xl">🎯</span>
                            </div>
                            <div>
                                <p className={`text-body-sm ${theme === "dark" ? "text-text-dark-muted" : "text-text-muted"}`}>
                                    Accuracy Rate
                                </p>
                                <p className="text-heading-xl font-bold">78.5%</p>
                            </div>
                        </div>
                    </div>

                    <div
                        className={`rounded-2xl p-6 ${
                            theme === "dark" ? "bg-surface-800 shadow-dark-card" : "bg-white shadow-card"
                        }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center">
                                <span className="text-2xl">⏱️</span>
                            </div>
                            <div>
                                <p className={`text-body-sm ${theme === "dark" ? "text-text-dark-muted" : "text-text-muted"}`}>
                                    Study Time
                                </p>
                                <p className="text-heading-xl font-bold">42h 15m</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Practice Session Card */}
            <div>
                <h3 className="font-serif text-heading-lg mb-6">Practice Session</h3>
                <div
                    className={`rounded-2xl overflow-hidden ${
                        theme === "dark" ? "bg-surface-800 shadow-dark-card-lg" : "bg-white shadow-card-lg"
                    }`}
                >
                    {/* Header */}
                    <div className="px-6 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-body-sm opacity-90">Reading Comprehension</p>
                                <h4 className="text-heading-md font-semibold">Practice Session #47</h4>
                            </div>
                            <div className="text-right">
                                <p className="text-body-sm opacity-90">Time Remaining</p>
                                <p className="text-heading-lg font-mono font-bold">24:35</p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="px-3 py-1 bg-warning text-white text-label-md font-medium rounded-lg">
                                Medium
                            </span>
                            <span className={`px-3 py-1 text-label-md rounded-lg ${
                                theme === "dark" ? "bg-surface-700 text-text-dark-secondary" : "bg-surface-100 text-text-secondary"
                            }`}>
                                Science & Technology
                            </span>
                        </div>

                        <div className={`p-4 rounded-xl mb-6 ${theme === "dark" ? "bg-surface-850" : "bg-surface-100"}`}>
                            <p className="text-reading-md">
                                The emergence of artificial intelligence in healthcare represents a paradigm shift 
                                in how we approach medical diagnosis and treatment. Machine learning algorithms, 
                                trained on vast datasets of medical images and patient records, can now detect 
                                patterns that may elude even experienced physicians...
                            </p>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className={`text-body-sm ${theme === "dark" ? "text-text-dark-muted" : "text-text-muted"}`}>
                                Question 3 of 6
                            </span>
                            <div className="flex gap-2">
                                <button className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                    theme === "dark"
                                        ? "text-text-dark-secondary hover:bg-surface-700"
                                        : "text-text-secondary hover:bg-surface-100"
                                }`}>
                                    Skip
                                </button>
                                <button className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg shadow-btn-primary transition-all hover:-translate-y-0.5">
                                    Submit Answer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Vocabulary Card */}
            <div>
                <h3 className="font-serif text-heading-lg mb-6">Vocabulary Card</h3>
                <div className="max-w-md">
                    <div
                        className={`rounded-2xl p-6 ${
                            theme === "dark" ? "bg-surface-800 shadow-dark-card" : "bg-white shadow-card-md"
                        }`}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h4 className="font-serif text-heading-xl">Ubiquitous</h4>
                                <p className={`text-body-sm ${theme === "dark" ? "text-text-dark-muted" : "text-text-muted"}`}>
                                    /juːˈbɪkwɪtəs/ • adjective
                                </p>
                            </div>
                            <button className={`p-2 rounded-lg transition-colors ${
                                theme === "dark" ? "hover:bg-surface-700" : "hover:bg-surface-100"
                            }`}>
                                <svg className="w-5 h-5 text-rose-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                </svg>
                            </button>
                        </div>

                        <p className={`text-body-lg mb-4 ${theme === "dark" ? "text-text-dark-primary" : "text-text-primary"}`}>
                            Present, appearing, or found everywhere.
                        </p>

                        <div className={`p-4 rounded-xl mb-4 ${theme === "dark" ? "bg-surface-850" : "bg-surface-100"}`}>
                            <p className={`text-body-sm italic ${theme === "dark" ? "text-text-dark-secondary" : "text-text-secondary"}`}>
                                &ldquo;Smartphones have become <span className="text-primary-500 font-medium">ubiquitous</span> in modern society.&rdquo;
                            </p>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <svg key={star} className={`w-5 h-5 ${star <= 4 ? "text-accent-400" : theme === "dark" ? "text-surface-700" : "text-surface-300"}`} fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                    </svg>
                                ))}
                            </div>
                            <span className={`px-3 py-1 text-label-md rounded-full ${
                                theme === "dark" ? "bg-secondary-500/20 text-secondary-300" : "bg-secondary-100 text-secondary-600"
                            }`}>
                                Familiar
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Leaderboard */}
            <div>
                <h3 className="font-serif text-heading-lg mb-6">Leaderboard</h3>
                <div
                    className={`rounded-2xl overflow-hidden ${
                        theme === "dark" ? "bg-surface-800 shadow-dark-card" : "bg-white shadow-card-md"
                    }`}
                >
                    <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-700">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold">Weekly Top Performers</h4>
                            <button className="text-primary-500 text-body-sm font-medium hover:text-primary-600">
                                View All →
                            </button>
                        </div>
                    </div>
                    <div className="divide-y divide-surface-200 dark:divide-surface-700">
                        {[
                            { rank: 1, name: "Priya S.", score: "2,450", badge: "🥇", color: "text-accent-500" },
                            { rank: 2, name: "Rahul K.", score: "2,320", badge: "🥈", color: "text-slate-400" },
                            { rank: 3, name: "Anjali M.", score: "2,180", badge: "🥉", color: "text-amber-600" },
                            { rank: 4, name: "You", score: "1,950", badge: "", color: "", highlight: true },
                            { rank: 5, name: "Vikram T.", score: "1,890", badge: "", color: "" },
                        ].map((user) => (
                            <div
                                key={user.rank}
                                className={`px-6 py-4 flex items-center gap-4 ${
                                    user.highlight
                                        ? theme === "dark"
                                            ? "bg-primary-500/10"
                                            : "bg-primary-50"
                                        : ""
                                }`}
                            >
                                <span className={`w-8 text-center font-bold ${user.color || (theme === "dark" ? "text-text-dark-muted" : "text-text-muted")}`}>
                                    {user.badge || `#${user.rank}`}
                                </span>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white font-semibold">
                                    {user.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <p className={`font-medium ${user.highlight ? "text-primary-500" : ""}`}>
                                        {user.name}
                                    </p>
                                </div>
                                <span className={`font-mono font-semibold ${theme === "dark" ? "text-text-dark-primary" : "text-text-primary"}`}>
                                    {user.score}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Heatmap Calendar */}
            <div>
                <h3 className="font-serif text-heading-lg mb-6">Activity Heatmap</h3>
                <div
                    className={`rounded-2xl p-6 ${
                        theme === "dark" ? "bg-surface-800 shadow-dark-card" : "bg-white shadow-card-md"
                    }`}
                >
                    <div className="flex items-center justify-between mb-4">
                        <p className={`text-body-sm ${theme === "dark" ? "text-text-dark-secondary" : "text-text-secondary"}`}>
                            Your study activity over the last 12 weeks
                        </p>
                        <div className="flex items-center gap-2">
                            <span className="text-body-xs text-text-muted">Less</span>
                            <div className="flex gap-1">
                                <div className={`w-3 h-3 rounded-sm ${theme === "dark" ? "bg-surface-700" : "bg-surface-200"}`} />
                                <div className="w-3 h-3 rounded-sm bg-primary-200" />
                                <div className="w-3 h-3 rounded-sm bg-primary-400" />
                                <div className="w-3 h-3 rounded-sm bg-primary-500" />
                                <div className="w-3 h-3 rounded-sm bg-primary-700" />
                            </div>
                            <span className="text-body-xs text-text-muted">More</span>
                        </div>
                    </div>
                    <div className="flex gap-1 overflow-x-auto pb-2">
                        {Array.from({ length: 12 }).map((_, weekIndex) => (
                            <div key={weekIndex} className="flex flex-col gap-1">
                                {Array.from({ length: 7 }).map((_, dayIndex) => {
                                    const intensity = Math.random();
                                    let bgClass = theme === "dark" ? "bg-surface-700" : "bg-surface-200";
                                    if (intensity > 0.2) bgClass = "bg-primary-200";
                                    if (intensity > 0.4) bgClass = "bg-primary-300";
                                    if (intensity > 0.6) bgClass = "bg-primary-400";
                                    if (intensity > 0.8) bgClass = "bg-primary-600";
                                    return (
                                        <div
                                            key={dayIndex}
                                            className={`w-4 h-4 rounded-sm ${bgClass} transition-colors hover:ring-2 hover:ring-primary-500 cursor-pointer`}
                                            title={`Week ${weekIndex + 1}, Day ${dayIndex + 1}`}
                                        />
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DesignSystem;
