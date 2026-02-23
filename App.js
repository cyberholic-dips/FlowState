import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/context/ThemeContext';
import { UserProvider } from './src/context/UserContext';
import { TimeProvider } from './src/context/TimeContext';

export default function App() {
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
