import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Modal, TextInput, KeyboardAvoidingView, Platform, Alert, Image, ActivityIndicator, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../../utils/storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';

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
    const [habits, setHabits] = useState([]);
    const [today, setToday] = useState(new Date());
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [newHabitName, setNewHabitName] = useState('');
    const [editingHabitId, setEditingHabitId] = useState(null);
    const [isOptionsVisible, setIsOptionsVisible] = useState(false);
    const [selectedHabit, setSelectedHabit] = useState(null);

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

    const navigateToSection = (screenName) => {
        setIsSidebarVisible(false);
        navigation.navigate(screenName);
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
        const updatedHabits = await storage.toggleHabitCompletion(id);
        setHabits(updatedHabits);
    };

    const handleAddOrUpdateHabit = async () => {
        if (newHabitName.trim()) {
            let updatedHabits;
            if (editingHabitId) {
                updatedHabits = await storage.updateHabit(editingHabitId, { name: newHabitName });
            } else {
                updatedHabits = await storage.addHabit({ name: newHabitName });
            }
            setHabits(updatedHabits);
            closeHabitModal();
        }
    };

    const openEditModal = (habit) => {
        setEditingHabitId(habit.id);
        setNewHabitName(habit.name);
        setIsModalVisible(true);
        setIsOptionsVisible(false);
    };

    const closeHabitModal = () => {
        setIsModalVisible(false);
        setNewHabitName('');
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
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <TouchableOpacity
                            onPress={() => setIsSidebarVisible(true)}
                            style={[styles.profileHeader, {
                                backgroundColor: theme.card,
                                shadowColor: theme.shadow,
                                borderColor: theme.border
                            }]}
                        >
                            <View style={styles.profileSection}>
                                <View style={[styles.avatar, { borderColor: theme.border }]}>
                                    {userData.profileImage ? (
                                        <Image source={userData.profileImage} style={styles.avatarImage} />
                                    ) : (
                                        <Ionicons name="person" size={24} color={theme.primary} />
                                    )}
                                </View>
                                <View>
                                    <Text style={[styles.dayLabel, { color: theme.subText }]}>{today.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()}</Text>
                                    <Text style={[styles.dateLabel, { color: theme.text }]}>{formatDate(today)}</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={theme.subText} style={{ marginLeft: 8 }} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => setIsModalVisible(true)}
                        >
                            <Ionicons name="add" size={28} color="white" />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.greeting, { color: theme.text }]}>Good morning, {userData.name}.</Text>
                    <Text style={[styles.subGreeting, { color: theme.subText }]}>Focus on your intentions for today.</Text>
                </View>

                {/* Quote of the Day */}
                <View style={[styles.quoteContainer]}>
                    <View style={[styles.quoteCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
                        {loadingQuote ? (
                            <ActivityIndicator color={theme.primary} />
                        ) : (
                            <View>
                                <View style={styles.quoteIconContainer}>
                                    <Ionicons name="chatbox-ellipses-outline" size={20} color={theme.primary} />
                                </View>
                                <Text style={[styles.quoteText, { color: theme.text }]}>"{quote?.q}"</Text>
                                <Text style={[styles.quoteAuthor, { color: theme.input === '#F3F4F6' ? theme.subText : theme.primary }]}>— {quote?.a}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Week Calendar */}
                <View style={styles.calendarStrip}>
                    <View style={[styles.weekContainer, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
                        {weekDays.map((date, index) => {
                            const isToday = date.toDateString() === today.toDateString();
                            const hasActivity = (index <= 3); // Simulated
                            return (
                                <View key={index} style={styles.dayItem}>
                                    <Text style={[styles.dayName, { color: isToday ? theme.primary : theme.subText }]}>{getDayName(date)}</Text>
                                    <View style={[styles.dateCircle, isToday && { backgroundColor: theme.primary }]}>
                                        <View style={[styles.dot, hasActivity && { backgroundColor: isToday ? 'white' : theme.primary }]} />
                                        <Text style={[styles.dateNumber, { color: isToday ? 'white' : theme.text }]}>{date.getDate()}</Text>
                                    </View>
                                </View>
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
                            style={[styles.emptyProjectCard, { borderColor: theme.border }]}
                        >
                            <Text style={{ color: theme.subText }}>Add a project or task deadline</Text>
                        </TouchableOpacity>
                    ) : (
                        projects.map((project) => {
                            const daysLeft = calculateDaysLeft(project);
                            const daysColor = getDaysLeftColor(daysLeft);
                            const daysText = daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`;

                            return (
                                <View key={project.id} style={[styles.projectCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
                                    <View style={styles.projectInfo}>
                                        <Text style={[styles.projectName, { color: theme.text }]}>{project.name}</Text>
                                        <Text style={[styles.projectDeadlineLabel, { color: theme.subText }]}>
                                            Complete within: {project.durationDays} days
                                        </Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <View style={[styles.daysLeftBadge, { backgroundColor: daysColor + '20' }]}>
                                            <Text style={[styles.daysLeftText, { color: daysColor }]}>{daysText}</Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => handleDeleteProject(project.id)}
                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                            style={{ marginTop: 8 }}
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
                        <View style={[styles.progressBadge, { backgroundColor: theme.tint + '20' }]}>
                            <Text style={[styles.progressText, { color: theme.success }]}>{completedCount} of {habits.length} done</Text>
                        </View>
                    </View>

                    {habits.map((habit) => (
                        <TouchableOpacity
                            key={habit.id}
                            style={[styles.habitCard, { backgroundColor: theme.card }]}
                            onPress={() => toggleHabit(habit.id)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.checkCircle, { borderColor: theme.border }, isCompleted(habit) && { backgroundColor: '#3B82F6', borderColor: '#3B82F6' }]}>
                                {isCompleted(habit) && <Ionicons name="checkmark" size={20} color="white" />}
                            </View>
                            <View style={styles.habitInfo}>
                                <Text style={[styles.habitName, { color: theme.text }, isCompleted(habit) && styles.completedHabitName]}>
                                    {habit.name}
                                </Text>
                                <View style={styles.streakInfo}>
                                    <Ionicons name="flame" size={14} color={theme.warning} />
                                    <Text style={[styles.streakText, { color: theme.subText }]}>
                                        {habit.streak > 0 ? `${habit.streak} day streak` : 'New habit'}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.menuButton}
                                onPress={() => openOptions(habit)}
                            >
                                <Ionicons name="ellipsis-vertical" size={20} color={theme.inactiveTint} />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    ))}
                </View>
                <View style={{ height: 40 }} />
            </ScrollView>

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
            {/* Sidebar Modal */}
            <Modal
                visible={isSidebarVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setIsSidebarVisible(false)}
            >
                <View style={styles.sidebarOverlay}>
                    <TouchableOpacity
                        style={styles.sidebarBackdrop}
                        activeOpacity={1}
                        onPress={() => setIsSidebarVisible(false)}
                    />
                    <View style={[styles.sidebarContainer, { backgroundColor: theme.card }]}>
                        <View style={styles.sidebarHeader}>
                            <View style={[styles.sidebarAvatar, { borderColor: theme.border }]}>
                                {userData.profileImage ? (
                                    <Image source={userData.profileImage} style={styles.avatarImage} />
                                ) : (
                                    <Ionicons name="person" size={32} color={theme.primary} />
                                )}
                            </View>
                            <Text style={[styles.sidebarName, { color: theme.text }]}>{userData.name}</Text>
                            <TouchableOpacity onPress={() => setIsSidebarVisible(false)} style={styles.closeSidebarButton}>
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

                            <TouchableOpacity style={styles.sidebarItem} onPress={() => navigateToSection('Youtube')}>
                                <Ionicons name="logo-youtube" size={24} color="#FF0000" />
                                <Text style={[styles.sidebarItemText, { color: theme.text }]}>YouTube</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.sidebarItem} onPress={() => navigateToSection('Tech')}>
                                <Ionicons name="hardware-chip-outline" size={24} color={theme.text} />
                                <Text style={[styles.sidebarItemText, { color: theme.text }]}>Tech Stuff</Text>
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

                    </View>
                </View>
            </Modal>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        paddingRight: 12,
        borderRadius: 30,
        borderWidth: 1,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 16,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#D1FAE5',
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
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    dateLabel: {
        fontSize: 18,
        fontWeight: '700',
    },
    addButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    greeting: {
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    subGreeting: {
        fontSize: 18,
        marginTop: 4,
    },
    quoteContainer: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    quoteCard: {
        padding: 16,
        borderRadius: 16,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    quoteIconContainer: {
        marginBottom: 8,
    },
    quoteText: {
        fontSize: 14,
        fontStyle: 'italic',
        fontWeight: '500',
        marginBottom: 8,
        lineHeight: 20,
    },
    quoteAuthor: {
        fontSize: 12,
        fontWeight: '700',
        alignSelf: 'flex-end',
    },
    calendarStrip: {
        paddingHorizontal: 16,
        marginBottom: 32,
    },
    weekContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 24,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    dayItem: {
        alignItems: 'center',
    },
    dayName: {
        fontSize: 10,
        fontWeight: '600',
        marginBottom: 8,
    },
    dateCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateNumber: {
        fontSize: 14,
        fontWeight: '600',
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'transparent',
        marginBottom: 2,
    },
    habitsSection: {
        paddingHorizontal: 24,
    },
    habitsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
    },
    progressBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    progressText: {
        fontSize: 13,
        fontWeight: '600',
    },
    habitCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
    },
    checkCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
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
        marginBottom: 4,
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
        fontSize: 12,
        marginLeft: 4,
    },
    menuButton: {
        padding: 8,
        marginRight: -8,
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
    },
    input: {
        borderRadius: 16,
        padding: 16,
        fontSize: 16,
        marginBottom: 24,
    },
    createButton: {
        borderRadius: 16,
        padding: 16,
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
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
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
    // Sidebar Styles
    sidebarOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        flexDirection: 'row',
    },
    sidebarBackdrop: {
        flex: 1,
    },
    sidebarContainer: {
        width: '80%',
        height: '100%',
        padding: 24,
        paddingTop: 60,
        borderTopRightRadius: 24,
        borderBottomRightRadius: 24,
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        shadowColor: "#000",
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
        zIndex: 20,
    },
    sidebarHeader: {
        alignItems: 'center',
        marginBottom: 32,
    },
    sidebarAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#D1FAE5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        overflow: 'hidden',
    },
    sidebarName: {
        fontSize: 20,
        fontWeight: '700',
    },
    closeSidebarButton: {
        position: 'absolute',
        top: 0,
        right: 0,
        padding: 8,
    },
    sidebarDivider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginBottom: 24,
    },
    sidebarItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderRadius: 12,
    },
    sidebarItemText: {
        fontSize: 16,
        fontWeight: '600',
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
    section: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    addSectionButton: {
        padding: 8,
        borderRadius: 12,
    },
    projectCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 1,
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
    },
    daysLeftBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    daysLeftText: {
        fontSize: 12,
        fontWeight: '700',
    },
    emptyProjectCard: {
        padding: 24,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
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
        paddingVertical: 10,
        paddingHorizontal: 0,
    },
    themeToggleLabel: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});
