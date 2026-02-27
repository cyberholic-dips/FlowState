import React, { createContext, useContext, useEffect } from 'react';
import { NotificationService } from '../utils/NotificationService';
import { useClock } from './time/useClock';
import { useFocusTimer } from './time/useFocusTimer';
import { useReminders } from './time/useReminders';

const TimeContext = createContext();

export const TimeProvider = ({ children }) => {
    const { currentTime } = useClock();
    const {
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
    } = useFocusTimer();
    const {
        reminders,
        isAlarmTriggered,
        activeReminder,
        addReminder,
        stopAlarmSound,
    } = useReminders();

    // Initial permission request
    useEffect(() => {
        NotificationService.requestPermissions();
    }, []);

    return (
        <TimeContext.Provider
            value={{
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
                playSuccessChime,
            }}
        >
            {children}
        </TimeContext.Provider>
    );
};

export const useTime = () => useContext(TimeContext);
