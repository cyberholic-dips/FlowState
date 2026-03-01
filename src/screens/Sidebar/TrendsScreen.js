import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { fetchWithTimeout } from '../../utils/network';

const GOOGLE_TRENDS_URLS = [
    'https://trends.google.com/trends/trendingsearches/daily/rss?geo=US',
    'https://trends.google.com/trending/rss?geo=US',
];
const REDDIT_URL = 'https://www.reddit.com/r/popular.json?limit=3&raw_json=1';
const HN_TOP_URL = 'https://hacker-news.firebaseio.com/v0/topstories.json';
const HN_ITEM_URL = 'https://hacker-news.firebaseio.com/v0/item';
const TRENDS_CACHE_KEY = 'trends-combo-cache-v1';
const REQUEST_TIMEOUT_MS = 12000;

const decodeHtml = (text = '') =>
    text
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');

const parseGoogleRssItems = (xml = '') => {
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 3);
    return items.map((item, index) => {
        const block = item[1];
        const title = block.match(/<title>([\s\S]*?)<\/title>/)?.[1] || 'Untitled trend';
        const link = block.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '';
        const traffic = block.match(/<ht:approx_traffic>([\s\S]*?)<\/ht:approx_traffic>/)?.[1] || '';
        return {
            id: `google-${index}`,
            title: decodeHtml(title.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1').trim()),
            meta: traffic ? `${decodeHtml(traffic)} searches` : 'Google Trends',
            url: link.trim(),
        };
    });
};

export default function TrendsScreen() {
    const { theme } = useTheme();
    const [googleTrends, setGoogleTrends] = useState([]);
    const [redditTrends, setRedditTrends] = useState([]);
    const [hackerNewsTrends, setHackerNewsTrends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sourceErrors, setSourceErrors] = useState({});

    const fetchGoogleTrends = useCallback(async () => {
        let lastError = null;

        for (const url of GOOGLE_TRENDS_URLS) {
            try {
                const response = await fetchWithTimeout(url, {
                    headers: {
                        Accept: 'application/rss+xml, application/xml, text/xml, */*',
                    },
                }, REQUEST_TIMEOUT_MS);
                const xml = await response.text();

                if (!response.ok) {
                    lastError = new Error(`HTTP ${response.status}`);
                    continue;
                }

                const items = parseGoogleRssItems(xml);
                if (items.length > 0) {
                    return items;
                }

                lastError = new Error('Empty RSS response');
            } catch (error) {
                lastError = error;
            }
        }

        throw new Error(lastError?.message || 'Google Trends unavailable');
    }, []);

    const fetchRedditTrends = useCallback(async () => {
        const response = await fetchWithTimeout(REDDIT_URL, {}, REQUEST_TIMEOUT_MS);
        const data = await response.json();
        if (!response.ok) {
            throw new Error('Reddit unavailable');
        }
        const children = data?.data?.children || [];
        return children.slice(0, 3).map((entry) => ({
            id: `reddit-${entry.data.id}`,
            title: decodeHtml(entry.data.title || 'Untitled post'),
            meta: `${entry.data.subreddit_name_prefixed} • ${entry.data.score || 0} upvotes`,
            url: `https://www.reddit.com${entry.data.permalink || ''}`,
        }));
    }, []);

    const fetchHackerNewsTrends = useCallback(async () => {
        const response = await fetchWithTimeout(HN_TOP_URL, {}, REQUEST_TIMEOUT_MS);
        const ids = await response.json();
        if (!response.ok || !Array.isArray(ids)) {
            throw new Error('Hacker News unavailable');
        }
        const topIds = ids.slice(0, 3);
        const items = await Promise.all(
            topIds.map(async (id) => {
                const itemResponse = await fetchWithTimeout(`${HN_ITEM_URL}/${id}.json`, {}, REQUEST_TIMEOUT_MS);
                const item = await itemResponse.json();
                return {
                    id: `hn-${id}`,
                    title: decodeHtml(item?.title || 'Untitled story'),
                    meta: `${item?.score || 0} points • ${item?.descendants || 0} comments`,
                    url: item?.url || `https://news.ycombinator.com/item?id=${id}`,
                };
            })
        );
        return items;
    }, []);

    const loadTrends = useCallback(async () => {
        setLoading(true);
        setSourceErrors({});
        let cached = null;

        try {
            const cachedRaw = await AsyncStorage.getItem(TRENDS_CACHE_KEY);
            if (cachedRaw) {
                cached = JSON.parse(cachedRaw);
                if (Array.isArray(cached.googleTrends)) setGoogleTrends(cached.googleTrends);
                if (Array.isArray(cached.redditTrends)) setRedditTrends(cached.redditTrends);
                if (Array.isArray(cached.hackerNewsTrends)) setHackerNewsTrends(cached.hackerNewsTrends);
            }
        } catch (e) {
            cached = null;
        }

        const results = await Promise.allSettled([
            fetchGoogleTrends(),
            fetchRedditTrends(),
            fetchHackerNewsTrends(),
        ]);

        const nextErrors = {};
        const nextCache = {
            googleTrends: Array.isArray(cached?.googleTrends) ? cached.googleTrends : [],
            redditTrends: Array.isArray(cached?.redditTrends) ? cached.redditTrends : [],
            hackerNewsTrends: Array.isArray(cached?.hackerNewsTrends) ? cached.hackerNewsTrends : [],
            updatedAt: new Date().toISOString(),
        };

        if (results[0].status === 'fulfilled' && results[0].value.length > 0) {
            setGoogleTrends(results[0].value);
            nextCache.googleTrends = results[0].value;
        } else if (nextCache.googleTrends.length > 0) {
            nextErrors.google = 'Google Trends unavailable, showing saved results';
        } else {
            setGoogleTrends([]);
            nextErrors.google = 'Failed to load Google Trends (blocked or unavailable)';
        }

        if (results[1].status === 'fulfilled' && results[1].value.length > 0) {
            setRedditTrends(results[1].value);
            nextCache.redditTrends = results[1].value;
        } else if (nextCache.redditTrends.length > 0) {
            nextErrors.reddit = 'Reddit unavailable, showing saved results';
        } else {
            setRedditTrends([]);
            nextErrors.reddit = 'Failed to load Reddit trends';
        }

        if (results[2].status === 'fulfilled' && results[2].value.length > 0) {
            setHackerNewsTrends(results[2].value);
            nextCache.hackerNewsTrends = results[2].value;
        } else if (nextCache.hackerNewsTrends.length > 0) {
            nextErrors.hn = 'Hacker News unavailable, showing saved results';
        } else {
            setHackerNewsTrends([]);
            nextErrors.hn = 'Failed to load Hacker News trends';
        }

        try {
            await AsyncStorage.setItem(TRENDS_CACHE_KEY, JSON.stringify(nextCache));
        } catch (e) {
            // Ignore cache write failures.
        }

        setSourceErrors(nextErrors);
        setLoading(false);
    }, [fetchGoogleTrends, fetchHackerNewsTrends, fetchRedditTrends]);

    useEffect(() => {
        loadTrends();
    }, [loadTrends]);

    const openUrl = (url) => {
        if (!url) return;
        Linking.openURL(url).catch(() => null);
    };

    const renderTrendRow = (item, rank) => (
        <TouchableOpacity key={item.id} style={[styles.trendItem, { borderBottomColor: theme.border }]} onPress={() => openUrl(item.url)} activeOpacity={0.8}>
            <View style={styles.trendLeft}>
                <View style={[styles.rankBadge, { backgroundColor: theme.primary + '18' }]}>
                    <Text style={[styles.rankText, { color: theme.primary }]}>{rank}</Text>
                </View>
                <View style={styles.trendTextWrap}>
                    <Text style={[styles.trendTopic, { color: theme.text }]} numberOfLines={2}>{item.title}</Text>
                    <Text style={[styles.trendCategory, { color: theme.subText }]} numberOfLines={1}>{item.meta}</Text>
                </View>
            </View>
            <View style={styles.volumeContainer}>
                <Ionicons name="open-outline" size={14} color={theme.subText} />
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
            <View style={styles.headerRow}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Trending Now</Text>
                <TouchableOpacity onPress={loadTrends} style={[styles.refreshButton, { backgroundColor: theme.input }]}>
                    <Ionicons name="refresh" size={16} color={theme.primary} />
                </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
                <View style={[styles.sourceCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.sourceTitle, { color: theme.text }]}>Google Trends</Text>
                    {googleTrends.map((item, index) => renderTrendRow(item, index + 1))}
                    {sourceErrors.google ? <Text style={[styles.errorText, { color: theme.danger }]}>{sourceErrors.google}</Text> : null}
                </View>

                <View style={[styles.sourceCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.sourceTitle, { color: theme.text }]}>Reddit Popular</Text>
                    {redditTrends.map((item, index) => renderTrendRow(item, index + 1))}
                    {sourceErrors.reddit ? <Text style={[styles.errorText, { color: theme.danger }]}>{sourceErrors.reddit}</Text> : null}
                </View>

                <View style={[styles.sourceCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.sourceTitle, { color: theme.text }]}>Hacker News</Text>
                    {hackerNewsTrends.map((item, index) => renderTrendRow(item, index + 1))}
                    {sourceErrors.hn ? <Text style={[styles.errorText, { color: theme.danger }]}>{sourceErrors.hn}</Text> : null}
                </View>
            </ScrollView>
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
    headerRow: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
    },
    listContent: {
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    refreshButton: {
        width: 34,
        height: 34,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sourceCard: {
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 12,
    },
    sourceTitle: {
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 2,
    },
    trendItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    trendLeft: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        flex: 1,
        marginRight: 12,
    },
    trendTextWrap: {
        flex: 1,
    },
    rankBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
        marginTop: 2,
    },
    rankText: {
        fontSize: 11,
        fontWeight: '800',
    },
    trendTopic: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 2,
    },
    trendCategory: {
        fontSize: 11,
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
    },
    errorText: {
        fontSize: 12,
        fontWeight: '600',
        paddingTop: 8,
    },
});
