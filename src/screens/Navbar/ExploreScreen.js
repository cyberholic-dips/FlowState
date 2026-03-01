import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
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
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { useFocusEffect } from '@react-navigation/native';
import TabPageHeader from '../../components/TabPageHeader';

const LIFE_SETTINGS_KEY = 'lifeIndex';
const LIFE_EXPECTANCY_STEP = 5;
const EVENT_FILTER_OPTIONS = ['All', 'Upcoming'];

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
    { key: 'airplane', icon: 'airplane', color: '#3B82F6' },
    { key: 'school', icon: 'school', color: '#22C55E' },
    { key: 'heart', icon: 'heart', color: '#EF4444' },
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
const formatYears = (value) => {
    const rounded = Math.round(value * 10) / 10;
    return Number.isInteger(rounded) ? `${rounded}` : `${rounded.toFixed(1)}`;
};

const getIconConfig = (iconKey) => EVENT_OPTIONS.find((item) => item.key === iconKey) || EVENT_OPTIONS[0];
const degToRad = (deg) => (deg * Math.PI) / 180;

export default function ExploreScreen() {
    const { width, height } = useWindowDimensions();
    const { theme } = useTheme();
    const { updateBirthDate } = useUser();
    const scrollRef = React.useRef(null);
    const eventCardOffsetsRef = React.useRef({});

    const [isReady, setIsReady] = useState(false);
    const [birthDate, setBirthDate] = useState(new Date(1999, 5, 26));
    const [lifeExpectancy, setLifeExpectancy] = useState(75);
    const [events, setEvents] = useState([]);

    const [isBirthPickerVisible, setIsBirthPickerVisible] = useState(false);
    const [isLifeExpectancyModalVisible, setIsLifeExpectancyModalVisible] = useState(false);
    const [isAddEventVisible, setIsAddEventVisible] = useState(false);
    const [isDraftDatePickerVisible, setIsDraftDatePickerVisible] = useState(false);
    const [editingEventId, setEditingEventId] = useState(null);
    const [selectedEventId, setSelectedEventId] = useState(null);
    const [draftLifeExpectancy, setDraftLifeExpectancy] = useState(75);
    const [eventFilter, setEventFilter] = useState('All');

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
            const userBirthDate = settings?.user?.birthDate;

            if (saved) {
                if (saved.birthDate) setBirthDate(new Date(saved.birthDate));
                if (typeof saved.lifeExpectancy === 'number') {
                    const normalized = clamp(saved.lifeExpectancy, 30, 120);
                    setLifeExpectancy(normalized);
                    setDraftLifeExpectancy(normalized);
                } else {
                    setLifeExpectancy(75);
                    setDraftLifeExpectancy(75);
                }
                if (Array.isArray(saved.events)) setEvents(saved.events);
            } else if (userBirthDate) {
                setBirthDate(new Date(userBirthDate));
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
                user: {
                    ...(settings.user || {}),
                    birthDate: birthDate.toISOString(),
                },
                [LIFE_SETTINGS_KEY]: {
                    birthDate: birthDate.toISOString(),
                    lifeExpectancy,
                    events,
                },
            });
        };

        persist();
    }, [isReady, birthDate, lifeExpectancy, events]);

    useFocusEffect(
        React.useCallback(() => {
            requestAnimationFrame(() => {
                scrollRef.current?.scrollTo({ y: 0, animated: true });
            });
        }, [])
    );

    const currentAge = useMemo(() => clamp(yearsSince(birthDate), 0, 130), [birthDate]);
    const lifeProgress = useMemo(() => clamp((currentAge / lifeExpectancy) * 100, 0, 100), [currentAge, lifeExpectancy]);
    const ui = useMemo(() => ({
        screenBg: theme.background,
        panel: theme.card,
        panelSoft: theme.input,
        panelAlt: theme.mode === 'dark' ? '#273449' : '#ECECEE',
        text: theme.text,
        subText: theme.subText,
        mutedText: theme.mode === 'dark' ? '#64748B' : '#8B8B8B',
        ringBg: theme.mode === 'dark' ? '#1A2538' : '#EFEFF0',
        ringEdge: theme.mode === 'dark' ? '#334155' : '#F5F5F5',
        hand: theme.mode === 'dark' ? '#CBD5E1' : '#3B3C41',
        handDot: theme.mode === 'dark' ? '#E2E8F0' : '#3A3B40',
        progressTrack: theme.mode === 'dark' ? '#334155' : '#D9DBDF',
        modalOverlay: theme.mode === 'dark' ? 'rgba(2,6,23,0.62)' : 'rgba(0,0,0,0.16)',
        badgeBg: theme.mode === 'dark' ? 'rgba(15,23,42,0.76)' : 'rgba(255,255,255,0.9)',
        actionBg: theme.mode === 'dark' ? 'rgba(15,23,42,0.72)' : 'rgba(255,255,255,0.92)',
    }), [theme]);

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

    const filteredCardEvents = useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (eventFilter === 'Upcoming') {
            return cardEvents.filter((event) => new Date(event.date) > startOfToday);
        }
        return cardEvents;
    }, [cardEvents, eventFilter]);

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
    const handTailLength = 10;
    const handDirX = handLength ? (handTipPoint.x - boardCenter) / handLength : 0;
    const handDirY = handLength ? (handTipPoint.y - boardCenter) / handLength : 0;
    const handBasePoint = {
        x: boardCenter - handDirX * handTailLength,
        y: boardCenter - handDirY * handTailLength,
    };
    const fullHandLength = handLength + handTailLength;
    const handMidX = (handTipPoint.x + handBasePoint.x) / 2;
    const handMidY = (handTipPoint.y + handBasePoint.y) / 2;

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

    const scrollToEventCard = (eventId) => {
        const y = eventCardOffsetsRef.current[eventId];
        if (typeof y !== 'number') return;
        scrollRef.current?.scrollTo({ y: Math.max(0, y - 140), animated: true });
    };

    const handleSelectEvent = (eventId, shouldScroll = false) => {
        setSelectedEventId(eventId);
        if (shouldScroll) {
            requestAnimationFrame(() => scrollToEventCard(eventId));
        }
    };

    useEffect(() => {
        if (!selectedEventId) return;
        const existsInFiltered = filteredCardEvents.some((event) => event.id === selectedEventId);
        if (!existsInFiltered) {
            setSelectedEventId(null);
        }
    }, [filteredCardEvents, selectedEventId]);

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
        Alert.alert(
            'Delete event?',
            'This event card will be removed from your timeline.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        setEvents((prev) => prev.filter((event) => event.id !== eventId));
                        setSelectedEventId(null);
                    },
                },
            ]
        );
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
        <SafeAreaView style={[styles.container, { backgroundColor: ui.screenBg }]}>
            <TabPageHeader title="Life" variant="minimal" />
            <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, isWide && styles.contentWide]}>
                <View style={[styles.settingsCard, isWide && styles.settingsCardWide, { backgroundColor: ui.panel }]}>
                    <View style={styles.compactControlsRow}>
                        <TouchableOpacity style={[styles.birthButton, { backgroundColor: ui.panelSoft }]} onPress={() => setIsBirthPickerVisible((prev) => !prev)}>
                            <Text style={[styles.controlLabel, styles.birthLabel, { color: ui.subText }]}>Birth Date</Text>
                            <Text style={[styles.birthValue, { color: ui.text }]} numberOfLines={1}>
                                {formatDate(birthDate)}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.expectancyWrap, { backgroundColor: ui.panelSoft }]}
                            activeOpacity={0.85}
                            onPress={() => {
                                setDraftLifeExpectancy(lifeExpectancy || 75);
                                setIsLifeExpectancyModalVisible(true);
                            }}
                        >
                            <Text style={[styles.controlLabel, { color: ui.subText }]}>Expectancy</Text>
                            <Text style={[styles.lifeExpectancyText, { color: ui.text }]}>{lifeExpectancy}y</Text>
                        </TouchableOpacity>

                        <View style={[styles.metricPill, { backgroundColor: ui.panelSoft }]}>
                            <Text style={[styles.controlLabel, { color: ui.subText }]}>Age</Text>
                            <Text style={[styles.lifeExpectancyText, { color: ui.text }]}>{formatYears(currentAge)}y</Text>
                        </View>

                        <View style={[styles.metricPill, { backgroundColor: ui.panelSoft }]}>
                            <Text style={[styles.controlLabel, { color: ui.subText }]}>Passed</Text>
                            <Text style={[styles.lifeExpectancyText, { color: ui.text }]}>{Math.round(lifeProgress)}%</Text>
                        </View>
                    </View>

                    <View style={[styles.progressTrack, { backgroundColor: ui.progressTrack }]}>
                        <View style={[styles.progressFillBar, { width: `${lifeProgress}%`, backgroundColor: '#F5A3A3' }]} />
                    </View>
                </View>

                {isBirthPickerVisible && (
                    <View style={[styles.birthPickerCard, { backgroundColor: ui.panel, borderColor: theme.border }]}>
                        <DateTimePicker
                            value={birthDate}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={(e, value) => {
                                if (value) {
                                    setBirthDate(value);
                                    updateBirthDate(value);
                                }
                                setIsBirthPickerVisible(false);
                            }}
                            maximumDate={new Date()}
                        />
                    </View>
                )}

                <View style={[styles.lifeBoard, { width: boardSize, height: boardSize, backgroundColor: ui.ringBg, shadowColor: theme.mode === 'dark' ? '#000' : '#17181B' }]}>
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
                                        color: passed ? ui.text : ui.mutedText,
                                    },
                                ]}
                            >
                                {item.ageValue}
                            </Text>
                        );
                    })}

                    <Text style={[styles.passText, { color: ui.subText, backgroundColor: `${ui.ringBg}E8` }]}>This life has passed</Text>
                    <Text style={[styles.progressText, { color: ui.text }]}>{Math.round(lifeProgress)}%</Text>

                    <View
                        style={[
                            styles.hand,
                            {
                                width: fullHandLength,
                                left: handMidX - fullHandLength / 2,
                                top: handMidY - 1.5,
                                transform: [{ rotate: `${ageToAngle(currentAge)}deg` }],
                                backgroundColor: ui.hand,
                            },
                        ]}
                    />

                    <View style={[styles.centerDot, { left: boardCenter - 5, top: boardCenter - 5, backgroundColor: ui.handDot, borderColor: ui.ringEdge }]} />

                    {eventDots.map((event) => (
                        <TouchableOpacity
                            key={`dot-${event.id}`}
                            activeOpacity={0.9}
                            onPress={() => handleSelectEvent(event.id, true)}
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

                <View style={styles.filterRow}>
                    {EVENT_FILTER_OPTIONS.map((filter) => {
                        const active = eventFilter === filter;
                        return (
                            <TouchableOpacity
                                key={filter}
                                style={[
                                    styles.filterChip,
                                    {
                                        backgroundColor: active ? theme.primary + '18' : ui.panelSoft,
                                        borderColor: active ? theme.primary : theme.border,
                                    },
                                ]}
                                onPress={() => setEventFilter(filter)}
                            >
                                <Text style={[styles.filterChipText, { color: active ? theme.primary : ui.text }]}>{filter}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={styles.cardsGrid}>
                    {filteredCardEvents.map((event) => {
                        const iconCfg = getIconConfig(event.iconKey);
                        const canEdit = event.id !== 'origin';
                        const isSelected = selectedEventId === event.id;
                        return (
                            <TouchableOpacity
                                key={event.id}
                                activeOpacity={0.9}
                                onPress={() => handleSelectEvent(event.id, false)}
                                style={[styles.eventCard, { backgroundColor: event.color }]}
                                onLayout={(e) => {
                                    eventCardOffsetsRef.current[event.id] = e.nativeEvent.layout.y;
                                }}
                            >
                                <View style={[styles.daysBadge, { backgroundColor: ui.badgeBg }]}>
                                    <Text style={[styles.daysBadgeText, { color: event.color }]}>{event.id === 'origin' ? birthDays : daysSince(event.date)} ds</Text>
                                </View>
                                {canEdit && isSelected && (
                                    <View style={styles.cardActions}>
                                        <TouchableOpacity style={[styles.cardActionBtn, { backgroundColor: ui.actionBg }]} onPress={() => openEditModal(event)}>
                                            <Ionicons name="pencil" size={12} color={ui.text} />
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.cardActionBtn, { backgroundColor: ui.actionBg }]} onPress={() => deleteEvent(event.id)}>
                                            <Ionicons name="trash-outline" size={12} color={ui.text} />
                                        </TouchableOpacity>
                                    </View>
                                )}
                                <Ionicons name={iconCfg.icon} size={30} color="white" style={{ marginBottom: 10 }} />
                                <Text style={styles.cardTitle} numberOfLines={1}>{event.title}</Text>
                                <Text style={styles.cardDate}>{formatDate(event.date)}</Text>
                            </TouchableOpacity>
                        );
                    })}

                    <TouchableOpacity style={[styles.addCard, { borderColor: theme.border, backgroundColor: ui.panel }]} onPress={openAddModal}>
                        <Ionicons name="add" size={52} color={ui.subText} />
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <Modal visible={isAddEventVisible} transparent animationType="fade" onRequestClose={() => setIsAddEventVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.modalOverlay, { backgroundColor: ui.modalOverlay }]}>
                    <View style={[styles.modalCard, { backgroundColor: ui.panel }]}>
                        <View style={styles.modalHeaderRow}>
                            <TouchableOpacity style={[styles.closeFab, { backgroundColor: ui.panelSoft }]} onPress={() => setIsAddEventVisible(false)}>
                                <Ionicons name="close" size={20} color={ui.text} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalTopRow}>
                            <View style={[styles.titleInputWrap, { backgroundColor: ui.panelSoft, borderColor: theme.border }]}>
                                <TextInput
                                    style={[styles.titleInput, { color: ui.text }]}
                                    placeholder="Enter title"
                                    placeholderTextColor={ui.subText}
                                    value={draftTitle}
                                    onChangeText={setDraftTitle}
                                    autoFocus
                                />
                            </View>
                            <TouchableOpacity style={[styles.saveFab, { backgroundColor: theme.primary }]} onPress={saveEvent}>
                                <Ionicons name="checkmark" size={22} color="white" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.dateWheelWrap}>
                            <TouchableOpacity style={[styles.dateSelector, { backgroundColor: ui.panelSoft }]} onPress={() => setIsDraftDatePickerVisible((prev) => !prev)}>
                                <Ionicons name="calendar-outline" size={20} color={ui.subText} />
                                <Text style={[styles.dateSelectorText, { color: ui.text }]}>{formatDate(draftDate)}</Text>
                                <Ionicons name={isDraftDatePickerVisible ? 'chevron-up' : 'chevron-down'} size={18} color={ui.subText} />
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
                                        <Ionicons name={item.icon} size={25} color="white" />
                                        {selected && (
                                            <View style={[styles.selectedMark, { backgroundColor: ui.panel }]}>
                                                <Ionicons name="checkmark-circle" size={20} color={theme.mode === 'dark' ? theme.text : '#3F3F51'} />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <Modal
                visible={isLifeExpectancyModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsLifeExpectancyModalVisible(false)}
            >
                <View style={[styles.modalOverlay, { backgroundColor: ui.modalOverlay }]}>
                    <View style={[styles.lifeExpectancyModal, { backgroundColor: ui.panel, borderColor: theme.border }]}>
                        <View style={styles.lifeModalHeader}>
                            <Text style={styles.lifeModalHeaderTitle}>Life Expectancy</Text>
                        </View>

                        <View style={styles.lifeModalBody}>
                            <Text style={[styles.lifeModalHint, { color: ui.subText }]}>Default is 75 years</Text>

                            <View style={styles.lifeModalValueRow}>
                                <TouchableOpacity
                                    style={[styles.stepBtn, { backgroundColor: ui.panelAlt }]}
                                    onPress={() => setDraftLifeExpectancy((v) => clamp(v - LIFE_EXPECTANCY_STEP, 30, 120))}
                                >
                                    <Ionicons name="remove" size={16} color={ui.text} />
                                </TouchableOpacity>
                                <Text style={[styles.lifeModalValueText, { color: ui.text }]}>{draftLifeExpectancy} yrs</Text>
                                <TouchableOpacity
                                    style={[styles.stepBtn, { backgroundColor: ui.panelAlt }]}
                                    onPress={() => setDraftLifeExpectancy((v) => clamp(v + LIFE_EXPECTANCY_STEP, 30, 120))}
                                >
                                    <Ionicons name="add" size={16} color={ui.text} />
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.lifeModalRange, { color: ui.subText }]}>Range: 30 - 120 years</Text>

                            <View style={styles.lifeModalActions}>
                                <TouchableOpacity
                                    style={[styles.lifeActionBtn, { backgroundColor: ui.panelSoft }]}
                                    onPress={() => setIsLifeExpectancyModalVisible(false)}
                                >
                                    <Text style={[styles.lifeActionText, { color: ui.text }]}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.lifeActionBtn, { backgroundColor: theme.primary }]}
                                    onPress={() => {
                                        setLifeExpectancy(draftLifeExpectancy);
                                        setIsLifeExpectancyModalVisible(false);
                                    }}
                                >
                                    <Text style={[styles.lifeActionText, { color: '#FFFFFF' }]}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
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
        paddingTop: 14,
    },
    contentWide: {
        maxWidth: 980,
        width: '100%',
        alignSelf: 'center',
    },
    settingsCard: {
        backgroundColor: '#F3F3F3',
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 8,
    },
    settingsCardWide: {
        paddingHorizontal: 16,
    },
    compactControlsRow: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 8,
    },
    birthButton: {
        flex: 0.82,
        minHeight: 50,
        borderRadius: 12,
        backgroundColor: '#ECECEE',
        paddingHorizontal: 8,
        paddingVertical: 7,
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    expectancyWrap: {
        flex: 1,
        minHeight: 50,
        borderRadius: 12,
        backgroundColor: '#ECECEE',
        paddingHorizontal: 8,
        paddingVertical: 7,
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    metricPill: {
        flex: 0.8,
        minHeight: 50,
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 7,
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    controlLabel: {
        fontSize: 11,
        color: '#8B8B8B',
        fontWeight: '700',
        marginBottom: 0,
    },
    birthLabel: {
        fontSize: 10,
    },
    birthValue: {
        fontSize: 13,
        color: '#2F2F2F',
        fontWeight: '700',
        marginTop: 4,
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
        fontSize: 15,
        color: '#2F2F2F',
        fontWeight: '700',
        marginTop: 4,
    },
    progressTrack: {
        height: 9,
        borderRadius: 999,
        backgroundColor: '#D9DBDF',
        overflow: 'hidden',
    },
    progressFillBar: {
        height: '100%',
        borderRadius: 999,
        backgroundColor: '#50555E',
        minWidth: 8,
    },
    birthPickerCard: {
        backgroundColor: '#F3F3F3',
        borderWidth: 1,
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
        height: 3,
        borderRadius: 2,
        backgroundColor: '#3B3C41',
        zIndex: 1,
    },
    centerDot: {
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#3A3B40',
        borderWidth: 2,
        borderColor: '#F5F5F5',
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
    filterRow: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 8,
        marginBottom: 10,
    },
    filterChip: {
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 7,
    },
    filterChipText: {
        fontSize: 12,
        fontWeight: '700',
    },
    cardsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
    },
    eventCard: {
        width: '47.5%',
        borderRadius: 16,
        paddingTop: 10,
        paddingBottom: 8,
        alignItems: 'center',
        minHeight: 104,
        marginBottom: 8,
    },
    daysBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    daysBadgeText: {
        fontSize: 11,
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
        fontSize: 14,
        lineHeight: 17,
        color: 'white',
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 2,
        width: '88%',
    },
    cardDate: {
        fontSize: 12,
        lineHeight: 14,
        color: 'white',
        fontWeight: '500',
        opacity: 0.95,
    },
    addCard: {
        width: '47.5%',
        minHeight: 104,
        borderRadius: 16,
        borderWidth: 3,
        borderColor: '#C4C4C4',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
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
        maxWidth: 520,
        borderRadius: 18,
        backgroundColor: '#ECECEC',
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    modalHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 2,
    },
    closeFab: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#DCDDDF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        gap: 8,
    },
    titleInputWrap: {
        flex: 1,
        height: 46,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: 'center',
        paddingHorizontal: 12,
    },
    titleInput: {
        flex: 1,
        fontSize: 17,
        lineHeight: 22,
        fontWeight: '600',
        color: '#3D3F43',
        paddingVertical: 0,
    },
    saveFab: {
        width: 46,
        height: 46,
        borderRadius: 23,
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
        fontSize: 16,
        fontWeight: '700',
        color: '#4A4E55',
    },
    iconGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'space-between',
    },
    iconChoice: {
        width: '15.2%',
        aspectRatio: 1,
        borderRadius: 999,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 52,
    },
    selectedMark: {
        position: 'absolute',
        right: -1,
        bottom: -1,
        backgroundColor: '#ECECEC',
        borderRadius: 12,
    },
    lifeExpectancyModal: {
        width: '92%',
        maxWidth: 360,
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
    },
    lifeModalHeader: {
        backgroundColor: '#2E58A9',
        minHeight: 56,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
    },
    lifeModalHeaderTitle: {
        color: '#FFFFFF',
        fontSize: 24,
        lineHeight: 28,
        fontWeight: '800',
        textAlign: 'center',
    },
    lifeModalBody: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 14,
    },
    lifeModalHint: {
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 12,
        fontWeight: '600',
    },
    lifeModalValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    lifeModalValueText: {
        fontSize: 30,
        lineHeight: 34,
        fontWeight: '900',
    },
    lifeModalRange: {
        marginTop: 8,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '600',
    },
    lifeModalActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 14,
    },
    lifeActionBtn: {
        flex: 1,
        minHeight: 42,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    lifeActionText: {
        fontSize: 14,
        fontWeight: '800',
    },
});
