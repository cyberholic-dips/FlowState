import React from 'react';
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const getDayName = (date) => date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

const getOrdinalNum = (n) => {
    return n + (n > 0 ? ['th', 'st', 'nd', 'rd'][(n > 3 && n < 21) || n % 10 > 3 ? 0 : n % 10] : '');
};

const formatDate = (date) => {
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const day = getOrdinalNum(date.getDate());
    return `${month} ${day}`;
};

export default function TodayHeaderSection({
    styles,
    theme,
    userData,
    today,
    quote,
    loadingQuote,
    quoteError,
    weekDays,
    onOpenSidebar,
    onOpenHabitModal,
    onRetryQuote,
}) {
    const triggerTapFeedback = () => {
        Haptics.selectionAsync().catch(() => null);
    };

    return (
        <>
            <View style={styles.topAnchorContainer}>
                <TouchableOpacity
                    style={[styles.todayAnchor, { backgroundColor: theme.card, shadowColor: theme.shadow }]}
                    onPress={onOpenSidebar}
                    onPressIn={triggerTapFeedback}
                    activeOpacity={0.8}
                >
                    <View style={styles.profileSection}>
                        <View style={[styles.avatar, { borderColor: theme.border, borderWidth: 1 }]}>
                            {userData.profileImage ? (
                                <Image source={userData.profileImage} style={styles.avatarImage} />
                            ) : (
                                <Ionicons name="person" size={20} color={theme.primary} />
                            )}
                        </View>
                        <View>
                            <Text style={[styles.dateLabel, { color: theme.text }]}>Today</Text>
                            <Text style={[styles.dayLabel, { color: theme.subText }]}>{formatDate(today)}</Text>
                        </View>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: theme.primary }]}
                    onPress={onOpenHabitModal}
                    onPressIn={triggerTapFeedback}
                    activeOpacity={0.8}
                >
                    <Ionicons name="add" size={26} color="white" />
                </TouchableOpacity>
            </View>

            <View style={styles.greetingContainer}>
                <Text style={[styles.greeting, { color: theme.text }]}>Hello, {userData.name ? userData.name.split(' ')[0] : 'there'}</Text>
                <Text style={[styles.subGreeting, { color: theme.subText }]}>Here's what's happening today.</Text>
            </View>

            <View style={styles.quoteContainer}>
                <View
                    style={[
                        styles.quoteCard,
                        {
                            backgroundColor: theme.glassBackground,
                            borderColor: theme.glassBorder,
                            borderWidth: 1,
                            shadowColor: theme.shadow,
                        },
                    ]}
                >
                    {loadingQuote ? (
                        <ActivityIndicator color={theme.primary} />
                    ) : quoteError ? (
                        <View style={styles.quoteErrorWrap}>
                            <Text style={[styles.quoteErrorText, { color: theme.subText }]}>{quoteError}</Text>
                            <TouchableOpacity
                                style={[styles.inlineActionButton, { backgroundColor: theme.primary }]}
                                onPress={() => {
                                    triggerTapFeedback();
                                    onRetryQuote();
                                }}
                            >
                                <Text style={styles.inlineActionText}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View>
                            <Text style={[styles.quoteText, { color: theme.text }]}>"{quote?.q}"</Text>
                            <Text style={[styles.quoteAuthor, { color: theme.primary, fontWeight: '700' }]}>— {quote?.a}</Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.calendarStrip}>
                <View
                    style={[
                        styles.weekContainer,
                        {
                            backgroundColor: theme.glassBackground,
                            borderColor: theme.glassBorder,
                            borderWidth: 1,
                            shadowColor: theme.shadow,
                        },
                    ]}
                >
                    {weekDays.map((date, index) => {
                        const isToday = date.toDateString() === today.toDateString();
                        const hasActivity = index <= 3;
                        return (
                            <TouchableOpacity key={index} style={styles.dayItem} activeOpacity={0.7}>
                                <Text
                                    style={[
                                        styles.dayName,
                                        {
                                            color: isToday ? theme.primary : theme.subText,
                                            fontWeight: isToday ? '900' : '600',
                                        },
                                    ]}
                                >
                                    {getDayName(date)}
                                </Text>
                                <View
                                    style={[
                                        styles.dateCircle,
                                        isToday && {
                                            backgroundColor: theme.primary,
                                            shadowColor: theme.primary,
                                            shadowOpacity: 0.4,
                                            shadowRadius: 8,
                                            elevation: 8,
                                        },
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.dot,
                                            { backgroundColor: hasActivity ? (isToday ? 'white' : theme.primary) : 'transparent' },
                                        ]}
                                    />
                                    <Text
                                        style={[
                                            styles.dateNumber,
                                            { color: isToday ? 'white' : theme.text, fontWeight: isToday ? '900' : '600' },
                                        ]}
                                    >
                                        {date.getDate()}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        </>
    );
}
