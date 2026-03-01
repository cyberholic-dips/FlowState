import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing } from 'react-native';
import { getFloatingTabBarStyle } from '../../../../navigation/tabBarStyles';

const { width } = Dimensions.get('window');

export function useSidebarDrawer({ navigation, theme }) {
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const sidebarX = useRef(new Animated.Value(-width * 0.8)).current;

    useEffect(() => {
        if (isSidebarVisible) {
            navigation.setOptions({
                tabBarStyle: { display: 'none' },
            });
            return;
        }

        // Keep Home tab visually identical to global floating tab bar.
        navigation.setOptions({
            tabBarStyle: getFloatingTabBarStyle(theme),
        });
    }, [isSidebarVisible, navigation, theme]);

    const openSidebar = () => {
        setIsSidebarVisible(true);
        Animated.timing(sidebarX, {
            toValue: 0,
            duration: 300,
            easing: Easing.out(Easing.bezier(0.25, 0.1, 0.25, 1)),
            useNativeDriver: true,
        }).start();
    };

    const closeSidebar = () => {
        Animated.timing(sidebarX, {
            toValue: -width * 0.8,
            duration: 250,
            easing: Easing.in(Easing.bezier(0.25, 0.1, 0.25, 1)),
            useNativeDriver: true,
        }).start(() => {
            setIsSidebarVisible(false);
        });
    };

    const navigateToSection = (screenName) => {
        closeSidebar();
        navigation.navigate(screenName);
    };

    const dynamicBackdropOpacity = sidebarX.interpolate({
        inputRange: [-width * 0.8, 0],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    return {
        isSidebarVisible,
        openSidebar,
        closeSidebar,
        navigateToSection,
        displayX: sidebarX,
        dynamicBackdropOpacity,
    };
}
