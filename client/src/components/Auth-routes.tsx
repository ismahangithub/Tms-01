import React, { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../hooks/useUser';

interface AuthenticatedRouteProps {
    children: ReactNode;
}

const AuthenticatedRoute = ({ children }: AuthenticatedRouteProps) => {
    const { checkAuthStatus, user } = useUser();
    const location = useLocation();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        // Perform the authentication check outside the render phase
        const authStatus = checkAuthStatus();
        setIsAuthenticated(authStatus);
    }, [checkAuthStatus]);

    // If the authentication status is not determined yet, don't render anything
    if (isAuthenticated === null) {
        return null; // Or a loading spinner if you prefer
    }

    return isAuthenticated ? <>{children}</> : <Navigate to="/auth/login" replace state={{ from: location }} />;
};

export default AuthenticatedRoute;
