import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TextInput, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';

export default function SettingsScreen() {
    const { theme, isDark, toggleTheme } = useTheme();
    const { userData, updateName } = useUser();
    const [nameInput, setNameInput] = useState(userData.name);
    const [isEditing, setIsEditing] = useState(false);

    const handleSaveName = () => {
        updateName(nameInput);
        setIsEditing(false);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={[styles.container, { backgroundColor: theme.background }]}
        >
            <View style={[styles.header, { backgroundColor: theme.card }]}>
                <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
                <Text style={[styles.subtitle, { color: theme.subText }]}>Customize your experience</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Profile Section */}
                <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.sectionHeader, { color: theme.subText }]}>PROFILE</Text>

                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, { color: theme.text }]}>Name</Text>
                        {isEditing ? (
                            <View style={styles.editRow}>
                                <TextInput
                                    style={[styles.input, { color: theme.text, backgroundColor: theme.input, borderColor: theme.border }]}
                                    value={nameInput}
                                    onChangeText={setNameInput}
                                    autoFocus
                                    onBlur={handleSaveName}
                                    onSubmitEditing={handleSaveName}
                                />
                                <TouchableOpacity onPress={handleSaveName} style={styles.iconButton}>
                                    <Ionicons name="checkmark-circle" size={24} color={theme.success} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.editRow}>
                                <Text style={[styles.value, { color: theme.subText }]}>{userData.name}</Text>
                                <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.iconButton}>
                                    <Ionicons name="pencil" size={20} color={theme.primary} />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>

                {/* App Settings Section */}
                <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.sectionHeader, { color: theme.subText }]}>APP SETTINGS</Text>

                    <View style={styles.row}>
                        <View style={styles.rowInfo}>
                            <Ionicons name={isDark ? "moon" : "sunny"} size={22} color={theme.text} style={styles.rowIcon} />
                            <Text style={[styles.rowLabel, { color: theme.text }]}>Dark Mode</Text>
                        </View>
                        <Switch
                            trackColor={{ false: "#767577", true: theme.primary }}
                            thumbColor={Platform.OS === "ios" ? "#fff" : "#f4f3f4"}
                            ios_backgroundColor="#3e3e3e"
                            onValueChange={toggleTheme}
                            value={isDark}
                        />
                    </View>
                </View>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: 'transparent',
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
    },
    content: {
        padding: 24,
    },
    section: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
        marginBottom: 16,
        opacity: 0.8,
    },
    inputContainer: {
        marginBottom: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    editRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    input: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        fontSize: 16,
        borderWidth: 1,
        marginRight: 8,
    },
    value: {
        fontSize: 16,
    },
    iconButton: {
        padding: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    rowInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowIcon: {
        marginRight: 12,
    },
    rowLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
});
