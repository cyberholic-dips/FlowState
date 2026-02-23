import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, Dimensions, KeyboardAvoidingView, Platform, Modal, Text, TextInput, TouchableOpacity, Switch, Alert } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useTime } from '../../context/TimeContext';
import TimeNavbar from '../../components/TimeNavbar';
import TimelineVisualization from '../../components/TimelineVisualization';
import FocusPanel from '../Explore/FocusPanel';
import ReminderPanel from '../Explore/ReminderPanel';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function ExploreScreen() {
    const { theme, isDark } = useTheme();
    const { addReminder, isAlarmTriggered, stopAlarmSound, activeReminder } = useTime();

    const [isTimelineExpanded, setIsTimelineExpanded] = useState(true);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);

    // Add Event Modal State
    const [newReminderTitle, setNewReminderTitle] = useState('');
    const [newReminderTime, setNewReminderTime] = useState(new Date());
    const [newReminderRepeat, setNewReminderRepeat] = useState(false);

    const handleAddReminder = () => {
        if (!newReminderTitle.trim()) {
            Alert.alert('Objective Required', 'Please enter a title for your reminder.');
            return;
        }

        const hrs = newReminderTime.getHours().toString().padStart(2, '0');
        const mins = newReminderTime.getMinutes().toString().padStart(2, '0');

        addReminder({
            title: newReminderTitle,
            time: `${hrs}:${mins}`,
            repeats: newReminderRepeat
        });

        setIsAddModalVisible(false);
        setNewReminderTitle('');
        setNewReminderRepeat(false);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <TimeNavbar
                onAddEvent={() => setIsAddModalVisible(true)}
                onToggleTimeline={() => setIsTimelineExpanded(!isTimelineExpanded)}
                isTimelineExpanded={isTimelineExpanded}
            />

            {isTimelineExpanded && <TimelineVisualization onAddClick={() => setIsAddModalVisible(true)} />}

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    <View style={styles.gridContainer}>
                        {/* Focus Section */}
                        <View style={styles.panelWrapper}>
                            <FocusPanel />
                        </View>

                        {/* Reminder Section */}
                        <View style={styles.panelWrapper}>
                            <ReminderPanel onAddClick={() => setIsAddModalVisible(true)} />
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Add Event Modal */}
            <Modal
                visible={isAddModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsAddModalVisible(false)}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    style={styles.modalOverlay}
                    onPress={() => setIsAddModalVisible(false)}
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        style={{ width: '100%' }}
                    >
                        <TouchableOpacity activeOpacity={1} style={[styles.modalContent, { backgroundColor: theme.card }]}>
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: theme.text }]}>Schedule Event</Text>
                                <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                                    <Ionicons name="close" size={24} color={theme.text} />
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.label, { color: theme.subText }]}>EVENT TITLE</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.input, color: theme.text, borderColor: theme.border }]}
                                placeholder="e.g. Deep Work, Workout, Reading..."
                                placeholderTextColor={theme.subText}
                                value={newReminderTitle}
                                onChangeText={setNewReminderTitle}
                                autoFocus
                            />

                            <Text style={[styles.label, { color: theme.subText }]}>PICK TIME</Text>
                            <View style={styles.pickerBox}>
                                <DateTimePicker
                                    value={newReminderTime}
                                    mode="time"
                                    is24Hour={false}
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(e, date) => date && setNewReminderTime(date)}
                                    themeVariant={isDark ? 'dark' : 'light'}
                                    textColor={theme.text}
                                />
                            </View>

                            <View style={[styles.switchRow, { borderTopColor: theme.border }]}>
                                <Text style={[styles.switchLabel, { color: theme.text }]}>Repeat Everyday</Text>
                                <Switch
                                    value={newReminderRepeat}
                                    onValueChange={setNewReminderRepeat}
                                    trackColor={{ false: '#767577', true: theme.primary }}
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                                onPress={handleAddReminder}
                            >
                                <Text style={styles.saveBtnText}>Save Event</Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    </KeyboardAvoidingView>
                </TouchableOpacity>
            </Modal>

            {/* Ringing Overlay */}
            <Modal visible={isAlarmTriggered} animationType="fade" transparent={false}>
                <SafeAreaView style={[styles.ringingOverlay, { backgroundColor: theme.primary }]}>
                    <View style={styles.ringingContent}>
                        <Ionicons name="notifications" size={80} color="white" />
                        <Text style={styles.ringingTitle}>
                            {activeReminder ? `Reminder for ${activeReminder.title} !!` : 'Reminder!'}
                        </Text>
                        <Text style={styles.ringingSub}>{activeReminder?.time}</Text>

                        <TouchableOpacity style={styles.dismissBtn} onPress={stopAlarmSound}>
                            <Text style={[styles.dismissText, { color: theme.primary }]}>DISMISS</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 100,
    },
    gridContainer: {
        flex: 1,
    },
    panelWrapper: {
        marginBottom: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        borderRadius: 32,
        padding: 24,
        width: width * 0.9,
        maxHeight: '85%',
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
    },
    label: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.5,
        marginBottom: 12,
    },
    input: {
        borderRadius: 16,
        padding: 18,
        fontSize: 16,
        borderWidth: 1,
        marginBottom: 24,
        fontWeight: '600',
    },
    pickerBox: {
        height: 160,
        justifyContent: 'center',
        marginVertical: 8,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 20,
        borderTopColor: 'rgba(0,0,0,0.05)',
        borderTopWidth: 1,
        marginBottom: 24,
    },
    switchLabel: {
        fontSize: 16,
        fontWeight: '700',
    },
    saveBtn: {
        height: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
    },
    saveBtnText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '800',
    },
    ringingOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ringingContent: {
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    ringingTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: 'white',
        textAlign: 'center',
        marginTop: 24,
        letterSpacing: -1,
    },
    ringingSub: {
        fontSize: 18,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.7)',
        marginTop: 8,
        marginBottom: 60,
    },
    dismissBtn: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    dismissText: {
        fontSize: 18,
        fontWeight: '900',
    }
});
