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
    },

    /**
     * Get settings
     */
    async getSettings() {
        try {
            const jsonValue = await AsyncStorage.getItem('@settings_data');
            return jsonValue != null ? JSON.parse(jsonValue) : null;
        } catch (e) {
            console.error('Error reading settings', e);
            return null;
        }
    },

    /**
     * Save settings
     */
    async saveSettings(settings) {
        try {
            const jsonValue = JSON.stringify(settings);
            await AsyncStorage.setItem('@settings_data', jsonValue);
        } catch (e) {
            console.error('Error saving settings', e);
        }
    },

    /**
     * Get all notes
     */
    async getNotes() {
        try {
            const jsonValue = await AsyncStorage.getItem('@notes_data');
            return jsonValue != null ? JSON.parse(jsonValue) : [];
        } catch (e) {
            console.error('Error reading notes', e);
            return [];
        }
    },

    /**
     * Save all notes
     */
    async saveNotes(notes) {
        try {
            const jsonValue = JSON.stringify(notes);
            await AsyncStorage.setItem('@notes_data', jsonValue);
        } catch (e) {
            console.error('Error saving notes', e);
        }
    },

    /**
     * Add a new note
     * noteData: { title, content, tags }
     */
    async addNote(noteData) {
        const notes = await this.getNotes();
        const newNote = {
            id: Date.now().toString(),
            title: noteData.title || '',
            content: noteData.content || (typeof noteData === 'string' ? noteData : ''),
            tags: noteData.tags || [],
            createdAt: new Date().toISOString(),
        };
        const newNotes = [newNote, ...notes];
        await this.saveNotes(newNotes);
        return newNotes;
    },

    /**
     * Delete a note
     */
    async deleteNote(noteId) {
        const notes = await this.getNotes();
        const updatedNotes = notes.filter(note => note.id !== noteId);
        await this.saveNotes(updatedNotes);
        return updatedNotes;
    },

    /**
     * Update an existing note
     */
    async updateNote(noteId, updates) {
        const notes = await this.getNotes();
        const updatedNotes = notes.map(note => {
            if (note.id === noteId) {
                return { ...note, ...updates };
            }
            return note;
        });
        await this.saveNotes(updatedNotes);
        return updatedNotes;
    },

    /**
     * Get all projects
     */
    async getProjects() {
        try {
            const jsonValue = await AsyncStorage.getItem('@projects_data');
            return jsonValue != null ? JSON.parse(jsonValue) : [];
        } catch (e) {
            console.error('Error reading projects', e);
            return [];
        }
    },

    /**
     * Save all projects
     */
    async saveProjects(projects) {
        try {
            const jsonValue = JSON.stringify(projects);
            await AsyncStorage.setItem('@projects_data', jsonValue);
        } catch (e) {
            console.error('Error saving projects', e);
        }
    },

    /**
     * Add a new project
     * project: { name, durationDays }
     */
    async addProject(projectData) {
        const projects = await this.getProjects();
        const newProject = {
            id: Date.now().toString(),
            name: projectData.name,
            durationDays: parseInt(projectData.durationDays, 10),
            createdAt: new Date().toISOString(),
        };
        const newProjects = [newProject, ...projects];
        await this.saveProjects(newProjects);
        return newProjects;
    },

    /**
     * Delete a project
     */
    async deleteProject(projectId) {
        const projects = await this.getProjects();
        const updatedProjects = projects.filter(p => p.id !== projectId);
        await this.saveProjects(updatedProjects);
        return updatedProjects;
    },

    /**
     * Update an existing project
     */
    async updateProject(projectId, updates) {
        const projects = await this.getProjects();
        const updatedProjects = projects.map(project => {
            if (project.id === projectId) {
                return { ...project, ...updates };
            }
            return project;
        });
        await this.saveProjects(updatedProjects);
        return updatedProjects;
    },

    /**
     * Get all focus sessions
     */
    async getFocusSessions() {
        try {
            const jsonValue = await AsyncStorage.getItem('@focus_sessions');
            return jsonValue != null ? JSON.parse(jsonValue) : [];
        } catch (e) {
            console.error('Error reading focus sessions', e);
            return [];
        }
    },

    /**
     * Save all focus sessions
     */
    async saveFocusSessions(sessions) {
        try {
            const jsonValue = JSON.stringify(sessions);
            await AsyncStorage.setItem('@focus_sessions', jsonValue);
        } catch (e) {
            console.error('Error saving focus sessions', e);
        }
    },

    /**
     * Add a new focus session
     */
    async addFocusSession(sessionData) {
        const sessions = await this.getFocusSessions();
        const newSession = {
            id: Date.now().toString(),
            title: sessionData.title,
            duration: sessionData.duration, // in milliseconds
            createdAt: new Date().toISOString(),
        };
        const newSessions = [newSession, ...sessions];
        await this.saveFocusSessions(newSessions);
        return newSessions;
    },

    /**
     * Delete a focus session
     */
    async deleteFocusSession(sessionId) {
        const sessions = await this.getFocusSessions();
        const updatedSessions = sessions.filter(s => s.id !== sessionId);
        await this.saveFocusSessions(updatedSessions);
        return updatedSessions;
    },

    /**
     * Get onboarding status
     */
    async getHasCompletedOnboarding() {
        try {
            const jsonValue = await AsyncStorage.getItem('@has_completed_onboarding');
            return jsonValue != null ? JSON.parse(jsonValue) : false;
        } catch (e) {
            console.error('Error reading onboarding status', e);
            return false;
        }
    },

    /**
     * Save onboarding status
     */
    async saveHasCompletedOnboarding(status) {
        try {
            const jsonValue = JSON.stringify(status);
            await AsyncStorage.setItem('@has_completed_onboarding', jsonValue);
        } catch (e) {
            console.error('Error saving onboarding status', e);
        }
    }

};
