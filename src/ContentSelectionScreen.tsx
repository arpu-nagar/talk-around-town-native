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
}

const ContentSelectionScreen: React.FC<ContentSelectionScreenProps> = ({ navigation }) => {
  // Initial content areas with selected state
  const [contentAreas, setContentAreas] = useState<ContentArea[]>([
    {
      id: 'language',
      title: 'Language Development',
      description: 'Activities and tips that encourage vocabulary growth, communication skills, and language patterns.',
      icon: 'chat',
      selected: false,
    },
    {
      id: 'science',
      title: 'Early Science Skills',
      description: 'Explorations and experiments that nurture curiosity, critical thinking, and understanding of the world.',
      icon: 'science',
      selected: false,
    },
    {
      id: 'literacy',
      title: 'Literacy Foundations',
      description: 'Reading and writing activities that build pre-literacy skills and foster a love for stories and books.',
      icon: 'menu-book',
      selected: false,
    },
    {
      id: 'social',
      title: 'Social-Emotional Learning',
      description: 'Guidance for developing emotional intelligence, relationship skills, and healthy self-awareness.',
      icon: 'people',
      selected: false,
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
    // Only allow selection of science skills, show "Coming Soon" for others
    if (id === 'science') {
      setContentAreas(
        contentAreas.map((area) =>
          area.id === id ? { ...area, selected: !area.selected } : area
        )
      );
    } else {
      // Show "Coming Soon" alert for other content areas
      Alert.alert(
        'Coming Soon',
        `${contentAreas.find(area => area.id === id)?.title} content will be available in a future update!`,
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  // Count selected content areas
  const selectedCount = contentAreas.filter(area => area.selected).length;

  // Save preferences and go back
  const savePreferences = async () => {
    try {
      // Get selected content areas (should only be science if any)
      const selectedAreas = contentAreas
        .filter(area => area.selected)
        .map(area => area.id);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('contentPreferences', JSON.stringify(selectedAreas));
      
      console.log('Saved content areas:', selectedAreas);
      
      // Show confirmation message if science is selected
      if (selectedAreas.includes('science')) {
        Alert.alert(
          'Preferences Saved',
          'Your content preferences have been updated. You will now receive science-focused parenting tips.',
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
                Currently, only Science Skills content is fully available. 
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
                  area.id !== 'science' && styles.contentAreaComingSoon
                ]}
                onPress={() => toggleSelection(area.id)}
                activeOpacity={0.7}
              >
                <View style={styles.contentAreaHeader}>
                  <Icon 
                    name={area.icon} 
                    size={28} 
                    color={area.selected ? "#FFFFFF" : area.id === 'science' ? "#4A90E2" : "#999999"} 
                    style={styles.contentIcon} 
                  />
                  <Text 
                    style={[
                      styles.contentAreaTitle, 
                      area.selected && styles.selectedText,
                      area.id !== 'science' && styles.comingSoonText
                    ]}
                  >
                    {area.title}
                    {area.id !== 'science' && " (Coming Soon)"}
                  </Text>
                  {area.id === 'science' ? (
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
                    area.id !== 'science' && styles.comingSoonText
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
  },
  gradientBackground: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholderView: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  contentContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tagline: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
    marginBottom: 18,
    textAlign: 'center',
  },
  betaBadgeContainer: {
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  betaBadge: {
    backgroundColor: '#FFB800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 10,
  },
  betaBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  betaText: {
    flex: 1,
    fontSize: 14,
    color: '#7D6E00',
    lineHeight: 20,
  },
  selectionStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90E2',
    marginBottom: 16,
    textAlign: 'center',
  },
  contentAreaItem: {
    backgroundColor: '#F5F7FA',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#F0F0F0',
  },
  contentAreaSelected: {
    backgroundColor: '#4A90E2',
    borderColor: '#357ABD',
  },
  contentAreaComingSoon: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
    opacity: 0.8,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
  },
  contentAreaDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666666',
    paddingLeft: 40,
  },
  selectedText: {
    color: '#FFFFFF',
  },
  comingSoonText: {
    color: '#999999',
  },
  saveButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  saveButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerNote: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
});

export default ContentSelectionScreen;