import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import { storage } from '../../../../utils/storage';
import { NotificationService } from '../../../../utils/NotificationService';

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

    const [isHabitModalVisible, setIsHabitModalVisible] = useState(false);
    const [newHabitName, setNewHabitName] = useState('');
    const [editingHabitId, setEditingHabitId] = useState(null);
    const [isOptionsVisible, setIsOptionsVisible] = useState(false);
    const [selectedHabit, setSelectedHabit] = useState(null);
    const [reminderTime, setReminderTime] = useState('09:00');

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
            if (storedHabits.length === 0) {
                const initialHabits = [
                    { id: '1', name: 'Morning Meditation', streak: 5, completedDates: [currentDateStr] },
                    { id: '2', name: 'Read 20 Pages', streak: 12, completedDates: [] },
                    { id: '3', name: 'Hydration Goal (2L)', streak: 3, completedDates: [currentDateStr] },
                    { id: '4', name: 'Evening Reflection', streak: 0, completedDates: [] },
                    { id: '5', name: 'No Screens after 10PM', streak: 8, completedDates: [] },
                ];
                await storage.saveHabits(initialHabits);
                setHabits(initialHabits);
                return;
            }

            setHabits(storedHabits);
        } catch (error) {
            setHabitsError('Could not load habits right now.');
            setHabits([]);
        } finally {
            setLoadingHabits(false);
        }
    }, [currentDateStr]);

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
            setToday(new Date());
        }, [loadHabits, loadProjects])
    );

    useEffect(() => {
        fetchQuote();
    }, [fetchQuote]);

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
        setReminderTime('09:00');
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
        setReminderTime(habit.reminderTime || '09:00');
        setIsHabitModalVisible(true);
        setIsOptionsVisible(false);
    }, []);

    const openOptions = useCallback((habit) => {
        setSelectedHabit(habit);
        setIsOptionsVisible(true);
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
            if (editingHabitId) {
                updatedHabits = await storage.updateHabit(editingHabitId, { name: newHabitName, reminderTime });
            } else {
                updatedHabits = await storage.addHabit({ name: newHabitName, reminderTime });
            }

            if (reminderTime) {
                const habitId = editingHabitId || updatedHabits[updatedHabits.length - 1].id;
                await NotificationService.scheduleHabitReminder(habitId, newHabitName, reminderTime);
            }

            setHabits(updatedHabits);
            closeHabitModal();
        } catch (error) {
            setHabitsError('Could not save this habit.');
        }
    }, [newHabitName, editingHabitId, reminderTime, closeHabitModal]);

    const handleDeleteHabit = useCallback(async (id) => {
        if (!id) return;

        Alert.alert(
            'Delete Habit',
            'Are you sure you want to delete this habit? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel', onPress: () => setIsOptionsVisible(false) },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setHabitsError(null);
                            await NotificationService.cancelNotification(`habit-${id}`);
                            const updatedHabits = await storage.deleteHabit(id);
                            setHabits(updatedHabits);
                            setIsOptionsVisible(false);
                            setSelectedHabit(null);
                        } catch (error) {
                            setHabitsError('Could not delete this habit.');
                        }
                    },
                },
            ]
        );
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
        weekDays,
        completedCount,
        isCompleted,

        isHabitModalVisible,
        newHabitName,
        setNewHabitName,
        editingHabitId,
        isOptionsVisible,
        setIsOptionsVisible,
        selectedHabit,
        reminderTime,
        setReminderTime,

        isProjectModalVisible,
        setIsProjectModalVisible,
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
        openOptions,
        toggleHabit,
        handleAddOrUpdateHabit,
        handleDeleteHabit,

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
