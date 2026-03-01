import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTime } from '../../context/TimeContext';
import { useTheme } from '../../context/ThemeContext';

export default function FocusPanel() {
    const {
        focusTime,
        isFocusRunning,
        focusTitle,
        startFocus,
        stopFocus,
        resetFocus,
        setFocusTitle,
    } = useTime();
    const { theme } = useTheme();

    const formatTime = (time) => {
        const secs = ("0" + (Math.floor(time / 1000) % 60)).slice(-2);
        const mins = ("0" + (Math.floor(time / 60000) % 60)).slice(-2);
        const hrs = Math.floor(time / 3600000);
        return hrs > 0 ? `${hrs}:${mins}:${secs}` : `${mins}:${secs}`;
    };

    const [focusTarget, setFocusTarget] = useState(25); // Default 25m

    const handleToggle = () => {
        if (!isFocusRunning) {
            if (!focusTitle.trim()) {
                Alert.alert('Objective Required', 'What are you focusing on?');
                return;
            }
            startFocus(focusTitle, focusTarget * 60);
        } else {
            stopFocus();
        }
    };

    return (
        <View style={[styles.panel, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.iconBox, { backgroundColor: theme.primary + '15' }]}>
                        <Ionicons name="stopwatch-outline" size={24} color={theme.primary} />
                    </View>
                    <Text style={[styles.title, { color: theme.text }]}>Focus Session</Text>
                </View>
            </View>

            <TextInput
                style={[styles.input, { backgroundColor: theme.input, color: theme.text, borderColor: theme.border }]}
                placeholder="Session Objective..."
                placeholderTextColor={theme.subText}
                value={focusTitle}
                onChangeText={setFocusTitle}
                editable={!isFocusRunning}
            />

            <View style={styles.timerContainer}>
                <Text style={[styles.timerValue, { color: theme.text }]}>{formatTime(focusTime)}</Text>
                <Text style={[styles.timerLabel, { color: theme.subText }]}>TIME ELAPSED</Text>
            </View>

            <View style={styles.controls}>
                <TouchableOpacity
                    style={[styles.btn, styles.resetBtn, { backgroundColor: theme.input }]}
                    onPress={resetFocus}
                >
                    <Text style={[styles.btnText, { color: theme.text }]}>Reset</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.btn, { backgroundColor: isFocusRunning ? theme.danger : theme.primary }]}
                    onPress={handleToggle}
                >
                    <Ionicons name={isFocusRunning ? "pause" : "play"} size={20} color="white" />
                    <Text style={[styles.btnText, { color: 'white', marginLeft: 8 }]}>
                        {isFocusRunning ? 'Stop' : 'Start'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Presets */}
            {!isFocusRunning && (
                <View style={styles.presets}>
                    {[25, 45, 60].map(mins => (
                        <TouchableOpacity
                            key={mins}
                            style={[styles.presetItem, { backgroundColor: focusTarget === mins ? theme.primary : theme.input }]}
                            onPress={() => {
                                setFocusTarget(mins);
                                setFocusTitle(`${mins}m Deep Work`);
                            }}
                        >
                            <Text style={[styles.presetText, { color: focusTarget === mins ? 'white' : theme.subText }]}>{mins}m</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    panel: {
        padding: 24,
        borderRadius: 28,
        borderWidth: 1,
        marginBottom: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
    },
    input: {
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        borderWidth: 1,
        marginBottom: 24,
    },
    timerContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    timerValue: {
        fontSize: 48,
        fontWeight: '800',
        letterSpacing: -1,
    },
    timerLabel: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 2,
        marginTop: 4,
    },
    controls: {
        flexDirection: 'row',
        gap: 12,
    },
    btn: {
        flex: 1,
        height: 54,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnText: {
        fontSize: 15,
        fontWeight: '700',
    },
    presets: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    presetItem: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
    },
    presetText: {
        fontSize: 12,
        fontWeight: '700',
    }
});
