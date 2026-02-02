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

import { useTheme } from '../context/ThemeContext';

export default function AppNavigator() {
    const { theme } = useTheme();

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
                    tabBarActiveTintColor: theme.primary,
                    tabBarInactiveTintColor: theme.inactiveTint,
                    tabBarStyle: {
                        backgroundColor: theme.tabBar,
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
                        <View style={[styles.tabBarBackground, { backgroundColor: theme.tabBar }]}>
                            <View style={[styles.topBorder, { backgroundColor: theme.border }]} />
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
    },
    topBorder: {
        height: 1,
    },
});
