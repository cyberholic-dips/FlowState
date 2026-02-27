import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { useTime } from '../../context/TimeContext';
import { useTodayData } from './today/hooks/useTodayData';
import { useSidebarDrawer } from './today/hooks/useSidebarDrawer';
import TodayHeaderSection from './today/components/TodayHeaderSection';
import ProjectsSection from './today/components/ProjectsSection';
import HabitsSection from './today/components/HabitsSection';
import TodayModals from './today/components/TodayModals';
import SidebarDrawer from './today/components/SidebarDrawer';

export default function TodayScreen() {
    const { theme, isDark, toggleTheme } = useTheme();
    const { userData, isUserLoading, userError } = useUser();
    const { playSuccessChime } = useTime();
    const navigation = useNavigation();

    const {
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
        editingProjectId,
        newProjectName,
        setNewProjectName,
        newProjectDuration,
        setNewProjectDuration,

        showConfetti,
        setShowConfetti,

        openCreateHabitModal,
        closeHabitModal,
        openEditModal,
        openOptions,
        toggleHabit,
        handleAddOrUpdateHabit,
        handleDeleteHabit,

        loadHabits,
        loadProjects,
        fetchQuote,
        openCreateProjectModal,
        closeProjectModal,
        openEditProjectModal,
        handleAddOrUpdateProject,
        handleCompleteProject,
        handleDeleteProject,
        calculateDaysLeft,
        getDaysLeftColor,
    } = useTodayData({ playSuccessChime });

    const {
        isSidebarVisible,
        openSidebar,
        closeSidebar,
        navigateToSection,
        displayX,
        dynamicBackdropOpacity,
    } = useSidebarDrawer({ navigation, theme });

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={{ flex: 1 }}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <TodayHeaderSection
                        styles={styles}
                        theme={theme}
                        userData={userData}
                        today={today}
                        quote={quote}
                        loadingQuote={loadingQuote}
                        quoteError={quoteError}
                        weekDays={weekDays}
                        onOpenSidebar={openSidebar}
                        onOpenHabitModal={openCreateHabitModal}
                        onRetryQuote={fetchQuote}
                    />

                    <ProjectsSection
                        styles={styles}
                        theme={theme}
                        projects={projects}
                        loadingProjects={loadingProjects}
                        projectsError={projectsError}
                        onRetryLoadProjects={loadProjects}
                        onOpenProjectModal={openCreateProjectModal}
                        onEditProject={openEditProjectModal}
                        onCompleteProject={handleCompleteProject}
                        onDeleteProject={handleDeleteProject}
                        calculateDaysLeft={calculateDaysLeft}
                        getDaysLeftColor={getDaysLeftColor}
                    />

                    <HabitsSection
                        styles={styles}
                        theme={theme}
                        habits={habits}
                        loadingHabits={loadingHabits}
                        habitsError={habitsError}
                        onRetryLoadHabits={loadHabits}
                        completedCount={completedCount}
                        isCompleted={isCompleted}
                        onToggleHabit={toggleHabit}
                        onEditHabit={openEditModal}
                        onDeleteHabit={handleDeleteHabit}
                        onOpenOptions={openOptions}
                        onOpenHabitModal={openCreateHabitModal}
                    />

                    <View style={{ height: 40 }} />
                </ScrollView>
            </View>

            <TodayModals
                styles={styles}
                theme={theme}
                isHabitModalVisible={isHabitModalVisible}
                closeHabitModal={closeHabitModal}
                editingHabitId={editingHabitId}
                newHabitName={newHabitName}
                setNewHabitName={setNewHabitName}
                reminderTime={reminderTime}
                setReminderTime={setReminderTime}
                handleAddOrUpdateHabit={handleAddOrUpdateHabit}
                isOptionsVisible={isOptionsVisible}
                setIsOptionsVisible={setIsOptionsVisible}
                selectedHabit={selectedHabit}
                openEditModal={openEditModal}
                handleDeleteHabit={handleDeleteHabit}
                isProjectModalVisible={isProjectModalVisible}
                closeProjectModal={closeProjectModal}
                editingProjectId={editingProjectId}
                newProjectName={newProjectName}
                setNewProjectName={setNewProjectName}
                newProjectDuration={newProjectDuration}
                setNewProjectDuration={setNewProjectDuration}
                handleAddOrUpdateProject={handleAddOrUpdateProject}
            />

            <SidebarDrawer
                styles={styles}
                theme={theme}
                userData={userData}
                isUserLoading={isUserLoading}
                userError={userError}
                isDark={isDark}
                toggleTheme={toggleTheme}
                isSidebarVisible={isSidebarVisible}
                dynamicBackdropOpacity={dynamicBackdropOpacity}
                displayX={displayX}
                closeSidebar={closeSidebar}
                navigateToSection={navigateToSection}
            />

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
    sectionStateCard: {
        borderWidth: 1,
        borderRadius: 20,
        padding: 18,
        marginBottom: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionStateText: {
        marginTop: 10,
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
    },
    inlineActionButton: {
        marginTop: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
    },
    inlineActionText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
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
    swipeActionsWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
        marginRight: 2,
    },
    swipeActionButton: {
        width: 72,
        height: '92%',
        borderRadius: 18,
        marginLeft: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    swipeActionLabel: {
        color: 'white',
        fontSize: 10,
        fontWeight: '700',
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.2,
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
    quoteErrorWrap: {
        alignItems: 'flex-start',
    },
    quoteErrorText: {
        fontSize: 13,
        fontWeight: '500',
        lineHeight: 20,
    },
    sidebarInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    sidebarInfoText: {
        marginTop: 6,
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
});
