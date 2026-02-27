import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Switch,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Platform,
    KeyboardAvoidingView,
    useWindowDimensions,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';

export default function SettingsScreen() {
    const { theme, isDark, toggleTheme } = useTheme();
    const { userData, updateName, updateAvatar, avatarOptions } = useUser();
    const { width } = useWindowDimensions();

    const [nameInput, setNameInput] = useState(userData.name);
    const [isEditing, setIsEditing] = useState(false);
    const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);

    const isWide = width >= 900;

    const initials = useMemo(() => {
        const name = userData.name?.trim() || 'User';
        return name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() || '')
            .join('');
    }, [userData.name]);

    const handleSaveName = () => {
        const cleaned = nameInput.trim();
        if (!cleaned) {
            setNameInput(userData.name);
            setIsEditing(false);
            return;
        }
        updateName(cleaned);
        setNameInput(cleaned);
        setIsEditing(false);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: theme.background }]}
        >
            <LinearGradient
                colors={isDark ? ['#0B1220', theme.background] : ['#EEF4FF', theme.background]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 0.38 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
            />

            <ScrollView contentContainerStyle={[styles.content, isWide && styles.contentWide]} showsVerticalScrollIndicator={false}>
                <View style={[styles.header, isWide && styles.headerWide]}>
                    <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
                    <Text style={[styles.subtitle, { color: theme.subText }]}>Manage profile, appearance, and app preferences.</Text>
                </View>

                <View
                    style={[
                        styles.heroCard,
                        {
                            backgroundColor: theme.card,
                            borderColor: theme.glassBorder,
                            shadowColor: theme.mode === 'dark' ? '#000' : '#64748B',
                        },
                    ]}
                >
                    <LinearGradient
                        colors={isDark ? ['#1E293B', '#334155'] : ['#F8FAFF', '#EFF6FF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={[styles.avatarCircle, { borderColor: theme.glassBorder }]}>
                        {userData.profileImage ? (
                            <Image source={userData.profileImage} style={styles.avatarImage} />
                        ) : (
                            <Text style={styles.avatarText}>{initials || 'U'}</Text>
                        )}
                    </View>
                    <View style={styles.heroTextGroup}>
                        <Text style={[styles.heroName, { color: theme.text }]}>{userData.name || 'User'}</Text>
                        <Text style={[styles.heroMeta, { color: theme.subText }]}>Personalized setup</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: theme.primary + '20' }]}>
                        <Text style={[styles.badgeText, { color: theme.primary }]}>{isDark ? 'Dark' : 'Light'}</Text>
                    </View>
                </View>

                <View style={[styles.sectionsWrap, isWide && styles.sectionsWrapWide]}>
                    <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}> 
                        <Text style={[styles.sectionHeader, { color: theme.subText }]}>PROFILE</Text>

                        <Text style={[styles.label, { color: theme.text }]}>Display Name</Text>
                        {isEditing ? (
                            <View style={styles.editRow}>
                                <TextInput
                                    style={[styles.input, { color: theme.text, backgroundColor: theme.input, borderColor: theme.border }]}
                                    value={nameInput}
                                    onChangeText={setNameInput}
                                    autoFocus
                                    onBlur={handleSaveName}
                                    onSubmitEditing={handleSaveName}
                                    returnKeyType="done"
                                />
                                <TouchableOpacity onPress={handleSaveName} style={[styles.actionIcon, { backgroundColor: theme.success + '20' }]}>
                                    <Ionicons name="checkmark" size={18} color={theme.success} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.valueRow}>
                                <Text style={[styles.value, { color: theme.text }]}>{userData.name || 'User'}</Text>
                                <TouchableOpacity onPress={() => setIsEditing(true)} style={[styles.actionIcon, { backgroundColor: theme.primary + '18' }]}>
                                    <Ionicons name="pencil" size={16} color={theme.primary} />
                                </TouchableOpacity>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.accordionHeader, { borderColor: theme.border, backgroundColor: theme.input }]}
                            activeOpacity={0.8}
                            onPress={() => setIsAvatarPickerOpen((prev) => !prev)}
                        >
                            <Text style={[styles.accordionTitle, { color: theme.text }]}>Picture Selection</Text>
                            <Ionicons
                                name={isAvatarPickerOpen ? 'chevron-up' : 'chevron-down'}
                                size={18}
                                color={theme.subText}
                            />
                        </TouchableOpacity>

                        {isAvatarPickerOpen ? (
                            <View style={styles.avatarOptionsGrid}>
                                {avatarOptions.map((avatar) => {
                                    const isActive = userData.avatarId === avatar.id;
                                    return (
                                        <TouchableOpacity
                                            key={avatar.id}
                                            onPress={() => updateAvatar(avatar.id)}
                                            activeOpacity={0.8}
                                            style={[
                                                styles.avatarOption,
                                                {
                                                    borderColor: isActive ? theme.primary : theme.border,
                                                    backgroundColor: isActive ? theme.primary + '12' : theme.input,
                                                },
                                            ]}
                                        >
                                            <Image source={avatar.source} style={styles.avatarOptionImage} />
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ) : null}
                    </View>

                    <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}> 
                        <Text style={[styles.sectionHeader, { color: theme.subText }]}>APPEARANCE</Text>

                        <View style={styles.settingRow}>
                            <View style={styles.settingLeft}>
                                <View style={[styles.settingIcon, { backgroundColor: theme.input }]}>
                                    <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={theme.primary} />
                                </View>
                                <View>
                                    <Text style={[styles.settingTitle, { color: theme.text }]}>Theme Mode</Text>
                                    <Text style={[styles.settingSub, { color: theme.subText }]}>{isDark ? 'Dark mode enabled' : 'Light mode enabled'}</Text>
                                </View>
                            </View>
                            <Switch
                                trackColor={{ false: '#94A3B8', true: theme.primary }}
                                thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : '#F8FAFC'}
                                ios_backgroundColor="#64748B"
                                onValueChange={toggleTheme}
                                value={isDark}
                            />
                        </View>
                    </View>

                    <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}> 
                        <Text style={[styles.sectionHeader, { color: theme.subText }]}>ABOUT</Text>

                        <View style={styles.infoRow}>
                            <View style={[styles.infoIcon, { backgroundColor: theme.input }]}>
                                <Ionicons name="code-slash-outline" size={18} color={theme.primary} />
                            </View>
                            <View>
                                <Text style={[styles.infoLabel, { color: theme.subText }]}>Developed by</Text>
                                <Text style={[styles.infoValue, { color: theme.text }]}>Xurde</Text>
                            </View>
                        </View>

                        <View style={[styles.infoDivider, { backgroundColor: theme.border }]} />

                        <View style={styles.infoRow}>
                            <View style={[styles.infoIcon, { backgroundColor: theme.input }]}>
                                <Ionicons name="hardware-chip-outline" size={18} color={theme.primary} />
                            </View>
                            <View>
                                <Text style={[styles.infoLabel, { color: theme.subText }]}>Version</Text>
                                <Text style={[styles.infoValue, { color: theme.text }]}>1.0.0</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 52,
        paddingBottom: 36,
    },
    contentWide: {
        paddingHorizontal: 28,
        maxWidth: 980,
        alignSelf: 'center',
        width: '100%',
    },
    header: {
        marginBottom: 18,
    },
    headerWide: {
        marginBottom: 24,
    },
    title: {
        fontSize: 34,
        fontWeight: '800',
        letterSpacing: -0.8,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '500',
    },
    heroCard: {
        borderRadius: 24,
        borderWidth: 1,
        padding: 18,
        marginBottom: 18,
        flexDirection: 'row',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 18,
        elevation: 4,
        overflow: 'hidden',
    },
    avatarCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        borderWidth: 1,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    },
    heroTextGroup: {
        flex: 1,
    },
    heroName: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 2,
    },
    heroMeta: {
        fontSize: 12,
        fontWeight: '600',
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.2,
        textTransform: 'uppercase',
    },
    sectionsWrap: {
        gap: 14,
    },
    sectionsWrapWide: {
        gap: 16,
    },
    section: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 16,
    },
    sectionHeader: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.2,
        marginBottom: 14,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 10,
    },
    editRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    valueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        marginRight: 10,
    },
    actionIcon: {
        width: 34,
        height: 34,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    value: {
        fontSize: 16,
        fontWeight: '600',
    },
    avatarOptionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 10,
    },
    accordionHeader: {
        marginTop: 16,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    accordionTitle: {
        fontSize: 14,
        fontWeight: '700',
    },
    avatarOption: {
        width: 46,
        height: 46,
        borderRadius: 23,
        borderWidth: 2,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarOptionImage: {
        width: '100%',
        height: '100%',
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingIcon: {
        width: 34,
        height: 34,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    settingTitle: {
        fontSize: 15,
        fontWeight: '700',
    },
    settingSub: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 1,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoIcon: {
        width: 34,
        height: 34,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    infoLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '700',
        marginTop: 1,
    },
    infoDivider: {
        height: 1,
        marginVertical: 14,
    },
});
