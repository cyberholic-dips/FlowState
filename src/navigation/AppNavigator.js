import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';

import TodayScreen from '../screens/Navbar/TodayScreen';
import StatsScreen from '../screens/Navbar/StatsScreen';
import ExploreScreen from '../screens/Navbar/ExploreScreen';
import SettingsScreen from '../screens/Navbar/SettingsScreen';
import NewsScreen from '../screens/Sidebar/NewsScreen';
import MarketScreen from '../screens/Sidebar/MarketScreen';
import TrendsScreen from '../screens/Sidebar/TrendsScreen';
import CryptoScreen from '../screens/Sidebar/CryptoScreen';
import MoviesScreen from '../screens/Sidebar/MoviesScreen';
import YoutubeScreen from '../screens/Sidebar/YoutubeScreen';
import TechScreen from '../screens/Sidebar/TechScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabNavigator() {
    const { theme } = useTheme();

    return (
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
                    position: 'absolute',
                    bottom: 25,
                    left: 20,
                    right: 20,
                    elevation: 5,
                    backgroundColor: theme.card,
                    borderRadius: 15,
                    height: 70,
                    paddingBottom: 10,
                    paddingTop: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 5 },
                    shadowOpacity: 0.1,
                    shadowRadius: 5,
                    borderTopWidth: 0,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    letterSpacing: 0.5,
                    marginTop: 4,
                },
                tabBarItemStyle: {
                    paddingVertical: 5,
                    borderRadius: 15, // Match rounded corners for ripples
                },
                // Removed custom background to let shape shine
                tabBarBackground: () => (
                    <View style={{ flex: 1, borderRadius: 15, backgroundColor: theme.card }} />
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
    );
}

import { useTheme } from '../context/ThemeContext';

export default function AppNavigator() {
    const { theme } = useTheme();

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="MainTabs" component={TabNavigator} />
                <Stack.Screen name="News" component={NewsScreen} options={{ headerShown: true, title: 'News', headerStyle: { backgroundColor: theme.card }, headerTintColor: theme.text }} />
                <Stack.Screen name="Market" component={MarketScreen} options={{ headerShown: true, title: 'Market', headerStyle: { backgroundColor: theme.card }, headerTintColor: theme.text }} />
                <Stack.Screen name="Trends" component={TrendsScreen} options={{ headerShown: true, title: 'Trends', headerStyle: { backgroundColor: theme.card }, headerTintColor: theme.text }} />
                <Stack.Screen name="Crypto" component={CryptoScreen} options={{ headerShown: true, title: 'Crypto', headerStyle: { backgroundColor: theme.card }, headerTintColor: theme.text }} />
                <Stack.Screen name="Movies" component={MoviesScreen} options={{ headerShown: true, title: 'Movies', headerStyle: { backgroundColor: theme.card }, headerTintColor: theme.text }} />
                <Stack.Screen name="Youtube" component={YoutubeScreen} options={{ headerShown: true, title: 'YouTube', headerStyle: { backgroundColor: theme.card }, headerTintColor: theme.text }} />
                <Stack.Screen name="Tech" component={TechScreen} options={{ headerShown: true, title: 'Tech Stuff', headerStyle: { backgroundColor: theme.card }, headerTintColor: theme.text }} />
            </Stack.Navigator>
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
