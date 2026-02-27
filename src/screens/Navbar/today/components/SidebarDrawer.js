import React from 'react';
import { ActivityIndicator, Animated, Image, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function SidebarDrawer({
    styles,
    theme,
    userData,
    isUserLoading,
    userError,
    isDark,
    toggleTheme,
    isSidebarVisible,
    dynamicBackdropOpacity,
    displayX,
    closeSidebar,
    navigateToSection,
}) {
    if (!isSidebarVisible) return null;
    const triggerTapFeedback = () => {
        Haptics.selectionAsync().catch(() => null);
    };

    return (
        <View style={[StyleSheet.absoluteFill, { zIndex: 100 }]}>
            <Animated.View style={[styles.sidebarOverlay, { opacity: dynamicBackdropOpacity }]}> 
                <TouchableOpacity style={styles.sidebarBackdrop} activeOpacity={1} onPress={closeSidebar} />
            </Animated.View>
            <Animated.View
                style={[
                    styles.sidebarContainer,
                    {
                        backgroundColor: theme.card,
                        transform: [{ translateX: displayX }],
                    },
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
                    <Text style={[styles.sidebarName, { color: theme.text }]}>{userData.name || 'User'}</Text>
                    {isUserLoading ? (
                        <View style={styles.sidebarInfoRow}>
                            <ActivityIndicator size="small" color={theme.primary} />
                            <Text style={[styles.sidebarInfoText, { color: theme.subText }]}>Loading profile...</Text>
                        </View>
                    ) : userError ? (
                        <Text style={[styles.sidebarInfoText, { color: theme.danger }]}>{userError}</Text>
                    ) : null}
                    <TouchableOpacity
                        onPress={closeSidebar}
                        onPressIn={triggerTapFeedback}
                        style={styles.closeSidebarButton}
                    >
                        <Ionicons name="close" size={24} color={theme.text} />
                    </TouchableOpacity>
                </View>

                <View style={styles.sidebarDivider} />

                <ScrollView style={styles.sidebarScroll} contentContainerStyle={styles.sidebarScrollContent} showsVerticalScrollIndicator={false}>
                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigateToSection('News')} onPressIn={triggerTapFeedback}>
                        <Ionicons name="newspaper-outline" size={24} color={theme.primary} />
                        <Text style={[styles.sidebarItemText, { color: theme.text }]}>News</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigateToSection('Market')} onPressIn={triggerTapFeedback}>
                        <Ionicons name="bar-chart-outline" size={24} color={theme.success} />
                        <Text style={[styles.sidebarItemText, { color: theme.text }]}>Share Market</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigateToSection('Trends')} onPressIn={triggerTapFeedback}>
                        <Ionicons name="trending-up-outline" size={24} color={theme.warning} />
                        <Text style={[styles.sidebarItemText, { color: theme.text }]}>Trends</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigateToSection('Crypto')} onPressIn={triggerTapFeedback}>
                        <Ionicons name="logo-bitcoin" size={24} color="#F7931A" />
                        <Text style={[styles.sidebarItemText, { color: theme.text }]}>Crypto News</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigateToSection('Movies')} onPressIn={triggerTapFeedback}>
                        <Ionicons name="film-outline" size={24} color={theme.text} />
                        <Text style={[styles.sidebarItemText, { color: theme.text }]}>Movies</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigateToSection('Tech')} onPressIn={triggerTapFeedback}>
                        <Ionicons name="hardware-chip-outline" size={24} color={theme.text} />
                        <Text style={[styles.sidebarItemText, { color: theme.text }]}>Tech Stuff</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.sidebarItem} onPress={() => navigateToSection('Notes')} onPressIn={triggerTapFeedback}>
                        <Ionicons name="document-text-outline" size={24} color={theme.primary} />
                        <Text style={[styles.sidebarItemText, { color: theme.text }]}>My Notes</Text>
                    </TouchableOpacity>

                    <View style={styles.sidebarDivider} />

                    <View style={styles.themeToggleContainer}>
                        <View style={styles.themeToggleLabel}>
                            <Ionicons name={isDark ? 'moon' : 'sunny'} size={24} color={theme.text} />
                            <Text style={[styles.sidebarItemText, { color: theme.text }]}>{isDark ? 'Dark Mode' : 'Light Mode'}</Text>
                        </View>
                        <Switch
                            trackColor={{ false: '#767577', true: theme.primary }}
                            thumbColor="#f4f3f4"
                            ios_backgroundColor="#3e3e3e"
                            onValueChange={toggleTheme}
                            value={isDark}
                        />
                    </View>
                </ScrollView>
            </Animated.View>
        </View>
    );
}
