import React, { createContext, useState, useEffect, useContext } from 'react';
import { StatusBar } from 'react-native';
import { storage } from '../utils/storage';

const ThemeContext = createContext();

export const lightTheme = {
    mode: 'light',
    primary: '#6366F1', // Vibrant Indigo
    secondary: '#EC4899', // Pink
    background: '#F0F2F5',
    card: '#FFFFFF',
    text: '#0F172A',
    subText: '#64748B',
    border: '#E2E8F0',
    input: '#F8FAFC',
    tabBar: '#FFFFFFCC', // Semi-transparent
    tint: '#6366F1',
    inactiveTint: '#94A3B8',
    danger: '#F43F5E',
    success: '#10B981',
    warning: '#F59E0B',
    glassBackground: '#FFFFFF',
    glassBorder: '#E2E8F0',
};

export const darkTheme = {
    mode: 'dark',
    primary: '#818CF8', // Soft Indigo
    secondary: '#F472B6', // Soft Pink
    background: '#0F172A', // Dark Slate 900
    card: '#1E293B', // Dark Slate 800
    text: '#F8FAFC',
    subText: '#94A3B8',
    border: '#334155',
    input: '#334155',
    tabBar: '#1E293BCC', // Semi-transparent
    tint: '#818CF8',
    inactiveTint: '#64748B',
    danger: '#FB7185',
    success: '#34D399',
    warning: '#FBBF24',
    glassBackground: '#1E293B',
    glassBorder: '#334155',
};

export const ThemeProvider = ({ children }) => {
    const [isDark, setIsDark] = useState(false);
    const theme = isDark ? darkTheme : lightTheme;

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        const settings = await storage.getSettings();
        if (settings && settings.theme) {
            setIsDark(settings.theme === 'dark');
        }
    };

    const toggleTheme = async () => {
        const newIsDark = !isDark;
        setIsDark(newIsDark);

        // Persist
        const settings = await storage.getSettings() || {};
        await storage.saveSettings({
            ...settings,
            theme: newIsDark ? 'dark' : 'light'
        });
    };

    return (
        <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
