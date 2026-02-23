import React, { useEffect, useMemo, useState, useRef } from "react";
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    Image,
    ActivityIndicator,
    Modal,
    RefreshControl,
    Animated,
    Dimensions,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WebView } from "react-native-webview";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";

const { width } = Dimensions.get("window");
const NEWS_STORAGE_KEY = "general-news-data-cache";

const decodeHtmlEntities = (text) => {
    if (!text) return "";
    return text
        .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/<!\[CDATA\[/g, "")
        .replace(/\]\]>/g, "");
};

const cleanText = (text) => {
    if (!text) return "";
    const decoded = decodeHtmlEntities(text);
    return decoded.replace(/\s+/g, " ").trim();
};

const parseDateSafe = (dateString) => {
    if (!dateString) return null;
    let date = new Date(dateString);
    if (!isNaN(date.getTime())) return date;
    return null;
};

const formatRelativeTime = (dateString) => {
    if (!dateString) return "";

    const date = parseDateSafe(dateString);
    if (!date) return dateString;

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    if (diffMs < 0) {
        return date.toLocaleDateString(undefined, {
            month: "short", day: "numeric", year: "numeric",
        });
    }

    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay === 1) return "Yesterday";
    if (diffDay < 7) return `${diffDay}d ago`;

    return date.toLocaleDateString(undefined, {
        month: "short", day: "numeric", year: "numeric",
    });
};

const SOURCES = [
    {
        id: "kathmandupost",
        name: "Kathmandu Post",
        url: "https://kathmandupost.com/rss",
        color: "#1a1a1a",
        accent: "#3B82F6",
        fetch: async () => {
            try {
                const response = await fetch("https://kathmandupost.com/rss");
                const xml = await response.text();
                const items = [];
                const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g);

                if (itemMatches) {
                    itemMatches.forEach(itemXml => {
                        const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/);
                        const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
                        const dateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);

                        if (titleMatch && linkMatch) {
                            items.push({
                                title: cleanText(titleMatch[1]),
                                link: linkMatch[1],
                                date: dateMatch ? dateMatch[1] : undefined,
                            });
                        }
                    });
                }
                return items;
            } catch (e) { return []; }
        }
    },
    {
        id: "techpana",
        name: "TechPana",
        url: "https://www.techpana.com/feed",
        color: "#0066cc",
        accent: "#10B981",
        fetch: async () => {
            try {
                const response = await fetch("https://www.techpana.com/feed");
                const xml = await response.text();
                const items = [];
                const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g);

                if (itemMatches) {
                    itemMatches.forEach(itemXml => {
                        const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/);
                        const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
                        const dateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);

                        if (titleMatch && linkMatch) {
                            items.push({
                                title: cleanText(titleMatch[1]),
                                link: linkMatch[1],
                                date: dateMatch ? dateMatch[1] : undefined,
                            });
                        }
                    });
                }
                return items;
            } catch (e) { return []; }
        }
    },
    {
        id: "bbc",
        name: "BBC News",
        url: "http://feeds.bbci.co.uk/news/rss.xml",
        color: "#bb1919",
        accent: "#bb1919",
        fetch: async () => {
            try {
                const response = await fetch("http://feeds.bbci.co.uk/news/rss.xml");
                const xml = await response.text();
                const items = [];
                const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g);

                if (itemMatches) {
                    itemMatches.forEach(itemXml => {
                        const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/);
                        const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
                        const dateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
                        const mediaMatch = itemXml.match(/<media:thumbnail[^>]*url="([^"]+)"/);

                        if (titleMatch && linkMatch) {
                            items.push({
                                title: cleanText(titleMatch[1]),
                                link: linkMatch[1],
                                date: dateMatch ? dateMatch[1] : undefined,
                                image: mediaMatch ? mediaMatch[1] : undefined,
                            });
                        }
                    });
                }
                return items;
            } catch (e) { return []; }
        }
    }
];

const newsCache = {};

export default function NewsScreen() {
    const { theme, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const scrollY = useRef(new Animated.Value(0)).current;

    const colors = useMemo(() => ({
        background: theme.background,
        surface: theme.card,
        text: theme.text,
        textSecondary: theme.subText,
        border: theme.border,
        primary: theme.primary,
        input: theme.input,
        shadow: isDark ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.05)",
    }), [theme, isDark]);

    const styles = useMemo(() => createStyles(colors), [colors]);

    const [activeSourceId, setActiveSourceId] = useState(SOURCES[0].id);
    const [newsData, setNewsData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [readingItem, setReadingItem] = useState(null);

    const activeSource = SOURCES.find((s) => s.id === activeSourceId);

    const loadNews = async (refresh = false) => {
        if (!refresh && newsCache[activeSourceId]) {
            setNewsData(newsCache[activeSourceId]);
            setIsLoading(false);
            return;
        }

        if (!refresh) {
            try {
                const stored = await AsyncStorage.getItem(NEWS_STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (parsed[activeSourceId] && parsed[activeSourceId].length > 0) {
                        setNewsData(parsed[activeSourceId]);
                        newsCache[activeSourceId] = parsed[activeSourceId];
                        setIsLoading(false);
                        return;
                    }
                }
            } catch (e) { }
        }

        if (!refresh) setIsLoading(true);
        const items = await activeSource.fetch();
        setNewsData(items);
        newsCache[activeSourceId] = items;

        try {
            const stored = await AsyncStorage.getItem(NEWS_STORAGE_KEY);
            const parsed = stored ? JSON.parse(stored) : {};
            parsed[activeSourceId] = items;
            await AsyncStorage.setItem(NEWS_STORAGE_KEY, JSON.stringify(parsed));
        } catch (e) { }

        setIsLoading(false);
    };

    useEffect(() => {
        loadNews();
    }, [activeSourceId]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadNews(true);
        setIsRefreshing(false);
    };

    const renderItem = ({ item, index }) => {
        const isFeatured = index === 0 && item.image;

        if (isFeatured) {
            return (
                <TouchableOpacity
                    style={styles.featuredCard}
                    onPress={() => setReadingItem(item)}
                    activeOpacity={0.9}
                >
                    <Image source={{ uri: item.image }} style={styles.featuredImage} />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={styles.featuredGradient}
                    >
                        <View style={styles.featuredBadge}>
                            <Text style={styles.featuredBadgeText}>FEATURED</Text>
                        </View>
                        <Text style={styles.featuredTitle} numberOfLines={3}>{item.title}</Text>
                        <View style={styles.cardFooter}>
                            <Text style={[styles.cardSource, { color: '#FFF', opacity: 0.8 }]}>{activeSource.name.toUpperCase()}</Text>
                            <Text style={[styles.cardDate, { color: '#FFF', opacity: 0.6 }]}>{formatRelativeTime(item.date)}</Text>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            );
        }

        return (
            <TouchableOpacity
                style={[styles.card, { backgroundColor: colors.surface }]}
                onPress={() => setReadingItem(item)}
                activeOpacity={0.7}
            >
                {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.cardImage} />
                ) : (
                    <View style={[styles.cardImage, styles.placeholderImage, { backgroundColor: activeSource.accent + '10' }]}>
                        <Ionicons name="newspaper-outline" size={24} color={activeSource.accent} />
                    </View>
                )}
                <View style={styles.cardContent}>
                    <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={3}>{item.title}</Text>
                    <View style={styles.cardFooter}>
                        <Text style={[styles.cardSource, { color: activeSource.accent }]}>{activeSource.name.toUpperCase()}</Text>
                        <Text style={[styles.cardDate, { color: colors.textSecondary }]}>{formatRelativeTime(item.date)}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [1, 0.9],
        extrapolate: 'clamp'
    });

    const headerTranslate = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [0, -10],
        extrapolate: 'clamp'
    });

    return (
        <View style={styles.screen}>
            <Animated.View style={[
                styles.header,
                {
                    paddingTop: insets.top + 16,
                    opacity: headerOpacity,
                    transform: [{ translateY: headerTranslate }]
                }
            ]}>
                <View style={styles.headerRow}>
                    <View>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>Global News</Text>
                        <View style={styles.liveIndicatiorRow}>
                            <View style={styles.liveDot} />
                            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Live Updates</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[styles.refreshIcon, { backgroundColor: colors.input }]}
                        onPress={() => loadNews(true)}
                    >
                        <Ionicons name="refresh" size={20} color={colors.text} />
                    </TouchableOpacity>
                </View>
            </Animated.View>

            <View style={styles.tabsContainer}>
                <FlatList
                    horizontal
                    data={SOURCES}
                    keyExtractor={(item) => item.id}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsContent}
                    renderItem={({ item }) => {
                        const isActive = activeSourceId === item.id;
                        return (
                            <TouchableOpacity
                                style={[
                                    styles.tab,
                                    isActive && { backgroundColor: item.accent, borderColor: item.accent, elevation: 4, shadowColor: item.accent }
                                ]}
                                onPress={() => setActiveSourceId(item.id)}
                            >
                                <Text style={[styles.tabText, { color: isActive ? '#FFF' : colors.textSecondary }]}>
                                    {isActive ? item.name : item.name.split(' ')[0]}
                                </Text>
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>

            {isLoading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Curating stories for you...</Text>
                </View>
            )}

            {!isLoading && newsData.length === 0 && (
                <View style={styles.loadingContainer}>
                    <Ionicons name="cloud-offline-outline" size={64} color={colors.textSecondary} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Unable to reach news server.</Text>
                    <TouchableOpacity
                        style={[styles.retryButton, { backgroundColor: colors.primary }]}
                        onPress={() => loadNews(true)}
                    >
                        <Text style={styles.retryText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            )}

            {!isLoading && newsData.length > 0 && (
                <Animated.FlatList
                    data={newsData}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: true }
                    )}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefresh}
                            colors={[activeSource.accent]}
                            tintColor={colors.text}
                        />
                    }
                />
            )}

            <Modal visible={!!readingItem} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setReadingItem(null)}>
                <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                        <TouchableOpacity onPress={() => setReadingItem(null)} style={styles.closeButton}>
                            <Text style={[styles.closeButtonText, { color: colors.primary }]}>Done</Text>
                        </TouchableOpacity>
                        <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={1}>{readingItem?.title}</Text>
                        <TouchableOpacity style={styles.closeButton}>
                            <Ionicons name="share-outline" size={20} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                    {readingItem && (
                        <WebView
                            source={{ uri: readingItem.link }}
                            startInLoadingState
                            renderLoading={() => (
                                <View style={[styles.webviewLoading, { backgroundColor: colors.surface }]}>
                                    <ActivityIndicator size="small" color={colors.primary} />
                                </View>
                            )}
                        />
                    )}
                </SafeAreaView>
            </Modal>
        </View>
    );
}

const createStyles = (colors) =>
    StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        header: {
            paddingHorizontal: 24,
            paddingBottom: 16,
            zIndex: 10,
        },
        headerRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        headerTitle: { fontSize: 32, fontWeight: "900", letterSpacing: -0.5 },
        liveIndicatiorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
        liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444', marginRight: 6 },
        headerSubtitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
        refreshIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
        tabsContainer: { marginBottom: 8 },
        tabsContent: { paddingHorizontal: 20, paddingVertical: 12 },
        tab: {
            paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25,
            backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border,
            marginRight: 10,
            shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
        },
        tabText: { fontSize: 13, fontWeight: "700" },
        listContent: { padding: 20, paddingBottom: 120 },
        featuredCard: {
            width: '100%',
            height: 280,
            borderRadius: 24,
            overflow: 'hidden',
            marginBottom: 24,
            elevation: 8,
            shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10,
        },
        featuredImage: { width: '100%', height: '100%' },
        featuredGradient: {
            ...StyleSheet.absoluteFillObject,
            justifyContent: 'flex-end',
            padding: 20,
        },
        featuredBadge: {
            backgroundColor: '#FF3B30',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 4,
            alignSelf: 'flex-start',
            marginBottom: 10,
        },
        featuredBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
        featuredTitle: { color: '#FFF', fontSize: 22, fontWeight: '800', lineHeight: 28, marginBottom: 12 },
        card: {
            flexDirection: "row", borderRadius: 20,
            overflow: "hidden", borderWidth: 1, borderColor: colors.border,
            height: 120, marginBottom: 16, elevation: 2,
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5,
        },
        cardImage: { width: 110, height: "100%", backgroundColor: colors.input },
        placeholderImage: { alignItems: "center", justifyContent: "center" },
        cardContent: { flex: 1, padding: 14, justifyContent: "space-between" },
        cardTitle: { fontSize: 15, fontWeight: "700", lineHeight: 20 },
        cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        cardSource: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
        cardDate: { fontSize: 11 },
        loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
        loadingText: { fontSize: 15, fontWeight: '600', marginTop: 16, textAlign: 'center' },
        retryButton: { marginTop: 24, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 25 },
        retryText: { color: "#FFF", fontWeight: "800", fontSize: 16 },
        modalContainer: { flex: 1 },
        modalHeader: {
            flexDirection: "row", alignItems: "center", justifyContent: "space-between",
            paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
        },
        closeButton: { padding: 8 },
        closeButtonText: { fontSize: 16, fontWeight: "700" },
        modalTitle: { fontSize: 14, fontWeight: "700", flex: 1, textAlign: "center", marginHorizontal: 12 },
        webviewLoading: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
    });
