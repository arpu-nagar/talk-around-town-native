import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { NavigationProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ContentSelectionScreenProps {
  navigation: NavigationProp<any>;
}

interface ContentArea {
  id: string;
  title: string;
  description: string;
  icon: string;
  selected: boolean;
  available: boolean;
}

const ContentSelectionScreen: React.FC<ContentSelectionScreenProps> = ({ navigation }) => {
  // Initial content areas with selected state and availability
  const [contentAreas, setContentAreas] = useState<ContentArea[]>([
    {
      id: 'language',
      title: 'Language Development',
      description: 'Activities and tips that encourage vocabulary growth, communication skills, and language patterns.',
      icon: 'chat',
      selected: true, // Default selected
      available: true, // Available for selection
    },
    {
      id: 'science',
      title: 'Early Science Skills',
      description: 'Explorations and experiments that nurture curiosity, critical thinking, and understanding of the world.',
      icon: 'science',
      selected: false,
      available: true, // Available for selection
    },
    {
      id: 'literacy',
      title: 'Literacy Foundations',
      description: 'Reading and writing activities that build pre-literacy skills and foster a love for stories and books.',
      icon: 'menu-book',
      selected: false,
      available: false, // Coming soon
    },
    {
      id: 'social',
      title: 'Social-Emotional Learning',
      description: 'Guidance for developing emotional intelligence, relationship skills, and healthy self-awareness.',
      icon: 'people',
      selected: false,
      available: false, // Coming soon
    },
  ]);

  // Load saved preferences when component mounts
  useEffect(() => {
    const loadSavedPreferences = async () => {
      try {
        const savedPreferences = await AsyncStorage.getItem('contentPreferences');
        if (savedPreferences) {
          const savedPreferenceIds = JSON.parse(savedPreferences);
          
          setContentAreas(prev => prev.map(area => ({
            ...area,
            selected: savedPreferenceIds.includes(area.id)
          })));
        }
      } catch (error) {
        console.error('Error loading content preferences:', error);
      }
    };
    
    loadSavedPreferences();
  }, []);

  // Toggle selection for a content area
  const toggleSelection = (id: string) => {
    const area = contentAreas.find(area => area.id === id);
    
    if (area && area.available) {
      setContentAreas(
        contentAreas.map((area) =>
          area.id === id ? { ...area, selected: !area.selected } : area
        )
      );
    } else if (area && !area.available) {
      // Show "Coming Soon" alert for unavailable content areas
      Alert.alert(
        'Coming Soon',
        `${area.title} content will be available in a future update!`,
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  // Count selected content areas
  const selectedCount = contentAreas.filter(area => area.selected).length;

  // Save preferences and go back
  const savePreferences = async () => {
    try {
      // Get selected content areas
      const selectedAreas = contentAreas
        .filter(area => area.selected)
        .map(area => area.id);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('contentPreferences', JSON.stringify(selectedAreas));
      
      console.log('Saved content areas:', selectedAreas);
      
      // Show confirmation message
      if (selectedAreas.length > 0) {
        const selectedTopics = contentAreas
          .filter(area => area.selected)
          .map(area => area.title)
          .join(' and ');
          
        Alert.alert(
          'Preferences Saved',
          `Your content preferences have been updated. You will now receive ${selectedTopics}-focused parenting tips.`,
          [{ text: 'Great!', onPress: () => navigation.goBack() }]
        );
      } else {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error saving content preferences:', error);
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#4A90E2', '#357ABD']} style={styles.gradientBackground}>
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Content Preferences</Text>
          <View style={styles.placeholderView} />
        </View>
        
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.contentContainer}>
            <Text style={styles.tagline}>
              Personalize Your Parenting Support
            </Text>
            
            <Text style={styles.description}>
              Select the developmental areas you'd like to focus on. ENACT will prioritize these topics 
              when delivering location-based tips and resources for your family.
            </Text>
            
            <View style={styles.betaBadgeContainer}>
              <View style={styles.betaBadge}>
                <Text style={styles.betaBadgeText}>BETA</Text>
              </View>
              <Text style={styles.betaText}>
                Currently, only Language Development and Science Skills content are available. 
                Other content areas coming soon!
              </Text>
            </View>
            
            <Text style={styles.selectionStatus}>
              {selectedCount === 0 
                ? "No areas selected yet" 
                : `${selectedCount} area${selectedCount !== 1 ? 's' : ''} selected`}
            </Text>
            
            {contentAreas.map((area) => (
              <TouchableOpacity 
                key={area.id}
                style={[
                  styles.contentAreaItem, 
                  area.selected && styles.contentAreaSelected,
                  !area.available && styles.contentAreaComingSoon
                ]}
                onPress={() => toggleSelection(area.id)}
                activeOpacity={0.7}
              >
                <View style={styles.contentAreaHeader}>
                  <Icon 
                    name={area.icon} 
                    size={28} 
                    color={area.selected ? "#FFFFFF" : area.available ? "#4A90E2" : "#999999"} 
                    style={styles.contentIcon} 
                  />
                  <Text 
                    style={[
                      styles.contentAreaTitle, 
                      area.selected && styles.selectedText,
                      !area.available && styles.comingSoonText
                    ]}
                  >
                    {area.title}
                    {!area.available && " (Coming Soon)"}
                  </Text>
                  {area.available ? (
                    <Icon 
                      name={area.selected ? "check-circle" : "radio-button-unchecked"} 
                      size={24} 
                      color={area.selected ? "#FFFFFF" : "#4A90E2"} 
                    />
                  ) : (
                    <Icon name="lock" size={20} color="#999999" />
                  )}
                </View>
                <Text 
                  style={[
                    styles.contentAreaDescription, 
                    area.selected && styles.selectedText,
                    !area.available && styles.comingSoonText
                  ]}
                >
                  {area.description}
                </Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity 
              style={[
                styles.saveButton, 
                selectedCount === 0 && styles.saveButtonDisabled
              ]}
              onPress={savePreferences}
              disabled={selectedCount === 0}
            >
              <Text style={styles.saveButtonText}>
                Save Preferences
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.footerNote}>
              You can change these preferences anytime in your profile settings.
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#4A90E2',
  },
  gradientBackground: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  placeholderView: {
    width: 40, // Same width as back button for center alignment
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  contentContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tagline: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 22,
    marginBottom: 24,
  },
  betaBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  betaBadge: {
    backgroundColor: '#4A90E2',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
  },
  betaBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  betaText: {
    flex: 1,
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '500',
  },
  selectionStatus: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    textAlign: 'center',
  },
  contentAreaItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  contentAreaSelected: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  contentAreaComingSoon: {
    backgroundColor: '#F8F9FA',
    borderColor: '#EAEAEA',
    opacity: 0.7,
  },
  contentAreaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contentIcon: {
    marginRight: 12,
  },
  contentAreaTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  contentAreaDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    paddingLeft: 40, // Align with title after icon
  },
  selectedText: {
    color: '#FFFFFF',
  },
  comingSoonText: {
    color: '#999999',
  },
  saveButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  saveButtonDisabled: {
    backgroundColor: '#A5C8F2',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footerNote: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
});

export default ContentSelectionScreen;