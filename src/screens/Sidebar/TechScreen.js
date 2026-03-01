import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image, Modal, RefreshControl } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

const TECHCRUNCH_FEED_URL = 'https://techcrunch.com/feed/';

const decodeHtmlEntities = (text) => {
    return text
        .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/<!\[CDATA\[/g, '')
        .replace(/\]\]>/g, '');
};

const cleanText = (text) => {
    if (!text) {return '';}
    const decoded = decodeHtmlEntities(text);
    return decoded.replace(/\s+/g, ' ').trim();
};

const formatRelativeTime = (dateString) => {
    if (!dateString) {return '';}
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {return dateString;}

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) {return date.toLocaleDateString();}

    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) {return 'Just now';}
    if (diffMin < 60) {return `${diffMin}m ago`;}
    if (diffHr < 24) {return `${diffHr}h ago`;}
    if (diffDay === 1) {return 'Yesterday';}
    if (diffDay < 7) {return `${diffDay}d ago`;}

    return date.toLocaleDateString();
};

export default function TechScreen() {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const [techItems, setTechItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState(null);

    const fetchTechNews = async (isRefresh = false) => {
        if (!isRefresh) {setLoading(true);}
        try {
            const response = await fetch(TECHCRUNCH_FEED_URL);
            const xmlText = await response.text();

            const items = [];
            const itemMatches = xmlText.match(/<item>([\s\S]*?)<\/item>/g);

            if (itemMatches) {
                itemMatches.forEach(itemXml => {
                    const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/);
                    const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
                    const dateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
                    const creatorMatch = itemXml.match(/<dc:creator>([\s\S]*?)<\/dc:creator>/);

                    // TechCrunch often puts images in content:encoded or media:content
                    const imgMatch = itemXml.match(/<media:content[^>]*url="([^"]+)"/) ||
                        itemXml.match(/<img[^>]*src="([^"]+)"/);

                    if (titleMatch && linkMatch) {
                        items.push({
                            id: linkMatch[1],
                            title: cleanText(titleMatch[1]),
                            link: linkMatch[1],
                            time: dateMatch ? formatRelativeTime(dateMatch[1]) : '',
                            source: creatorMatch ? cleanText(creatorMatch[1]) : 'TechCrunch',
                            image: imgMatch ? imgMatch[1] : null,
                            icon: 'hardware-chip-outline'
                        });
                    }
                });
            }
            setTechItems(items);
        } catch (error) {
            console.error('Failed to fetch TechCrunch news:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchTechNews();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchTechNews(true);
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.techCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}
            onPress={() => setSelectedArticle(item)}
            activeOpacity={0.8}
        >
            <View style={[styles.iconBox, { backgroundColor: theme.input }]}>
                {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.cardImage} />
                ) : (
                    <Ionicons name={item.icon} size={24} color={theme.primary} />
                )}
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
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={{ marginTop: 12, color: theme.subText }}>Loading latest tech news...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Tech Stuff</Text>
                <Text style={[styles.headerSubtitle, { color: theme.subText }]}>Latest from TechCrunch</Text>
            </View>

            <FlatList
                data={techItems}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.text} />
                }
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Text style={{ color: theme.subText, marginTop: 40 }}>No news found. Pull to refresh.</Text>
                    </View>
                }
            />

            <Modal visible={!!selectedArticle} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedArticle(null)}>
                <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.card }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                        <TouchableOpacity onPress={() => setSelectedArticle(null)} style={styles.closeButton}>
                            <Text style={[styles.closeButtonText, { color: theme.primary }]}>Done</Text>
                        </TouchableOpacity>
                        <Text style={[styles.modalTitle, { color: theme.text }]} numberOfLines={1}>{selectedArticle?.title}</Text>
                    </View>
                    {selectedArticle && (
                        <WebView
                            source={{ uri: selectedArticle.link }}
                            startInLoadingState
                            renderLoading={() => (
                                <View style={[styles.webviewLoading, { backgroundColor: theme.card }]}>
                                    <ActivityIndicator size="small" color={theme.primary} />
                                </View>
                            )}
                        />
                    )}
                </SafeAreaView>
            </Modal>
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
    header: {
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
    },
    headerSubtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    techCard: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 16,
        marginBottom: 16,
        elevation: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        alignItems: 'center',
    },
    iconBox: {
        width: 60,
        height: 60,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        overflow: 'hidden',
    },
    cardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    textContent: {
        flex: 1,
    },
    techTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 6,
        lineHeight: 20,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    techSource: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    techTime: {
        fontSize: 11,
    },
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
    },
    closeButton: {
        padding: 8,
    },
    closeButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    modalTitle: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 16,
    },
    webviewLoading: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
