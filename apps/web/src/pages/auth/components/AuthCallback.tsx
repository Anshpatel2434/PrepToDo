import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useExchangeTokenMutation } from '../redux_usecases/authApi';
import { PageLoader } from '../../../ui_components/PageLoader';
import toast from 'react-hot-toast';

export const AuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [exchangeToken] = useExchangeTokenMutation();

    useEffect(() => {
        const token = searchParams.get('token');
        const returnTo = searchParams.get('returnTo');
        const error = searchParams.get('error');

        if (error) {
            toast.error('Authentication failed. Please try again.');
            navigate('/auth');
            return;
        }

        if (!token) {
            toast.error('No token received');
            navigate('/auth');
            return;
        }

        const handleExchange = async () => {
            try {
                await exchangeToken({ token }).unwrap();
                toast.success('Successfully signed in!', { id: 'auth-success' });

                // Check if we have a stored redirect
                const storedRedirect = localStorage.getItem('post_auth_redirect');
                localStorage.removeItem('post_auth_redirect');

                // Auth paths to filter out
                const authPaths = ['/auth', '/auth/', '/auth/callback', '/auth/reset-password'];
                const isAuthPath = (path: string) => {
                    const normalized = path.toLowerCase().split('?')[0];
                    return authPaths.some(p => normalized === p || normalized.startsWith('/auth/'));
                };

                // Prioritize URL param, then stored redirect, then dashboard
                // But filter out auth paths
                let destination = returnTo || storedRedirect || '/dashboard';
                if (isAuthPath(destination)) {
                    destination = '/dashboard';
                }

                navigate(destination);
            } catch (err) {
                console.error('Exchange failed:', err);
                toast.error('Authentication session failed');
                navigate('/auth');
            }
        };

        handleExchange();
    }, [searchParams, navigate, exchangeToken]);

    return <PageLoader variant="fullscreen" message="Completing sign in..." />;
};

export default AuthCallback;
