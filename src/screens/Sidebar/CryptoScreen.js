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
    ScrollView,
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
const CRYPTO_CACHE_KEY = "crypto-hub-cache";

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

const formatRelativeTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const fetchPrices = async () => {
    try {
        const response = await fetch(
            "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=12&page=1&sparkline=false&price_change_percentage=24h"
        );
        return await response.json();
    } catch (e) {
        return [];
    }
};

const fetchNews = async () => {
    try {
        const response = await fetch("https://www.coindesk.com/arc/outboundfeeds/rss");
        const xml = await response.text();
        const items = [];
        const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g);

        if (itemMatches) {
            itemMatches.slice(0, 15).forEach(itemXml => {
                const titleMatch = itemXml.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || itemXml.match(/<title>([\s\S]*?)<\/title>/);
                const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
                const dateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
                const mediaMatch = itemXml.match(/<media:content[^>]*url="([^"]+)"/);

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
};

export default function CryptoScreen() {
    const { theme, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const scrollY = useRef(new Animated.Value(0)).current;

    const colors = useMemo(() => ({
        background: theme.background,
        surface: theme.card,
        text: theme.text,
        textSecondary: theme.subText,
        border: theme.border,
        primary: "#F7931A", // Bitcoin Orange
        accent: "#627EEA", // Ethereum Blue
        success: "#10B981",
        danger: "#EF4444",
        input: theme.input,
    }), [theme]);

    const styles = useMemo(() => createStyles(colors), [colors]);

    const [prices, setPrices] = useState([]);
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [readingItem, setReadingItem] = useState(null);

    const loadData = async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);

        const [priceData, newsData] = await Promise.all([fetchPrices(), fetchNews()]);

        if (priceData && priceData.length > 0) setPrices(priceData);
        if (newsData && newsData.length > 0) setNews(newsData);

        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData(true);
        setRefreshing(false);
    };

    const PriceCard = ({ item }) => (
        <View style={[styles.priceCard, { backgroundColor: colors.surface }]}>
            <View style={styles.priceCardTop}>
                <Image source={{ uri: item.image }} style={styles.coinIcon} />
                <View>
                    <Text style={[styles.coinSymbol, { color: colors.text }]}>{item.symbol.toUpperCase()}</Text>
                    <Text style={[styles.coinName, { color: colors.textSecondary }]} numberOfLines={1}>{item.name}</Text>
                </View>
            </View>
            <View style={styles.priceCardBottom}>
                <Text style={[styles.coinPrice, { color: colors.text }]}>${item.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                <View style={[styles.changeBadge, { backgroundColor: item.price_change_percentage_24h >= 0 ? colors.success + '20' : colors.danger + '20' }]}>
                    <Ionicons
                        name={item.price_change_percentage_24h >= 0 ? "caret-up" : "caret-down"}
                        size={12}
                        color={item.price_change_percentage_24h >= 0 ? colors.success : colors.danger}
                    />
                    <Text style={[styles.changeText, { color: item.price_change_percentage_24h >= 0 ? colors.success : colors.danger }]}>
                        {Math.abs(item.price_change_percentage_24h).toFixed(2)}%
                    </Text>
                </View>
            </View>
        </View>
    );

    const renderNewsItem = ({ item, index }) => {
        const isFeatured = index === 0 && item.image;

        if (isFeatured) {
            return (
                <TouchableOpacity
                    key={item.link || index}
                    style={styles.featuredCard}
                    onPress={() => setReadingItem(item)}
                    activeOpacity={0.9}
                >
                    <Image source={{ uri: item.image }} style={styles.featuredImage} />
                    <LinearGradient colors={["transparent", "rgba(0,0,0,0.85)"]} style={styles.featuredGradient}>
                        <View style={styles.featuredBadge}>
                            <Text style={styles.featuredBadgeText}>LATEST UPDATE</Text>
                        </View>
                        <Text style={styles.featuredTitle} numberOfLines={3}>
                            {item.title}
                        </Text>
                        <View style={styles.cardFooter}>
                            <Text style={styles.cardSource}>COINDESK</Text>
                            <Text style={styles.cardDate}>{formatRelativeTime(item.date)}</Text>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            );
        }

        return (
            <TouchableOpacity
                key={item.link || index}
                style={[styles.newsCard, { backgroundColor: colors.surface }]}
                onPress={() => setReadingItem(item)}
                activeOpacity={0.7}
            >
                {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.newsImage} />
                ) : (
                    <View style={[styles.newsImage, styles.placeholderImage, { backgroundColor: colors.primary + "10" }]}>
                        <Ionicons name="logo-bitcoin" size={24} color={colors.primary} />
                    </View>
                )}
                <View style={styles.newsContent}>
                    <Text style={[styles.newsTitle, { color: colors.text }]} numberOfLines={3}>
                        {item.title}
                    </Text>
                    <View style={styles.cardFooter}>
                        <Text style={[styles.cardSource, { color: colors.primary }]}>COINDESK</Text>
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
                { paddingTop: insets.top + 16, transform: [{ translateY: headerTranslate }] }
            ]}>
                <View style={styles.headerRow}>
                    <View>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>Crypto Hub</Text>
                        <View style={styles.liveIndicatiorRow}>
                            <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
                            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Live Markets & News</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={[styles.refreshBtn, { backgroundColor: colors.input }]} onPress={() => loadData(true)}>
                        <Ionicons name="flash" size={18} color={colors.primary} />
                    </TouchableOpacity>
                </View>
            </Animated.View>

            <Animated.ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true }
                )}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Market Leaders</Text>
                    <TouchableOpacity>
                        <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.priceList}
                >
                    {loading && Array(5).fill(0).map((_, i) => (
                        <View key={i} style={[styles.priceCard, { backgroundColor: colors.surface, opacity: 0.6, width: 140, height: 100 }]} />
                    ))}
                    {!loading && prices.map((item) => <PriceCard key={item.id} item={item} />)}
                </ScrollView>

                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Stories</Text>
                </View>

                <View style={styles.newsList}>
                    {loading && <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />}
                    {!loading && news.map((item, index) => renderNewsItem({ item, index }))}
                </View>

                <View style={{ height: 100 }} />
            </Animated.ScrollView>

            <Modal visible={!!readingItem} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setReadingItem(null)}>
                <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                        <TouchableOpacity onPress={() => setReadingItem(null)} style={styles.closeButton}>
                            <Text style={[styles.closeButtonText, { color: colors.primary }]}>Done</Text>
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
        header: { paddingHorizontal: 24, paddingBottom: 16, zIndex: 10 },
        headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        headerTitle: { fontSize: 32, fontWeight: "900", letterSpacing: -1 },
        liveIndicatiorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
        liveDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
        headerSubtitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
        refreshBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
        scrollView: { flex: 1 },
        sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginTop: 24, marginBottom: 12 },
        sectionTitle: { fontSize: 20, fontWeight: '800' },
        seeAll: { fontSize: 14, fontWeight: '700' },
        priceList: { paddingHorizontal: 20 },
        priceCard: { width: 150, padding: 16, borderRadius: 24, marginRight: 12, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
        priceCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
        coinIcon: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
        coinSymbol: { fontSize: 16, fontWeight: '800' },
        coinName: { fontSize: 12, fontWeight: '600' },
        priceCardBottom: { marginTop: 'auto' },
        coinPrice: { fontSize: 18, fontWeight: '900', marginBottom: 8 },
        changeBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
        changeText: { fontSize: 11, fontWeight: '800', marginLeft: 2 },
        newsList: { paddingHorizontal: 20, marginTop: 8 },
        featuredCard: { width: '100%', height: 280, borderRadius: 28, overflow: 'hidden', marginBottom: 20, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10 },
        featuredImage: { width: '100%', height: '100%' },
        featuredGradient: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: 24 },
        featuredBadge: { backgroundColor: '#F7931A', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 10 },
        featuredBadgeText: { color: '#000', fontSize: 10, fontWeight: '900' },
        featuredTitle: { color: '#FFF', fontSize: 22, fontWeight: '800', lineHeight: 28, marginBottom: 12 },
        newsCard: { flexDirection: 'row', borderRadius: 20, overflow: 'hidden', height: 120, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, borderWidth: 1, borderColor: colors.border },
        newsImage: { width: 110, height: '100%', backgroundColor: colors.input },
        newsContent: { flex: 1, padding: 14, justifyContent: 'space-between' },
        newsTitle: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
        placeholderImage: { alignItems: 'center', justifyContent: 'center' },
        cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        cardSource: { fontSize: 10, fontWeight: '900', letterSpacing: 1, color: '#FFF' },
        cardDate: { fontSize: 11, color: '#FFF' },
        modalContainer: { flex: 1 },
        modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
        closeButton: { padding: 8 },
        closeButtonText: { fontSize: 17, fontWeight: "800" },
        modalTitle: { fontSize: 14, fontWeight: "700", flex: 1, textAlign: "center", marginHorizontal: 12 },
        webviewLoading: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
    });
