import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, TextInput, KeyboardAvoidingView, Platform, Modal, Alert, Switch, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../context/ThemeContext';
import { storage } from '../../utils/storage';

const { width } = Dimensions.get('window');

// Configure notifications behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export default function ExploreScreen() {
    const { theme } = useTheme();

    // --- Stopwatch State ---
    const [stopwatchTime, setStopwatchTime] = useState(0);
    const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
    const [stopwatchTitle, setStopwatchTitle] = useState('');
    const stopwatchInterval = useRef(null);

    // --- Alarm State ---
    const [alarmTime, setAlarmTime] = useState(''); // HH:MM 24h format internally
    const [isAlarmEnabled, setIsAlarmEnabled] = useState(false);
    const [isRepeating, setIsRepeating] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState('');
    const [isAlarmModalVisible, setIsAlarmModalVisible] = useState(false);
    const [tempDate, setTempDate] = useState(new Date());
    const [tempIsRepeating, setTempIsRepeating] = useState(false);
    const [sound, setSound] = useState(null);
    const [isAlarmTriggered, setIsAlarmTriggered] = useState(false);

    // --- Notes State ---
    const [notes, setNotes] = useState([]);
    const [noteInput, setNoteInput] = useState('');
    const [isNoteInputVisible, setIsNoteInputVisible] = useState(false);

    // --- Permissions & Initialization ---
    useEffect(() => {
        const requestPermissions = async () => {
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Please enable notifications to receive alarm alerts when the app is closed.');
            }
        };
        requestPermissions();

        // Listen for notification responses (when user taps notification)
        const subscription = Notifications.addNotificationResponseReceivedListener(response => {
            // If they tap the notification, we can trigger the ringing overlay
            // but for a true "alarm" experience, we rely on the foreground trigger as well
        });

        return () => subscription.remove();
    }, []);

    // Load Notes on Focus
    useFocusEffect(
        useCallback(() => {
            loadNotes();
        }, [])
    );

    const loadNotes = async () => {
        const loadedNotes = await storage.getNotes();
        setNotes(loadedNotes);
    };

    const handleAddNote = async () => {
        if (!noteInput.trim()) return;
        const updatedNotes = await storage.addNote(noteInput);
        setNotes(updatedNotes);
        setNoteInput('');
        setIsNoteInputVisible(false);
    };

    const handleDeleteNote = async (id) => {
        const updatedNotes = await storage.deleteNote(id);
        setNotes(updatedNotes);
    };

    // --- Stopwatch Logic ---
    useEffect(() => {
        if (isStopwatchRunning) {
            stopwatchInterval.current = setInterval(() => {
                setStopwatchTime(prev => prev + 10);
            }, 10);
        } else {
            clearInterval(stopwatchInterval.current);
        }
        return () => clearInterval(stopwatchInterval.current);
    }, [isStopwatchRunning]);

    const formatStopwatchTime = (time) => {
        const ms = ("0" + (Math.floor(time / 10) % 100)).slice(-2);
        const secs = ("0" + (Math.floor(time / 1000) % 60)).slice(-2);
        const mins = ("0" + (Math.floor(time / 60000) % 60)).slice(-2);
        const hrs = ("0" + Math.floor(time / 3600000)).slice(-2);
        return `${hrs}:${mins}:${secs}.${ms}`;
    };

    const toggleStopwatch = async () => {
        if (!isStopwatchRunning) {
            if (!stopwatchTitle.trim()) {
                Alert.alert('Title Required', 'Please enter a title for your focus session before starting.');
                return;
            }
            setIsStopwatchRunning(true);
        } else {
            setIsStopwatchRunning(false);
            // Record if > 30 minutes (1,800,000 ms)
            if (stopwatchTime >= 1800000) {
                await storage.addFocusSession({
                    title: stopwatchTitle,
                    duration: stopwatchTime
                });
                Alert.alert('Session Recorded', `Great job! Your focus session "${stopwatchTitle}" has been saved.`);
                setStopwatchTime(0);
                setStopwatchTitle('');
            } else if (stopwatchTime > 0) {
                Alert.alert(
                    'Session Too Short',
                    'Focus sessions are only recorded if they last more than 30 minutes. Do you want to reset?',
                    [
                        { text: 'Keep Time', style: 'cancel' },
                        {
                            text: 'Reset',
                            onPress: () => {
                                setStopwatchTime(0);
                                setStopwatchTitle('');
                            },
                            style: 'destructive'
                        }
                    ]
                );
            }
        }
    };

    const resetStopwatch = () => {
        setIsStopwatchRunning(false);
        setStopwatchTime(0);
        setStopwatchTitle('');
    };

    // --- Alarm Logic ---
    const playAlarmSound = async () => {
        try {
            if (sound) {
                await sound.unloadAsync();
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                shouldDuckAndroid: true,
                staysActiveInBackground: true,
                playThroughEarpieceAndroid: false,
            });

            const { sound: newSound } = await Audio.Sound.createAsync(
                require('../Alarm/Alarm.mp3'),
                { isLooping: true, volume: 1.0 }
            );

            setSound(newSound);
            await newSound.playAsync();
        } catch (error) {
            console.error('Error playing sound', error);
        }
    };

    const stopAlarmSound = async () => {
        setIsAlarmTriggered(false);
        if (sound) {
            try {
                await sound.stopAsync();
                await sound.unloadAsync();
            } catch (e) {
                console.error('Error stopping sound', e);
            }
            setSound(null);
        }
        // If it's not repeating, clear the alarm
        if (!isRepeating) {
            setAlarmTime('');
        }
    };

    const calculateTimeRemaining = useCallback(() => {
        if (!alarmTime) {
            setTimeRemaining('');
            return;
        }

        const [hours, minutes] = alarmTime.split(':').map(Number);
        const now = new Date();
        const target = new Date();
        target.setHours(hours, minutes, 0, 0);

        if (target <= now) {
            target.setDate(target.getDate() + 1);
        }

        const diffMs = target - now;

        // Trigger alarm if within 1.5 seconds and not already triggered
        if (isAlarmEnabled && diffMs < 1500 && diffMs > 0 && !isAlarmTriggered) {
            console.log('TRIGGERING ALARM');
            setIsAlarmTriggered(true);
            playAlarmSound();
        }

        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        const enabledText = isAlarmEnabled ? '' : ' (Disabled)';
        setTimeRemaining(`${diffHrs}h ${diffMins}m left${enabledText}`);
    }, [alarmTime, isAlarmTriggered, sound, isRepeating, isAlarmEnabled]);

    useEffect(() => {
        calculateTimeRemaining();
        const timer = setInterval(calculateTimeRemaining, 1000);
        return () => clearInterval(timer);
    }, [calculateTimeRemaining]);

    const scheduleNotification = async (hours, minutes, repeat) => {
        await Notifications.cancelAllScheduledNotificationsAsync();

        const trigger = {
            hour: hours,
            minute: minutes,
            repeats: repeat,
        };

        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Alarm! 🔔",
                body: "Time for your scheduled FlowState task!",
                sound: true, // This uses system default sound
                priority: Notifications.AndroidNotificationPriority.MAX,
            },
            trigger,
        });
    };

    const handleSetAlarm = () => {
        const h24 = tempDate.getHours();
        const m = tempDate.getMinutes();

        const timeStr = `${h24.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        setAlarmTime(timeStr);
        setIsRepeating(tempIsRepeating);
        setIsAlarmEnabled(true);
        setIsAlarmTriggered(false);
        setIsAlarmModalVisible(false);

        // Schedule notification for background
        scheduleNotification(h24, m, tempIsRepeating);
    };

    const toggleAlarmStatus = async (value) => {
        setIsAlarmEnabled(value);
        if (value && alarmTime) {
            const [h24, m] = alarmTime.split(':').map(Number);
            await scheduleNotification(h24, m, isRepeating);
        } else {
            await Notifications.cancelAllScheduledNotificationsAsync();
        }
    };

    const formatDisplayTime = (time) => {
        if (!time) return 'Not Set';
        let [h, m] = time.split(':').map(Number);
        const period = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:${m.toString().padStart(2, '0')} ${period}`;
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.text }]}>Explore</Text>
                        <Text style={[styles.subtitle, { color: theme.subText }]}>Productivity tools for your journey</Text>
                    </View>

                    {/* Alarm Section */}
                    <View style={[styles.sectionCard, styles.alarmCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconBox, { backgroundColor: theme.input }]}>
                                <Ionicons name="alarm-outline" size={28} color="#10B981" />
                            </View>
                            <View>
                                <Text style={[styles.cardTitle, { color: theme.text }]}>Smart Alarm</Text>
                                <View style={styles.badgeRow}>
                                    {isRepeating && <Text style={[styles.repeatBadge, { backgroundColor: theme.tint + '20', color: theme.success }]}>Everyday</Text>}
                                </View>
                            </View>
                        </View>

                        <View style={styles.alarmDisplay}>
                            <Text style={[styles.alarmValue, { color: theme.text }, !isAlarmEnabled && styles.disabledValue]}>
                                {formatDisplayTime(alarmTime)}
                            </Text>
                            <Text style={[styles.remainingText, !isAlarmEnabled && styles.disabledText]}>
                                {alarmTime ? timeRemaining : 'Set an alarm to see time left'}
                            </Text>
                        </View>

                        <View style={[styles.statusRow, { backgroundColor: theme.input }]}>
                            <View style={styles.statusTextCol}>
                                <Text style={[styles.statusLabel, { color: theme.text }]}>Alarm Status</Text>
                                <Text style={styles.statusValue}>{isAlarmEnabled ? 'Currently Active' : 'Currently Disabled'}</Text>
                            </View>
                            <Switch
                                value={isAlarmEnabled}
                                onValueChange={toggleAlarmStatus}
                                trackColor={{ false: '#D1D5DB', true: '#6EE7B7' }}
                                thumbColor={isAlarmEnabled ? '#10B981' : '#F3F4F6'}
                                disabled={!alarmTime}
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.setAlarmButton}
                            onPress={() => {
                                if (alarmTime) {
                                    let [h, m] = alarmTime.split(':').map(Number);
                                    const d = new Date();
                                    d.setHours(h, m, 0, 0);
                                    setTempDate(d);
                                    setTempIsRepeating(isRepeating);
                                } else {
                                    const d = new Date();
                                    d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5); // Round to nearest 5 mins for convenience
                                    setTempDate(d);
                                    setTempIsRepeating(false);
                                }
                                setIsAlarmModalVisible(true);
                            }}
                        >
                            <Text style={styles.buttonText}>{alarmTime ? 'Change Alarm' : 'Set Alarm'}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Stopwatch Section */}
                    <View style={[styles.sectionCard, styles.stopwatchCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconBox, { backgroundColor: theme.input }]}>
                                <Ionicons name="stopwatch-outline" size={28} color="#3B82F6" />
                            </View>
                            <Text style={[styles.cardTitle, { color: theme.text }]}>Stopwatch</Text>
                        </View>

                        <View style={styles.stopwatchTitleContainer}>
                            <TextInput
                                style={[styles.stopwatchInput, { color: theme.text, backgroundColor: theme.input }]}
                                placeholder="What are you focusing on?"
                                placeholderTextColor={theme.subText}
                                value={stopwatchTitle}
                                onChangeText={setStopwatchTitle}
                                editable={!isStopwatchRunning}
                            />
                        </View>

                        <View style={styles.timerDisplay}>
                            <Text style={[styles.timerValue, { color: theme.text }]}>{formatStopwatchTime(stopwatchTime)}</Text>
                        </View>

                        <View style={styles.controlRow}>
                            <TouchableOpacity
                                style={[styles.controlButton, styles.resetButton, { backgroundColor: theme.input }]}
                                onPress={resetStopwatch}
                            >
                                <Text style={[styles.resetButtonText, { color: theme.text }]}>Reset</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.controlButton,
                                    isStopwatchRunning ? styles.stopButton : styles.startButton
                                ]}
                                onPress={toggleStopwatch}
                            >
                                <Ionicons
                                    name={isStopwatchRunning ? "pause" : "play"}
                                    size={24}
                                    color="white"
                                />
                                <Text style={styles.buttonText}>
                                    {isStopwatchRunning ? 'Stop' : 'Start'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Notes Section */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>My Notes</Text>

                        {/* Add Note Trigger Card */}
                        {!isNoteInputVisible && (
                            <TouchableOpacity
                                style={[styles.addNoteCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                                onPress={() => setIsNoteInputVisible(true)}
                            >
                                <View style={[styles.addNoteIcon, { backgroundColor: theme.input }]}>
                                    <Ionicons name="add" size={24} color={theme.primary} />
                                </View>
                                <Text style={[styles.addNoteText, { color: theme.subText }]}>Capture a thought...</Text>
                            </TouchableOpacity>
                        )}

                        {isNoteInputVisible && (
                            <View style={[styles.noteInputContainer, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
                                <TextInput
                                    style={[styles.noteInput, { color: theme.text, backgroundColor: theme.input }]}
                                    placeholder="What's on your mind?"
                                    placeholderTextColor={theme.subText}
                                    value={noteInput}
                                    onChangeText={setNoteInput}
                                    autoFocus
                                    multiline
                                />
                                <View style={styles.noteInputButtons}>
                                    <TouchableOpacity onPress={() => setIsNoteInputVisible(false)} style={styles.noteCancelBtn}>
                                        <Text style={{ color: theme.subText, fontWeight: '600' }}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={handleAddNote} style={[styles.noteSaveBtn, { backgroundColor: theme.primary }]}>
                                        <Text style={{ color: 'white', fontWeight: 'bold' }}>Save Note</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        <View style={styles.notesGrid}>
                            {notes.length === 0 && !isNoteInputVisible ? (
                                <View style={styles.emptyStateContainer}>
                                    <Ionicons name="document-text-outline" size={48} color={theme.border} />
                                    <Text style={[styles.emptyNotes, { color: theme.subText }]}>Your notes will appear here</Text>
                                </View>
                            ) : (
                                notes.map((note, index) => {
                                    // Generate a deterministic color based on index or id for visual variety
                                    const noteColors = [
                                        { bg: '#FEF3C7', text: '#92400E' }, // Amber
                                        { bg: '#DBEAFE', text: '#1E40AF' }, // Blue
                                        { bg: '#D1FAE5', text: '#065F46' }, // Emerald
                                        { bg: '#FCE7F3', text: '#9D174D' }, // Pink
                                        { bg: '#E0E7FF', text: '#3730A3' }, // Indigo
                                    ];
                                    // Use theme card color if dark mode, else use pastel
                                    const isDark = theme.mode === 'dark';
                                    const colorSet = noteColors[index % noteColors.length];
                                    const cardBg = isDark ? theme.card : colorSet.bg;
                                    const textColor = isDark ? theme.text : colorSet.text;
                                    const dateColor = isDark ? theme.subText : colorSet.text; // slightly lighter in real app, but this works

                                    return (
                                        <View key={note.id} style={[styles.noteCard, { backgroundColor: cardBg, shadowColor: theme.shadow }]}>
                                            <Text style={[styles.noteContent, { color: textColor }]}>{note.content}</Text>
                                            <View style={[styles.noteDivider, { backgroundColor: isDark ? theme.border : 'rgba(0,0,0,0.05)' }]} />
                                            <View style={styles.noteFooter}>
                                                <Text style={[styles.noteDate, { color: dateColor, opacity: 0.8 }]}>
                                                    {new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </Text>
                                                <TouchableOpacity
                                                    onPress={() => handleDeleteNote(note.id)}
                                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                >
                                                    <Ionicons name="trash-outline" size={16} color={isDark ? '#EF4444' : textColor} style={{ opacity: 0.7 }} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    );
                                })
                            )}
                        </View>
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Alarm Set Modal */}
            <Modal
                visible={isAlarmModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsAlarmModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>Set Alarm</Text>

                        <View style={styles.pickerContainer}>
                            <DateTimePicker
                                value={tempDate}
                                mode="time"
                                is24Hour={false}
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(event, selectedDate) => {
                                    if (selectedDate) setTempDate(selectedDate);
                                }}
                                textColor={theme.text}
                                style={styles.datePicker}
                                themeVariant={theme.mode}
                            />
                        </View>

                        <View style={[styles.repeatRow, { borderColor: theme.border }]}>
                            <View>
                                <Text style={[styles.repeatTitle, { color: theme.text }]}>Repeat Everyday</Text>
                                <Text style={[styles.repeatSubtitle, { color: theme.subText }]}>Alarm triggers daily at this time</Text>
                            </View>
                            <Switch
                                value={tempIsRepeating}
                                onValueChange={setTempIsRepeating}
                                trackColor={{ false: '#D1D5DB', true: '#6EE7B7' }}
                                thumbColor={tempIsRepeating ? '#10B981' : '#F3F4F6'}
                            />
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setIsAlarmModalVisible(false)}
                            >
                                <Text style={[styles.cancelButtonText, { color: theme.subText }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={handleSetAlarm}
                            >
                                <Text style={styles.saveButtonText}>Set Alarm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Alarm Ringing Overlay */}
            <Modal
                visible={isAlarmTriggered}
                animationType="fade"
                transparent={false}
            >
                <SafeAreaView style={styles.ringingOverlay}>
                    <View style={styles.ringingContent}>
                        <View style={styles.ringingIconContainer}>
                            <Ionicons name="alarm" size={100} color="white" />
                        </View>
                        <Text style={styles.ringingTitle}>Wake Up!</Text>
                        <Text style={styles.ringingTime}>{formatDisplayTime(alarmTime)}</Text>

                        <TouchableOpacity
                            style={styles.stopAlarmCircle}
                            onPress={stopAlarmSound}
                        >
                            <Text style={styles.stopAlarmText}>STOP</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
    },
    header: {
        paddingTop: 20,
        paddingBottom: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 18,
        marginTop: 4,
    },
    sectionCard: {
        borderRadius: 28,
        padding: 24,
        marginBottom: 20,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    repeatBadge: {
        fontSize: 12,
        fontWeight: '600',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    badgeRow: {
        flexDirection: 'row',
        marginTop: 4,
        gap: 8,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
    },
    statusTextCol: {
        flex: 1,
    },
    statusLabel: {
        fontSize: 14,
        fontWeight: '700',
    },
    statusValue: {
        fontSize: 12,
        marginTop: 2,
    },
    alarmDisplay: {
        alignItems: 'center',
        marginBottom: 24,
    },
    alarmValue: {
        fontSize: width > 400 ? 56 : 48, // Responsive sizing
        fontWeight: '800',
        letterSpacing: -1,
    },
    disabledValue: {
        opacity: 0.3,
    },
    remainingText: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 4,
    },
    disabledText: {
        opacity: 0.5,
    },
    setAlarmButton: {
        backgroundColor: '#10B981',
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
    },
    timerDisplay: {
        alignItems: 'center',
        marginBottom: 24,
    },
    timerValue: {
        fontSize: 44,
        fontWeight: '800',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    stopwatchTitleContainer: {
        marginBottom: 20,
    },
    stopwatchInput: {
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        fontWeight: '600',
    },
    controlRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    controlButton: {
        flex: 1,
        borderRadius: 16,
        padding: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    startButton: {
        backgroundColor: '#3B82F6',
        marginLeft: 12,
    },
    stopButton: {
        backgroundColor: '#EF4444',
        marginLeft: 12,
    },
    resetButton: {
        // backgroundColor handled dynamically
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 8,
    },
    resetButtonText: {
        fontSize: 16,
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: {
        borderRadius: 28,
        padding: 24,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 24,
        textAlign: 'center',
    },
    pickerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
        height: 200,
    },
    datePicker: {
        width: '100%',
        height: '100%',
    },
    repeatRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        marginBottom: 24,
    },
    repeatTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    repeatSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    cancelButton: {
        flex: 1,
        padding: 18,
        alignItems: 'center',
    },
    saveButton: {
        flex: 1,
        backgroundColor: '#10B981',
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontWeight: '600',
    },
    saveButtonText: {
        color: 'white',
        fontWeight: '700',
    },
    ringingOverlay: {
        flex: 1,
        backgroundColor: '#EF4444',
    },
    ringingContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    ringingIconContainer: {
        marginBottom: 40,
    },
    ringingTitle: {
        fontSize: 40,
        fontWeight: '900',
        color: 'white',
        letterSpacing: -1,
        marginBottom: 8,
    },
    ringingTime: {
        fontSize: 24,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 60,
    },
    stopAlarmCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    stopAlarmText: {
        fontSize: 24,
        fontWeight: '900',
        color: '#EF4444',
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
    },
    addNoteCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    addNoteIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    addNoteText: {
        fontSize: 16,
        fontWeight: '500',
    },
    noteInputContainer: {
        padding: 20,
        borderRadius: 24,
        marginBottom: 24,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    noteInput: {
        minHeight: 100,
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        textAlignVertical: 'top',
        fontSize: 16,
    },
    noteInputButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 16,
    },
    noteCancelBtn: {
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    noteSaveBtn: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 14,
    },
    notesGrid: {
        gap: 16,
    },
    emptyStateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        opacity: 0.6,
    },
    emptyNotes: {
        fontSize: 16,
        marginTop: 12,
    },
    noteCard: {
        padding: 20,
        borderRadius: 24,
        marginBottom: 4,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 1,
    },
    noteContent: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 16,
        lineHeight: 24,
    },
    noteDivider: {
        height: 1,
        width: '100%',
        marginBottom: 12,
    },
    noteFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    noteDate: {
        fontSize: 12,
        fontWeight: '600',
    },
});
