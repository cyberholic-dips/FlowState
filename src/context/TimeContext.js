import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { storage } from '../utils/storage';
import { NotificationService } from '../utils/NotificationService';

const TimeContext = createContext();

export const TimeProvider = ({ children }) => {
    // Shared Clock System
    const [currentTime, setCurrentTime] = useState(new Date());

    // Focus State
    const [focusTime, setFocusTime] = useState(0);
    const [isFocusRunning, setIsFocusRunning] = useState(false);
    const [focusTitle, setFocusTitle] = useState('');
    const focusInterval = useRef(null);
    const focusNotificationId = useRef(null);

    // Reminder State
    const [reminders, setReminders] = useState([]);
    const [isAlarmTriggered, setIsAlarmTriggered] = useState(false);
    const [activeReminder, setActiveReminder] = useState(null);
    const [sound, setSound] = useState(null);

    // Audio Enhancements State
    const [isWhiteNoiseEnabled, setIsWhiteNoiseEnabled] = useState(false);
    const [ambientSoundObj, setAmbientSoundObj] = useState(null);

    // Play Success Chime
    const playSuccessChime = async () => {
        try {
            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                staysActiveInBackground: true,
                shouldDuckAndroid: true,
            });
            const { sound: chimeSound } = await Audio.Sound.createAsync(
                { uri: 'https://actions.google.com/sounds/v1/cartoon/magic_chime.ogg' },
                { shouldPlay: true, volume: 1.0 }
            );
            // Auto unload after playing
            chimeSound.setOnPlaybackStatusUpdate((status) => {
                if (status.didJustFinish) {
                    chimeSound.unloadAsync();
                }
            });
        } catch (error) {
            console.error('Error playing success chime', error);
        }
    };

    const toggleWhiteNoise = () => {
        setIsWhiteNoiseEnabled(prev => !prev);
    };

    // Tick the clock every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Initial permission request
    useEffect(() => {
        NotificationService.requestPermissions();
    }, []);

    // Focus Timer Engine
    useEffect(() => {
        if (isFocusRunning) {
            focusInterval.current = setInterval(() => {
                setFocusTime(prev => prev + 1000);
            }, 1000);
        } else {
            clearInterval(focusInterval.current);
        }
        return () => clearInterval(focusInterval.current);
    }, [isFocusRunning]);

    // Reminder Engine - Checks every second
    useEffect(() => {
        const checkReminders = () => {
            if (isAlarmTriggered) return;

            const now = new Date();
            reminders.forEach(reminder => {
                if (reminder.enabled && !reminder.triggered) {
                    const [hrs, mins] = reminder.time.split(':').map(Number);
                    const target = new Date();
                    target.setHours(hrs, mins, 0, 0);

                    // If time has passed today, it triggers
                    const diff = target - now;
                    if (diff < 1000 && diff > -1000) {
                        triggerReminder(reminder);
                    }
                }
            });
        };

        const timer = setInterval(checkReminders, 1000);
        return () => clearInterval(timer);
    }, [reminders, isAlarmTriggered]);

    const triggerReminder = async (reminder) => {
        setIsAlarmTriggered(true);
        setActiveReminder(reminder);
        playAlarmSound();

        // Update reminder state to triggered
        setReminders(prev => prev.map(r =>
            r.id === reminder.id ? { ...r, triggered: true } : r
        ));
    };

    const playAlarmSound = async () => {
        try {
            if (sound) await sound.unloadAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                shouldDuckAndroid: true,
                staysActiveInBackground: true,
                playThroughEarpieceAndroid: false,
            });
            const { sound: newSound } = await Audio.Sound.createAsync(
                require('../../Alarm/Alarm.mp3'),
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
        setActiveReminder(null);
        if (sound) {
            try {
                await sound.stopAsync();
                await sound.unloadAsync();
            } catch (e) { }
            setSound(null);
        }
    };

    const addReminder = (reminder) => {
        const newReminder = {
            id: Date.now().toString(),
            enabled: true,
            triggered: false,
            ...reminder
        };
        setReminders(prev => [...prev, newReminder]);
        scheduleNotification(newReminder);
    };

    const scheduleNotification = async (reminder) => {
        const [hrs, mins] = reminder.time.split(':').map(Number);
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "FlowState Reminder! 🔔",
                body: reminder.title ? `Time for: ${reminder.title}` : "Your scheduled reminder is here!",
                sound: true,
                priority: Notifications.AndroidNotificationPriority.MAX,
            },
            trigger: {
                hour: hrs,
                minute: mins,
                repeats: reminder.repeats,
            },
        });
    };

    const startFocus = async (title, targetSeconds) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setFocusTitle(title);
        setIsFocusRunning(true);

        // Handle Ambient Noise
        if (isWhiteNoiseEnabled) {
            try {
                await Audio.setAudioModeAsync({
                    playsInSilentModeIOS: true,
                    staysActiveInBackground: true,
                    shouldDuckAndroid: true,
                });
                const { sound: newAmbientSound } = await Audio.Sound.createAsync(
                    { uri: 'https://actions.google.com/sounds/v1/water/rain_on_roof.ogg' },
                    { isLooping: true, volume: 0.3, shouldPlay: true }
                );
                setAmbientSoundObj(newAmbientSound);
            } catch (error) {
                console.error("Failed to start white noise", error);
            }
        }

        // Show ongoing notification
        const id = await NotificationService.showOngoingFocusNotification(title);
        focusNotificationId.current = id;

        if (targetSeconds > 0) {
            NotificationService.scheduleFocusCompletion(title, targetSeconds);
        }
    };

    const stopFocus = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsFocusRunning(false);
        if (focusNotificationId.current) {
            NotificationService.dismissFocusNotification(focusNotificationId.current);
            focusNotificationId.current = null;
        }
        if (ambientSoundObj) {
            try {
                await ambientSoundObj.stopAsync();
                await ambientSoundObj.unloadAsync();
            } catch (e) { }
            setAmbientSoundObj(null);
        }
    };

    const resetFocus = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsFocusRunning(false);
        setFocusTime(0);
        setFocusTitle('');
        if (focusNotificationId.current) {
            NotificationService.dismissFocusNotification(focusNotificationId.current);
            focusNotificationId.current = null;
        }
        if (ambientSoundObj) {
            try {
                await ambientSoundObj.stopAsync();
                await ambientSoundObj.unloadAsync();
            } catch (e) { }
            setAmbientSoundObj(null);
        }
    };

    return (
        <TimeContext.Provider value={{
            currentTime,
            focusTime,
            isFocusRunning,
            focusTitle,
            reminders,
            isAlarmTriggered,
            activeReminder,
            startFocus,
            stopFocus,
            resetFocus,
            addReminder,
            stopAlarmSound,
            setFocusTitle,
            isWhiteNoiseEnabled,
            toggleWhiteNoise,
            playSuccessChime
        }}>
            {children}
        </TimeContext.Provider>
    );
};

export const useTime = () => useContext(TimeContext);
