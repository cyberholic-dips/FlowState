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
    reminderTime,
    setReminderTime,
    handleAddOrUpdateHabit,
    isOptionsVisible,
    setIsOptionsVisible,
    selectedHabit,
    openEditModal,
    handleDeleteHabit,
    isProjectModalVisible,
    closeProjectModal,
    editingProjectId,
    newProjectName,
    setNewProjectName,
    newProjectDuration,
    setNewProjectDuration,
    handleAddOrUpdateProject,
}) {
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

            <Modal visible={isOptionsVisible} animationType="fade" transparent onRequestClose={() => setIsOptionsVisible(false)}>
                <TouchableOpacity style={styles.optionsOverlay} activeOpacity={1} onPress={() => setIsOptionsVisible(false)}>
                    <View style={[styles.optionsContent, { backgroundColor: theme.card }]}> 
                        <View style={[styles.optionsHeader, { borderBottomColor: theme.border }]}> 
                            <Text style={[styles.optionsTitle, { color: theme.text }]}>{selectedHabit?.name}</Text>
                        </View>

                        <TouchableOpacity style={styles.optionItem} onPress={() => openEditModal(selectedHabit)}>
                            <Ionicons name="pencil-outline" size={20} color={theme.subText} />
                            <Text style={[styles.optionText, { color: theme.subText }]}>Edit Habit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.optionItem, styles.deleteOption]} onPress={() => handleDeleteHabit(selectedHabit?.id)}>
                            <Ionicons name="trash-outline" size={20} color={theme.danger} />
                            <Text style={[styles.optionText, { color: theme.danger }]}>Delete Habit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.cancelOption, { borderTopColor: theme.border }]} onPress={() => setIsOptionsVisible(false)}>
                            <Text style={[styles.cancelText, { color: theme.subText }]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
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
                            placeholder="e.g. Finish Habit Tracker App"
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
