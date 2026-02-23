import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity, SafeAreaView, Animated } from 'react-native';
import LottieView from 'lottie-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { storage } from '../utils/storage';

const { width, height } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        title: 'Personal Time OS',
        subtitle: 'Reclaim your attention and focus on what truly matters.',
        // We'll use a local fallback animation or a remote URL
        animation: 'https://lottie.host/8111e1ee-b5a8-444a-a035-71be84704871/9yTzX3V9Xo.json',
        color: '#6366F1'
    },
    {
        id: '2',
        title: 'Build Better Habits',
        subtitle: 'Track your daily routines and build consistency over time.',
        animation: 'https://lottie.host/b008d5cd-078e-4f32-8df7-cdb1e7f6075c/s1iXoQvSNo.json',
        color: '#10B981'
    },
    {
        id: '3',
        title: 'Deep Work Sessions',
        subtitle: 'Enter distraction-free zones to do your best work.',
        animation: 'https://lottie.host/8703a8f5-df2b-4e1b-b467-3329f6dd82d6/tNxtT4M0xH.json',
        color: '#F59E0B'
    }
];

export default function OnboardingScreen({ navigation }) {
    const { theme } = useTheme();
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const slidesRef = useRef(null);

    const viewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems && viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const scrollTo = () => {
        if (currentIndex < SLIDES.length - 1) {
            slidesRef.current.scrollToIndex({ index: currentIndex + 1 });
        } else {
            completeOnboarding();
        }
    };

    const completeOnboarding = async () => {
        await storage.saveHasCompletedOnboarding(true);
        // AppNavigator will re-render automatically, or we can force navigate
        navigation.navigate('MainTabs');
    };

    const skipOnboarding = async () => {
        await storage.saveHasCompletedOnboarding(true);
        navigation.navigate('MainTabs');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.skipHeader}>
                {currentIndex < SLIDES.length - 1 && (
                    <TouchableOpacity onPress={skipOnboarding} style={styles.skipButton}>
                        <Text style={[styles.skipText, { color: theme.subText }]}>Skip</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.sliderContainer}>
                <FlatList
                    data={SLIDES}
                    renderItem={({ item }) => (
                        <View style={[styles.slide, { width }]}>
                            <View style={styles.animationContainer}>
                                <LottieView
                                    source={{ uri: item.animation }}
                                    autoPlay
                                    loop
                                    style={styles.animation}
                                />
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
                                <Text style={[styles.subtitle, { color: theme.subText }]}>{item.subtitle}</Text>
                            </View>
                        </View>
                    )}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    pagingEnabled
                    bounces={false}
                    keyExtractor={(item) => item.id}
                    onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                        useNativeDriver: false,
                    })}
                    scrollEventThrottle={32}
                    onViewableItemsChanged={viewableItemsChanged}
                    viewabilityConfig={viewConfig}
                    ref={slidesRef}
                />
            </View>

            <View style={styles.footer}>
                <View style={styles.pagination}>
                    {SLIDES.map((_, i) => {
                        const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
                        const dotWidth = scrollX.interpolate({
                            inputRange,
                            outputRange: [10, 20, 10],
                            extrapolate: 'clamp',
                        });
                        const opacity = scrollX.interpolate({
                            inputRange,
                            outputRange: [0.3, 1, 0.3],
                            extrapolate: 'clamp',
                        });
                        return (
                            <Animated.View
                                style={[
                                    styles.dot,
                                    { width: dotWidth, opacity, backgroundColor: SLIDES[i].color }
                                ]}
                                key={i.toString()}
                            />
                        );
                    })}
                </View>

                <TouchableOpacity
                    style={[
                        styles.button,
                        { backgroundColor: SLIDES[currentIndex].color }
                    ]}
                    onPress={scrollTo}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>
                        {currentIndex === SLIDES.length - 1 ? "Get Started" : "Next"}
                    </Text>
                    <Ionicons
                        name={currentIndex === SLIDES.length - 1 ? "checkmark" : "arrow-forward"}
                        size={20}
                        color="white"
                        style={{ marginLeft: 8 }}
                    />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    skipHeader: {
        height: 60,
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingHorizontal: 24,
    },
    skipButton: {
        padding: 8,
    },
    skipText: {
        fontSize: 16,
        fontWeight: '600',
    },
    sliderContainer: {
        flex: 3,
    },
    slide: {
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    animationContainer: {
        flex: 0.7,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    animation: {
        width: width * 0.8,
        height: width * 0.8,
    },
    textContainer: {
        flex: 0.3,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        marginBottom: 16,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 10,
    },
    footer: {
        flex: 1,
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 40,
        paddingTop: 20,
    },
    pagination: {
        flexDirection: 'row',
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {
        height: 10,
        borderRadius: 5,
        marginHorizontal: 8,
    },
    button: {
        flexDirection: 'row',
        paddingVertical: 18,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '800',
    }
});
