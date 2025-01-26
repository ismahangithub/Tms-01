import { MantineProvider } from '@mantine/core';
import { PropsWithChildren, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from './store';
import { toggleRTL, toggleTheme, toggleLocale, toggleMenu, toggleLayout, toggleAnimation, toggleNavbar, toggleSemidark } from './store/themeConfigSlice';
import store from './store';
import axios from 'axios';
import { Toaster } from 'react-hot-toast';
import { UserProvider } from './hooks/useUser';
import ErrorBoundary from '../src/components/ErrorBountry';

axios.defaults.baseURL = 'http://localhost:8001';
axios.defaults.withCredentials = true;

function App({ children }: PropsWithChildren) {
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(toggleTheme(localStorage.getItem('theme') || themeConfig.theme));
        dispatch(toggleMenu(localStorage.getItem('menu') || themeConfig.menu));
        dispatch(toggleLayout(localStorage.getItem('layout') || themeConfig.layout));
        dispatch(toggleRTL(localStorage.getItem('rtlClass') || themeConfig.rtlClass));
        dispatch(toggleAnimation(localStorage.getItem('animation') || themeConfig.animation));
        dispatch(toggleNavbar(localStorage.getItem('navbar') || themeConfig.navbar));
        dispatch(toggleLocale(localStorage.getItem('i18nextLng') || themeConfig.locale));
        dispatch(toggleSemidark(localStorage.getItem('semidark') || themeConfig.semidark));
    }, [dispatch, themeConfig.theme, themeConfig.menu, themeConfig.layout, themeConfig.rtlClass, themeConfig.animation, themeConfig.navbar, themeConfig.locale, themeConfig.semidark]);

    return (
        <MantineProvider theme={{}}>
            <UserProvider>
                <div
                    className={`${(store.getState().themeConfig.sidebar && 'toggle-sidebar') || ''} ${themeConfig.menu} ${themeConfig.layout} ${
                        themeConfig.rtlClass
                    } main-section antialiased relative font-nunito text-sm font-normal`}
                >
                    <ErrorBoundary>
                        <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
                        {children}
                    </ErrorBoundary>
                </div>
            </UserProvider>
        </MantineProvider>
    );
}

export default App;
