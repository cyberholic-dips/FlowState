import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications should be handled when the app is foregrounded
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export const NotificationService = {
    /**
     * Request permissions for notifications
     */
    async requestPermissions() {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            return false;
        }

        if (Platform.OS === 'android') {
            Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        return true;
    },

    /**
     * Schedule a daily reminder for a habit
     * @param {string} habitId 
     * @param {string} habitName 
     * @param {string} timeString "HH:mm"
     */
    async scheduleHabitReminder(habitId, habitName, timeString) {
        if (!timeString) return null;

        const [hours, minutes] = timeString.split(':').map(Number);

        // Cancel existing notification for this habit if any
        await this.cancelNotification(`habit-${habitId}`);

        const identifier = await Notifications.scheduleNotificationAsync({
            content: {
                title: "Habit Reminder! 🌿",
                body: `It's time for: ${habitName}`,
                data: { type: 'habit', habitId },
                sound: true,
            },
            trigger: {
                hour: hours,
                minute: minutes,
                repeats: true,
            },
        });

        return identifier;
    },

    /**
     * Schedule a one-time notification for focus session completion
     * @param {string} sessionTitle 
     * @param {number} secondsFromNow 
     */
    async scheduleFocusCompletion(sessionTitle, secondsFromNow) {
        if (secondsFromNow <= 0) return null;

        const identifier = await Notifications.scheduleNotificationAsync({
            content: {
                title: "Focus Target Reached! 🎯",
                body: `Great job! You've completed your session: ${sessionTitle}`,
                data: { type: 'focus' },
                sound: true,
            },
            trigger: {
                seconds: secondsFromNow,
            },
        });

        return identifier;
    },

    /**
     * Show an ongoing notification for an active focus session
     * @param {string} sessionTitle 
     */
    async showOngoingFocusNotification(sessionTitle) {
        const identifier = await Notifications.scheduleNotificationAsync({
            content: {
                title: "Focus Session Active ⚡",
                body: `Focusing on: ${sessionTitle}`,
                data: { type: 'focus-ongoing' },
                sticky: true, // Android: prevent dismissal
                priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: null, // immediate
        });
        return identifier;
    },

    /**
     * Dismiss the ongoing focus notification
     * @param {string} identifier 
     */
    async dismissFocusNotification(identifier) {
        if (!identifier) return;
        await Notifications.dismissNotificationAsync(identifier);
        await Notifications.cancelScheduledNotificationAsync(identifier);
    },

    /**
     * Cancel a specific notification
     * @param {string} identifier 
     */
    async cancelNotification(identifier) {
        if (!identifier) return;
        await Notifications.cancelScheduledNotificationAsync(identifier);
    },

    /**
     * Cancel all scheduled notifications
     */
    async cancelAll() {
        await Notifications.cancelAllScheduledNotificationsAsync();
    }
};
