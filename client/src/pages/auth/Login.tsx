import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { setPageTitle, toggleRTL } from '../../store/themeConfigSlice';
import { IRootState } from '../../store';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useUser } from '../../hooks/useUser';
import IconMail from '../../components/Icon/IconMail';
import IconLockDots from '../../components/Icon/IconLockDots';
import { Button } from '../../components/ui/button';

const LoginCover = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '' });
    const { login, user, checkAuthStatus } = useUser();

    // Redirect to dashboard if already authenticated
    useEffect(() => {
        dispatch(setPageTitle('Login'));
        if (checkAuthStatus()) {
            console.log('User already authenticated, redirecting to dashboard...');
            navigate('/dashboard');
        }
    }, [dispatch, navigate, checkAuthStatus]);

    // Handle input field changes
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = event.target;
        setFormData((prevData) => ({
            ...prevData,
            [id]: value,
        }));
    };

    // Handle form submission
    const submitForm = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!formData.email || !formData.password) {
            toast.error('Please fill in both email and password fields.');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post('http://localhost:8001/api/users/loginUser', formData);

            if (response.status === 200) {
                console.log('Login successful:', response.data);

                const { token, user } = response.data;

                // Save to localStorage
                localStorage.setItem('token', token);
                localStorage.setItem('userId', user._id);  // Ensure userId is saved correctly
                localStorage.setItem('user', JSON.stringify(user));

                console.log('User ID saved to localStorage:', user._id);  // Debugging log
                toast.success('Login successful');
                login(user, 7 * 24 * 60 * 60); // Set user state for 7 days

                console.log('Navigating to /dashboard...');
                navigate('/dashboard'); // Redirect after login
            } else {
                toast.error(response.data.message || 'Invalid credentials.');
            }
        } catch (error) {
            console.error('Login error:', error);
            toast.error(
                error.response?.data?.message || 'An error occurred during login.'
            );
        } finally {
            setLoading(false);
        }
    };

    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const [flag, setFlag] = useState(themeConfig.locale);

    const setLocale = (flag: string) => {
        setFlag(flag);
        dispatch(toggleRTL(flag.toLowerCase() === 'ae' ? 'rtl' : 'ltr'));
    };

    // Redirect if user is already logged in
    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div>
            <div className="absolute inset-0">
                <img src="/assets/images/auth/bg-gradient.png" alt="background" className="h-full w-full object-cover" />
            </div>
            <div className="relative flex min-h-screen items-center justify-center bg-[url(/assets/images/auth/map.png)] bg-cover bg-center bg-no-repeat px-6 py-10 dark:bg-[#060818] sm:px-16">
                <div className="relative flex w-full max-w-[1502px] flex-col justify-between overflow-hidden rounded-md bg-white/60 backdrop-blur-lg dark:bg-black/50 lg:min-h-[758px] lg:flex-row lg:gap-10 xl:gap-0">
                    <div className="relative hidden w-full items-center justify-center bg-[linear-gradient(225deg,rgba(239,18,98,1)_0%,rgba(67,97,238,1)_100%)] p-5 lg:inline-flex lg:max-w-[835px]">
                        <Link to="/dashboard" className="w-48 block lg:w-72 ms-10">
                            <img src="/assets/images/auth/logo-white.svg" alt="Logo" className="w-full" />
                        </Link>
                        <div className="mt-24 hidden w-full max-w-[430px] lg:block">
                            <img src="/assets/images/auth/login.svg" alt="Cover" className="w-full" />
                        </div>
                    </div>
                    <div className="relative flex w-full flex-col items-center justify-center gap-6 px-4 pb-16 pt-6 sm:px-6 lg:max-w-[667px]">
                        <div className="w-full max-w-[440px] lg:mt-16">
                            <div className="mb-10">
                                <h1 className="text-3xl font-extrabold uppercase !leading-snug text-primary md:text-4xl">
                                    Sign in
                                </h1>
                                <p className="text-base font-bold leading-normal text-white-dark">
                                    Enter your email and password to login
                                </p>
                            </div>
                            <form className="space-y-5 dark:text-white" onSubmit={submitForm}>
                                <div>
                                    <label htmlFor="email">Email</label>
                                    <div className="relative text-white-dark">
                                        <input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            placeholder="Enter Email"
                                            className="form-input ps-10 placeholder:text-white-dark"
                                            onChange={handleInputChange}
                                        />
                                        <span className="absolute start-4 top-1/2 -translate-y-1/2">
                                            <IconMail fill={true} />
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="password">Password</label>
                                    <div className="relative text-white-dark">
                                        <input
                                            id="password"
                                            type="password"
                                            value={formData.password}
                                            placeholder="Enter Password"
                                            className="form-input ps-10 placeholder:text-white-dark"
                                            onChange={handleInputChange}
                                        />
                                        <span className="absolute start-4 top-1/2 -translate-y-1/2">
                                            <IconLockDots fill={true} />
                                        </span>
                                    </div>
                                </div>
                                <Button type="submit" variant="outline" className="w-full font-bold" disabled={loading}>
                                    {loading ? 'Signing in...' : 'Sign in'}
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginCover;
