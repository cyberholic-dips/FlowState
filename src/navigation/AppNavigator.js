import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';

import TodayScreen from '../screens/Navbar/TodayScreen';
import StatsScreen from '../screens/Navbar/StatsScreen';
import LearningScreen from '../screens/Navbar/LearningScreen';
import ExploreScreen from '../screens/Navbar/ExploreScreen';
import SettingsScreen from '../screens/Navbar/SettingsScreen';
import NewsScreen from '../screens/Sidebar/NewsScreen';
import MarketScreen from '../screens/Sidebar/MarketScreen';
import TrendsScreen from '../screens/Sidebar/TrendsScreen';
import CryptoScreen from '../screens/Sidebar/CryptoScreen';
import MoviesScreen from '../screens/Sidebar/MoviesScreen';

import TechScreen from '../screens/Sidebar/TechScreen';
import NoteScreen from '../screens/Sidebar/NoteScreen';
import OnboardingScreen from '../screens/OnboardingScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabNavigator() {
    const { theme, isDark } = useTheme();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    let iconColor = focused ? theme.primary : theme.inactiveTint;

                    if (route.name === 'Today') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Stats') {
                        iconName = focused ? 'stats-chart' : 'stats-chart-outline';
                    } else if (route.name === 'Learning') {
                        iconName = focused ? 'book' : 'book-outline';
                    } else if (route.name === 'Explore') {
                        iconName = focused ? 'compass' : 'compass-outline';
                    } else if (route.name === 'Settings') {
                        iconName = focused ? 'settings' : 'settings-outline';
                    }

                    return (
                        <View style={focused ? styles.activeIconCircle : null}>
                            <Ionicons name={iconName} size={focused ? 24 : 22} color={iconColor} />
                        </View>
                    );
                },
                tabBarActiveTintColor: theme.primary,
                tabBarInactiveTintColor: theme.inactiveTint,
                tabBarShowLabel: false,
                tabBarStyle: {
                    position: 'absolute',
                    bottom: 30,
                    left: 20,
                    right: 20,
                    elevation: 10,
                    backgroundColor: theme.tabBar,
                    borderRadius: 35,
                    height: 70,
                    shadowColor: theme.mode === 'dark' ? '#000' : '#475569',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.15,
                    shadowRadius: 15,
                    borderTopWidth: 1,
                    borderTopColor: theme.glassBorder,
                    borderLeftWidth: 1,
                    borderLeftColor: theme.glassBorder,
                    borderRightWidth: 1,
                    borderRightColor: theme.glassBorder,
                },
                tabBarItemStyle: {
                    height: 70,
                    justifyContent: 'center',
                    alignItems: 'center',
                },
            })}
        >
            <Tab.Screen name="Today" component={TodayScreen} />
            <Tab.Screen name="Stats" component={StatsScreen} />
            <Tab.Screen name="Learning" component={LearningScreen} />
            <Tab.Screen name="Explore" component={ExploreScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
    );
}

import { useTheme } from '../context/ThemeContext';
import { storage } from '../utils/storage';

import CustomHeader from '../components/CustomHeader';

export default function AppNavigator() {
    const { theme } = useTheme();
    const [isAppReady, setIsAppReady] = React.useState(false);
    const [initialRoute, setInitialRoute] = React.useState('Onboarding');

    React.useEffect(() => {
        async function checkOnboarding() {
            try {
                const hasCompleted = await storage.getHasCompletedOnboarding();
                if (hasCompleted) {
                    setInitialRoute('MainTabs');
                }
            } catch (error) {
                console.error('Failed to check onboarding status', error);
            } finally {
                setIsAppReady(true);
            }
        }
        checkOnboarding();
    }, []);

    if (!isAppReady) {
        return null; // or a loading splash screen
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName={initialRoute}
                screenOptions={{
                    headerShown: false,
                }}
            >
                <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                <Stack.Screen name="MainTabs" component={TabNavigator} />

                {/* Sidebar Screens with Custom Header */}
                <Stack.Screen
                    name="News"
                    component={NewsScreen}
                    options={{
                        headerShown: true,
                        header: (props) => <CustomHeader {...props} />,
                        title: 'Global News'
                    }}
                />
                <Stack.Screen
                    name="Market"
                    component={MarketScreen}
                    options={{
                        headerShown: true,
                        header: (props) => <CustomHeader {...props} />,
                        title: 'Market Watch'
                    }}
                />
                <Stack.Screen
                    name="Trends"
                    component={TrendsScreen}
                    options={{
                        headerShown: true,
                        header: (props) => <CustomHeader {...props} />,
                        title: 'Trending'
                    }}
                />
                <Stack.Screen
                    name="Crypto"
                    component={CryptoScreen}
                    options={{
                        headerShown: true,
                        header: (props) => <CustomHeader {...props} />,
                        title: 'Crypto News'
                    }}
                />
                <Stack.Screen
                    name="Movies"
                    component={MoviesScreen}
                    options={{
                        headerShown: true,
                        header: (props) => <CustomHeader {...props} />,
                        title: 'Movies & TV'
                    }}
                />

                <Stack.Screen
                    name="Tech"
                    component={TechScreen}
                    options={{
                        headerShown: true,
                        header: (props) => <CustomHeader {...props} />,
                        title: 'Tech Stuff'
                    }}
                />
                <Stack.Screen
                    name="Notes"
                    component={NoteScreen}
                    options={{
                        headerShown: true,
                        header: (props) => <CustomHeader {...props} />,
                        title: 'My Notes'
                    }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    activeIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(99, 102, 241, 0.1)', // theme.primary with low opacity
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabBarBackground: {
        flex: 1,
    },
    topBorder: {
        height: 1,
    },
});
