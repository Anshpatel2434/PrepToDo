import { useState, useEffect, useRef } from 'react';

interface UseAnimatedCounterOptions {
    duration?: number;  // Animation duration in ms
    delay?: number;     // Delay before starting in ms
    easing?: 'linear' | 'easeOut' | 'easeInOut' | 'spring';
}

/**
 * Custom hook for animating numbers counting up
 * Professional edtech-style with spring physics
 */
export function useAnimatedCounter(
    end: number,
    options: UseAnimatedCounterOptions = {}
): number {
    const { duration = 1200, delay = 0, easing = 'spring' } = options;
    const [count, setCount] = useState(0);
    const startTimeRef = useRef<number | null>(null);
    const frameRef = useRef<number | null>(null);

    useEffect(() => {
        // Check for reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReducedMotion) {
            setCount(end);
            return;
        }

        const startAnimation = () => {
            startTimeRef.current = null;

            const animate = (timestamp: number) => {
                if (startTimeRef.current === null) {
                    startTimeRef.current = timestamp;
                }

                const elapsed = timestamp - startTimeRef.current;
                const progress = Math.min(elapsed / duration, 1);

                // Easing functions
                let easedProgress: number;
                switch (easing) {
                    case 'linear':
                        easedProgress = progress;
                        break;
                    case 'easeOut':
                        easedProgress = 1 - Math.pow(1 - progress, 3);
                        break;
                    case 'easeInOut':
                        easedProgress = progress < 0.5
                            ? 4 * progress * progress * progress
                            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
                        break;
                    case 'spring':
                    default:
                        // Spring-like easing with slight overshoot
                        const c4 = (2 * Math.PI) / 3;
                        easedProgress = progress === 1
                            ? 1
                            : 1 - Math.pow(2, -10 * progress) * Math.sin((progress * 10 - 0.75) * c4);
                        break;
                }

                const currentCount = Math.round(easedProgress * end);
                setCount(currentCount);

                if (progress < 1) {
                    frameRef.current = requestAnimationFrame(animate);
                }
            };

            frameRef.current = requestAnimationFrame(animate);
        };

        const timeoutId = setTimeout(startAnimation, delay);

        return () => {
            clearTimeout(timeoutId);
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
            }
        };
    }, [end, duration, delay, easing]);

    return count;
}

/**
 * Animated percentage counter with decimal support
 */
export function useAnimatedPercentage(
    end: number,
    options: UseAnimatedCounterOptions = {}
): string {
    const { duration = 1200, delay = 0, easing = 'spring' } = options;
    const [value, setValue] = useState('0');
    const startTimeRef = useRef<number | null>(null);
    const frameRef = useRef<number | null>(null);

    useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReducedMotion) {
            setValue(Math.round(end).toString());
            return;
        }

        const startAnimation = () => {
            startTimeRef.current = null;

            const animate = (timestamp: number) => {
                if (startTimeRef.current === null) {
                    startTimeRef.current = timestamp;
                }

                const elapsed = timestamp - startTimeRef.current;
                const progress = Math.min(elapsed / duration, 1);

                // Spring easing
                const c4 = (2 * Math.PI) / 3;
                const easedProgress = progress === 1
                    ? 1
                    : 1 - Math.pow(2, -10 * progress) * Math.sin((progress * 10 - 0.75) * c4);

                const currentValue = Math.round(easedProgress * end);
                setValue(currentValue.toString());

                if (progress < 1) {
                    frameRef.current = requestAnimationFrame(animate);
                }
            };

            frameRef.current = requestAnimationFrame(animate);
        };

        const timeoutId = setTimeout(startAnimation, delay);

        return () => {
            clearTimeout(timeoutId);
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
            }
        };
    }, [end, duration, delay, easing]);

    return value;
}
