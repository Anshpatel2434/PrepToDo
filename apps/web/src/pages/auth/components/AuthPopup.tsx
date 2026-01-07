import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthForm } from "./AuthForm";
import { FaTimes } from "react-icons/fa";

export type AuthPopupCloseReason = "dismiss" | "success";

interface AuthPopupProps {
    isOpen: boolean;
    onClose: (reason?: AuthPopupCloseReason) => void;
    isDark: boolean;
    initialMode?: "signin" | "signup";
}

export const AuthPopup: React.FC<AuthPopupProps> = ({
    isOpen,
    onClose,
    isDark,
    initialMode = "signin",
}) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={() => onClose("dismiss")}
                />

                {/* Popup */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={`
            relative w-full max-w-md mx-4 
            ${isDark ? "bg-bg-secondary-dark" : "bg-bg-secondary-light"}
            rounded-3xl shadow-2xl border 
            ${isDark ? "border-border-darker" : "border-border-light"}
            overflow-hidden
          `}
                >
                    {/* Close button */}
                    <button
                        onClick={() => onClose("dismiss")}
                        className={`
                            absolute top-4 right-4 z-10 p-2 rounded-full
                            ${
                                isDark
                                    ? "hover:bg-bg-tertiary-dark"
                                    : "hover:bg-bg-tertiary-light"
                            }
                            transition-colors duration-200
                            ${
                                isDark
                                    ? "text-text-secondary-dark"
                                    : "text-text-secondary-light"
                            }
                        `}
                    >
                        <FaTimes size={16} />
                    </button>

                    {/* Auth Form */}
                    <AuthForm
                        isDark={isDark}
                        initialMode={initialMode}
                        onClose={onClose}
                    />
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
