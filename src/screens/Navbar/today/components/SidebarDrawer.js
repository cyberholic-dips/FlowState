import React from 'react';
import { ActivityIndicator, Animated, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function SidebarDrawer({
    styles,
    theme,
    userData,
    isUserLoading,
    userError,
    isSidebarVisible,
    dynamicBackdropOpacity,
    displayX,
    closeSidebar,
    navigateToSection,
}) {
    if (!isSidebarVisible) {return null;}
    const triggerTapFeedback = () => {
        Haptics.selectionAsync().catch(() => null);
    };
    const menuItems = [
        { key: 'News', icon: 'newspaper-outline', color: theme.primary, label: 'News' },
        { key: 'Market', icon: 'bar-chart-outline', color: theme.success, label: 'Share Market' },
        { key: 'Trends', icon: 'trending-up-outline', color: theme.warning, label: 'Trends' },
        { key: 'Crypto', icon: 'logo-bitcoin', color: '#F7931A', label: 'Crypto News' },
        { key: 'DecisionWheel', icon: 'shuffle-outline', color: theme.secondary, label: 'Decision Wheel' },
        { key: 'Focus', icon: 'timer-outline', color: theme.primary, label: 'Focus' },
        { key: 'Tech', icon: 'hardware-chip-outline', color: theme.text, label: 'Tech Stuff' },
    ];

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
                    <View style={styles.sidebarHeaderRow}>
                        <View style={[styles.sidebarAvatar, { borderColor: theme.border }]}> 
                            {userData.profileImage ? (
                                <Image source={userData.profileImage} style={styles.avatarImage} />
                            ) : (
                                <Ionicons name="person" size={24} color={theme.primary} />
                            )}
                        </View>
                        <View style={styles.sidebarIdentity}>
                            <Text style={[styles.sidebarName, { color: theme.text }]} numberOfLines={1}>
                                {userData.name || 'User'}
                            </Text>
                            {isUserLoading ? (
                                <View style={styles.sidebarInfoRow}>
                                    <ActivityIndicator size="small" color={theme.primary} />
                                    <Text style={[styles.sidebarInfoText, { color: theme.subText }]}>Loading profile...</Text>
                                </View>
                            ) : userError ? (
                                <Text style={[styles.sidebarInfoText, { color: theme.danger }]} numberOfLines={1}>{userError}</Text>
                            ) : (
                                <Text style={[styles.sidebarSubtext, { color: theme.subText }]}>Welcome back</Text>
                            )}
                        </View>
                    </View>
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
                    {menuItems.map((item) => (
                        <TouchableOpacity
                            key={item.key}
                            style={[styles.sidebarItem, { backgroundColor: theme.input }]}
                            onPress={() => navigateToSection(item.key)}
                            onPressIn={triggerTapFeedback}
                        >
                            <Ionicons name={item.icon} size={22} color={item.color} />
                            <Text style={[styles.sidebarItemText, { color: theme.text }]}>{item.label}</Text>
                        </TouchableOpacity>
                    ))}

                    <View style={styles.sidebarDivider} />

                    <TouchableOpacity
                        style={[styles.sidebarItem, { backgroundColor: theme.input }]}
                        onPress={() => navigateToSection('Settings')}
                        onPressIn={triggerTapFeedback}
                    >
                        <Ionicons name="settings-outline" size={22} color={theme.text} />
                        <Text style={[styles.sidebarItemText, { color: theme.text }]}>Settings</Text>
                    </TouchableOpacity>
                </ScrollView>
            </Animated.View>
        </View>
    );
}
