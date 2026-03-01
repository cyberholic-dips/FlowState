import { useCallback, useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import { NotificationService } from '../../utils/NotificationService';

export function useReminders() {
    const [reminders, setReminders] = useState([]);
    const [isAlarmTriggered, setIsAlarmTriggered] = useState(false);
    const [activeReminder, setActiveReminder] = useState(null);
    const alarmSoundRef = useRef(null);

    const playAlarmSound = useCallback(async () => {
        try {
            if (alarmSoundRef.current) {
                await alarmSoundRef.current.unloadAsync();
            }

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

            alarmSoundRef.current = newSound;
            await newSound.playAsync();
        } catch (error) {
            console.error('Error playing sound', error);
        }
    }, []);

    const stopAlarmSound = useCallback(async () => {
        setIsAlarmTriggered(false);
        setActiveReminder(null);

        if (!alarmSoundRef.current) {return;}

        try {
            await alarmSoundRef.current.stopAsync();
            await alarmSoundRef.current.unloadAsync();
        } catch (error) {
            // ignore cleanup failures
        }

        alarmSoundRef.current = null;
    }, []);

    const triggerReminder = useCallback(async (reminder) => {
        setIsAlarmTriggered(true);
        setActiveReminder(reminder);
        playAlarmSound();

        setReminders((prev) =>
            prev.map((r) => (r.id === reminder.id ? { ...r, triggered: true } : r))
        );
    }, [playAlarmSound]);

    useEffect(() => {
        const checkReminders = () => {
            if (isAlarmTriggered) {return;}

            const now = new Date();
            reminders.forEach((reminder) => {
                if (reminder.enabled && !reminder.triggered) {
                    const [hrs, mins] = reminder.time.split(':').map(Number);
                    const target = new Date();
                    target.setHours(hrs, mins, 0, 0);

                    const diff = target - now;
                    if (diff < 1000 && diff > -1000) {
                        triggerReminder(reminder);
                    }
                }
            });
        };

        const timer = setInterval(checkReminders, 1000);
        return () => clearInterval(timer);
    }, [reminders, isAlarmTriggered, triggerReminder]);

    const scheduleNotification = useCallback(async (reminder) => {
        if (!NotificationService.isAvailable()) {
            return;
        }

        try {
            const [hrs, mins] = reminder.time.split(':').map(Number);
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'FlowState Reminder! 🔔',
                    body: reminder.title ? `Time for: ${reminder.title}` : 'Your scheduled reminder is here!',
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.MAX,
                },
                trigger: {
                    hour: hrs,
                    minute: mins,
                    repeats: reminder.repeats,
                },
            });
        } catch (error) {
            // no-op
        }
    }, []);

    const addReminder = useCallback((reminder) => {
        const newReminder = {
            id: Date.now().toString(),
            enabled: true,
            triggered: false,
            ...reminder,
        };

        setReminders((prev) => [...prev, newReminder]);
        scheduleNotification(newReminder);
    }, [scheduleNotification]);

    useEffect(() => {
        return () => {
            if (alarmSoundRef.current) {
                alarmSoundRef.current.stopAsync().catch(() => { });
                alarmSoundRef.current.unloadAsync().catch(() => { });
                alarmSoundRef.current = null;
            }
        };
    }, []);

    return {
        reminders,
        isAlarmTriggered,
        activeReminder,
        addReminder,
        stopAlarmSound,
    };
}
