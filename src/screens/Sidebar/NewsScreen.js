import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, Linking, RefreshControl } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function NewsScreen() {
    const { theme } = useTheme();
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const fetchNews = async () => {
        try {
            // Using a free, publicly accessible news API endpoint
            const response = await fetch('https://saurav.tech/NewsAPI/top-headlines/category/general/us.json');
            const data = await response.json();
            setNews(data.articles || []);
            setLoading(false);
            setRefreshing(false);
        } catch (err) {
            console.error("Error fetching news:", err);
            setError("Failed to load news. Please check your connection.");
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNews();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNews();
    };

    const openArticle = (url) => {
        if (url) {
            Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }]}
            onPress={() => openArticle(item.url)}
            activeOpacity={0.9}
        >
            {item.urlToImage && (
                <Image source={{ uri: item.urlToImage }} style={styles.image} />
            )}
            <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={2}>{item.title}</Text>
                <View style={styles.metaRow}>
                    <Text style={[styles.sourceText, { color: theme.primary }]}>{item.source.name}</Text>
                    <Text style={[styles.dateText, { color: theme.subText }]}>
                        {new Date(item.publishedAt).toLocaleDateString()}
                    </Text>
                </View>
                <Text style={[styles.description, { color: theme.subText }]} numberOfLines={3}>
                    {item.description}
                </Text>
            </View>
        </TouchableOpacity>
    );

    if (loading && !refreshing) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.subText }]}>Fetching latest headlines...</Text>
            </View>
        );
    }

    if (error && news.length === 0) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
                <Ionicons name="alert-circle-outline" size={64} color={theme.danger} />
                <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
                <TouchableOpacity onPress={fetchNews} style={[styles.retryButton, { backgroundColor: theme.primary }]}>
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <FlatList
                data={news}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    listContent: {
        padding: 20,
    },
    card: {
        borderRadius: 16,
        marginBottom: 20,
        overflow: 'hidden',
        elevation: 4,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    image: {
        width: '100%',
        height: 180,
    },
    cardContent: {
        padding: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        lineHeight: 24,
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sourceText: {
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    dateText: {
        fontSize: 12,
    },
    description: {
        fontSize: 14,
        lineHeight: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
    },
    errorText: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 24,
    },
    retryButton: {
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 12,
    },
    retryText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
    },
});
