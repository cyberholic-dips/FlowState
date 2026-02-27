import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Dimensions,
    Modal,
    SafeAreaView,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { storage } from '../../utils/storage';

const { width } = Dimensions.get('window');
const PLAN_AGREEMENT_TEMPLATE_TITLE = 'योजना सम्झौता गरी पाउ ।';
const PLAN_AGREEMENT_TEMPLATE_CONTENT = `बिषय :  योजना सम्झौता गरी पाउ ।

उपरोक्त सम्बन्धमा यस आ.व. [ ]को योजना [ work title ],[place of work] ठेक्का न :[  ] को योजना  सम्झौता गरिदिनुहुन अनुरोध गर्दछौ ।`;

export default function NoteScreen() {
    const { theme, isDark } = useTheme();
    const [notes, setNotes] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState('#all');
    const [noteTitle, setNoteTitle] = useState('');
    const [noteContent, setNoteContent] = useState('');
    const [noteTags, setNoteTags] = useState('');
    const [isNoteInputVisible, setIsNoteInputVisible] = useState(false);
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            loadNotes();
        }, [])
    );

    const loadNotes = async () => {
        setIsLoading(true);
        const loadedNotes = await storage.getNotes();
        setNotes(loadedNotes);
        setIsLoading(false);
    };

    const handleAddNote = async () => {
        if (!noteContent.trim() && !noteTitle.trim()) return;

        const tagsArray = noteTags.split(',')
            .map(t => t.trim().toLowerCase())
            .filter(t => t.length > 0)
            .map(t => t.startsWith('#') ? t : `#${t}`);

        const noteData = {
            title: noteTitle,
            content: noteContent,
            tags: tagsArray
        };

        let updatedNotes;
        if (editingNoteId) {
            updatedNotes = await storage.updateNote(editingNoteId, noteData);
        } else {
            updatedNotes = await storage.addNote(noteData);
        }

        setNotes(updatedNotes);
        clearInputs();
        setEditingNoteId(null);
        setIsNoteInputVisible(false);
    };

    const handleEditPress = (note) => {
        setEditingNoteId(note.id);
        setNoteTitle(note.title);
        setNoteContent(note.content);
        setNoteTags(note.tags ? note.tags.join(', ') : '');
        setIsNoteInputVisible(true);
    };

    const clearInputs = () => {
        setNoteTitle('');
        setNoteContent('');
        setNoteTags('');
    };

    const applyPlanAgreementTemplate = () => {
        setNoteTitle(PLAN_AGREEMENT_TEMPLATE_TITLE);
        setNoteContent(PLAN_AGREEMENT_TEMPLATE_CONTENT);
    };

    const handleDeleteNote = async (id) => {
        Alert.alert(
            "Delete Note",
            "Are you sure you want to permanently delete this thought?",
            [
                { text: "Keep it", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        const updatedNotes = await storage.deleteNote(id);
                        setNotes(updatedNotes);
                    }
                }
            ]
        );
    };

    const getAllTags = () => {
        const tags = new Set(['#all']);
        notes.forEach(note => {
            if (note.tags) {
                note.tags.forEach(tag => tags.add(tag));
            }
        });
        return Array.from(tags);
    };

    const filteredNotes = notes.filter(note => {
        const matchesSearch =
            (note.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (note.content?.toLowerCase() || '').includes(searchQuery.toLowerCase());

        const matchesTag = selectedTag === '#all' || (note.tags && note.tags.includes(selectedTag));

        return matchesSearch && matchesTag;
    });

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const groupNotesByDate = (notesList) => {
        const groups = {};
        notesList.forEach(note => {
            const date = new Date(note.createdAt);
            const today = new Date();
            const yesterday = new Date();
            yesterday.setDate(today.getDate() - 1);

            let label = 'OLDER';
            if (date.toDateString() === today.toDateString()) {
                label = 'TODAY';
            } else if (date.toDateString() === yesterday.toDateString()) {
                label = 'YESTERDAY';
            } else {
                label = date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();
            }

            if (!groups[label]) groups[label] = [];
            groups[label].push(note);
        });
        return groups;
    };

    const noteGroups = groupNotesByDate(filteredNotes);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    {/* Search Bar */}
                    <View style={styles.searchContainer}>
                        <View style={[styles.searchBar, { backgroundColor: isDark ? theme.card : '#F3F4F6' }]}>
                            <Ionicons name="search-outline" size={20} color={theme.subText} style={{ marginRight: 10 }} />
                            <TextInput
                                style={[styles.searchInput, { color: theme.text }]}
                                placeholder="Search your thoughts..."
                                placeholderTextColor={theme.subText}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                    </View>

                    {/* Tags Bar */}
                    <View style={styles.tagsBarContainer}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsScrollContent}>
                            {getAllTags().map(tag => (
                                <TouchableOpacity
                                    key={tag}
                                    style={[
                                        styles.tagPill,
                                        { backgroundColor: selectedTag === tag ? (isDark ? theme.primary : '#10B981') : (isDark ? theme.card : '#E5E7EB') }
                                    ]}
                                    onPress={() => setSelectedTag(tag)}
                                >
                                    <Text style={[
                                        styles.tagPillText,
                                        { color: selectedTag === tag ? 'white' : theme.text }
                                    ]}>
                                        {tag}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        {isLoading ? (
                            <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
                        ) : filteredNotes.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="document-text-outline" size={64} color={theme.border} />
                                <Text style={[styles.emptyText, { color: theme.subText }]}>No notes found</Text>
                            </View>
                        ) : (
                            Object.keys(noteGroups).map(label => (
                                <View key={label} style={styles.dateGroup}>
                                    <Text style={[styles.dateLabel, { color: theme.subText }]}>{label}</Text>
                                    {noteGroups[label].map(note => (
                                        <View key={note.id} style={[styles.noteCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
                                            <View style={styles.noteHeader}>
                                                <View style={styles.timeTag}>
                                                    <Ionicons name="time-outline" size={16} color="#10B981" />
                                                    <Text style={[styles.noteTime, { color: theme.text }]}>{formatTime(note.createdAt)}</Text>
                                                </View>
                                                {note.tags && note.tags.length > 0 && (
                                                    <View style={[styles.noteCategoryBadge, { backgroundColor: isDark ? theme.primary + '20' : '#ECFDF5' }]}>
                                                        <Text style={[styles.noteCategoryText, { color: isDark ? theme.primary : '#10B981' }]}>
                                                            {note.tags[0].toUpperCase()}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>

                                            <TouchableOpacity
                                                onPress={() => handleEditPress(note)}
                                                activeOpacity={0.7}
                                            >
                                                {note.title ? (
                                                    <Text style={[styles.noteTitle, { color: theme.text }]}>{note.title}</Text>
                                                ) : null}
                                                <Text style={[styles.notePreview, { color: theme.subText }]} numberOfLines={3}>
                                                    {note.content}
                                                </Text>
                                            </TouchableOpacity>

                                            <View style={styles.noteFooter}>
                                                <View style={styles.tagsContainer}>
                                                    {note.tags && note.tags.length > 1 && (
                                                        <View style={styles.moreTags}>
                                                            {note.tags.slice(1).map((t, idx) => (
                                                                <Text key={idx} style={[styles.smallTag, { color: theme.primary }]}>{t} </Text>
                                                            ))}
                                                        </View>
                                                    )}
                                                </View>
                                                <View style={styles.actionButtons}>
                                                    <TouchableOpacity
                                                        style={styles.actionBtn}
                                                        onPress={() => handleEditPress(note)}
                                                    >
                                                        <Ionicons name="create-outline" size={18} color={theme.subText} />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={styles.actionBtn}
                                                        onPress={() => handleDeleteNote(note.id)}
                                                    >
                                                        <Ionicons name="trash-outline" size={18} color={theme.danger || '#EF4444'} />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            ))
                        )}
                        <View style={{ height: 100 }} />
                    </ScrollView>

                    {/* Floating Add Button */}
                    {!isNoteInputVisible && (
                        <TouchableOpacity
                            style={[styles.floatingAddButton, { backgroundColor: theme.primary }]}
                            onPress={() => setIsNoteInputVisible(true)}
                        >
                            <Ionicons name="add" size={32} color="white" />
                        </TouchableOpacity>
                    )}

                    {/* Note Creation Modal */}
                    <Modal
                        visible={isNoteInputVisible}
                        animationType="slide"
                        transparent={true}
                        onRequestClose={() => setIsNoteInputVisible(false)}
                    >
                        <KeyboardAvoidingView
                            behavior={Platform.OS === "ios" ? "padding" : "height"}
                            style={styles.modalOverlay}
                        >
                            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                                <View style={styles.modalHeader}>
                                    <Text style={[styles.modalTitle, { color: theme.text }]}>
                                        {editingNoteId ? 'Update Thought' : 'New Thought'}
                                    </Text>
                                    <TouchableOpacity onPress={() => {
                                        setIsNoteInputVisible(false);
                                        setEditingNoteId(null);
                                        clearInputs();
                                    }}>
                                        <Ionicons name="close" size={24} color={theme.text} />
                                    </TouchableOpacity>
                                </View>

                                <TextInput
                                    style={[styles.titleInput, { color: theme.text }]}
                                    placeholder="Title (Optional)"
                                    placeholderTextColor={theme.subText}
                                    value={noteTitle}
                                    onChangeText={setNoteTitle}
                                />

                                <TouchableOpacity
                                    style={[styles.templateButton, { backgroundColor: isDark ? theme.primary + '22' : '#ECFDF5' }]}
                                    onPress={applyPlanAgreementTemplate}
                                >
                                    <Ionicons name="document-text-outline" size={16} color={isDark ? theme.primary : '#059669'} />
                                    <Text style={[styles.templateButtonText, { color: isDark ? theme.primary : '#059669' }]}>
                                        Use योजना सम्झौता template
                                    </Text>
                                </TouchableOpacity>

                                <TextInput
                                    style={[styles.contentInput, { color: theme.text }]}
                                    placeholder="What are you thinking?"
                                    placeholderTextColor={theme.subText}
                                    value={noteContent}
                                    onChangeText={setNoteContent}
                                    multiline
                                    autoFocus
                                />

                                <View style={styles.tagInputContainer}>
                                    <Ionicons name="pricetag-outline" size={20} color={theme.primary} />
                                    <TextInput
                                        style={[styles.tagInput, { color: theme.text }]}
                                        placeholder="tags (e.g. ideas, work)"
                                        placeholderTextColor={theme.subText}
                                        value={noteTags}
                                        onChangeText={setNoteTags}
                                    />
                                </View>

                                <TouchableOpacity
                                    style={[styles.saveButton, { backgroundColor: theme.primary }]}
                                    onPress={handleAddNote}
                                >
                                    <Text style={styles.saveButtonText}>
                                        {editingNoteId ? 'Update Note' : 'Save Note'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </KeyboardAvoidingView>
                    </Modal>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

// Reuse logic from TodayScreen for Sidebar if needed
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 15,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 50,
        borderRadius: 15,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
    },
    tagsBarContainer: {
        marginBottom: 20,
    },
    tagsScrollContent: {
        paddingHorizontal: 20,
        gap: 10,
    },
    tagPill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    tagPillText: {
        fontSize: 14,
        fontWeight: '700',
    },
    scrollContent: {
        paddingHorizontal: 20,
    },
    dateGroup: {
        marginBottom: 25,
    },
    dateLabel: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 15,
        textTransform: 'uppercase',
    },
    noteCard: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 15,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    noteHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    timeTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    noteTime: {
        fontSize: 14,
        fontWeight: '600',
        opacity: 0.6,
    },
    noteCategoryBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    noteCategoryText: {
        fontSize: 10,
        fontWeight: '800',
    },
    noteTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    notePreview: {
        fontSize: 15,
        lineHeight: 22,
        fontWeight: '500',
    },
    moreTags: {
        flexDirection: 'row',
        marginTop: 10,
        flexWrap: 'wrap',
    },
    smallTag: {
        fontSize: 11,
        fontWeight: '700',
        opacity: 0.7,
    },
    noteFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 15,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    tagsContainer: {
        flex: 1,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 15,
    },
    actionBtn: {
        padding: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        opacity: 0.3,
    },
    emptyText: {
        marginTop: 10,
        fontSize: 16,
        fontWeight: '600',
    },
    floatingAddButton: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        minHeight: '60%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
    },
    titleInput: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 15,
        paddingVertical: 10,
    },
    templateButton: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        marginBottom: 12,
    },
    templateButtonText: {
        fontSize: 13,
        fontWeight: '800',
    },
    contentInput: {
        flex: 1,
        fontSize: 16,
        lineHeight: 24,
        textAlignVertical: 'top',
        marginBottom: 20,
    },
    tagInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 25,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    tagInput: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
    },
    saveButton: {
        paddingVertical: 18,
        borderRadius: 15,
        alignItems: 'center',
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
    },
});
