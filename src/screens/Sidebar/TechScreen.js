import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function TechScreen() {
    const { theme } = useTheme();
    const [techItems, setTechItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const mockTech = [
            { id: '1', title: 'New M3 MacBook Pro Review', source: 'The Verge', time: '2h ago', icon: 'laptop-outline' },
            { id: '2', title: 'OpenAI Announces GPT-5 Specs', source: 'TechCrunch', time: '5h ago', icon: 'hardware-chip-outline' },
            { id: '3', title: 'The Future of VR: Vision Pro 2', source: 'Engadget', time: 'Yesterday', icon: 'glasses-outline' },
            { id: '4', title: 'Top 10 VS Code Extensions 2024', source: 'Dev.to', time: '3 days ago', icon: 'code-slash-outline' },
        ];
        setTimeout(() => {
            setTechItems(mockTech);
            setLoading(false);
        }, 500);
    }, []);

    const renderItem = ({ item }) => (
        <TouchableOpacity style={[styles.techCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
            <View style={[styles.iconBox, { backgroundColor: theme.input }]}>
                <Ionicons name={item.icon} size={24} color={theme.primary} />
            </View>
            <View style={styles.textContent}>
                <Text style={[styles.techTitle, { color: theme.text }]} numberOfLines={2}>{item.title}</Text>
                <View style={styles.metaRow}>
                    <Text style={[styles.techSource, { color: theme.primary }]}>{item.source}</Text>
                    <Text style={[styles.techTime, { color: theme.subText }]}>{item.time}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.text} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Tech Stuff</Text>
            <FlatList
                data={techItems}
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
        paddingHorizontal: 20,
    },
    techCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        elevation: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        alignItems: 'center',
    },
    iconBox: {
        width: 50,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContent: {
        flex: 1,
    },
    techTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 6,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    techSource: {
        fontSize: 12,
        fontWeight: '800',
    },
    techTime: {
        fontSize: 12,
    },
});
