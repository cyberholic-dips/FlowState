import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../context/ThemeContext';

export default function MoviesScreen() {
    const { theme } = useTheme();
    const [loading, setLoading] = useState(true);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <WebView
                source={{ uri: 'https://www.imdb.com/what-to-watch/fan-favorites/' }}
                style={styles.webview}
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                renderLoading={() => (
                    <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                        <ActivityIndicator size="large" color={theme.primary} />
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    webview: {
        flex: 1,
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
});

