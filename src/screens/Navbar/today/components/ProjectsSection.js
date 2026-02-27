import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import * as Haptics from 'expo-haptics';

export default function ProjectsSection({
    styles,
    theme,
    projects,
    loadingProjects,
    projectsError,
    onRetryLoadProjects,
    onOpenProjectModal,
    onEditProject,
    onCompleteProject,
    onDeleteProject,
    calculateDaysLeft,
    getDaysLeftColor,
}) {
    const triggerTapFeedback = () => {
        Haptics.selectionAsync().catch(() => null);
    };

    const renderProjectActions = (project) => (
        <View style={styles.swipeActionsWrap}>
            <TouchableOpacity
                style={[styles.swipeActionButton, { backgroundColor: theme.success }]}
                activeOpacity={0.8}
                onPress={() => {
                    triggerTapFeedback();
                    onCompleteProject(project.id);
                }}
            >
                <Ionicons name="checkmark" size={16} color="white" />
                <Text style={styles.swipeActionLabel}>Done</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.swipeActionButton, { backgroundColor: theme.primary }]}
                activeOpacity={0.8}
                onPress={() => {
                    triggerTapFeedback();
                    onEditProject(project);
                }}
            >
                <Ionicons name="pencil" size={16} color="white" />
                <Text style={styles.swipeActionLabel}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.swipeActionButton, { backgroundColor: theme.danger }]}
                activeOpacity={0.8}
                onPress={() => {
                    triggerTapFeedback();
                    onDeleteProject(project.id);
                }}
            >
                <Ionicons name="trash" size={16} color="white" />
                <Text style={styles.swipeActionLabel}>Delete</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Tasks to Complete</Text>
                <TouchableOpacity
                    onPress={() => {
                        triggerTapFeedback();
                        onOpenProjectModal();
                    }}
                    style={[styles.addSectionButton, { backgroundColor: theme.input }]}
                >
                    <Ionicons name="add" size={20} color={theme.primary} />
                </TouchableOpacity>
            </View>

            {loadingProjects && (
                <View style={[styles.sectionStateCard, { borderColor: theme.border, backgroundColor: theme.glassBackground }]}>
                    <ActivityIndicator color={theme.primary} />
                    <Text style={[styles.sectionStateText, { color: theme.subText }]}>Loading tasks...</Text>
                </View>
            )}

            {!!projectsError && (
                <View style={[styles.sectionStateCard, { borderColor: theme.danger + '66', backgroundColor: theme.glassBackground }]}>
                    <Text style={[styles.sectionStateText, { color: theme.danger }]}>{projectsError}</Text>
                    <TouchableOpacity
                        style={[styles.inlineActionButton, { backgroundColor: theme.primary }]}
                        onPress={() => {
                            triggerTapFeedback();
                            onRetryLoadProjects();
                        }}
                    >
                        <Text style={styles.inlineActionText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            )}

            {!loadingProjects && !projectsError && projects.length === 0 ? (
                <TouchableOpacity
                    onPress={() => {
                        triggerTapFeedback();
                        onOpenProjectModal();
                    }}
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
            ) : null}

            {!loadingProjects && !projectsError && projects.map((project) => {
                    const daysLeft = calculateDaysLeft(project);
                    const daysColor = getDaysLeftColor(daysLeft);
                    const daysText = daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`;

                    return (
                        <Swipeable key={project.id} renderRightActions={() => renderProjectActions(project)}>
                            <View
                                style={[
                                    styles.projectCard,
                                    {
                                        backgroundColor: theme.glassBackground,
                                        borderColor: theme.glassBorder,
                                        borderWidth: 1,
                                        shadowColor: theme.shadow,
                                    },
                                ]}
                            >
                                <View style={styles.projectInfo}>
                                    <Text style={[styles.projectName, { color: theme.text }]}>{project.name}</Text>
                                    <Text style={[styles.projectDeadlineLabel, { color: theme.subText }]}>Duration: {project.durationDays} days</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <View style={[styles.daysLeftBadge, { backgroundColor: daysColor + '20' }]}>
                                        <LinearGradient colors={[daysColor, daysColor + 'CC']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                                        <Text style={[styles.daysLeftText, { color: 'white' }]}>{daysText}</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => {
                                            triggerTapFeedback();
                                            onDeleteProject(project.id);
                                        }}
                                        onPressIn={triggerTapFeedback}
                                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                                        style={{ marginTop: 10 }}
                                    >
                                        <Ionicons name="trash-outline" size={16} color={theme.subText} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Swipeable>
                    );
                })}
        </View>
    );
}
