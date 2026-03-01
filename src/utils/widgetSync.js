import { NativeModules, Platform } from 'react-native';

const widgetModule = NativeModules.WidgetSyncModule;

export const syncHabitsToWidget = async ({ habits, dateStr }) => {
    if (Platform.OS !== 'android' || !widgetModule?.updateHabits) {return;}

    try {
        const payload = (Array.isArray(habits) ? habits : []).map((habit) => {
            const completedDates = Array.isArray(habit.completedDates) ? habit.completedDates : [];
            return {
                id: String(habit.id || ''),
                name: String(habit.name || 'Habit'),
                isCompleted: completedDates.includes(dateStr),
            };
        });

        await widgetModule.updateHabits(JSON.stringify(payload));
    } catch (error) {
        // Fail silently - widget sync should never break app usage.
    }
};
