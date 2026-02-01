import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <AppNavigator />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
