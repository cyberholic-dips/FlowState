import AsyncStorage from '@react-native-async-storage/async-storage';

const HABITS_KEY = '@habits_data';

export const storage = {
    /**
     * Get all habits from storage
     */
    async getHabits() {
        try {
            const jsonValue = await AsyncStorage.getItem(HABITS_KEY);
            return jsonValue != null ? JSON.parse(jsonValue) : [];
        } catch (e) {
            console.error('Error reading habits', e);
            return [];
        }
    },

    /**
     * Save all habits to storage
     */
    async saveHabits(habits) {
        try {
            const jsonValue = JSON.stringify(habits);
            await AsyncStorage.setItem(HABITS_KEY, jsonValue);
        } catch (e) {
            console.error('Error saving habits', e);
        }
    },

    /**
     * Add a new habit
     */
    async addHabit(habit) {
        const habits = await this.getHabits();
        const newHabits = [...habits, { ...habit, id: Date.now().toString(), streak: 0, completedDates: [] }];
        await this.saveHabits(newHabits);
        return newHabits;
    },

    /**
     * Toggle habit completion for today
     */
    async toggleHabitCompletion(habitId) {
        const habits = await this.getHabits();
        const today = new Date().toISOString().split('T')[0];

        const updatedHabits = habits.map(habit => {
            if (habit.id === habitId) {
                const completedDates = habit.completedDates || [];
                const isCompleted = completedDates.includes(today);

                let newCompletedDates;
                let newStreak = habit.streak || 0;

                if (isCompleted) {
                    newCompletedDates = completedDates.filter(date => date !== today);
                    newStreak = Math.max(0, newStreak - 1);
                } else {
                    newCompletedDates = [...completedDates, today];
                    newStreak += 1;
                }

                return { ...habit, completedDates: newCompletedDates, streak: newStreak };
            }
            return habit;
        });

        await this.saveHabits(updatedHabits);
        return updatedHabits;
    },

    /**
     * Update an existing habit
     */
    async updateHabit(habitId, updates) {
        const habits = await this.getHabits();
        const updatedHabits = habits.map(habit => {
            if (habit.id === habitId) {
                return { ...habit, ...updates };
            }
            return habit;
        });
        await this.saveHabits(updatedHabits);
        return updatedHabits;
    },

    /**
     * Delete a habit
     */
    async deleteHabit(habitId) {
        const habits = await this.getHabits();
        const updatedHabits = habits.filter(habit => habit.id !== habitId);
        await this.saveHabits(updatedHabits);
        return updatedHabits;
    }
};
