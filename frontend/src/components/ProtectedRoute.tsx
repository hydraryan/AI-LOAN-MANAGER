import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getSession } from '../lib/api/auth';

const ProtectedRoute = () => {
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        let active = true;

        const checkSession = async () => {
            try {
                await getSession();
                if (active) {
                    setIsAuthenticated(true);
                }
            } catch {
                if (active) {
                    setIsAuthenticated(false);
                }
            } finally {
                if (active) {
                    setIsLoading(false);
                }
            }
        };

        checkSession();

        return () => {
            active = false;
        };
    }, []);

    if (isLoading) {
        return <div className="p-10 text-center text-gray-500 dark:text-gray-300">Checking session...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return <Outlet />;
};

export default ProtectedRoute;