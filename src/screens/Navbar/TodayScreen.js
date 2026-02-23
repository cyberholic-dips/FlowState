import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Modal, TextInput, KeyboardAvoidingView, Platform, Alert, Image, ActivityIndicator, Switch, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../../utils/storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { useTime } from '../../context/TimeContext';
import { NotificationService } from '../../utils/NotificationService';

const { width } = Dimensions.get('window');

// Helper to get day name
const getDayName = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
};

// Helper to get formatted date suffix
const getOrdinalNum = (n) => {
    return n + (n > 0 ? ['th', 'st', 'nd', 'rd'][(n > 3 && n < 21) || n % 10 > 3 ? 0 : n % 10] : '');
};

const formatDate = (date) => {
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const day = getOrdinalNum(date.getDate());
    return `${month} ${day}`;
};

export default function TodayScreen() {
    const { theme, isDark, toggleTheme } = useTheme();
    const { userData } = useUser();
    const { playSuccessChime } = useTime();
    const [habits, setHabits] = useState([]);
    const [today, setToday] = useState(new Date());
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [newHabitName, setNewHabitName] = useState('');
    const [editingHabitId, setEditingHabitId] = useState(null);
    const [isOptionsVisible, setIsOptionsVisible] = useState(false);
    const [selectedHabit, setSelectedHabit] = useState(null);
    const [reminderTime, setReminderTime] = useState('09:00'); // Default 9 AM
    const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);

    // Project State
    const [projects, setProjects] = useState([]);
    const [isProjectModalVisible, setIsProjectModalVisible] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDuration, setNewProjectDuration] = useState('');

    // Quote State
    const [quote, setQuote] = useState(null);
    const [loadingQuote, setLoadingQuote] = useState(true);

    // Sidebar State
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);

    // Navigation
    const navigation = useNavigation();

    // Confetti State
    const [showConfetti, setShowConfetti] = useState(false);

    // Hide tab bar when sidebar is open
    useEffect(() => {
        navigation.setOptions({
            tabBarStyle: isSidebarVisible ? { display: 'none' } : {
                position: 'absolute',
                bottom: 30,
                left: 20,
                right: 20,
                elevation: 10,
                backgroundColor: theme.tabBar,
                borderRadius: 35,
                height: 70,
                shadowColor: theme.mode === 'dark' ? '#000' : '#475569',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.15,
                shadowRadius: 15,
                borderTopWidth: 1,
                borderTopColor: theme.glassBorder,
                borderLeftWidth: 1,
                borderLeftColor: theme.glassBorder,
                borderRightWidth: 1,
                borderRightColor: theme.glassBorder,
            }
        });
    }, [isSidebarVisible, navigation, theme]);

    // Animations
    const headerScale = useRef(new Animated.Value(1)).current;
    const sidebarX = useRef(new Animated.Value(-width * 0.8)).current;

    // Combined position for gesture support
    const displayX = sidebarX;

    // Dynamic backdrop opacity based on sidebar position
    const dynamicBackdropOpacity = displayX.interpolate({
        inputRange: [-width * 0.8, 0],
        outputRange: [0, 1],
        extrapolate: 'clamp'
    });

    const openSidebar = () => {
        setIsSidebarVisible(true);
        Animated.timing(sidebarX, {
            toValue: 0,
            duration: 300,
            easing: Easing.out(Easing.bezier(0.25, 0.1, 0.25, 1)),
            useNativeDriver: true,
        }).start();
    };

    const closeSidebar = () => {
        Animated.timing(sidebarX, {
            toValue: -width * 0.8,
            duration: 250,
            easing: Easing.in(Easing.bezier(0.25, 0.1, 0.25, 1)),
            useNativeDriver: true,
        }).start(() => {
            setIsSidebarVisible(false);
        });
    };

    const navigateToSection = (screenName) => {
        closeSidebar();
        navigation.navigate(screenName);
    };

    const onHeaderPressIn = () => {
        Animated.spring(headerScale, {
            toValue: 0.96,
            useNativeDriver: true,
        }).start();
    };

    const onHeaderPressOut = () => {
        Animated.spring(headerScale, {
            toValue: 1,
            friction: 4,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    const currentDateStr = today.toISOString().split('T')[0];

    const loadHabits = async () => {
        const storedHabits = await storage.getHabits();
        if (storedHabits.length === 0) {
            // Seed initial data if empty
            const initialHabits = [
                { id: '1', name: 'Morning Meditation', streak: 5, completedDates: [currentDateStr] },
                { id: '2', name: 'Read 20 Pages', streak: 12, completedDates: [] },
                { id: '3', name: 'Hydration Goal (2L)', streak: 3, completedDates: [currentDateStr] },
                { id: '4', name: 'Evening Reflection', streak: 0, completedDates: [] },
                { id: '5', name: 'No Screens after 10PM', streak: 8, completedDates: [] },
            ];
            await storage.saveHabits(initialHabits);
            setHabits(initialHabits);
        } else {
            setHabits(storedHabits);
        }
    };

    const loadProjects = async () => {
        const storedProjects = await storage.getProjects();
        setProjects(storedProjects);
    };

    // Fetch Quote
    const fetchQuote = async () => {
        setLoadingQuote(true);
        try {
            const response = await fetch('https://zenquotes.io/api/today');
            const data = await response.json();
            if (data && data.length > 0) {
                setQuote(data[0]);
            }
        } catch (error) {
            console.error("Failed to fetch quote", error);
            // Fallback quote
            setQuote({ q: "Success is not final, failure is not fatal: it is the courage to continue that counts.", a: "Winston Churchill" });
        } finally {
            setLoadingQuote(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadHabits();
            loadProjects();
            setToday(new Date()); // Update date whenever screen comes into focus
        }, [])
    );

    useEffect(() => {
        fetchQuote();
    }, []);

    const toggleHabit = async (id) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const updatedHabits = await storage.toggleHabitCompletion(id);
        setHabits(updatedHabits);

        // Check if all habits are now completed for the confetti
        const habitToggledToCompleted = updatedHabits.some(h => h.id === id && h.completedDates?.includes(currentDateStr));
        if (habitToggledToCompleted) {
            playSuccessChime(); // Play the satisfying sound
            const allCompleted = updatedHabits.every(h => h.completedDates?.includes(currentDateStr));
            if (updatedHabits.length > 0 && allCompleted) {
                setShowConfetti(true);
            }
        }
    };

    const handleAddOrUpdateHabit = async () => {
        if (newHabitName.trim()) {
            let updatedHabits;
            if (editingHabitId) {
                updatedHabits = await storage.updateHabit(editingHabitId, { name: newHabitName, reminderTime });
            } else {
                updatedHabits = await storage.addHabit({ name: newHabitName, reminderTime });
            }

            // Schedule notification
            if (reminderTime) {
                const habitId = editingHabitId || updatedHabits[updatedHabits.length - 1].id;
                await NotificationService.scheduleHabitReminder(habitId, newHabitName, reminderTime);
            }

            setHabits(updatedHabits);
            closeHabitModal();
        }
    };

    const openEditModal = (habit) => {
        setEditingHabitId(habit.id);
        setNewHabitName(habit.name);
        setReminderTime(habit.reminderTime || '09:00');
        setIsModalVisible(true);
        setIsOptionsVisible(false);
    };

    const closeHabitModal = () => {
        setIsModalVisible(false);
        setNewHabitName('');
        setReminderTime('09:00');
        setEditingHabitId(null);
    };

    const handleDeleteHabit = async (id) => {
        Alert.alert(
            "Delete Habit",
            "Are you sure you want to delete this habit? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel", onPress: () => setIsOptionsVisible(false) },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        await NotificationService.cancelNotification(`habit-${id}`);
                        const updatedHabits = await storage.deleteHabit(id);
                        setHabits(updatedHabits);
                        setIsOptionsVisible(false);
                        setSelectedHabit(null);
                    }
                }
            ]
        );
    };

    const openOptions = (habit) => {
        setSelectedHabit(habit);
        setIsOptionsVisible(true);
    };

    const isCompleted = (habit) => {
        return habit.completedDates && habit.completedDates.includes(currentDateStr);
    };

    const completedCount = habits.filter(isCompleted).length;

    // Generate week days around today
    const getWeekDays = () => {
        const days = [];
        for (let i = -3; i <= 3; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            days.push(d);
        }
        return days;
    };

    const weekDays = getWeekDays();

    // Project Logic
    const handleAddProject = async () => {
        if (!newProjectName.trim() || !newProjectDuration.trim()) return;
        const updatedProjects = await storage.addProject({
            name: newProjectName,
            durationDays: newProjectDuration
        });
        setProjects(updatedProjects);
        setNewProjectName('');
        setNewProjectDuration('');
        setIsProjectModalVisible(false);
    };

    const handleDeleteProject = async (id) => {
        Alert.alert(
            "Delete Task",
            "Are you sure you want to delete this task?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        const updatedProjects = await storage.deleteProject(id);
                        setProjects(updatedProjects);
                    }
                }
            ]
        );
    };

    const calculateDaysLeft = (project) => {
        const createdDate = new Date(project.createdAt);
        const deadlineDate = new Date(createdDate);
        deadlineDate.setDate(createdDate.getDate() + project.durationDays);

        const now = new Date();
        const diffTime = deadlineDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays;
    };

    const getDaysLeftColor = (days) => {
        if (days > 3) return '#10B981'; // Green
        if (days > 1) return '#F59E0B'; // Orange
        return '#EF4444'; // Red
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={{ flex: 1 }}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Header Anchor */}
                    <View style={styles.topAnchorContainer}>
                        <TouchableOpacity
                            style={[styles.todayAnchor, { backgroundColor: theme.card, shadowColor: theme.shadow }]}
                            onPress={openSidebar}
                            activeOpacity={0.8}
                        >
                            <View style={styles.profileSection}>
                                <View style={[styles.avatar, { borderColor: theme.border, borderWidth: 1 }]}>
                                    {userData.profileImage ? (
                                        <Image source={userData.profileImage} style={styles.avatarImage} />
                                    ) : (
                                        <Ionicons name="person" size={20} color={theme.primary} />
                                    )}
                                </View>
                                <View>
                                    <Text style={[styles.dateLabel, { color: theme.text }]}>Today</Text>
                                    <Text style={[styles.dayLabel, { color: theme.subText }]}>{formatDate(today)}</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color={theme.subText} style={{ marginLeft: 8 }} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.addButton, { backgroundColor: theme.primary }]}
                            onPress={() => setIsModalVisible(true)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="add" size={26} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* Greeting */}
                    <View style={styles.greetingContainer}>
                        <Text style={[styles.greeting, { color: theme.text }]}>
                            Hello, {userData.name ? userData.name.split(' ')[0] : 'there'}
                        </Text>
                        <Text style={[styles.subGreeting, { color: theme.subText }]}>
                            Here's what's happening today.
                        </Text>
                    </View>

                    {/* Quote of the Day */}
                    <View style={styles.quoteContainer}>
                        <View style={[styles.quoteCard, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder, borderWidth: 1, shadowColor: theme.shadow }]}>
                            {loadingQuote ? (
                                <ActivityIndicator color={theme.primary} />
                            ) : (
                                <View>
                                    <Text style={[styles.quoteText, { color: theme.text }]}>"{quote?.q}"</Text>
                                    <Text style={[styles.quoteAuthor, { color: theme.primary, fontWeight: '700' }]}>— {quote?.a}</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Week Calendar */}
                    <View style={styles.calendarStrip}>
                        <View style={[styles.weekContainer, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder, borderWidth: 1, shadowColor: theme.shadow }]}>
                            {weekDays.map((date, index) => {
                                const isToday = date.toDateString() === today.toDateString();
                                const hasActivity = (index <= 3); // Simulated activity
                                return (
                                    <TouchableOpacity key={index} style={styles.dayItem} activeOpacity={0.7}>
                                        <Text style={[styles.dayName, { color: isToday ? theme.primary : theme.subText, fontWeight: isToday ? '900' : '600' }]}>
                                            {getDayName(date)}
                                        </Text>
                                        <View style={[styles.dateCircle, isToday && { backgroundColor: theme.primary, shadowColor: theme.primary, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 }]}>
                                            <View style={[styles.dot, { backgroundColor: hasActivity ? (isToday ? 'white' : theme.primary) : 'transparent' }]} />
                                            <Text style={[styles.dateNumber, { color: isToday ? 'white' : theme.text, fontWeight: isToday ? '900' : '600' }]}>
                                                {date.getDate()}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Projects Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>Tasks to Complete</Text>
                            <TouchableOpacity
                                onPress={() => setIsProjectModalVisible(true)}
                                style={[styles.addSectionButton, { backgroundColor: theme.input }]}
                            >
                                <Ionicons name="add" size={20} color={theme.primary} />
                            </TouchableOpacity>
                        </View>

                        {projects.length === 0 ? (
                            <TouchableOpacity
                                onPress={() => setIsProjectModalVisible(true)}
                                style={[styles.emptyProjectCard, { borderColor: theme.border, overflow: 'hidden' }]}
                                activeOpacity={0.6}
                            >
                                <LottieView
                                    source={{ uri: 'https://lottie.host/8111e1ee-b5a8-444a-a035-71be84704871/9yTzX3V9Xo.json' }}
                                    autoPlay
                                    loop
                                    style={{ width: 120, height: 120, marginBottom: 10 }}
                                />
                                <Text style={{ color: theme.subText, fontWeight: '600' }}>Add a project deadline</Text>
                            </TouchableOpacity>
                        ) : (
                            projects.map((project) => {
                                const daysLeft = calculateDaysLeft(project);
                                const daysColor = getDaysLeftColor(daysLeft);
                                const daysText = daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`;

                                return (
                                    <View key={project.id} style={[styles.projectCard, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder, borderWidth: 1, shadowColor: theme.shadow }]}>
                                        <View style={styles.projectInfo}>
                                            <Text style={[styles.projectName, { color: theme.text }]}>{project.name}</Text>
                                            <Text style={[styles.projectDeadlineLabel, { color: theme.subText }]}>
                                                Duration: {project.durationDays} days
                                            </Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <View style={[styles.daysLeftBadge, { backgroundColor: daysColor + '20' }]}>
                                                <LinearGradient
                                                    colors={[daysColor, daysColor + 'CC']}
                                                    style={StyleSheet.absoluteFill}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 1 }}
                                                />
                                                <Text style={[styles.daysLeftText, { color: 'white' }]}>{daysText}</Text>
                                            </View>
                                            <TouchableOpacity
                                                onPress={() => handleDeleteProject(project.id)}
                                                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                                                style={{ marginTop: 10 }}
                                            >
                                                <Ionicons name="trash-outline" size={16} color={theme.subText} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                );
                            })
                        )}
                    </View>

                    {/* Habits Section */}
                    <View style={styles.habitsSection}>
                        <View style={styles.habitsHeader}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>Daily Habits</Text>
                            <View style={[styles.progressBadge, { backgroundColor: theme.success + '15' }]}>
                                <Text style={[styles.progressText, { color: theme.success }]}>{completedCount}/{habits.length} done</Text>
                            </View>
                        </View>

                        {habits.length === 0 && (
                            <View style={[styles.emptyStateContainer, { borderColor: theme.border, borderWidth: 1, backgroundColor: theme.glassBackground }]}>
                                <LottieView
                                    source={{ uri: 'https://lottie.host/b008d5cd-078e-4f32-8df7-cdb1e7f6075c/s1iXoQvSNo.json' }}
                                    autoPlay
                                    loop
                                    style={{ width: 180, height: 180 }}
                                />
                                <Text style={[styles.emptyStateTitle, { color: theme.text }]}>Start Your Journey</Text>
                                <Text style={[styles.emptyStateSubtext, { color: theme.subText }]}>Build habits to shape your future self</Text>
                                <TouchableOpacity
                                    style={[styles.emptyStateButton, { backgroundColor: theme.primary }]}
                                    onPress={() => setIsModalVisible(true)}
                                >
                                    <Text style={styles.emptyStateButtonText}>Create First Habit</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {habits.length === 0 && (
                            <View style={[styles.emptyStateContainer, { borderColor: theme.border, borderWidth: 1, backgroundColor: theme.glassBackground }]}>
                                <LottieView
                                    source={{ uri: 'https://lottie.host/b008d5cd-078e-4f32-8df7-cdb1e7f6075c/s1iXoQvSNo.json' }}
                                    autoPlay
                                    loop
                                    style={{ width: 180, height: 180 }}
                                />
                                <Text style={[styles.emptyStateTitle, { color: theme.text }]}>Start Your Journey</Text>
                                <Text style={[styles.emptyStateSubtext, { color: theme.subText }]}>Build habits to shape your future self</Text>
                                <TouchableOpacity
                                    style={[styles.emptyStateButton, { backgroundColor: theme.primary }]}
                                    onPress={() => setIsModalVisible(true)}
                                >
                                    <Text style={styles.emptyStateButtonText}>Create First Habit</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {habits.map((habit) => (
                            <TouchableOpacity
                                key={habit.id}
                                style={[styles.habitCard, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder, borderWidth: 1, shadowColor: theme.shadow }]}
                                onPress={() => toggleHabit(habit.id)}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.checkCircle, { borderColor: theme.border }, isCompleted(habit) && { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                                    {isCompleted(habit) && <Ionicons name="checkmark" size={18} color="white" />}
                                </View>
                                <View style={styles.habitInfo}>
                                    <Text style={[styles.habitName, { color: theme.text }, isCompleted(habit) && styles.completedHabitName]}>
                                        {habit.name}
                                    </Text>
                                    <View style={styles.streakInfo}>
                                        <Ionicons name="flame" size={14} color={theme.warning} />
                                        <Text style={[styles.streakText, { color: theme.subText }]}>
                                            {habit.streak > 0 ? `${habit.streak} day streak` : 'Ready to start'}
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={styles.menuButton}
                                    onPress={() => openOptions(habit)}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Ionicons name="ellipsis-vertical" size={18} color={theme.subText} />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={{ height: 40 }} />
                </ScrollView>
            </View>

            {/* Add/Edit Habit Modal */}
            <Modal
                visible={isModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={closeHabitModal}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>{editingHabitId ? 'Edit Habit' : 'New Habit'}</Text>
                            <TouchableOpacity onPress={closeHabitModal}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.inputLabel, { color: theme.subText }]}>{editingHabitId ? 'UPDATE YOUR INTENTION' : 'WHAT WOULD YOU LIKE TO START?'}</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.input, color: theme.text }]}
                            placeholder="e.g. Morning Yoga, Read 10 Pages..."
                            placeholderTextColor={theme.subText}
                            value={newHabitName}
                            onChangeText={setNewHabitName}
                            autoFocus={true}
                        />

                        <Text style={[styles.inputLabel, { color: theme.subText, marginTop: 12 }]}>REMINDER TIME</Text>
                        <View style={styles.timePickerContainer}>
                            <TextInput
                                style={[styles.timeInput, { backgroundColor: theme.input, color: theme.text }]}
                                placeholder="HH:mm"
                                placeholderTextColor={theme.subText}
                                value={reminderTime}
                                onChangeText={setReminderTime}
                                maxLength={5}
                            />
                            <Text style={{ color: theme.subText, fontSize: 12, marginLeft: 8 }}>Use 24h format (e.g. 14:30)</Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.createButton, { backgroundColor: theme.primary }, !newHabitName.trim() && styles.createButtonDisabled]}
                            onPress={handleAddOrUpdateHabit}
                            disabled={!newHabitName.trim()}
                        >
                            <Text style={styles.createButtonText}>{editingHabitId ? 'Save Changes' : 'Create Habit'}</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Habit Options Modal */}
            <Modal
                visible={isOptionsVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setIsOptionsVisible(false)}
            >
                <TouchableOpacity
                    style={styles.optionsOverlay}
                    activeOpacity={1}
                    onPress={() => setIsOptionsVisible(false)}
                >
                    <View style={[styles.optionsContent, { backgroundColor: theme.card }]}>
                        <View style={[styles.optionsHeader, { borderBottomColor: theme.border }]}>
                            <Text style={[styles.optionsTitle, { color: theme.text }]}>{selectedHabit?.name}</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.optionItem}
                            onPress={() => openEditModal(selectedHabit)}
                        >
                            <Ionicons name="pencil-outline" size={20} color={theme.subText} />
                            <Text style={[styles.optionText, { color: theme.subText }]}>Edit Habit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.optionItem, styles.deleteOption]}
                            onPress={() => handleDeleteHabit(selectedHabit?.id)}
                        >
                            <Ionicons name="trash-outline" size={20} color={theme.danger} />
                            <Text style={[styles.optionText, { color: theme.danger }]}>Delete Habit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.cancelOption, { borderTopColor: theme.border }]}
                            onPress={() => setIsOptionsVisible(false)}
                        >
                            <Text style={[styles.cancelText, { color: theme.subText }]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>


            {/* Add Project Modal */}
            <Modal
                visible={isProjectModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsProjectModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>New Project / Task</Text>
                            <TouchableOpacity onPress={() => setIsProjectModalVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.inputLabel, { color: theme.subText }]}>TASK NAME</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.input, color: theme.text }]}
                            placeholder="e.g. Finish Habit Tracker App"
                            placeholderTextColor={theme.subText}
                            value={newProjectName}
                            onChangeText={setNewProjectName}
                            autoFocus={true}
                        />

                        <Text style={[styles.inputLabel, { color: theme.subText }]}>DURATION (DAYS)</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.input, color: theme.text }]}
                            placeholder="e.g. 5"
                            placeholderTextColor={theme.subText}
                            value={newProjectDuration}
                            onChangeText={setNewProjectDuration}
                            keyboardType="number-pad"
                        />

                        <TouchableOpacity
                            style={[styles.createButton, { backgroundColor: theme.primary }, (!newProjectName.trim() || !newProjectDuration.trim()) && styles.createButtonDisabled]}
                            onPress={handleAddProject}
                            disabled={!newProjectName.trim() || !newProjectDuration.trim()}
                        >
                            <Text style={styles.createButtonText}>Start Tracking</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Sidebar Custom Drawer */}
            {
                isSidebarVisible && (
                    <View style={[StyleSheet.absoluteFill, { zIndex: 100 }]}>
                        <Animated.View
                            style={[
                                styles.sidebarOverlay,
                                {
                                    opacity: dynamicBackdropOpacity,
                                }
                            ]}
                        >
                            <TouchableOpacity
                                style={styles.sidebarBackdrop}
                                activeOpacity={1}
                                onPress={closeSidebar}
                            />
                        </Animated.View>
                        <Animated.View
                            style={[
                                styles.sidebarContainer,
                                {
                                    backgroundColor: theme.card,
                                    transform: [{ translateX: displayX }],
                                }
                            ]}
                        >
                            <View style={styles.sidebarHeader}>
                                <View style={[styles.sidebarAvatar, { borderColor: theme.border }]}>
                                    {userData.profileImage ? (
                                        <Image source={userData.profileImage} style={styles.avatarImage} />
                                    ) : (
                                        <Ionicons name="person" size={32} color={theme.primary} />
                                    )}
                                </View>
                                <Text style={[styles.sidebarName, { color: theme.text }]}>{userData.name}</Text>
                                <TouchableOpacity onPress={closeSidebar} style={styles.closeSidebarButton}>
                                    <Ionicons name="close" size={24} color={theme.text} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.sidebarDivider} />

                            <ScrollView
                                style={styles.sidebarScroll}
                                contentContainerStyle={styles.sidebarScrollContent}
                                showsVerticalScrollIndicator={false}
                            >
                                <TouchableOpacity style={styles.sidebarItem} onPress={() => navigateToSection('News')}>
                                    <Ionicons name="newspaper-outline" size={24} color={theme.primary} />
                                    <Text style={[styles.sidebarItemText, { color: theme.text }]}>News</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.sidebarItem} onPress={() => navigateToSection('Market')}>
                                    <Ionicons name="bar-chart-outline" size={24} color={theme.success} />
                                    <Text style={[styles.sidebarItemText, { color: theme.text }]}>Share Market</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.sidebarItem} onPress={() => navigateToSection('Trends')}>
                                    <Ionicons name="trending-up-outline" size={24} color={theme.warning} />
                                    <Text style={[styles.sidebarItemText, { color: theme.text }]}>Trends</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.sidebarItem} onPress={() => navigateToSection('Crypto')}>
                                    <Ionicons name="logo-bitcoin" size={24} color="#F7931A" />
                                    <Text style={[styles.sidebarItemText, { color: theme.text }]}>Crypto News</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.sidebarItem} onPress={() => navigateToSection('Movies')}>
                                    <Ionicons name="film-outline" size={24} color={theme.text} />
                                    <Text style={[styles.sidebarItemText, { color: theme.text }]}>Movies</Text>
                                </TouchableOpacity>



                                <TouchableOpacity style={styles.sidebarItem} onPress={() => navigateToSection('Tech')}>
                                    <Ionicons name="hardware-chip-outline" size={24} color={theme.text} />
                                    <Text style={[styles.sidebarItemText, { color: theme.text }]}>Tech Stuff</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.sidebarItem} onPress={() => navigateToSection('Notes')}>
                                    <Ionicons name="document-text-outline" size={24} color={theme.primary} />
                                    <Text style={[styles.sidebarItemText, { color: theme.text }]}>My Notes</Text>
                                </TouchableOpacity>

                                <View style={styles.sidebarDivider} />

                                <View style={styles.themeToggleContainer}>
                                    <View style={styles.themeToggleLabel}>
                                        <Ionicons name={isDark ? "moon" : "sunny"} size={24} color={theme.text} />
                                        <Text style={[styles.sidebarItemText, { color: theme.text }]}>{isDark ? "Dark Mode" : "Light Mode"}</Text>
                                    </View>
                                    <Switch
                                        trackColor={{ false: "#767577", true: theme.primary }}
                                        thumbColor={isDark ? "#f4f3f4" : "#f4f3f4"}
                                        ios_backgroundColor="#3e3e3e"
                                        onValueChange={toggleTheme}
                                        value={isDark}
                                    />
                                </View>
                            </ScrollView>
                        </Animated.View>
                    </View>
                )
            }

            {/* Confetti Setup */}
            {showConfetti && (
                <View style={[StyleSheet.absoluteFill, { zIndex: 999 }]} pointerEvents="none">
                    <LottieView
                        source={{ uri: 'https://lottie.host/7e0cebd5-728f-4ed3-9a4f-561494df9f87/1O4d3Vb9mQ.json' }}
                        autoPlay
                        loop={false}
                        onAnimationFinish={() => setShowConfetti(false)}
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                    />
                </View>
            )}

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    topAnchorContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 12,
        marginBottom: 24,
    },
    todayAnchor: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingLeft: 10,
        paddingRight: 18,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    dayLabel: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        opacity: 0.6,
    },
    dateLabel: {
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    addButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    greetingContainer: {
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    greeting: {
        fontSize: 28,
        fontWeight: '700',
        letterSpacing: -0.8,
    },
    subGreeting: {
        fontSize: 16,
        marginTop: 6,
        fontWeight: '500',
        opacity: 0.7,
    },
    quoteContainer: {
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    quoteCard: {
        padding: 24,
        borderRadius: 30,
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.12,
        shadowRadius: 25,
        elevation: 5,
    },
    quoteIconContainer: {
        marginBottom: 12,
    },
    quoteText: {
        fontSize: 15,
        fontStyle: 'italic',
        lineHeight: 24,
        fontWeight: '500',
        marginBottom: 12,
    },
    quoteAuthor: {
        fontSize: 13,
        fontWeight: '700',
        alignSelf: 'flex-end',
        opacity: 0.8,
    },
    calendarStrip: {
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    weekContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        borderRadius: 30,
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.12,
        shadowRadius: 25,
        elevation: 5,
    },
    dayItem: {
        alignItems: 'center',
    },
    dayName: {
        fontSize: 10,
        fontWeight: '700',
        marginBottom: 10,
        letterSpacing: 0.5,
    },
    dateCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateNumber: {
        fontSize: 14,
        fontWeight: '700',
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        marginBottom: 2,
    },
    section: {
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    addSectionButton: {
        width: 32,
        height: 32,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    projectCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderRadius: 26,
        marginBottom: 16,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 4,
    },
    projectInfo: {
        flex: 1,
        marginRight: 16,
    },
    projectName: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    projectDeadlineLabel: {
        fontSize: 12,
        fontWeight: '500',
        opacity: 0.6,
    },
    daysLeftBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    daysLeftText: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    emptyProjectCard: {
        padding: 32,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.5,
    },
    emptyStateContainer: {
        padding: 32,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
    },
    emptyStateTitle: {
        fontSize: 22,
        fontWeight: '800',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateSubtext: {
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    emptyStateButton: {
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 20,
    },
    emptyStateButtonText: {
        color: 'white',
        fontWeight: '800',
        fontSize: 15,
    },
    habitsSection: {
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    habitsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    progressBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    progressText: {
        fontSize: 12,
        fontWeight: '700',
    },
    habitCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        borderRadius: 26,
        marginBottom: 14,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 15,
        elevation: 3,
    },
    checkCircle: {
        width: 28,
        height: 28,
        borderRadius: 11,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    habitInfo: {
        flex: 1,
    },
    habitName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    completedHabitName: {
        opacity: 0.5,
        textDecorationLine: 'line-through',
    },
    streakInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    streakText: {
        fontSize: 11,
        fontWeight: '600',
        marginLeft: 4,
        opacity: 0.6,
    },
    menuButton: {
        padding: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '700',
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 12,
        textTransform: 'uppercase',
        opacity: 0.6,
    },
    input: {
        borderRadius: 16,
        padding: 16,
        fontSize: 16,
        marginBottom: 24,
        fontWeight: '500',
    },
    timePickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    timeInput: {
        width: 80,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    createButton: {
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
    },
    createButtonDisabled: {
        opacity: 0.5,
    },
    createButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    optionsOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    optionsContent: {
        width: '100%',
        borderRadius: 28,
        padding: 24,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    optionsHeader: {
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
    },
    optionsTitle: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
    },
    optionText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 12,
    },
    deleteOption: {
        marginTop: 4,
    },
    sidebarOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    sidebarBackdrop: {
        flex: 1,
    },
    sidebarContainer: {
        width: '85%',
        height: '100%',
        padding: 24,
        paddingTop: 60,
        borderTopRightRadius: 32,
        borderBottomRightRadius: 32,
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        shadowColor: "#000",
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        zIndex: 20,
    },
    sidebarHeader: {
        alignItems: 'center',
        marginBottom: 40,
    },
    sidebarAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#D1FAE5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 2,
        overflow: 'hidden',
    },
    sidebarName: {
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    closeSidebarButton: {
        position: 'absolute',
        top: 0,
        right: 0,
        padding: 12,
    },
    sidebarDivider: {
        height: 1,
        marginBottom: 24,
        opacity: 0.1,
    },
    sidebarItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 16,
        marginBottom: 8,
    },
    sidebarItemText: {
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 16,
    },
    cancelOption: {
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '700',
    },
    sidebarScroll: {
        flex: 1,
    },
    sidebarScrollContent: {
        paddingBottom: 40,
    },
    themeToggleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    themeToggleLabel: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});
