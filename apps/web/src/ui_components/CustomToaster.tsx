import toast, { Toaster, ToastBar } from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";
import { MdClose } from "react-icons/md";

/**
 * Custom toast helper to ensure consistent IDs and prevent duplicates
 */
export const showToast = {
    success: (message: string, id?: string) => toast.success(message, { id }),
    error: (message: string, id?: string) => toast.error(message, { id }),
    loading: (message: string, id?: string) => toast.loading(message, { id }),
    dismiss: (id?: string) => toast.dismiss(id),
};

export const CustomToaster = () => {
    const { isDark } = useTheme();

    return (
        <Toaster
            position="top-right"
            toastOptions={{
                duration: 4000,
            }}
        >
            {(t) => (
                <ToastBar toast={t} style={{ all: 'unset' }}>
                    {({ icon, message }) => (
                        <div
                            className={`
                                flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl transition-all duration-500 ease-out
                                ${isDark
                                    ? "bg-bg-tertiary-dark/90 border-border-dark text-text-primary-dark"
                                    : "bg-white/90 border-border-light text-text-primary-light"
                                }
                                ${t.visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95'}
                            `}
                        >
                            <div className="shrink-0 animate-in zoom-in duration-300">
                                {icon}
                            </div>
                            <div className="flex-1 text-sm font-semibold tracking-tight">
                                {message}
                            </div>
                            {t.type !== 'loading' && (
                                <button
                                    onClick={() => toast.dismiss(t.id)}
                                    className={`p-1 rounded-lg transition-colors ${isDark ? "hover:bg-bg-primary-dark text-text-secondary-dark" : "hover:bg-gray-100 text-text-secondary-light"}`}
                                >
                                    <MdClose className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}
                </ToastBar>
            )}
        </Toaster>
    );
};
