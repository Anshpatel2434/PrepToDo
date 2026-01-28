import { Turnstile } from '@marsidev/react-turnstile';
import type { TurnstileInstance } from '@marsidev/react-turnstile';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';

interface TurnstileWidgetProps {
    onVerify: (token: string) => void;
    onError?: () => void;
    onExpire?: () => void;
    isDark?: boolean;
}

export interface TurnstileWidgetRef {
    reset: () => void;
}

export const TurnstileWidget = forwardRef<TurnstileWidgetRef, TurnstileWidgetProps>(
    ({ onVerify, onError, onExpire, isDark = false }, ref) => {
        const turnstileRef = useRef<TurnstileInstance>(null);
        const [isLoaded, setIsLoaded] = useState(false);
        const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

        useImperativeHandle(ref, () => ({
            reset: () => turnstileRef.current?.reset(),
        }));

        if (!siteKey) {
            console.warn('Turnstile site key not configured - CAPTCHA disabled');
            // Return null in production, but allow signup flow to continue in dev
            return null;
        }

        return (
            <div className="flex flex-col items-center my-4">
                <Turnstile
                    ref={turnstileRef}
                    siteKey={siteKey}
                    onSuccess={onVerify}
                    onError={onError}
                    onExpire={onExpire}
                    onWidgetLoad={() => setIsLoaded(true)}
                    options={{
                        theme: isDark ? 'dark' : 'light',
                        size: 'normal',
                    }}
                />
                {!isLoaded && (
                    <div className={`text-sm ${isDark ? 'text-text-muted-dark' : 'text-text-muted-light'}`}>
                        Loading security verification...
                    </div>
                )}
            </div>
        );
    }
);

TurnstileWidget.displayName = 'TurnstileWidget';
