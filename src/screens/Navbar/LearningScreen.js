import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const FREE_DICTIONARY_API = 'https://api.dictionaryapi.dev/api/v2/entries/en';
const RANDOM_WORD_API = 'https://random-word-api.herokuapp.com/word';

export default function LearningScreen() {
    const { theme, isDark } = useTheme();
    const [wordData, setWordData] = useState(null);
    const [newsItems, setNewsItems] = useState({ general: null, market: null, crypto: null });
    const [loading, setLoading] = useState(true);
    const [loadingNews, setLoadingNews] = useState(true);
    const [error, setError] = useState(null);

    const fetchWordData = async (retryCount = 0) => {
        if (retryCount === 0) setLoading(true);
        setError(null);

        try {
            // 1. Get a random word
            const wordResponse = await fetch(RANDOM_WORD_API);
            const words = await wordResponse.json();
            const word = words[0];

            // 2. Get definition and examples
            const dictResponse = await fetch(`${FREE_DICTIONARY_API}/${word}`);
            const data = await dictResponse.json();

            if (data && data[0]) {
                setWordData(data[0]);
            } else if (retryCount < 3) {
                // Some random words might not be in the dictionary, try again
                fetchWordData(retryCount + 1);
            } else {
                setError('Could not find definition for random words.');
            }
        } catch (err) {
            setError('Failed to fetch learning data. Check your connection.');
        } finally {
            if (retryCount === 0 || wordData || error) setLoading(false);
        }
    };

    const fetchQuickNews = async () => {
        setLoadingNews(true);
        const news = { general: null, market: null, crypto: null };

        try {
            // 1. General News (Kathmandu Post RSS)
            const newsResponse = await fetch("https://kathmandupost.com/rss");
            const newsXml = await newsResponse.text();
            const newsMatch = newsXml.match(/<item>([\s\S]*?)<\/item>/);
            if (newsMatch) {
                const title = newsMatch[1].match(/<title>([\s\S]*?)<\/title>/);
                const link = newsMatch[1].match(/<link>([\s\S]*?)<\/link>/);
                if (title && link) news.general = { title: title[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1').trim(), link: link[1] };
            }

            // 2. Market News (Sharesansar HTML)
            const marketResponse = await fetch("https://www.sharesansar.com/category/latest");
            const marketHtml = await marketResponse.text();
            const marketPart = marketHtml.split('class="featured-news-list');
            if (marketPart.length > 1) {
                const title = marketPart[1].match(/<h4 class="featured-news-title">([^<]+)<\/h4>/);
                const link = marketPart[1].match(/href="([^"]+)"/);
                if (title && link) news.market = { title: title[1].trim(), link: link[1] };
            }

            // 3. Crypto News (CoinDesk RSS)
            const cryptoResponse = await fetch("https://www.coindesk.com/arc/outboundfeeds/rss");
            const cryptoXml = await cryptoResponse.text();
            const cryptoMatch = cryptoXml.match(/<item>([\s\S]*?)<\/item>/);
            if (cryptoMatch) {
                const title = cryptoMatch[1].match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || cryptoMatch[1].match(/<title>([\s\S]*?)<\/title>/);
                const link = cryptoMatch[1].match(/<link>([\s\S]*?)<\/link>/);
                if (title && link) news.crypto = { title: title[1].trim(), link: link[1] };
            }

            setNewsItems(news);
        } catch (err) {
            console.error("Failed to fetch quick news", err);
        } finally {
            setLoadingNews(false);
        }
    };

    useEffect(() => {
        fetchWordData();
        fetchQuickNews();
    }, []);

    // Helper to find a definition and example
    const getBestDefinition = () => {
        if (!wordData) return null;
        for (const meaning of wordData.meanings) {
            for (const def of meaning.definitions) {
                if (def.definition) {
                    return {
                        partOfSpeech: meaning.partOfSpeech,
                        definition: def.definition,
                        example: def.example
                    };
                }
            }
        }
        return null;
    };

    const bestDef = getBestDefinition();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.text }]}>Learning</Text>
                    <Text style={[styles.subtitle, { color: theme.subText }]}>Expand your knowledge</Text>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Random Learnings</Text>
                </View>

                {loading ? (
                    <View style={[styles.card, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder, borderWidth: 1, shadowColor: theme.shadow }]}>
                        <ActivityIndicator size="large" color={theme.primary} />
                        <Text style={[styles.loadingText, { color: theme.subText }]}>Fetching a curious word...</Text>
                    </View>
                ) : error ? (
                    <TouchableOpacity
                        style={[styles.card, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder, borderWidth: 1, shadowColor: theme.shadow }]}
                        onPress={() => fetchWordData()}
                    >
                        <Ionicons name="alert-circle-outline" size={32} color={theme.subText} />
                        <Text style={[styles.errorText, { color: theme.subText }]}>{error}</Text>
                        <Text style={{ color: theme.primary, fontWeight: '900', marginTop: 8 }}>Tap to Retry</Text>
                    </TouchableOpacity>
                ) : wordData ? (
                    <View style={[styles.card, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder, borderWidth: 1, shadowColor: theme.shadow }]}>
                        <View style={styles.wordHeader}>
                            <Text style={[styles.word, { color: theme.text }]}>{wordData.word}</Text>
                            {bestDef && (
                                <View style={[styles.partOfSpeechBadge, { backgroundColor: theme.primary + '15' }]}>
                                    <Text style={[styles.partOfSpeech, { color: theme.primary }]}>
                                        {bestDef.partOfSpeech}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {wordData.phonetic && (
                            <Text style={[styles.phonetic, { color: theme.primary, opacity: 0.9, fontWeight: '700' }]}>{wordData.phonetic}</Text>
                        )}

                        <Text style={[styles.definition, { color: theme.text }]}>
                            {bestDef?.definition || 'No definition available.'}
                        </Text>

                        {bestDef?.example && (
                            <View style={[styles.noteContainer, { backgroundColor: theme.primary + '08' }]}>
                                <Text style={[styles.noteLabel, { color: theme.primary, opacity: 0.8, fontWeight: '900' }]}>Example Usage:</Text>
                                <Text style={[styles.noteText, { color: theme.text }]}>"{bestDef.example}"</Text>
                            </View>
                        )}

                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={[styles.learnMoreButton, { backgroundColor: theme.primary }]}
                                onPress={() => Linking.openURL(`https://www.google.com/search?q=define+${wordData.word}`)}
                            >
                                <Text style={styles.learnMoreText}>Search Deeply</Text>
                                <Ionicons name="search-outline" size={20} color="white" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.refreshButton, { borderColor: theme.glassBorder, borderWidth: 1, backgroundColor: theme.glassBackground }]}
                                onPress={() => fetchWordData()}
                            >
                                <Ionicons name="refresh" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : null}

                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24 }]}>Quick News Highlights</Text>
                </View>

                {loadingNews ? (
                    <View style={[styles.card, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder, borderWidth: 1, shadowColor: theme.shadow }]}>
                        <ActivityIndicator color={theme.primary} />
                    </View>
                ) : (
                    <View style={[styles.card, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder, borderWidth: 1, shadowColor: theme.shadow, padding: 20 }]}>
                        {/* General News Item */}
                        {newsItems.general && (
                            <TouchableOpacity
                                style={styles.newsStrip}
                                onPress={() => Linking.openURL(newsItems.general.link)}
                            >
                                <View style={[styles.newsCategoryBadge, { backgroundColor: '#3B82F615' }]}>
                                    <Ionicons name="newspaper-outline" size={16} color="#3B82F6" />
                                    <Text style={[styles.newsCategoryText, { color: '#3B82F6' }]}>GENERAL</Text>
                                </View>
                                <Text style={[styles.newsHeadline, { color: theme.text }]} numberOfLines={2}>
                                    {newsItems.general.title}
                                </Text>
                            </TouchableOpacity>
                        )}

                        <View style={[styles.newsDivider, { backgroundColor: theme.border }]} />

                        {/* Market News Item */}
                        {newsItems.market && (
                            <TouchableOpacity
                                style={styles.newsStrip}
                                onPress={() => Linking.openURL(newsItems.market.link)}
                            >
                                <View style={[styles.newsCategoryBadge, { backgroundColor: '#10B98115' }]}>
                                    <Ionicons name="trending-up-outline" size={16} color="#10B981" />
                                    <Text style={[styles.newsCategoryText, { color: '#10B981' }]}>MARKET</Text>
                                </View>
                                <Text style={[styles.newsHeadline, { color: theme.text }]} numberOfLines={2}>
                                    {newsItems.market.title}
                                </Text>
                            </TouchableOpacity>
                        )}

                        <View style={[styles.newsDivider, { backgroundColor: theme.border }]} />

                        {/* Crypto News Item */}
                        {newsItems.crypto && (
                            <TouchableOpacity
                                style={styles.newsStrip}
                                onPress={() => Linking.openURL(newsItems.crypto.link)}
                            >
                                <View style={[styles.newsCategoryBadge, { backgroundColor: '#F59E0B15' }]}>
                                    <Ionicons name="logo-bitcoin" size={16} color="#F59E0B" />
                                    <Text style={[styles.newsCategoryText, { color: '#F59E0B' }]}>CRYPTO</Text>
                                </View>
                                <Text style={[styles.newsHeadline, { color: theme.text }]} numberOfLines={2}>
                                    {newsItems.crypto.title}
                                </Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={styles.viewMoreNews}
                            onPress={() => fetchQuickNews()}
                        >
                            <Text style={[styles.viewMoreNewsText, { color: theme.primary }]}>Refresh Headlines</Text>
                            <Ionicons name="refresh-outline" size={16} color={theme.primary} />
                        </TouchableOpacity>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
    },
    header: {
        paddingTop: 24,
        paddingBottom: 24,
    },
    title: {
        fontSize: 34,
        fontWeight: '900',
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 16,
        marginTop: 4,
        opacity: 0.8,
    },
    sectionHeader: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '800',
    },
    card: {
        borderRadius: 30,
        padding: 24,
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.12,
        shadowRadius: 25,
        elevation: 5,
    },
    wordHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        flexWrap: 'wrap',
    },
    word: {
        fontSize: 32,
        fontWeight: '800',
        textTransform: 'capitalize',
        marginRight: 12,
    },
    phonetic: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
        opacity: 0.8,
    },
    partOfSpeechBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    partOfSpeech: {
        fontSize: 14,
        fontWeight: '700',
        fontStyle: 'italic',
    },
    definition: {
        fontSize: 18,
        lineHeight: 26,
        marginBottom: 20,
    },
    noteContainer: {
        width: '100%',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
    },
    noteLabel: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    noteText: {
        fontSize: 15,
        lineHeight: 22,
        fontStyle: 'italic',
    },
    buttonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    learnMoreButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 16,
        gap: 8,
    },
    refreshButton: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    learnMoreText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '600',
    },
    errorText: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 12,
    },
    newsStrip: {
        paddingVertical: 12,
    },
    newsCategoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginBottom: 8,
        gap: 6,
    },
    newsCategoryText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    newsHeadline: {
        fontSize: 15,
        fontWeight: '600',
        lineHeight: 22,
    },
    newsDivider: {
        height: 1,
        width: '100%',
        marginVertical: 4,
        opacity: 0.1,
    },
    viewMoreNews: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        gap: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    viewMoreNewsText: {
        fontSize: 14,
        fontWeight: '800',
    }
});
