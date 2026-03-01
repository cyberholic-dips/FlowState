import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { NotificationService } from '../../utils/NotificationService';
import { storage } from '../../utils/storage';

const MIN_RECORDABLE_FOCUS_MS = 25 * 60 * 1000;

export function useFocusTimer() {
    const [focusTime, setFocusTime] = useState(0);
    const [isFocusRunning, setIsFocusRunning] = useState(false);
    const [focusTitle, setFocusTitle] = useState('');
    const [isWhiteNoiseEnabled, setIsWhiteNoiseEnabled] = useState(false);

    const focusInterval = useRef(null);
    const focusNotificationId = useRef(null);
    const ambientSoundRef = useRef(null);

    const playSuccessChime = useCallback(async () => {
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
            chimeSound.setOnPlaybackStatusUpdate((status) => {
                if (status.didJustFinish) {
                    chimeSound.unloadAsync();
                }
            });
        } catch (error) {
            console.error('Error playing success chime', error);
        }
    }, []);

    const stopAmbientNoise = useCallback(async () => {
        const ambient = ambientSoundRef.current;
        if (!ambient) return;

        try {
            await ambient.stopAsync();
            await ambient.unloadAsync();
        } catch (error) {
            // ignore cleanup failures
        }
        ambientSoundRef.current = null;
    }, []);

    const toggleWhiteNoise = useCallback(() => {
        setIsWhiteNoiseEnabled((prev) => !prev);
    }, []);

    useEffect(() => {
        if (isFocusRunning) {
            focusInterval.current = setInterval(() => {
                setFocusTime((prev) => prev + 1000);
            }, 1000);
        } else {
            clearInterval(focusInterval.current);
        }

        return () => clearInterval(focusInterval.current);
    }, [isFocusRunning]);

    const startFocus = useCallback(async (title, targetSeconds) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setFocusTitle(title);
        setIsFocusRunning(true);

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
                ambientSoundRef.current = newAmbientSound;
            } catch (error) {
                console.error('Failed to start white noise', error);
            }
        }

        const id = await NotificationService.showOngoingFocusNotification(title);
        focusNotificationId.current = id;

        if (targetSeconds > 0) {
            NotificationService.scheduleFocusCompletion(title, targetSeconds);
        }
    }, [isWhiteNoiseEnabled]);

    const stopFocus = useCallback(async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsFocusRunning(false);

        if (focusNotificationId.current) {
            NotificationService.dismissFocusNotification(focusNotificationId.current);
            focusNotificationId.current = null;
        }

        await stopAmbientNoise();

        if (focusTime >= MIN_RECORDABLE_FOCUS_MS) {
            await storage.addFocusSession({
                title: focusTitle?.trim() || 'Focus Session',
                duration: focusTime,
            });
        }
    }, [focusTime, focusTitle, stopAmbientNoise]);

    const resetFocus = useCallback(async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsFocusRunning(false);
        setFocusTime(0);
        setFocusTitle('');

        if (focusNotificationId.current) {
            NotificationService.dismissFocusNotification(focusNotificationId.current);
            focusNotificationId.current = null;
        }

        await stopAmbientNoise();
    }, [stopAmbientNoise]);

    useEffect(() => {
        return () => {
            clearInterval(focusInterval.current);
            if (focusNotificationId.current) {
                NotificationService.dismissFocusNotification(focusNotificationId.current);
                focusNotificationId.current = null;
            }
            stopAmbientNoise();
        };
    }, [stopAmbientNoise]);

    return {
        focusTime,
        isFocusRunning,
        focusTitle,
        startFocus,
        stopFocus,
        resetFocus,
        setFocusTitle,
        isWhiteNoiseEnabled,
        toggleWhiteNoise,
        playSuccessChime,
    };
}
