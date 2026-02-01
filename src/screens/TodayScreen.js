import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Modal, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../utils/storage';
import { useFocusEffect } from '@react-navigation/native';

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
    const [habits, setHabits] = useState([]);
    const [today, setToday] = useState(new Date());
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [newHabitName, setNewHabitName] = useState('');
    const [editingHabitId, setEditingHabitId] = useState(null);
    const [isOptionsVisible, setIsOptionsVisible] = useState(false);
    const [selectedHabit, setSelectedHabit] = useState(null);

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

    useFocusEffect(
        useCallback(() => {
            loadHabits();
            setToday(new Date()); // Update date whenever screen comes into focus
        }, [])
    );

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

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <View style={styles.profileSection}>
                            <View style={styles.avatar}>
                                <Ionicons name="person" size={24} color="#34D399" />
                            </View>
                            <View>
                                <Text style={styles.dayLabel}>{today.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()}</Text>
                                <Text style={styles.dateLabel}>{formatDate(today)}</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => setIsModalVisible(true)}
                        >
                            <Ionicons name="add" size={28} color="white" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.greeting}>Good morning, Alex.</Text>
                    <Text style={styles.subGreeting}>Focus on your intentions for today.</Text>
                </View>

                {/* Week Calendar */}
                <View style={styles.calendarStrip}>
                    <View style={styles.weekContainer}>
                        {weekDays.map((date, index) => {
                            const isToday = date.toDateString() === today.toDateString();
                            const hasActivity = (index <= 3); // Simulated for design consistency
                            return (
                                <View key={index} style={styles.dayItem}>
                                    <Text style={[styles.dayName, isToday && styles.activeDayText]}>{getDayName(date)}</Text>
                                    <View style={[styles.dateCircle, isToday && styles.activeDateCircle]}>
                                        <View style={[styles.dot, hasActivity && styles.greenDot]} />
                                        <Text style={[styles.dateNumber, isToday && styles.activeDateNumber]}>{date.getDate()}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Habits Section */}
                <View style={styles.habitsSection}>
                    <View style={styles.habitsHeader}>
                        <Text style={styles.sectionTitle}>Daily Habits</Text>
                        <View style={styles.progressBadge}>
                            <Text style={styles.progressText}>{completedCount} of {habits.length} done</Text>
                        </View>
                    </View>

                    {habits.map((habit) => (
                        <TouchableOpacity
                            key={habit.id}
                            style={styles.habitCard}
                            onPress={() => toggleHabit(habit.id)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.checkCircle, isCompleted(habit) && styles.checkedCircle]}>
                                {isCompleted(habit) && <Ionicons name="checkmark" size={20} color="white" />}
                            </View>
                            <View style={styles.habitInfo}>
                                <Text style={[styles.habitName, isCompleted(habit) && styles.completedHabitName]}>
                                    {habit.name}
                                </Text>
                                <View style={styles.streakInfo}>
                                    <Ionicons name="flame" size={14} color="#F59E0B" />
                                    <Text style={styles.streakText}>
                                        {habit.streak > 0 ? `${habit.streak} day streak` : 'New habit'}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.menuButton}
                                onPress={() => openOptions(habit)}
                            >
                                <Ionicons name="ellipsis-vertical" size={20} color="#D1D5DB" />
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
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editingHabitId ? 'Edit Habit' : 'New Habit'}</Text>
                            <TouchableOpacity onPress={closeHabitModal}>
                                <Ionicons name="close" size={24} color="#374151" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>{editingHabitId ? 'UPDATE YOUR INTENTION' : 'WHAT WOULD YOU LIKE TO START?'}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Morning Yoga, Read 10 Pages..."
                            placeholderTextColor="#9CA3AF"
                            value={newHabitName}
                            onChangeText={setNewHabitName}
                            autoFocus={true}
                        />

                        <TouchableOpacity
                            style={[styles.createButton, !newHabitName.trim() && styles.createButtonDisabled]}
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
                    <View style={styles.optionsContent}>
                        <View style={styles.optionsHeader}>
                            <Text style={styles.optionsTitle}>{selectedHabit?.name}</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.optionItem}
                            onPress={() => openEditModal(selectedHabit)}
                        >
                            <Ionicons name="pencil-outline" size={20} color="#4B5563" />
                            <Text style={styles.optionText}>Edit Habit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.optionItem, styles.deleteOption]}
                            onPress={() => handleDeleteHabit(selectedHabit?.id)}
                        >
                            <Ionicons name="trash-outline" size={20} color="#EF4444" />
                            <Text style={[styles.optionText, styles.deleteText]}>Delete Habit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelOption}
                            onPress={() => setIsOptionsVisible(false)}
                        >
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 24,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
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
    },
    dayLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#9CA3AF',
        textTransform: 'uppercase',
    },
    dateLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
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
        color: '#111827',
        letterSpacing: -0.5,
    },
    subGreeting: {
        fontSize: 18,
        color: '#6B7280',
        marginTop: 4,
    },
    calendarStrip: {
        paddingHorizontal: 16,
        marginBottom: 32,
    },
    weekContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 24,
        shadowColor: '#000',
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
        color: '#9CA3AF',
        marginBottom: 8,
    },
    activeDayText: {
        color: '#10B981',
    },
    dateCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeDateCircle: {
        backgroundColor: '#10B981',
    },
    dateNumber: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
    },
    activeDateNumber: {
        color: 'white',
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'transparent',
        marginBottom: 2,
    },
    greenDot: {
        backgroundColor: '#10B981',
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
        color: '#111827',
    },
    progressBadge: {
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    progressText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#059669',
    },
    habitCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
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
        borderColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    checkedCircle: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    habitInfo: {
        flex: 1,
    },
    habitName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 4,
    },
    completedHabitName: {
        color: '#9CA3AF',
        textDecorationLine: 'line-through',
    },
    streakInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    streakText: {
        fontSize: 12,
        color: '#9CA3AF',
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
        backgroundColor: 'white',
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
        color: '#111827',
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#9CA3AF',
        letterSpacing: 1,
        marginBottom: 12,
    },
    input: {
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        padding: 16,
        fontSize: 16,
        color: '#111827',
        marginBottom: 24,
    },
    createButton: {
        backgroundColor: '#10B981',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
    },
    createButtonDisabled: {
        backgroundColor: '#D1FAE5',
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
        backgroundColor: 'white',
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
        borderBottomColor: '#F3F4F6',
    },
    optionsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
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
        color: '#4B5563',
        marginLeft: 12,
    },
    deleteOption: {
        marginTop: 4,
    },
    deleteText: {
        color: '#EF4444',
    },
    cancelOption: {
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#9CA3AF',
    },
});
