import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function MarketScreen() {
    const { theme } = useTheme();
    const [markets, setMarkets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mocking market data for quick loading, in a real app this would be a fetch
        const mockMarkets = [
            { id: '1', name: 'S&P 500', value: '4,958.61', change: '+0.52%', up: true },
            { id: '2', name: 'NASDAQ', value: '15,628.95', change: '+0.95%', up: true },
            { id: '3', name: 'DOW JONES', value: '38,677.36', change: '-0.11%', up: false },
            { id: '4', name: 'BITCOIN', value: '$43,210.50', change: '+1.24%', up: true },
            { id: '5', name: 'GOLD', value: '$2,034.40', change: '-0.24%', up: false },
        ];
        setTimeout(() => {
            setMarkets(mockMarkets);
            setLoading(false);
        }, 800);
    }, []);

    const renderItem = ({ item }) => (
        <View style={[styles.marketCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
            <View>
                <Text style={[styles.marketName, { color: theme.text }]}>{item.name}</Text>
                <Text style={[styles.marketValue, { color: theme.text }]}>{item.value}</Text>
            </View>
            <View style={[styles.changeBadge, { backgroundColor: item.up ? '#D1FAE5' : '#FEE2E2' }]}>
                <Ionicons name={item.up ? 'trending-up' : 'trending-down'} size={14} color={item.up ? '#059669' : '#DC2626'} />
                <Text style={[styles.changeText, { color: item.up ? '#059669' : '#DC2626' }]}>{item.change}</Text>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.success} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Market Watch</Text>
            <FlatList
                data={markets}
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
        padding: 20,
    },
    listContent: {
        paddingHorizontal: 20,
    },
    marketCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
        elevation: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    marketName: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
        opacity: 0.7,
    },
    marketValue: {
        fontSize: 18,
        fontWeight: '800',
    },
    changeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },
    changeText: {
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 4,
    },
});
