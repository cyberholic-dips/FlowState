import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    Animated,
    TextInput,
    Platform,
    KeyboardAvoidingView,
    Keyboard,
    ActivityIndicator,
} from 'react-native';
import LottieView from '../components/LottieCompat';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { storage } from '../utils/storage';

const { width } = Dimensions.get('window');
const LIFE_SETTINGS_KEY = 'lifeIndex';
const DEFAULT_LIFE_EXPECTANCY = 75;

const SLIDES = [
    {
        id: '1',
        title: 'Personal Time OS',
        subtitle: 'Reclaim your attention and focus on what truly matters.',
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

const formatBirthDate = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function OnboardingScreen({ navigation }) {
    const { theme } = useTheme();
    const { reloadUser } = useUser();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [nameInput, setNameInput] = useState('');
    const [birthDate, setBirthDate] = useState(new Date(2000, 0, 1));
    const [showBirthPicker, setShowBirthPicker] = useState(false);
    const [nameError, setNameError] = useState('');
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const scrollX = useRef(new Animated.Value(0)).current;
    const slidesRef = useRef(null);

    const viewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems && viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;
    const isLastSlideActive = currentIndex === SLIDES.length - 1;
    const shouldCompactForKeyboard = isLastSlideActive && isKeyboardVisible;

    React.useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
        const showSub = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
        const hideSub = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const completeOnboarding = async () => {
        const cleanedName = nameInput.trim();
        if (!cleanedName) {
            setNameError('Please enter your name.');
            return;
        }
        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        try {
            const normalizedBirthDate = new Date(birthDate).toISOString();

            await storage.updateSettings((settings = {}) => {
                const existingUser = settings.user || {};
                const existingLife = settings[LIFE_SETTINGS_KEY] || {};
                return {
                    ...settings,
                    user: {
                        ...existingUser,
                        name: cleanedName,
                        avatarId: existingUser.avatarId || 1,
                        birthDate: normalizedBirthDate,
                    },
                    [LIFE_SETTINGS_KEY]: {
                        ...existingLife,
                        birthDate: normalizedBirthDate,
                        lifeExpectancy: typeof existingLife.lifeExpectancy === 'number' ? existingLife.lifeExpectancy : DEFAULT_LIFE_EXPECTANCY,
                        events: Array.isArray(existingLife.events) ? existingLife.events : [],
                    },
                };
            });

            await storage.saveHasCompletedOnboarding(true);
            await reloadUser();
            navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
            });
        } catch (error) {
            setNameError('Could not complete setup. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const scrollTo = () => {
        if (currentIndex < SLIDES.length - 1) {
            slidesRef.current.scrollToIndex({ index: currentIndex + 1 });
        } else {
            completeOnboarding();
        }
    };

    const skipOnboarding = () => {
        slidesRef.current?.scrollToIndex({ index: SLIDES.length - 1 });
    };

    const renderSlide = ({ item }) => {
        const isLastSlide = item.id === SLIDES[SLIDES.length - 1].id;
        const hideAnimation = isLastSlide && isKeyboardVisible;
        return (
            <View style={[styles.slide, { width }]}> 
                {!hideAnimation ? (
                    <View style={[styles.animationContainer, isLastSlide && styles.animationContainerCompact]}>
                        <LottieView
                            source={{ uri: item.animation }}
                            autoPlay
                            loop
                            style={[styles.animation, isLastSlide && styles.animationCompact]}
                        />
                    </View>
                ) : null}
                <View style={[styles.textContainer, isLastSlide && styles.textContainerExpanded, hideAnimation && styles.textContainerKeyboard]}>
                    <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
                    <Text style={[styles.subtitle, { color: theme.subText }]}>{item.subtitle}</Text>

                    {isLastSlide ? (
                        <View style={[styles.setupCard, { backgroundColor: theme.card, borderColor: theme.border }]}> 
                            <Text style={[styles.setupTitle, { color: theme.text }]}>Quick setup</Text>

                            <TextInput
                                value={nameInput}
                                onChangeText={(value) => {
                                    setNameInput(value);
                                    if (nameError) {setNameError('');}
                                }}
                                placeholder="Your name"
                                placeholderTextColor={theme.subText}
                                style={[styles.input, { color: theme.text, backgroundColor: theme.input, borderColor: theme.border }]}
                                autoCapitalize="words"
                                returnKeyType="done"
                            />
                            {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

                            <TouchableOpacity
                                onPress={() => setShowBirthPicker((prev) => !prev)}
                                style={[styles.dateButton, { backgroundColor: theme.input, borderColor: theme.border }]}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="calendar-outline" size={18} color={theme.subText} />
                                <Text style={[styles.dateText, { color: theme.text }]}>{formatBirthDate(birthDate)}</Text>
                                <Ionicons name={showBirthPicker ? 'chevron-up' : 'chevron-down'} size={16} color={theme.subText} />
                            </TouchableOpacity>

                            {showBirthPicker ? (
                                <View style={styles.datePickerWrap}>
                                    <DateTimePicker
                                        value={birthDate}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        maximumDate={new Date()}
                                        onChange={(event, selectedDate) => {
                                            if (selectedDate) {
                                                setBirthDate(selectedDate);
                                            }
                                            if (Platform.OS === 'android' || event?.type === 'dismissed') {
                                                setShowBirthPicker(false);
                                            }
                                        }}
                                    />
                                    {Platform.OS === 'ios' ? (
                                        <TouchableOpacity
                                            style={[styles.closePickerButton, { backgroundColor: theme.input, borderColor: theme.border }]}
                                            onPress={() => setShowBirthPicker(false)}
                                        >
                                            <Text style={[styles.closePickerText, { color: theme.text }]}>Done</Text>
                                        </TouchableOpacity>
                                    ) : null}
                                </View>
                            ) : null}
                        </View>
                    ) : null}
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: theme.background }]}
        >
            <SafeAreaView style={styles.container}>
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
                        renderItem={renderSlide}
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
                        keyboardShouldPersistTaps="handled"
                        ref={slidesRef}
                    />
                </View>

                <View style={[styles.footer, shouldCompactForKeyboard && styles.footerKeyboard]}>
                    {!shouldCompactForKeyboard ? (
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
                    ) : null}

                    <TouchableOpacity
                        style={[
                            styles.button,
                            { backgroundColor: SLIDES[currentIndex].color },
                            isSubmitting && styles.buttonDisabled,
                        ]}
                        onPress={scrollTo}
                        activeOpacity={0.8}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <ActivityIndicator size="small" color="#FFFFFF" />
                                <Text style={[styles.buttonText, styles.buttonTextOffset]}>Saving...</Text>
                            </>
                        ) : (
                            <>
                                <Text style={styles.buttonText}>
                                    {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
                                </Text>
                                <Ionicons
                                    name={currentIndex === SLIDES.length - 1 ? 'checkmark' : 'arrow-forward'}
                                    size={20}
                                    color="white"
                                    style={{ marginLeft: 8 }}
                                />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </KeyboardAvoidingView>
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
        paddingHorizontal: 28,
    },
    animationContainer: {
        flex: 0.6,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    animation: {
        width: width * 0.65,
        height: width * 0.65,
    },
    animationContainerCompact: {
        flex: 0.44,
    },
    animationCompact: {
        width: width * 0.46,
        height: width * 0.46,
    },
    textContainer: {
        flex: 0.4,
        alignItems: 'center',
        width: '100%',
    },
    textContainerExpanded: {
        flex: 0.56,
    },
    textContainerKeyboard: {
        flex: 1,
        justifyContent: 'flex-start',
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        marginBottom: 10,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 10,
        marginBottom: 12,
    },
    setupCard: {
        width: '100%',
        borderRadius: 16,
        borderWidth: 1,
        padding: 14,
    },
    setupTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 10,
    },
    input: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
    },
    errorText: {
        color: '#DC2626',
        fontSize: 12,
        marginTop: 6,
        marginBottom: 6,
    },
    dateButton: {
        marginTop: 10,
        borderRadius: 10,
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dateText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
    },
    datePickerWrap: {
        marginTop: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closePickerButton: {
        marginTop: 8,
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    closePickerText: {
        fontSize: 14,
        fontWeight: '700',
    },
    footer: {
        flex: 1,
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 40,
        paddingTop: 20,
    },
    footerKeyboard: {
        flex: 0.35,
        paddingTop: 8,
        paddingBottom: 14,
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
    },
    buttonTextOffset: {
        marginLeft: 8,
    },
    buttonDisabled: {
        opacity: 0.8,
    },
});
