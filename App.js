import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/context/ThemeContext';
import { UserProvider } from './src/context/UserContext';
import { TimeProvider } from './src/context/TimeContext';
import { storage } from './src/utils/storage';
import { syncHabitsToWidget } from './src/utils/widgetSync';

export default function App() {
    const [isStorageReady, setIsStorageReady] = useState(false);

    useEffect(() => {
        const bootstrapStorage = async () => {
            await storage.ensureDataMigrated();
            setIsStorageReady(true);
        };
        bootstrapStorage();
    }, []);

    useEffect(() => {
        const handleCompleteHabitUrl = async (url) => {
            if (!url || !url.startsWith('habittracker://')) return;
            const normalized = url.replace('habittracker://', '');
            const [route, query = ''] = normalized.split('?');
            if (route !== 'complete-habit') return;

            const queryPairs = query.split('&').map((part) => part.split('='));
            const rawHabitId = queryPairs.find(([key]) => key === 'habitId')?.[1];
            const habitId = rawHabitId ? decodeURIComponent(rawHabitId) : '';
            if (!habitId) return;

            const updatedHabits = await storage.setHabitCompletion(habitId, true);
            const today = new Date().toISOString().split('T')[0];
            await syncHabitsToWidget({ habits: updatedHabits, dateStr: today });
        };

        Linking.getInitialURL().then((url) => {
            handleCompleteHabitUrl(url);
        });

        const sub = Linking.addEventListener('url', ({ url }) => {
            handleCompleteHabitUrl(url);
        });

        return () => sub.remove();
    }, []);

    if (!isStorageReady) {
        return null;
    }

    return (
        <ThemeProvider>
            <UserProvider>
                <TimeProvider>
                    <AppNavigator />
                </TimeProvider>
            </UserProvider>
        </ThemeProvider>
    );
}
