import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, ScrollView, Dimensions } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 60) / 2;

export default function MoviesScreen() {
    const { theme } = useTheme();
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch trending movies (using a publicly accessible mock/curated feed for speed)
        const fetchMovies = async () => {
            try {
                // For demonstration, we'll use a curated list of "Fan Favorites" as per original intent
                // In a real app, this would be a fetch to TMDb or similar
                const mockMovies = [
                    { id: '1', title: 'The Shawshank Redemption', rating: '9.3', year: '1994', poster: 'https://m.media-amazon.com/images/M/MV5BNDE3ODcxYzMtY2YzZC00NmIyLTgwYzEtadc1YjgzMzM4NjkxXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg' },
                    { id: '2', title: 'The Godfather', rating: '9.2', year: '1972', poster: 'https://m.media-amazon.com/images/M/MV5BM2MyNjYxNmUtYTAwNi00MTYxLWJmNWYtYzZlODY3ZTk3OTFlXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_FMjpg_UX1000_.jpg' },
                    { id: '3', title: 'The Dark Knight', rating: '9.0', year: '2008', poster: 'https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_.jpg' },
                    { id: '4', title: 'Pulp Fiction', rating: '8.9', year: '1994', poster: 'https://m.media-amazon.com/images/M/MV5BNGNhMDIzZTUtNTBlZi00MTRlLWFjM2ItYzViMjE3YzI5MjVlXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg' },
                    { id: '5', title: 'Inception', rating: '8.8', year: '2010', poster: 'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_.jpg' },
                    { id: '6', title: 'Interstellar', rating: '8.7', year: '2014', poster: 'https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS00OGEyLWFmMjktY2FiMmZkNWIyODZiXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg' },
                ];
                setMovies(mockMovies);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching movies:", error);
                setLoading(false);
            }
        };

        fetchMovies();
    }, []);

    const renderItem = ({ item }) => (
        <TouchableOpacity style={[styles.movieCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]} activeOpacity={0.8}>
            <Image source={{ uri: item.poster }} style={styles.poster} />
            <View style={styles.movieInfo}>
                <Text style={[styles.movieTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
                <View style={styles.movieMeta}>
                    <View style={styles.ratingRow}>
                        <Ionicons name="star" size={14} color="#F59E0B" />
                        <Text style={[styles.ratingText, { color: theme.text }]}>{item.rating}</Text>
                    </View>
                    <Text style={[styles.yearText, { color: theme.subText }]}>{item.year}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Fan Favorites</Text>
            <FlatList
                data={movies}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                numColumns={2}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 10,
    },
    listContent: {
        paddingHorizontal: 15,
        paddingBottom: 20,
    },
    movieCard: {
        width: COLUMN_WIDTH,
        margin: 7.5,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 5,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    poster: {
        width: '100%',
        height: 220,
        backgroundColor: '#E5E7EB',
    },
    movieInfo: {
        padding: 12,
    },
    movieTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 6,
    },
    movieMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    yearText: {
        fontSize: 12,
        fontWeight: '600',
    },
});
