import {
    Dispatch,
    ReactNode,
    SetStateAction,
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
} from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
    role: string;
    id: string;
    email: string;
    firstName: string;
    lastName: string;
}

interface UserContextType {
    user: User | null;
    setUser: Dispatch<SetStateAction<User | null>>;
    login: (userData: User, expiresIn: number) => void;
    logout: () => void;
    checkAuthStatus: () => boolean;
}

interface UserProviderProps {
    children: ReactNode;
}

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider = ({ children }: UserProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const navigate = useNavigate();

    /**
     * Log the user out and clear localStorage data
     */
    const logout = useCallback(() => {
        localStorage.removeItem('user');
        localStorage.removeItem('expirationTime');
        setUser(null);
        navigate('/auth/login', { replace: true }); // Redirect to login
    }, [navigate]);

    /**
     * Log the user in, store user data, and set token expiration
     */
    const login = useCallback(
        (userData: User, expiresIn: number) => {
            const expirationTime = new Date().getTime() + expiresIn * 1000;

            try {
                // Store user and expiration time in localStorage
                localStorage.setItem('user', JSON.stringify(userData));
                localStorage.setItem('expirationTime', expirationTime.toString());
                setUser(userData);
                navigate('/dashboard', { replace: true }); // Redirect to dashboard
            } catch (error) {
                console.error('Error storing user data:', error);
            }
        },
        [navigate]
    );

    /**
     * Check authentication status and manage expired tokens
     */
    const checkAuthStatus = useCallback((): boolean => {
        const storedUser = localStorage.getItem('user');
        const expirationTime = localStorage.getItem('expirationTime');

        if (storedUser && expirationTime) {
            const currentTime = new Date().getTime();

            // Validate expiration time
            if (currentTime < parseInt(expirationTime)) {
                try {
                    setUser(JSON.parse(storedUser));
                    return true; // User is authenticated
                } catch (error) {
                    console.error('Error parsing user data:', error);
                }
            }
        }

        // Logout if invalid or expired
        logout();
        return false;
    }, [logout]);

    // Run checkAuthStatus on component mount
    useEffect(() => {
        checkAuthStatus();
    }, [checkAuthStatus]);

    return (
        <UserContext.Provider value={{ user, setUser, login, logout, checkAuthStatus }}>
            {children}
        </UserContext.Provider>
    );
};

/**
 * Custom hook to use UserContext
 */
export const useUser = () => {
    const context = useContext(UserContext);

    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }

    return context;
};

export default UserContext;
