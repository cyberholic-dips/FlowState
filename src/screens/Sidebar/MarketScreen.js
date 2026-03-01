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
const NEWS_STORAGE_KEY = "market-news-data-cache";

const decodeHtmlEntities = (text) => {
    if (!text) {return "";}
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
    if (!text) {return "";}
    const decoded = decodeHtmlEntities(text);
    return decoded.replace(/\s+/g, " ").trim();
};

const parseDateSafe = (dateString) => {
    if (!dateString) {return null;}
    let date = new Date(dateString);
    if (!isNaN(date.getTime())) {return date;}

    // Try manual fixes for common news site formats
    const cleaned = dateString.replace(/,/g, " ").replace(/\s+/g, " ").trim();
    date = new Date(cleaned);
    if (!isNaN(date.getTime())) {return date;}

    return null;
};

const formatRelativeTime = (dateString) => {
    if (!dateString) {return "";}

    const date = parseDateSafe(dateString);
    if (!date) {return dateString;}

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

    if (diffSec < 60) {return "Just now";}
    if (diffMin < 60) {return `${diffMin}m ago`;}
    if (diffHr < 24) {return `${diffHr}h ago`;}
    if (diffDay === 1) {return "Yesterday";}
    if (diffDay < 7) {return `${diffDay}d ago`;}

    return date.toLocaleDateString(undefined, {
        month: "short", day: "numeric", year: "numeric",
    });
};

const SOURCES = [
    {
        id: "sharesansar",
        name: "Sharesansar",
        url: "https://www.sharesansar.com/category/latest",
        color: "#D32F2F",
        accent: "#EF4444",
        category: "STOCKS",
        fetch: async () => {
            try {
                const response = await fetch("https://www.sharesansar.com/category/latest");
                const html = await response.text();
                const items = [];
                const parts = html.split('class="featured-news-list');
                parts.shift();
                parts.forEach((part) => {
                    const titleMatch = part.match(/<h4 class="featured-news-title">([^<]+)<\/h4>/);
                    const linkMatch = part.match(/href="([^"]+)"/);
                    const imgMatch = part.match(/src="([^"]+)"/);
                    const dateMatch = part.match(/<span class="text-org">([^<]+)<\/span>/);
                    if (titleMatch && linkMatch) {
                        items.push({
                            title: cleanText(titleMatch[1]),
                            link: linkMatch[1],
                            image: imgMatch ? imgMatch[1] : undefined,
                            date: dateMatch ? cleanText(dateMatch[1]) : undefined,
                        });
                    }
                });
                return items;
            } catch (e) { return []; }
        }
    },
    {
        id: "merolagani",
        name: "MeroLagani",
        url: "https://merolagani.com/NewsList.aspx",
        color: "#1976D2",
        accent: "#3B82F6",
        category: "STOCKS",
        fetch: async () => {
            try {
                const response = await fetch("https://merolagani.com/NewsList.aspx");
                const html = await response.text();
                const items = [];
                const parts = html.split('class="media-news');
                parts.shift();
                parts.forEach((part) => {
                    const imgMatch = part.match(/<img src="([^"]+)"/);
                    const titleMatch = part.match(/<h4 class="media-title">[\s\S]*?<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
                    const dateMatch = part.match(/<span class="media-label">([\s\S]*?)<\/span>/);
                    if (titleMatch) {
                        items.push({
                            title: cleanText(titleMatch[2]),
                            link: titleMatch[1].startsWith("http") ? titleMatch[1] : "https://merolagani.com" + titleMatch[1],
                            image: imgMatch ? imgMatch[1] : undefined,
                            date: dateMatch ? cleanText(dateMatch[1]) : undefined,
                        });
                    }
                });
                return items;
            } catch (e) { return []; }
        }
    }
];

const newsCache = {};

export default function MarketScreen() {
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

        if (!refresh) {setIsLoading(true);}
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
                        colors={['transparent', 'rgba(0,0,0,0.85)']}
                        style={styles.featuredGradient}
                    >
                        <View style={[styles.featuredBadge, { backgroundColor: activeSource.accent }]}>
                            <Text style={styles.featuredBadgeText}>{activeSource.category}</Text>
                        </View>
                        <Text style={styles.featuredTitle} numberOfLines={3}>{item.title}</Text>
                        <View style={styles.cardFooter}>
                            <Text style={[styles.cardSource, { color: '#FFF', opacity: 0.9 }]}>{activeSource.name.toUpperCase()}</Text>
                            <Text style={[styles.cardDate, { color: '#FFF', opacity: 0.7 }]}>{formatRelativeTime(item.date)}</Text>
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
                    <View style={[styles.cardImage, styles.placeholderImage, { backgroundColor: activeSource.accent + '15' }]}>
                        <Ionicons name={activeSource.category === 'CRYPTO' ? 'logo-bitcoin' : 'trending-up-outline'} size={28} color={activeSource.accent} />
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

    const headerTranslate = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [0, -5],
        extrapolate: 'clamp'
    });

    return (
        <View style={styles.screen}>
            <Animated.View style={[
                styles.header,
                {
                    paddingTop: insets.top + 16,
                    transform: [{ translateY: headerTranslate }]
                }
            ]}>
                <View style={styles.headerRow}>
                    <View>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>Market Watch</Text>
                        <View style={styles.liveIndicatiorRow}>
                            <View style={[styles.liveDot, { backgroundColor: activeSource.accent }]} />
                            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Real-time Market Feed</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[styles.refreshIcon, { backgroundColor: colors.input }]}
                        onPress={() => loadNews(true)}
                    >
                        <Ionicons name="stats-chart" size={18} color={colors.text} />
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
                                    {item.name}
                                </Text>
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>

            {isLoading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={activeSource.accent} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Analyzing market data...</Text>
                </View>
            )}

            {!isLoading && newsData.length === 0 && (
                <View style={styles.loadingContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color={colors.textSecondary} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Markets are temporarily unreachable.</Text>
                    <TouchableOpacity
                        style={[styles.retryButton, { backgroundColor: activeSource.accent }]}
                        onPress={() => loadNews(true)}
                    >
                        <Text style={styles.retryText}>Retry Connection</Text>
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
                            <Text style={[styles.closeButtonText, { color: activeSource.accent }]}>Done</Text>
                        </TouchableOpacity>
                        <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={1}>{readingItem?.title}</Text>
                        <View style={{ width: 40 }} />
                    </View>
                    {readingItem && (
                        <WebView
                            source={{ uri: readingItem.link }}
                            startInLoadingState
                            renderLoading={() => (
                                <View style={[styles.webviewLoading, { backgroundColor: colors.surface }]}>
                                    <ActivityIndicator size="small" color={activeSource.accent} />
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
        headerTitle: { fontSize: 30, fontWeight: "900", letterSpacing: -0.8 },
        liveIndicatiorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
        liveDot: { width: 7, height: 7, borderRadius: 3.5, marginRight: 8 },
        headerSubtitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },
        refreshIcon: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
        tabsContainer: { marginBottom: 12 },
        tabsContent: { paddingHorizontal: 20, paddingVertical: 8 },
        tab: {
            paddingHorizontal: 22, paddingVertical: 10, borderRadius: 25,
            backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border,
            marginRight: 12,
            shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
        },
        tabText: { fontSize: 13, fontWeight: "800" },
        listContent: { padding: 20, paddingBottom: 120 },
        featuredCard: {
            width: '100%',
            height: 300,
            borderRadius: 28,
            overflow: 'hidden',
            marginBottom: 28,
            elevation: 10,
            shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 15,
        },
        featuredImage: { width: '100%', height: '100%' },
        featuredGradient: {
            ...StyleSheet.absoluteFillObject,
            justifyContent: 'flex-end',
            padding: 24,
        },
        featuredBadge: {
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 6,
            alignSelf: 'flex-start',
            marginBottom: 12,
        },
        featuredBadgeText: { color: '#000', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
        featuredTitle: { color: '#FFF', fontSize: 24, fontWeight: '800', lineHeight: 30, marginBottom: 16 },
        card: {
            flexDirection: "row", borderRadius: 20,
            overflow: "hidden", borderWidth: 1, borderColor: colors.border,
            height: 120, marginBottom: 16, elevation: 3,
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6,
        },
        cardImage: { width: 115, height: "100%", backgroundColor: colors.input },
        placeholderImage: { alignItems: "center", justifyContent: "center" },
        cardContent: { flex: 1, padding: 16, justifyContent: "space-between" },
        cardTitle: { fontSize: 15, fontWeight: "700", lineHeight: 21 },
        cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        cardSource: { fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
        cardDate: { fontSize: 11, fontWeight: '500' },
        loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
        loadingText: { fontSize: 16, fontWeight: '700', marginTop: 16, textAlign: 'center' },
        retryButton: { marginTop: 28, paddingHorizontal: 36, paddingVertical: 15, borderRadius: 30, elevation: 5 },
        retryText: { color: "#FFF", fontWeight: "900", fontSize: 16 },
        modalContainer: { flex: 1 },
        modalHeader: {
            flexDirection: "row", alignItems: "center", justifyContent: "space-between",
            paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
        },
        closeButton: { padding: 8 },
        closeButtonText: { fontSize: 17, fontWeight: "800" },
        modalTitle: { fontSize: 14, fontWeight: "700", flex: 1, textAlign: "center" },
        webviewLoading: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
    });
