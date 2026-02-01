import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';

import TodayScreen from '../screens/TodayScreen';
import StatsScreen from '../screens/StatsScreen';
import ExploreScreen from '../screens/ExploreScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

// Custom colors matching the reference design
const COLORS = {
    primary: '#34D399',      // Green color for active state
    inactive: '#9CA3AF',     // Gray color for inactive state
    background: '#FFFFFF',   // White background
    text: '#1F2937',         // Dark text
};

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    headerShown: false,
                    tabBarIcon: ({ focused, color, size }) => {
                        let iconName;

                        if (route.name === 'Today') {
                            iconName = focused ? 'home' : 'home-outline';
                        } else if (route.name === 'Stats') {
                            iconName = focused ? 'grid' : 'grid-outline';
                        } else if (route.name === 'Explore') {
                            iconName = focused ? 'compass' : 'compass-outline';
                        } else if (route.name === 'Settings') {
                            iconName = focused ? 'settings' : 'settings-outline';
                        }

                        return <Ionicons name={iconName} size={24} color={color} />;
                    },
                    tabBarActiveTintColor: COLORS.primary,
                    tabBarInactiveTintColor: COLORS.inactive,
                    tabBarStyle: {
                        backgroundColor: COLORS.background,
                        borderTopWidth: 0,
                        elevation: 0,
                        shadowOpacity: 0,
                        height: 85,
                        paddingBottom: 20,
                        paddingTop: 10,
                    },
                    tabBarLabelStyle: {
                        fontSize: 11,
                        fontWeight: '600',
                        letterSpacing: 0.5,
                        marginTop: 4,
                    },
                    tabBarItemStyle: {
                        paddingVertical: 5,
                    },
                    // Add indicator bar at the top of active tab
                    tabBarBackground: () => (
                        <View style={styles.tabBarBackground}>
                            <View style={styles.topBorder} />
                        </View>
                    ),
                })}
            >
                <Tab.Screen
                    name="Today"
                    component={TodayScreen}
                    options={{
                        tabBarLabel: 'TODAY',
                    }}
                />
                <Tab.Screen
                    name="Stats"
                    component={StatsScreen}
                    options={{
                        tabBarLabel: 'STATS',
                    }}
                />
                <Tab.Screen
                    name="Explore"
                    component={ExploreScreen}
                    options={{
                        tabBarLabel: 'EXPLORE',
                    }}
                />
                <Tab.Screen
                    name="Settings"
                    component={SettingsScreen}
                    options={{
                        tabBarLabel: 'SETTINGS',
                    }}
                />
            </Tab.Navigator>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    tabBarBackground: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    topBorder: {
        height: 1,
        backgroundColor: '#E5E7EB',
    },
});
