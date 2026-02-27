import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing } from 'react-native';

const { width } = Dimensions.get('window');

export function useSidebarDrawer({ navigation, theme }) {
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const sidebarX = useRef(new Animated.Value(-width * 0.8)).current;

    useEffect(() => {
        navigation.setOptions({
            tabBarStyle: isSidebarVisible
                ? { display: 'none' }
                : {
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
