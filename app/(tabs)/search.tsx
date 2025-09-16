import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Search, ExternalLink, Star } from 'lucide-react-native';
import { useComicReader } from '@/hooks/useComicReader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

const POPULAR_COMIC_SITES = [
  {
    name: 'MangaDex',
    url: 'https://mangadex.org',
    description: 'Popular manga reading platform',
    rating: 4.8,
  },
  {
    name: 'Webtoons',
    url: 'https://www.webtoons.com',
    description: 'Digital comics and webtoons',
    rating: 4.6,
  },
  {
    name: 'Tapas',
    url: 'https://tapas.io',
    description: 'Independent comics and novels',
    rating: 4.4,
  },
  {
    name: 'Comic Walker',
    url: 'https://comic-walker.com',
    description: 'Japanese manga platform',
    rating: 4.5,
  },
];

const SEARCH_SUGGESTIONS = [
  'One Piece',
  'Naruto',
  'Attack on Titan',
  'My Hero Academia',
  'Demon Slayer',
  'Dragon Ball',
  'Death Note',
  'Tokyo Ghoul',
];

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<string>('');
  const { setCurrentUrl } = useComicReader();
  const insets = useSafeAreaInsets();
  
  const containerStyle = useMemo(() => StyleSheet.create({
    dynamicContainer: {
      ...styles.container,
      paddingTop: insets.top,
    },
  }), [insets.top]);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setNotification('Please enter a search term');
      setTimeout(() => setNotification(''), 3000);
      return;
    }

    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery + ' manga comic online read')}`;
    setCurrentUrl(searchUrl);
    
    // Navigate to reader tab
    router.push('/(tabs)/reader');
    
    // Show success message
    setNotification('Opening search results in Reader tab');
    setTimeout(() => setNotification(''), 3000);
  };

  const handleSiteSelect = (url: string) => {
    setCurrentUrl(url);
    
    // Navigate to reader tab
    router.push('/(tabs)/reader');
    
    // Show success message
    setNotification('Loading comic site in Reader tab');
    setTimeout(() => setNotification(''), 3000);
  };

  const handleSuggestionPress = (suggestion: string) => {
    setSearchQuery(suggestion);
  };

  return (
    <View style={containerStyle.dynamicContainer}>
      <StatusBar style="light" />
      
      {/* Notification */}
      {notification ? (
        <View style={styles.notification}>
          <Text style={styles.notificationText}>{notification}</Text>
        </View>
      ) : null}
      
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Find Comics</Text>
          <Text style={styles.headerSubtitle}>
            Search for your favorite comics and manga
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search color="#999" size={20} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for comics..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
          </View>
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>

        {/* Search Suggestions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Searches</Text>
          <View style={styles.suggestionsContainer}>
            {SEARCH_SUGGESTIONS.map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                style={styles.suggestionChip}
                onPress={() => handleSuggestionPress(suggestion)}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Popular Sites */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Comic Sites</Text>
          {POPULAR_COMIC_SITES.map((site) => (
            <TouchableOpacity
              key={site.name}
              style={styles.siteCard}
              onPress={() => handleSiteSelect(site.url)}
            >
              <View style={styles.siteInfo}>
                <Text style={styles.siteName}>{site.name}</Text>
                <Text style={styles.siteDescription}>{site.description}</Text>
                <View style={styles.ratingContainer}>
                  <Star color="#FFD700" size={16} fill="#FFD700" />
                  <Text style={styles.ratingText}>{site.rating}</Text>
                </View>
              </View>
              <ExternalLink color="#FF6B6B" size={24} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to Use</Text>
          <View style={styles.instructionCard}>
            <Text style={styles.instructionText}>
              1. Search for your favorite comic or select a popular site{'\n'}
              2. Navigate to a comic page in the Reader tab{'\n'}
              3. Tap on comic panels or use the camera button{'\n'}
              4. Listen as the text is read aloud automatically
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: '#999',
    fontSize: 16,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    marginLeft: 12,
  },
  searchButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  suggestionText: {
    color: '#FFF',
    fontSize: 14,
  },
  siteCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  siteInfo: {
    flex: 1,
  },
  siteName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  siteDescription: {
    color: '#999',
    fontSize: 14,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
  },
  instructionCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  instructionText: {
    color: '#999',
    fontSize: 14,
    lineHeight: 20,
  },
  notification: {
    backgroundColor: '#FF6B6B',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  notificationText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});