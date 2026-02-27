import React, { useEffect, useMemo, useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { storage } from '../../utils/storage';

const LIFE_SETTINGS_KEY = 'lifeIndex';

const EVENT_OPTIONS = [
    { key: 'star', icon: 'star', color: '#34D1BF' },
    { key: 'cash', icon: 'cash', color: '#55D22E' },
    { key: 'water', icon: 'water', color: '#19B6E5' },
    { key: 'barbell', icon: 'barbell', color: '#6A6D7E' },
    { key: 'diamond', icon: 'diamond', color: '#A855F7' },
    { key: 'wallet', icon: 'wallet', color: '#34D1BF' },
    { key: 'gift', icon: 'gift', color: '#F6C045' },
    { key: 'book', icon: 'book', color: '#5B6FE5' },
    { key: 'calendar', icon: 'calendar', color: '#FF7A3D' },
    { key: 'home', icon: 'home', color: '#34D1BF' },
    { key: 'film', icon: 'film', color: '#55D22E' },
    { key: 'medkit', icon: 'medkit', color: '#F26B6B' },
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const formatDate = (dateLike) => {
    const d = new Date(dateLike);
    return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
};

const daysSince = (dateLike) => {
    const now = new Date();
    const d = new Date(dateLike);
    return Math.max(0, Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)));
};

const yearsSince = (start, end = new Date()) => {
    const ms = new Date(end).getTime() - new Date(start).getTime();
    return ms / (1000 * 60 * 60 * 24 * 365.2425);
};

const getIconConfig = (iconKey) => EVENT_OPTIONS.find((item) => item.key === iconKey) || EVENT_OPTIONS[0];
const degToRad = (deg) => (deg * Math.PI) / 180;

export default function ExploreScreen() {
    const { width, height } = useWindowDimensions();

    const [isReady, setIsReady] = useState(false);
    const [birthDate, setBirthDate] = useState(new Date(1999, 5, 26));
    const [lifeExpectancy, setLifeExpectancy] = useState(75);
    const [events, setEvents] = useState([]);

    const [isBirthPickerVisible, setIsBirthPickerVisible] = useState(false);
    const [isAddEventVisible, setIsAddEventVisible] = useState(false);
    const [isDraftDatePickerVisible, setIsDraftDatePickerVisible] = useState(false);
    const [editingEventId, setEditingEventId] = useState(null);
    const [selectedEventId, setSelectedEventId] = useState(null);

    const [draftTitle, setDraftTitle] = useState('');
    const [draftDate, setDraftDate] = useState(new Date());
    const [draftIconKey, setDraftIconKey] = useState(EVENT_OPTIONS[0].key);

    const isWide = width >= 920;
    const boardSize = clamp(
        Math.min(width - 28, height * 0.56),
        280,
        isWide ? 560 : 440
    );
    const boardCenter = boardSize / 2;
    const ringRadius = boardSize * 0.36;
    const labelRadius = ringRadius + boardSize * 0.085;
    const handRadius = ringRadius * 1.06;
    const eventRadius = ringRadius * 0.96;

    useEffect(() => {
        const load = async () => {
            const settings = await storage.getSettings();
            const saved = settings?.[LIFE_SETTINGS_KEY];

            if (saved) {
                if (saved.birthDate) setBirthDate(new Date(saved.birthDate));
                if (saved.lifeExpectancy) setLifeExpectancy(saved.lifeExpectancy);
                if (Array.isArray(saved.events)) setEvents(saved.events);
            }

            setIsReady(true);
        };

        load();
    }, []);

    useEffect(() => {
        if (!isReady) return;

        const persist = async () => {
            const settings = (await storage.getSettings()) || {};
            await storage.saveSettings({
                ...settings,
                [LIFE_SETTINGS_KEY]: {
                    birthDate: birthDate.toISOString(),
                    lifeExpectancy,
                    events,
                },
            });
        };

        persist();
    }, [isReady, birthDate, lifeExpectancy, events]);

    const currentAge = useMemo(() => clamp(yearsSince(birthDate), 0, 130), [birthDate]);
    const lifeProgress = useMemo(() => clamp((currentAge / lifeExpectancy) * 100, 0, 100), [currentAge, lifeExpectancy]);

    const birthDays = useMemo(() => daysSince(birthDate), [birthDate]);

    const originEvent = useMemo(() => ({
        id: 'origin',
        title: 'Come to world',
        date: birthDate.toISOString(),
        iconKey: 'gift',
        color: '#E7CB83',
        ageAtEvent: 0,
        daysLabel: `${birthDays} ds`,
    }), [birthDate, birthDays]);

    const timelineEvents = useMemo(() => {
        const dynamicEvents = [...events]
            .map((event) => ({ ...event, ageAtEvent: yearsSince(birthDate, event.date) }))
            .filter((event) => event.ageAtEvent >= 0)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        return [originEvent, ...dynamicEvents];
    }, [events, birthDate, originEvent]);

    const cardEvents = useMemo(() => {
        return [originEvent, ...events].sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [events, originEvent]);

    const ageToAngle = (ageValue) => -90 + (clamp(ageValue / lifeExpectancy, 0, 1) * 360);
    const getPointAtAge = (ageValue, radius = ringRadius) => {
        const angle = degToRad(ageToAngle(ageValue));
        return {
            x: boardCenter + Math.cos(angle) * radius,
            y: boardCenter + Math.sin(angle) * radius,
        };
    };

    const handTipPoint = getPointAtAge(currentAge, handRadius);
    const handLength = Math.hypot(handTipPoint.x - boardCenter, handTipPoint.y - boardCenter);
    const handMidX = (handTipPoint.x + boardCenter) / 2;
    const handMidY = (handTipPoint.y + boardCenter) / 2;

    const ringLabels = useMemo(() => {
        const step = 5;
        const values = [];
        for (let ageValue = 0; ageValue < lifeExpectancy; ageValue += step) values.push(ageValue);
        return values.map((ageValue) => ({
            key: `label-${ageValue}`,
            ageValue,
            point: getPointAtAge(ageValue, labelRadius),
        }));
    }, [lifeExpectancy, labelRadius]);

    const eventDots = useMemo(() => {
        return timelineEvents
            .filter((event) => event.id !== 'origin')
            .map((event) => ({ ...event, point: getPointAtAge(event.ageAtEvent, eventRadius) }));
    }, [timelineEvents, eventRadius, lifeExpectancy]);

    const highlightedEvent = useMemo(() => {
        if (selectedEventId) {
            return timelineEvents.find((event) => event.id === selectedEventId) || null;
        }
        return eventDots.length ? eventDots[eventDots.length - 1] : null;
    }, [selectedEventId, timelineEvents, eventDots]);

    const openAddModal = () => {
        setDraftTitle('');
        setDraftDate(new Date());
        setDraftIconKey(EVENT_OPTIONS[0].key);
        setEditingEventId(null);
        setSelectedEventId(null);
        setIsDraftDatePickerVisible(false);
        setIsAddEventVisible(true);
    };

    const openEditModal = (event) => {
        if (!event || event.id === 'origin') return;
        setDraftTitle(event.title || '');
        setDraftDate(new Date(event.date));
        setDraftIconKey(event.iconKey || EVENT_OPTIONS[0].key);
        setEditingEventId(event.id);
        setSelectedEventId(event.id);
        setIsDraftDatePickerVisible(false);
        setIsAddEventVisible(true);
    };

    const deleteEvent = (eventId) => {
        if (!eventId || eventId === 'origin') return;
        setEvents((prev) => prev.filter((event) => event.id !== eventId));
        setSelectedEventId(null);
    };

    const saveEvent = () => {
        const title = draftTitle.trim();
        if (!title) return;

        const iconCfg = getIconConfig(draftIconKey);
        const eventPayload = {
            title,
            date: draftDate.toISOString(),
            iconKey: draftIconKey,
            color: iconCfg.color,
        };

        if (editingEventId) {
            setEvents((prev) =>
                prev.map((event) => (event.id === editingEventId ? { ...event, ...eventPayload } : event))
            );
        } else {
            setEvents((prev) => [{ id: `${Date.now()}`, ...eventPayload }, ...prev]);
        }
        setSelectedEventId(null);
        setIsAddEventVisible(false);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, isWide && styles.contentWide]}>
                <View style={styles.headerRow}>
                    <Text style={styles.lifeTitle}>LIFE</Text>
                </View>

                <View style={[styles.controlsWrap, isWide && styles.controlsWrapWide]}>
                    <TouchableOpacity style={styles.controlCard} onPress={() => setIsBirthPickerVisible((prev) => !prev)}>
                        <Text style={styles.controlLabel}>Birth Date</Text>
                        <Text style={styles.controlValue}>{formatDate(birthDate)}</Text>
                    </TouchableOpacity>

                    <View style={styles.controlCard}>
                        <Text style={styles.controlLabel}>Life Expectancy</Text>
                        <View style={styles.lifeExpectancyRow}>
                            <TouchableOpacity style={styles.stepBtn} onPress={() => setLifeExpectancy((v) => clamp(v - 1, 30, 120))}>
                                <Ionicons name="remove" size={16} color="#3B3B3B" />
                            </TouchableOpacity>
                            <Text style={styles.lifeExpectancyText}>{lifeExpectancy} yrs</Text>
                            <TouchableOpacity style={styles.stepBtn} onPress={() => setLifeExpectancy((v) => clamp(v + 1, 30, 120))}>
                                <Ionicons name="add" size={16} color="#3B3B3B" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {isBirthPickerVisible && (
                    <View style={styles.birthPickerCard}>
                        <DateTimePicker
                            value={birthDate}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={(e, value) => {
                                if (value) setBirthDate(value);
                                setIsBirthPickerVisible(false);
                            }}
                            maximumDate={new Date()}
                        />
                    </View>
                )}

                <View style={[styles.lifeBoard, { width: boardSize, height: boardSize }]}>
                    {ringLabels.map((item) => {
                        const passed = item.ageValue <= currentAge;
                        return (
                            <Text
                                key={item.key}
                                style={[
                                    styles.ringLabel,
                                    {
                                        left: item.point.x - 18,
                                        top: item.point.y - 12,
                                        color: passed ? '#2E2F33' : '#C2C4C8',
                                    },
                                ]}
                            >
                                {item.ageValue}
                            </Text>
                        );
                    })}

                    <Text style={styles.passText}>This life has passed</Text>
                    <Text style={styles.progressText}>{Math.round(lifeProgress)}%</Text>

                    <View
                        style={[
                            styles.hand,
                            {
                                width: handLength,
                                left: handMidX - handLength / 2,
                                top: handMidY - 1,
                                transform: [{ rotate: `${ageToAngle(currentAge)}deg` }],
                            },
                        ]}
                    />

                    <View
                        style={[
                            styles.handArrow,
                            {
                                left: handTipPoint.x - 4,
                                top: handTipPoint.y - 6,
                                transform: [{ rotate: `${ageToAngle(currentAge) + 90}deg` }],
                            },
                        ]}
                    />

                    <View style={[styles.centerDot, { left: boardCenter - 7, top: boardCenter - 7 }]} />
                    <View style={[styles.progressDot, { left: handTipPoint.x - 4, top: handTipPoint.y - 4 }]} />

                    {eventDots.map((event) => (
                        <View
                            key={`dot-${event.id}`}
                            style={[styles.eventPin, { left: event.point.x - 5, top: event.point.y - 5, backgroundColor: event.color }]}
                        />
                    ))}

                    {highlightedEvent && (() => {
                        const bubblePoint = getPointAtAge(highlightedEvent.ageAtEvent, ringRadius * 1.02);
                        return (
                            <View
                                style={[
                                    styles.eventBubble,
                                    {
                                        backgroundColor: highlightedEvent.color,
                                        left: clamp(bubblePoint.x - 72, 10, boardSize - 160),
                                        top: clamp(bubblePoint.y - 44, 10, boardSize - 72),
                                    },
                                ]}
                            >
                                <Text style={styles.eventBubbleText} numberOfLines={1}>{highlightedEvent.title}</Text>
                            </View>
                        );
                    })()}
                </View>

                <View style={styles.cardsGrid}>
                    {cardEvents.map((event) => {
                        const iconCfg = getIconConfig(event.iconKey);
                        const canEdit = event.id !== 'origin';
                        const isSelected = selectedEventId === event.id;
                        return (
                            <TouchableOpacity
                                key={event.id}
                                activeOpacity={0.9}
                                onPress={() => setSelectedEventId((prev) => (prev === event.id ? null : event.id))}
                                style={[styles.eventCard, { backgroundColor: event.color }]}
                            >
                                <View style={styles.daysBadge}>
                                    <Text style={[styles.daysBadgeText, { color: event.color }]}>{event.id === 'origin' ? birthDays : daysSince(event.date)} ds</Text>
                                </View>
                                {canEdit && isSelected && (
                                    <View style={styles.cardActions}>
                                        <TouchableOpacity style={styles.cardActionBtn} onPress={() => openEditModal(event)}>
                                            <Ionicons name="pencil" size={12} color="#4C4F57" />
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.cardActionBtn} onPress={() => deleteEvent(event.id)}>
                                            <Ionicons name="trash-outline" size={12} color="#4C4F57" />
                                        </TouchableOpacity>
                                    </View>
                                )}
                                <Ionicons name={iconCfg.icon} size={30} color="white" style={{ marginBottom: 10 }} />
                                <Text style={styles.cardTitle} numberOfLines={1}>{event.title}</Text>
                                <Text style={styles.cardDate}>{formatDate(event.date)}</Text>
                            </TouchableOpacity>
                        );
                    })}

                    <TouchableOpacity style={styles.addCard} onPress={openAddModal}>
                        <Ionicons name="add" size={52} color="#BFBFBF" />
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <Modal visible={isAddEventVisible} transparent animationType="fade" onRequestClose={() => setIsAddEventVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalTopRow}>
                            <TextInput
                                style={styles.titleInput}
                                placeholder="Enter The Title"
                                placeholderTextColor="#B6B8BC"
                                value={draftTitle}
                                onChangeText={setDraftTitle}
                                autoFocus
                            />
                            <TouchableOpacity style={styles.saveFab} onPress={saveEvent}>
                                <Ionicons name="checkmark" size={28} color="white" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.dateWheelWrap}>
                            <TouchableOpacity style={styles.dateSelector} onPress={() => setIsDraftDatePickerVisible((prev) => !prev)}>
                                <Ionicons name="calendar-outline" size={20} color="#6C7178" />
                                <Text style={styles.dateSelectorText}>{formatDate(draftDate)}</Text>
                                <Ionicons name={isDraftDatePickerVisible ? 'chevron-up' : 'chevron-down'} size={18} color="#6C7178" />
                            </TouchableOpacity>

                            {isDraftDatePickerVisible && (
                                <DateTimePicker
                                    value={draftDate}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(e, value) => {
                                        if (value) setDraftDate(value);
                                        setIsDraftDatePickerVisible(false);
                                    }}
                                    maximumDate={new Date()}
                                />
                            )}
                        </View>

                        <View style={styles.iconGrid}>
                            {EVENT_OPTIONS.map((item) => {
                                const selected = draftIconKey === item.key;
                                return (
                                    <TouchableOpacity
                                        key={item.key}
                                        style={[styles.iconChoice, { backgroundColor: item.color }]}
                                        onPress={() => setDraftIconKey(item.key)}
                                    >
                                        <Ionicons name={item.icon} size={30} color="white" />
                                        {selected && (
                                            <View style={styles.selectedMark}>
                                                <Ionicons name="checkmark-circle" size={22} color="#3F3F51" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ECECEC',
    },
    content: {
        paddingHorizontal: 12,
        paddingBottom: 30,
    },
    contentWide: {
        maxWidth: 980,
        width: '100%',
        alignSelf: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 10,
        paddingHorizontal: 8,
    },
    lifeTitle: {
        fontSize: 64,
        lineHeight: 72,
        fontWeight: '800',
        letterSpacing: 2,
        color: '#2E2E2E',
    },
    controlsWrap: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 10,
    },
    controlsWrapWide: {
        gap: 14,
    },
    controlCard: {
        flex: 1,
        backgroundColor: '#F3F3F3',
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    controlLabel: {
        fontSize: 12,
        color: '#8B8B8B',
        fontWeight: '700',
        marginBottom: 4,
    },
    controlValue: {
        fontSize: 17,
        color: '#2F2F2F',
        fontWeight: '700',
    },
    lifeExpectancyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    stepBtn: {
        width: 28,
        height: 28,
        borderRadius: 9,
        backgroundColor: '#E4E4E4',
        justifyContent: 'center',
        alignItems: 'center',
    },
    lifeExpectancyText: {
        fontSize: 17,
        color: '#2F2F2F',
        fontWeight: '700',
    },
    birthPickerCard: {
        backgroundColor: '#F3F3F3',
        borderRadius: 14,
        marginBottom: 12,
        paddingVertical: 4,
    },
    lifeBoard: {
        alignSelf: 'center',
        marginBottom: 16,
        borderRadius: 34,
        backgroundColor: '#EFEFF0',
        overflow: 'hidden',
        shadowColor: '#17181B',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
    },
    ringLabel: {
        position: 'absolute',
        fontSize: 18,
        fontWeight: '800',
        width: 36,
        textAlign: 'center',
        letterSpacing: -0.2,
    },
    passText: {
        position: 'absolute',
        top: '22%',
        alignSelf: 'center',
        fontSize: 11,
        color: '#8A8A8A',
        fontWeight: '700',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        backgroundColor: 'rgba(239,239,240,0.92)',
        zIndex: 5,
    },
    progressText: {
        position: 'absolute',
        top: '28%',
        alignSelf: 'center',
        fontSize: 38,
        lineHeight: 42,
        color: '#2F3035',
        fontWeight: '900',
        zIndex: 5,
    },
    hand: {
        position: 'absolute',
        height: 2,
        borderRadius: 1,
        backgroundColor: '#3B3C41',
        zIndex: 1,
    },
    handArrow: {
        position: 'absolute',
        width: 0,
        height: 0,
        borderLeftWidth: 4,
        borderRightWidth: 4,
        borderBottomWidth: 10,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: '#3B3C41',
        zIndex: 1,
    },
    centerDot: {
        position: 'absolute',
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#3A3B40',
        borderWidth: 2,
        borderColor: '#F5F5F5',
    },
    progressDot: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#3A3B40',
    },
    eventPin: {
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    eventBubble: {
        position: 'absolute',
        minWidth: 110,
        maxWidth: 152,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.14,
        shadowRadius: 8,
        elevation: 3,
    },
    eventBubbleText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '700',
        textAlign: 'center',
    },
    cardsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
    },
    eventCard: {
        width: '48%',
        borderRadius: 18,
        paddingTop: 12,
        paddingBottom: 10,
        alignItems: 'center',
        minHeight: 122,
        marginBottom: 10,
    },
    daysBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 10,
        paddingVertical: 2,
    },
    daysBadgeText: {
        fontSize: 13,
        fontWeight: '700',
    },
    cardActions: {
        position: 'absolute',
        top: 8,
        right: 8,
        flexDirection: 'row',
        gap: 6,
    },
    cardActionBtn: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: 'rgba(255,255,255,0.92)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 16,
        lineHeight: 19,
        color: 'white',
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 2,
        width: '88%',
    },
    cardDate: {
        fontSize: 13,
        lineHeight: 16,
        color: 'white',
        fontWeight: '500',
        opacity: 0.95,
    },
    addCard: {
        width: '48%',
        minHeight: 122,
        borderRadius: 18,
        borderWidth: 3,
        borderColor: '#C4C4C4',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.16)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    modalCard: {
        width: '100%',
        maxWidth: 760,
        borderRadius: 20,
        backgroundColor: '#ECECEC',
        padding: 14,
    },
    modalTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    titleInput: {
        flex: 1,
        fontSize: 30,
        lineHeight: 36,
        fontWeight: '500',
        color: '#3D3F43',
        marginRight: 12,
        paddingVertical: 4,
    },
    saveFab: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#34D1BF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateWheelWrap: {
        marginTop: 4,
        marginBottom: 12,
    },
    dateSelector: {
        height: 44,
        borderRadius: 12,
        backgroundColor: '#E2E2E4',
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dateSelectorText: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        color: '#4A4E55',
    },
    iconGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'space-between',
    },
    iconChoice: {
        width: '15.8%',
        aspectRatio: 1,
        borderRadius: 999,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 60,
    },
    selectedMark: {
        position: 'absolute',
        right: -2,
        bottom: -2,
        backgroundColor: '#ECECEC',
        borderRadius: 14,
    },
});
