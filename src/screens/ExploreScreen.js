import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, TextInput, KeyboardAvoidingView, Platform, Modal, Alert, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';

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
    // --- Stopwatch State ---
    const [stopwatchTime, setStopwatchTime] = useState(0);
    const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
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

    const toggleStopwatch = () => setIsStopwatchRunning(!isStopwatchRunning);
    const resetStopwatch = () => {
        setIsStopwatchRunning(false);
        setStopwatchTime(0);
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
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>Explore</Text>
                    <Text style={styles.subtitle}>Productivity tools for your journey</Text>
                </View>

                {/* Alarm Section */}
                <View style={[styles.sectionCard, styles.alarmCard]}>
                    <View style={styles.cardHeader}>
                        <View style={styles.iconBox}>
                            <Ionicons name="alarm-outline" size={28} color="#10B981" />
                        </View>
                        <View>
                            <Text style={styles.cardTitle}>Smart Alarm</Text>
                            <View style={styles.badgeRow}>
                                {isRepeating && <Text style={styles.repeatBadge}>Everyday</Text>}
                            </View>
                        </View>
                    </View>

                    <View style={styles.alarmDisplay}>
                        <Text style={[styles.alarmValue, !isAlarmEnabled && styles.disabledValue]}>
                            {formatDisplayTime(alarmTime)}
                        </Text>
                        <Text style={[styles.remainingText, !isAlarmEnabled && styles.disabledText]}>
                            {alarmTime ? timeRemaining : 'Set an alarm to see time left'}
                        </Text>
                    </View>

                    <View style={styles.statusRow}>
                        <View style={styles.statusTextCol}>
                            <Text style={styles.statusLabel}>Alarm Status</Text>
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
                <View style={[styles.sectionCard, styles.stopwatchCard]}>
                    <View style={styles.cardHeader}>
                        <View style={styles.iconBox}>
                            <Ionicons name="stopwatch-outline" size={28} color="#3B82F6" />
                        </View>
                        <Text style={styles.cardTitle}>Stopwatch</Text>
                    </View>

                    <View style={styles.timerDisplay}>
                        <Text style={styles.timerValue}>{formatStopwatchTime(stopwatchTime)}</Text>
                    </View>

                    <View style={styles.controlRow}>
                        <TouchableOpacity
                            style={[styles.controlButton, styles.resetButton]}
                            onPress={resetStopwatch}
                        >
                            <Text style={styles.resetButtonText}>Reset</Text>
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

                <View style={styles.toolsGrid}>
                    <View style={styles.toolItem}>
                        <Ionicons name="sunny-outline" size={24} color="#F59E0B" />
                        <Text style={styles.toolLabel}>Mood Track</Text>
                    </View>
                    <View style={styles.toolItem}>
                        <Ionicons name="book-outline" size={24} color="#8B5CF6" />
                        <Text style={styles.toolLabel}>Journal</Text>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

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
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Set Alarm</Text>

                        <View style={styles.pickerContainer}>
                            <DateTimePicker
                                value={tempDate}
                                mode="time"
                                is24Hour={false}
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(event, selectedDate) => {
                                    if (selectedDate) setTempDate(selectedDate);
                                }}
                                textColor="#111827"
                                style={styles.datePicker}
                            />
                        </View>

                        <View style={styles.repeatRow}>
                            <View>
                                <Text style={styles.repeatTitle}>Repeat Everyday</Text>
                                <Text style={styles.repeatSubtitle}>Alarm triggers daily at this time</Text>
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
                                <Text style={styles.cancelButtonText}>Cancel</Text>
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
        backgroundColor: '#F9FAFB',
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
        color: '#111827',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 18,
        color: '#6B7280',
        marginTop: 4,
    },
    sectionCard: {
        backgroundColor: 'white',
        borderRadius: 28,
        padding: 24,
        marginBottom: 20,
        shadowColor: '#000',
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
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    repeatBadge: {
        fontSize: 12,
        fontWeight: '600',
        color: '#10B981',
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    badgeRow: {
        flexDirection: 'row',
        marginTop: 4,
        gap: 8,
    },
    disabledBadge: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
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
        color: '#111827',
    },
    statusValue: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    alarmDisplay: {
        alignItems: 'center',
        marginBottom: 24,
    },
    alarmValue: {
        fontSize: width > 400 ? 56 : 48, // Responsive sizing
        fontWeight: '800',
        color: '#111827',
        letterSpacing: -1,
    },
    disabledValue: {
        color: '#D1D5DB',
    },
    remainingText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#10B981',
        marginTop: 4,
    },
    disabledText: {
        color: '#9CA3AF',
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
        color: '#111827',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
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
        backgroundColor: '#F3F4F6',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 8,
    },
    resetButtonText: {
        color: '#4B5563',
        fontSize: 16,
        fontWeight: '700',
    },
    toolsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    toolItem: {
        width: (width - 64) / 2,
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
    },
    toolLabel: {
        marginTop: 12,
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 28,
        padding: 24,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111827',
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
        borderColor: '#F3F4F6',
        marginBottom: 24,
    },
    repeatTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    repeatSubtitle: {
        fontSize: 12,
        color: '#6B7280',
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
        color: '#6B7280',
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
    }
});
