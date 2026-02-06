import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function YoutubeScreen() {
    const { theme } = useTheme();
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const mockVideos = [
            { id: '1', title: 'Mastering React Native Animation', channel: 'Code Academy', views: '250K views', thumbnail: 'https://img.youtube.com/vi/uY_VOnX4G_E/maxresdefault.jpg' },
            { id: '2', title: '10 Habit Hacks for High Productivity', source: 'Better You', views: '1.2M views', thumbnail: 'https://img.youtube.com/vi/W_vV6Vp9_eM/maxresdefault.jpg' },
            { id: '3', title: 'The Future of AI Coding Agents', channel: 'Tech Trends', views: '89K views', thumbnail: 'https://img.youtube.com/vi/mI60K9-5h8w/maxresdefault.jpg' },
        ];
        setTimeout(() => {
            setVideos(mockVideos);
            setLoading(false);
        }, 700);
    }, []);

    const renderItem = ({ item }) => (
        <TouchableOpacity style={[styles.videoCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
            <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
            <View style={styles.videoInfo}>
                <Ionicons name="logo-youtube" size={24} color="#FF0000" style={styles.playIcon} />
                <View style={styles.textContent}>
                    <Text style={[styles.videoTitle, { color: theme.text }]} numberOfLines={2}>{item.title}</Text>
                    <Text style={[styles.videoMeta, { color: theme.subText }]}>{item.channel || item.source} • {item.views}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color="#FF0000" />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>YouTube Picks</Text>
            <FlatList
                data={videos}
                renderItem={renderItem}
                keyExtractor={item => item.id}
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
        fontWeight: '800',
        padding: 24,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    videoCard: {
        borderRadius: 16,
        marginBottom: 20,
        overflow: 'hidden',
        elevation: 3,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    thumbnail: {
        width: '100%',
        height: 180,
        backgroundColor: '#000',
    },
    videoInfo: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'flex-start',
    },
    playIcon: {
        marginRight: 12,
        marginTop: 2,
    },
    textContent: {
        flex: 1,
    },
    videoTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
        lineHeight: 22,
    },
    videoMeta: {
        fontSize: 12,
        fontWeight: '600',
    },
});
