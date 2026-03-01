import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TodayModals({
    styles,
    theme,
    isHabitModalVisible,
    closeHabitModal,
    editingHabitId,
    newHabitName,
    setNewHabitName,
    habitFrequency,
    setHabitFrequency,
    habitPriority,
    setHabitPriority,
    habitCategory,
    setHabitCategory,
    habitFrequencyOptions,
    habitPriorityOptions,
    habitCategoryOptions,
    handleAddOrUpdateHabit,
    isProjectModalVisible,
    closeProjectModal,
    editingProjectId,
    newProjectName,
    setNewProjectName,
    newProjectDuration,
    setNewProjectDuration,
    handleAddOrUpdateProject,
}) {
    const renderOptionGroup = ({ label, value, setValue, options }) => (
        <View style={styles.optionGroup}>
            <Text style={[styles.inputLabel, { color: theme.subText }]}>{label}</Text>
            <View style={styles.optionRow}>
                {options.map((option) => {
                    const isActive = option === value;
                    return (
                        <TouchableOpacity
                            key={`${label}-${option}`}
                            style={[
                                styles.optionChip,
                                {
                                    borderColor: isActive ? theme.primary : theme.border,
                                    backgroundColor: isActive ? theme.primary + '18' : theme.input,
                                },
                            ]}
                            onPress={() => setValue(option)}
                            activeOpacity={0.85}
                        >
                            <Text style={[styles.optionChipText, { color: isActive ? theme.primary : theme.text }]}>{option}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );

    return (
        <>
            <Modal visible={isHabitModalVisible} animationType="slide" transparent onRequestClose={closeHabitModal}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
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
                            autoFocus
                        />

                        {renderOptionGroup({
                            label: 'FREQUENCY',
                            value: habitFrequency,
                            setValue: setHabitFrequency,
                            options: habitFrequencyOptions,
                        })}
                        {renderOptionGroup({
                            label: 'PRIORITY',
                            value: habitPriority,
                            setValue: setHabitPriority,
                            options: habitPriorityOptions,
                        })}
                        {renderOptionGroup({
                            label: 'CATEGORY',
                            value: habitCategory,
                            setValue: setHabitCategory,
                            options: habitCategoryOptions,
                        })}

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
            <Modal
                visible={isProjectModalVisible}
                animationType="slide"
                transparent
                onRequestClose={closeProjectModal}
            >
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}> 
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>{editingProjectId ? 'Edit Task' : 'New Project / Task'}</Text>
                            <TouchableOpacity onPress={closeProjectModal}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.inputLabel, { color: theme.subText }]}>TASK NAME</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.input, color: theme.text }]}
                            placeholder="e.g. Finish Flow State App"
                            placeholderTextColor={theme.subText}
                            value={newProjectName}
                            onChangeText={setNewProjectName}
                            autoFocus
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
                            style={[
                                styles.createButton,
                                { backgroundColor: theme.primary },
                                (!newProjectName.trim() || !newProjectDuration.trim()) && styles.createButtonDisabled,
                            ]}
                            onPress={handleAddOrUpdateProject}
                            disabled={!newProjectName.trim() || !newProjectDuration.trim()}
                        >
                            <Text style={styles.createButtonText}>{editingProjectId ? 'Save Changes' : 'Start Tracking'}</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </>
    );
}
