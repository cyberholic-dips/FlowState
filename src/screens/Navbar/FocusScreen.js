import React, { useCallback, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { storage } from '../../utils/storage';
import { useTheme } from '../../context/ThemeContext';
import FocusPanel from '../Explore/FocusPanel';
import TabPageHeader from '../../components/TabPageHeader';

const MIN_RECENT_MS = 25 * 60 * 1000;

const formatDuration = (ms) => {
    const totalMins = Math.floor(ms / 60000);
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
};

export default function FocusScreen() {
    const { theme } = useTheme();
    const [recentSessions, setRecentSessions] = useState([]);
    const scrollRef = React.useRef(null);

    const loadRecentSessions = useCallback(async () => {
        const sessions = await storage.getFocusSessions();
        const filtered = sessions
            .filter((session) => (session?.duration || 0) >= MIN_RECENT_MS)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 8);
        setRecentSessions(filtered);
    }, []);

    useFocusEffect(
        useCallback(() => {
            requestAnimationFrame(() => {
                scrollRef.current?.scrollTo({ y: 0, animated: true });
            });
            loadRecentSessions();
        }, [loadRecentSessions])
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}> 
            <TabPageHeader title="Focus" variant="minimal" />
            <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <FocusPanel />
                <View style={[styles.recentSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.recentTitle, { color: theme.text }]}>Recent Focus Sessions</Text>
                    {recentSessions.length === 0 ? (
                        <Text style={[styles.emptyText, { color: theme.subText }]}>
                            Sessions longer than 25 minutes will appear here.
                        </Text>
                    ) : (
                        recentSessions.map((session) => (
                            <View key={session.id} style={[styles.sessionRow, { borderBottomColor: theme.border }]}>
                                <View style={styles.sessionTextWrap}>
                                    <Text style={[styles.sessionTitle, { color: theme.text }]} numberOfLines={1}>
                                        {session.title}
                                    </Text>
                                    <Text style={[styles.sessionMeta, { color: theme.subText }]}>
                                        {new Date(session.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </Text>
                                </View>
                                <Text style={[styles.sessionDuration, { color: theme.primary }]}>
                                    {formatDuration(session.duration)}
                                </Text>
                            </View>
                        ))
                    )}
                </View>
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 14,
    },
    recentSection: {
        borderWidth: 1,
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    recentTitle: {
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 10,
    },
    emptyText: {
        fontSize: 13,
        fontWeight: '600',
        lineHeight: 18,
    },
    sessionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
    },
    sessionTextWrap: {
        flex: 1,
        marginRight: 12,
    },
    sessionTitle: {
        fontSize: 14,
        fontWeight: '700',
    },
    sessionMeta: {
        marginTop: 2,
        fontSize: 12,
        fontWeight: '600',
    },
    sessionDuration: {
        fontSize: 13,
        fontWeight: '800',
    },
});
