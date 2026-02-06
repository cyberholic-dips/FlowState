import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Linking, Image } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function CryptoScreen() {
    const { theme } = useTheme();
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCryptoNews();
    }, []);

    const fetchCryptoNews = async () => {
        try {
            const response = await fetch('https://api.coingecko.com/api/v3/news');
            const data = await response.json();
            setNews(data.data || []);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching crypto news:", err);
            setError("Failed to load crypto news. Please try again later.");
            setLoading(false);
        }
    };

    const openLink = (url) => {
        if (url) {
            Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity style={[styles.card, { backgroundColor: theme.card }]} onPress={() => openLink(item.url)}>
            {item.thumb_2x && (
                <Image source={{ uri: item.thumb_2x }} style={styles.image} />
            )}
            <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={2}>{item.title}</Text>
                <Text style={[styles.cardDate, { color: theme.subText }]}>
                    {new Date(item.updated_at * 1000).toLocaleDateString()}
                </Text>
                <Text style={[styles.cardDescription, { color: theme.subText }]} numberOfLines={3}>
                    {item.description}
                </Text>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color="#F7931A" />
                <Text style={{ color: theme.text, marginTop: 10 }}>Loading crypto updates...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
                <Ionicons name="alert-circle-outline" size={50} color={theme.text} />
                <Text style={{ color: theme.text, marginTop: 10 }}>{error}</Text>
                <TouchableOpacity onPress={fetchCryptoNews} style={[styles.retryButton, { backgroundColor: theme.primary }]}>
                    <Text style={{ color: '#FFF' }}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Crypto News</Text>
            <FlatList
                data={news}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
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
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginHorizontal: 20,
        marginVertical: 15,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    card: {
        borderRadius: 12,
        marginBottom: 15,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    image: {
        width: '100%',
        height: 150,
    },
    cardContent: {
        padding: 15,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    cardDate: {
        fontSize: 12,
        marginBottom: 8,
    },
    cardDescription: {
        fontSize: 14,
        lineHeight: 20,
    },
    retryButton: {
        marginTop: 15,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
});
