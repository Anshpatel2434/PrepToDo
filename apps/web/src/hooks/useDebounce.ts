import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Debounces a value, returning the debounced value after the delay
 */
export function useDebounceValue<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Returns a debounced version of the callback function
 */
export function useDebounceCallback<T extends (...args: unknown[]) => unknown>(
    callback: T,
    delay: number
): T {
    const timeoutRef = useRef<number | null>(null);

    return useCallback(
        ((...args: Parameters<T>) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = window.setTimeout(() => {
                callback(...args);
            }, delay);
        }) as T,
        [callback, delay]
    );
}

/**
 * Cooldown hook - prevents action until cooldown period expires
 * Useful for rate limiting user actions like OTP resend
 */
export function useCooldown(cooldownMs: number): {
    isOnCooldown: boolean;
    startCooldown: () => void;
    remainingTime: number;
    remainingSeconds: number;
} {
    const [isOnCooldown, setIsOnCooldown] = useState(false);
    const [remainingTime, setRemainingTime] = useState(0);
    const intervalRef = useRef<number | null>(null);

    const startCooldown = useCallback(() => {
        setIsOnCooldown(true);
        setRemainingTime(cooldownMs);

        intervalRef.current = window.setInterval(() => {
            setRemainingTime((prev) => {
                if (prev <= 1000) {
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    setIsOnCooldown(false);
                    return 0;
                }
                return prev - 1000;
            });
        }, 1000);
    }, [cooldownMs]);

    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    return {
        isOnCooldown,
        startCooldown,
        remainingTime,
        remainingSeconds: Math.ceil(remainingTime / 1000),
    };
}
