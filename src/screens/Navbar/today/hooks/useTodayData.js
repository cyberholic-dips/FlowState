import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import { storage } from '../../../../utils/storage';
import { syncHabitsToWidget } from '../../../../utils/widgetSync';
import { NotificationService } from '../../../../utils/NotificationService';

const LIFE_SETTINGS_KEY = 'lifeIndex';
const DEFAULT_LIFE_EXPECTANCY = 75;
export const HABIT_FREQUENCY_OPTIONS = ['Daily', 'Weekdays', 'Weekly'];
export const HABIT_PRIORITY_OPTIONS = ['Low', 'Medium', 'High'];
export const HABIT_CATEGORY_OPTIONS = ['Health', 'Learning', 'Work', 'Mindset', 'Custom'];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const yearsSince = (start, end = new Date()) => {
    const ms = new Date(end).getTime() - new Date(start).getTime();
    return ms / (1000 * 60 * 60 * 24 * 365.2425);
};

export function useTodayData({ playSuccessChime }) {
    const [habits, setHabits] = useState([]);
    const [today, setToday] = useState(new Date());
    const [projects, setProjects] = useState([]);
    const [loadingHabits, setLoadingHabits] = useState(false);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [habitsError, setHabitsError] = useState(null);
    const [projectsError, setProjectsError] = useState(null);

    const [quote, setQuote] = useState(null);
    const [loadingQuote, setLoadingQuote] = useState(true);
    const [quoteError, setQuoteError] = useState(null);
    const [lifeWidget, setLifeWidget] = useState({
        birthDate: null,
        lifeExpectancy: DEFAULT_LIFE_EXPECTANCY,
        ageYears: 0,
        remainingYears: DEFAULT_LIFE_EXPECTANCY,
        passedPercent: 0,
    });

    const [isHabitModalVisible, setIsHabitModalVisible] = useState(false);
    const [newHabitName, setNewHabitName] = useState('');
    const [editingHabitId, setEditingHabitId] = useState(null);
    const [habitFrequency, setHabitFrequency] = useState(HABIT_FREQUENCY_OPTIONS[0]);
    const [habitPriority, setHabitPriority] = useState(HABIT_PRIORITY_OPTIONS[1]);
    const [habitCategory, setHabitCategory] = useState(HABIT_CATEGORY_OPTIONS[0]);

    const [isProjectModalVisible, setIsProjectModalVisible] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDuration, setNewProjectDuration] = useState('');
    const [editingProjectId, setEditingProjectId] = useState(null);

    const [showConfetti, setShowConfetti] = useState(false);

    const currentDateStr = today.toISOString().split('T')[0];

    const loadHabits = useCallback(async () => {
        setLoadingHabits(true);
        setHabitsError(null);
        try {
            const storedHabits = await storage.getHabits();
            setHabits(storedHabits);
        } catch (error) {
            setHabitsError('Could not load habits right now.');
            setHabits([]);
        } finally {
            setLoadingHabits(false);
        }
    }, []);

    const loadProjects = useCallback(async () => {
        setLoadingProjects(true);
        setProjectsError(null);
        try {
            const storedProjects = await storage.getProjects();
            setProjects(storedProjects);
        } catch (error) {
            setProjectsError('Could not load tasks right now.');
            setProjects([]);
        } finally {
            setLoadingProjects(false);
        }
    }, []);

    const loadLifeWidget = useCallback(async () => {
        try {
            const settings = await storage.getSettings();
            const saved = settings?.[LIFE_SETTINGS_KEY];
            const birthDate = saved?.birthDate ? new Date(saved.birthDate) : null;
            const lifeExpectancy = clamp(
                typeof saved?.lifeExpectancy === 'number' ? saved.lifeExpectancy : DEFAULT_LIFE_EXPECTANCY,
                30,
                120
            );
            const ageYears = birthDate ? clamp(yearsSince(birthDate), 0, 130) : 0;
            const passedPercent = clamp((ageYears / lifeExpectancy) * 100, 0, 100);
            const remainingYears = clamp(lifeExpectancy - ageYears, 0, 120);

            setLifeWidget({
                birthDate: birthDate ? birthDate.toISOString() : null,
                lifeExpectancy,
                ageYears,
                remainingYears,
                passedPercent,
            });
        } catch (error) {
            setLifeWidget({
                birthDate: null,
                lifeExpectancy: DEFAULT_LIFE_EXPECTANCY,
                ageYears: 0,
                remainingYears: DEFAULT_LIFE_EXPECTANCY,
                passedPercent: 0,
            });
        }
    }, []);

    const fetchQuote = useCallback(async () => {
        setLoadingQuote(true);
        setQuoteError(null);
        try {
            const response = await fetch('https://zenquotes.io/api/today');
            const data = await response.json();
            if (data && data.length > 0) {
                setQuote(data[0]);
                return;
            }

            setQuoteError('No quote available right now.');
            setQuote(null);
        } catch (error) {
            console.error('Failed to fetch quote', error);
            setQuoteError('Quote service is unavailable at the moment.');
            setQuote({
                q: 'Success is not final, failure is not fatal: it is the courage to continue that counts.',
                a: 'Winston Churchill',
            });
        } finally {
            setLoadingQuote(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadHabits();
            loadProjects();
            loadLifeWidget();
            setToday(new Date());
        }, [loadHabits, loadProjects, loadLifeWidget])
    );

    useEffect(() => {
        fetchQuote();
    }, [fetchQuote]);

    useEffect(() => {
        syncHabitsToWidget({ habits, dateStr: currentDateStr });
    }, [habits, currentDateStr]);

    useEffect(() => {
        NotificationService.syncFixedDailyHabitReminders(habits.length > 0).catch(() => null);
    }, [habits.length]);

    const isCompleted = useCallback((habit) => {
        return habit.completedDates && habit.completedDates.includes(currentDateStr);
    }, [currentDateStr]);

    const completedCount = useMemo(() => habits.filter(isCompleted).length, [habits, isCompleted]);

    const weekDays = useMemo(() => {
        const days = [];
        for (let i = -3; i <= 3; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            days.push(d);
        }
        return days;
    }, [today]);

    const closeHabitModal = useCallback(() => {
        setIsHabitModalVisible(false);
        setNewHabitName('');
        setHabitFrequency(HABIT_FREQUENCY_OPTIONS[0]);
        setHabitPriority(HABIT_PRIORITY_OPTIONS[1]);
        setHabitCategory(HABIT_CATEGORY_OPTIONS[0]);
        setEditingHabitId(null);
    }, []);

    const openCreateHabitModal = useCallback(() => {
        closeHabitModal();
        setIsHabitModalVisible(true);
    }, [closeHabitModal]);

    const openEditModal = useCallback((habit) => {
        if (!habit) return;
        setEditingHabitId(habit.id);
        setNewHabitName(habit.name);
        setHabitFrequency(habit.frequency || HABIT_FREQUENCY_OPTIONS[0]);
        setHabitPriority(habit.priority || HABIT_PRIORITY_OPTIONS[1]);
        setHabitCategory(habit.category || HABIT_CATEGORY_OPTIONS[0]);
        setIsHabitModalVisible(true);
    }, []);

    const toggleHabit = useCallback(async (id) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const updatedHabits = await storage.toggleHabitCompletion(id);
        setHabits(updatedHabits);

        const habitToggledToCompleted = updatedHabits.some((h) => h.id === id && h.completedDates?.includes(currentDateStr));
        if (habitToggledToCompleted) {
            playSuccessChime();
            const allCompleted = updatedHabits.every((h) => h.completedDates?.includes(currentDateStr));
            if (updatedHabits.length > 0 && allCompleted) {
                setShowConfetti(true);
            }
        }
    }, [currentDateStr, playSuccessChime]);

    const handleAddOrUpdateHabit = useCallback(async () => {
        if (!newHabitName.trim()) return;

        try {
            setHabitsError(null);
            let updatedHabits;
            const habitPayload = {
                name: newHabitName,
                frequency: habitFrequency,
                priority: habitPriority,
                category: habitCategory,
            };
            if (editingHabitId) {
                updatedHabits = await storage.updateHabit(editingHabitId, habitPayload);
            } else {
                updatedHabits = await storage.addHabit(habitPayload);
            }

            // Update UI immediately after create/edit so widgets and sections refresh without re-focus.
            setHabits(updatedHabits);

            closeHabitModal();
        } catch (error) {
            setHabitsError('Could not save this habit.');
        }
    }, [newHabitName, editingHabitId, habitFrequency, habitPriority, habitCategory, closeHabitModal]);

    const handleDeleteHabit = useCallback(async (id) => {
        if (!id) return;

        Alert.alert(
            'Delete Habit',
            'Are you sure you want to delete this habit? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setHabitsError(null);
                            const updatedHabits = await storage.deleteHabit(id);
                            setHabits(updatedHabits);
                        } catch (error) {
                            setHabitsError('Could not delete this habit.');
                        }
                    },
                },
            ]
        );
    }, []);

    const addHabitFromTemplate = useCallback(async (name) => {
        const cleanName = (name || '').trim();
        if (!cleanName) return;

        try {
            setHabitsError(null);
            const updatedHabits = await storage.addHabit({
                name: cleanName,
                frequency: HABIT_FREQUENCY_OPTIONS[0],
                priority: HABIT_PRIORITY_OPTIONS[1],
                category: HABIT_CATEGORY_OPTIONS[0],
            });
            setHabits(updatedHabits);
        } catch (error) {
            setHabitsError('Could not add this habit right now.');
        }
    }, []);

    const closeProjectModal = useCallback(() => {
        setIsProjectModalVisible(false);
        setNewProjectName('');
        setNewProjectDuration('');
        setEditingProjectId(null);
    }, []);

    const openCreateProjectModal = useCallback(() => {
        closeProjectModal();
        setIsProjectModalVisible(true);
    }, [closeProjectModal]);

    const openEditProjectModal = useCallback((project) => {
        if (!project) return;
        setEditingProjectId(project.id);
        setNewProjectName(project.name || '');
        setNewProjectDuration(String(project.durationDays || ''));
        setIsProjectModalVisible(true);
    }, []);

    const handleAddOrUpdateProject = useCallback(async () => {
        if (!newProjectName.trim() || !newProjectDuration.trim()) return;
        const parsedDuration = parseInt(newProjectDuration, 10);
        if (Number.isNaN(parsedDuration) || parsedDuration <= 0) {
            setProjectsError('Duration must be a valid number of days.');
            return;
        }

        try {
            setProjectsError(null);
            const updatedProjects = editingProjectId
                ? await storage.updateProject(editingProjectId, {
                    name: newProjectName.trim(),
                    durationDays: parsedDuration,
                })
                : await storage.addProject({
                    name: newProjectName.trim(),
                    durationDays: parsedDuration,
                });

            setProjects(updatedProjects);
            closeProjectModal();
        } catch (error) {
            setProjectsError('Could not save this task.');
        }
    }, [newProjectName, newProjectDuration, editingProjectId, closeProjectModal]);

    const handleDeleteProject = useCallback((id) => {
        Alert.alert(
            'Delete Task',
            'Are you sure you want to delete this task?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setProjectsError(null);
                            const updatedProjects = await storage.deleteProject(id);
                            setProjects(updatedProjects);
                        } catch (error) {
                            setProjectsError('Could not delete this task.');
                        }
                    },
                },
            ]
        );
    }, []);

    const handleCompleteProject = useCallback(async (id) => {
        if (!id) return;
        try {
            setProjectsError(null);
            const updatedProjects = await storage.deleteProject(id);
            setProjects(updatedProjects);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            setProjectsError('Could not complete this task.');
        }
    }, []);

    const calculateDaysLeft = useCallback((project) => {
        const createdDate = new Date(project.createdAt);
        const deadlineDate = new Date(createdDate);
        deadlineDate.setDate(createdDate.getDate() + project.durationDays);

        const now = new Date();
        const diffTime = deadlineDate - now;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }, []);

    const getDaysLeftColor = useCallback((days) => {
        if (days > 3) return '#10B981';
        if (days > 1) return '#F59E0B';
        return '#EF4444';
    }, []);

    return {
        habits,
        today,
        projects,
        loadingHabits,
        loadingProjects,
        habitsError,
        projectsError,
        quote,
        loadingQuote,
        quoteError,
        lifeWidget,
        weekDays,
        completedCount,
        isCompleted,

        isHabitModalVisible,
        newHabitName,
        setNewHabitName,
        editingHabitId,
        habitFrequency,
        setHabitFrequency,
        habitPriority,
        setHabitPriority,
        habitCategory,
        setHabitCategory,
        habitFrequencyOptions: HABIT_FREQUENCY_OPTIONS,
        habitPriorityOptions: HABIT_PRIORITY_OPTIONS,
        habitCategoryOptions: HABIT_CATEGORY_OPTIONS,

        isProjectModalVisible,
        editingProjectId,
        newProjectName,
        setNewProjectName,
        newProjectDuration,
        setNewProjectDuration,

        showConfetti,
        setShowConfetti,

        openCreateHabitModal,
        closeHabitModal,
        loadHabits,
        loadProjects,
        fetchQuote,
        openEditModal,
        toggleHabit,
        handleAddOrUpdateHabit,
        handleDeleteHabit,
        addHabitFromTemplate,

        openCreateProjectModal,
        closeProjectModal,
        openEditProjectModal,
        handleAddOrUpdateProject,
        handleCompleteProject,
        handleDeleteProject,
        calculateDaysLeft,
        getDaysLeftColor,
    };
}
