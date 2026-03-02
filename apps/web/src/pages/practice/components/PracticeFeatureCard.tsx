import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

interface FeatureCardProps {
    feature: {
        id: string;
        title: string;
        description: string;
        icon: React.ElementType;
        backgroundIcon: React.ElementType; // Kept for interface compatibility but not used in the strict physical layout
        path: string;
        colorConfig: {
            dark: { iconBg: string; iconColor: string; shadow: string };
            light: { iconBg: string; iconColor: string; shadow: string };
        };
    };
    index: number;
    isDark: boolean;
    onClick: () => void;
}

export const PracticeFeatureCard: React.FC<FeatureCardProps> = ({ feature, index, isDark, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);

    const cardVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, delay: index * 0.1, ease: "easeOut" as const }
        }
    };

    const colors = isDark ? feature.colorConfig.dark : feature.colorConfig.light;
    const Icon = feature.icon;

    // A realistic CSS representation of a metallic thumbtack
    const RealisticPin = () => (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-40 pointer-events-none drop-shadow-md">
            {/* Thumbtack Head (Top View) */}
            <div className="w-[18px] h-[18px] rounded-full bg-gradient-to-br from-[#f0f0f0] via-[#c0c0c0] to-[#808080] border-2 border-[#a0a0a0] flex items-center justify-center shadow-[1px_2px_4px_rgba(0,0,0,0.5)]">
                {/* Inner dimple structure of a pin */}
                <div className="w-[10px] h-[10px] rounded-full bg-gradient-to-tl from-[#c0c0c0] to-[#e0e0e0]"></div>
                {/* Bright white specular highlight to sell the metal material */}
                <div className="absolute top-[2px] left-[4px] w-[3px] h-[3px] bg-white rounded-full opacity-90 blur-[0.5px]"></div>
            </div>
            {/* Soft, dark shadow cast onto the paper directly underneath the pin head */}
            <div className="absolute top-[12px] left-[3px] w-[14px] h-[7px] bg-black/30 rounded-[100%] blur-[2px] -z-10 mix-blend-multiply"></div>
        </div>
    );

    return (
        <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            onClick={onClick}
            // Add top/left margin to make room for the detached pinned note taking up exterior space
            className="group cursor-pointer relative mt-8 ml-4 h-full flex flex-col perspective-1000"
        >

            {/* 
                THE "STAMPED" CORNER NOTE
                A smaller piece of paper physically attached to the top-left corner by the pin.
            */}
            <motion.div
                className={`
                    absolute -top-6 -left-6 md:-top-8 md:-left-8 z-30 
                    w-20 h-20 md:w-24 md:h-24 flex items-center justify-center
                    shadow-[2px_4px_10px_rgba(0,0,0,0.15)]
                    ${isDark
                        ? 'bg-[#E5E5E5] border border-[#CCCCCC]' // Even in dark mode, the "stamp" remains physical paper
                        : 'bg-[#FAF9F6] border border-[#EAEAEA]'
                    }
                `}
                initial={{ y: 0, rotate: 0, rotateX: 0, rotateY: 0, rotateZ: 0 }}
                animate={isHovered ? { y: -4, scale: 1.05, rotate: 0, rotateX: 0, rotateY: 0, rotateZ: 0 } : { y: 0, scale: 1, rotate: 0, rotateX: 0, rotateY: 0, rotateZ: 0 }}
                transition={{ type: "spring", stiffness: 350, damping: 20 }}
            >
                {/* The "Stamp" print graphic - replicating ink stamped on paper */}
                <div className={`
                    absolute inset-2 border-[1.5px] border-dashed flex items-center justify-center
                    ${colors.iconColor.replace('text-', 'border-')}/60
                `}>
                    {/* Dark mode forces the stamp icons to be darker since the stamp paper is always light */}
                    <Icon size={38} className={isDark ? 'text-gray-800' : `${colors.iconColor} opacity-90`} strokeWidth={2} />
                </div>

                {/* The physical thumbtack digging into the stamp */}
                <RealisticPin />
            </motion.div>

            {/* 
                THE MAIN ACADEMIC PAPER CARD 
                Stark, sharp corners, paper-like backgrounds, squarely aligned.
            */}
            <motion.div
                initial={{ rotate: 0, rotateX: 0, rotateY: 0, rotateZ: 0 }}
                whileHover={{ y: -4, rotate: 0, rotateX: 0, rotateY: 0, rotateZ: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className={`
                    flex-1 relative w-full pt-14 md:pt-[72px] px-6 pb-6 overflow-hidden
                    flex flex-col justify-between
                    rounded-sm /* Keeping cut cardstock look */
                    ${isDark
                        ? 'bg-[#18181A] border border-gray-700 shadow-xl'
                        : 'bg-[#FDFCF8] border border-gray-300 shadow-[2px_6px_20px_rgba(0,0,0,0.06)]'
                    }
                `}
            >
                {/* Subtle Lined Paper Texture */}
                <div
                    className="absolute inset-0 z-0 opacity-40 pointer-events-none"
                    style={{
                        backgroundImage: isDark
                            ? 'repeating-linear-gradient(transparent, transparent 27px, #2A2A2A 28px)'
                            : 'repeating-linear-gradient(transparent, transparent 27px, #E5E7EB 28px)',
                        backgroundPosition: '0px 10px'
                    }}
                />

                {/* CONTENT AREA */}
                {/* Shift text down and right to respect the pinned card in the top-left */}
                <div className="relative z-10 w-full mb-8">
                    {/* Academic Serif font for the title */}
                    <h3 className={`text-xl font-bold mb-3 font-serif tracking-tight ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                        {feature.title}
                    </h3>

                    <p className={`text-[15px] leading-relaxed font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {feature.description}
                    </p>
                </div>

                {/* CALL TO ACTION BUTTON */}
                <div className="relative z-10 w-full mt-auto pt-6 border-t border-gray-200 dark:border-gray-800">
                    <motion.div
                        className={`
                            flex w-full items-center justify-between
                            font-bold tracking-widest uppercase text-xs
                            transition-colors duration-300
                            ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}
                        `}
                    >
                        <span>Enter Module</span>
                        <motion.div
                            animate={{ x: isHovered ? 4 : 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        >
                            <ArrowUpRight strokeWidth={2.5} size={18} />
                        </motion.div>
                    </motion.div>
                </div>
            </motion.div>
        </motion.div>
    );
};
