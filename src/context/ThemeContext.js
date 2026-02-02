import React, { createContext, useState, useEffect, useContext } from 'react';
import { StatusBar } from 'react-native';
import { storage } from '../utils/storage';

const ThemeContext = createContext();

export const lightTheme = {
    mode: 'light',
    primary: '#34D399',
    background: '#F9FAFB',
    card: '#FFFFFF',
    text: '#1F2937',
    subText: '#6B7280',
    border: '#E5E7EB',
    input: '#F3F4F6',
    tabBar: '#FFFFFF',
    tint: '#34D399',
    inactiveTint: '#9CA3AF',
    danger: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
};

export const darkTheme = {
    mode: 'dark',
    primary: '#34D399',
    background: '#111827',
    card: '#1F2937',
    text: '#F9FAFB',
    subText: '#9CA3AF',
    border: '#374151',
    input: '#374151',
    tabBar: '#1F2937',
    tint: '#34D399',
    inactiveTint: '#6B7280',
    danger: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
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
