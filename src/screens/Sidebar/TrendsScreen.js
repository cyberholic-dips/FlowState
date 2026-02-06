import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function TrendsScreen() {
    const { theme } = useTheme();
    const [trends, setTrends] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const mockTrends = [
            { id: '1', topic: 'Artificial Intelligence', category: 'Technology', volume: '1.2M searches' },
            { id: '2', topic: 'Sustainable Living', category: 'Lifestyle', volume: '850K searches' },
            { id: '3', topic: 'Cryptocurrency Regulation', category: 'Finance', volume: '620K searches' },
            { id: '4', topic: 'Mindfulness Meditation', category: 'Health', volume: '450K searches' },
            { id: '5', topic: 'Remote Work Culture', category: 'Business', volume: '380K searches' },
        ];
        setTimeout(() => {
            setTrends(mockTrends);
            setLoading(false);
        }, 600);
    }, []);

    const renderItem = ({ item }) => (
        <TouchableOpacity style={[styles.trendItem, { borderBottomColor: theme.border }]}>
            <View>
                <Text style={[styles.trendTopic, { color: theme.text }]}>#{item.topic}</Text>
                <Text style={[styles.trendCategory, { color: theme.subText }]}>{item.category}</Text>
            </View>
            <View style={styles.volumeContainer}>
                <Ionicons name="stats-chart" size={12} color={theme.primary} />
                <Text style={[styles.volumeText, { color: theme.subText }]}>{item.volume}</Text>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.warning} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>What's Trending</Text>
            <FlatList
                data={trends}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
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
        paddingHorizontal: 24,
    },
    trendItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 20,
        borderBottomWidth: 1,
    },
    trendTopic: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    trendCategory: {
        fontSize: 12,
        fontWeight: '600',
    },
    volumeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    volumeText: {
        fontSize: 12,
        marginLeft: 6,
        fontWeight: '600',
    }
});
