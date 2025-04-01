import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { NavigationProp } from '@react-navigation/native';

interface AboutScreenProps {
  navigation: NavigationProp<any>;
}

const AboutScreen: React.FC<AboutScreenProps> = ({ navigation }) => {
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
          <Text style={styles.headerTitle}>About ENACT</Text>
          <View style={styles.placeholderView} />
        </View>
        
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.contentContainer}>
            <Text style={styles.tagline}>
              Parenting Tips When & Where You Need Them
            </Text>
            
            <Text style={styles.description}>
              ENACT is your personalized parenting companion that delivers age-appropriate guidance precisely when and where you need it most. Designed for parents and caregivers on the go, ENACT combines location awareness with expert parenting advice to support your journey through parenthood.
            </Text>
            
            <Text style={styles.sectionTitle}>Key Features:</Text>
            
            <View style={styles.featureItem}>
              <Icon name="place" size={24} color="#4A90E2" style={styles.featureIcon} />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Location-Based Parenting Tips</Text>
                <Text style={styles.featureDescription}>
                  Receive custom notifications with helpful parenting advice when you arrive at saved locations like the playground, grocery store, or bedtime.
                </Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <Icon name="child-care" size={24} color="#4A90E2" style={styles.featureIcon} />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Age-Appropriate Guidance</Text>
                <Text style={styles.featureDescription}>
                  Get tailored advice based on your child's specific age and developmental stage, ensuring relevance for every family member.
                </Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <Icon name="mic" size={24} color="#4A90E2" style={styles.featureIcon} />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Voice Assistance</Text>
                <Text style={styles.featureDescription}>
                  Ask parenting questions hands-free with our voice prompt feature and receive instant, helpful responses powered by advanced AI.
                </Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <Icon name="notifications" size={24} color="#4A90E2" style={styles.featureIcon} />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Custom Location Alerts</Text>
                <Text style={styles.featureDescription}>
                  Save important locations and get timely tips and reminders when you arrive - perfect for managing routines and transitions.
                </Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <Icon name="security" size={24} color="#4A90E2" style={styles.featureIcon} />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Privacy-Focused</Text>
                <Text style={styles.featureDescription}>
                  Your family's information stays secure, with children's data used solely to provide age-appropriate content.
                </Text>
              </View>
            </View>
            
            <Text style={styles.conclusion}>
              Whether you're navigating mealtime battles, bedtime routines, or public outings, ENACT delivers practical, in-the-moment support that grows with your family. Transform everyday parenting challenges into opportunities for connection and growth with ENACT.
            </Text>
            
            <Text style={styles.callToAction}>
              Experience parenting support that's there exactly when you need it!
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
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  placeholderView: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  contentContainer: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tagline: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'justify',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  featureIcon: {
    marginTop: 2,
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  conclusion: {
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'justify',
  },
  callToAction: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A90E2',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default AboutScreen;