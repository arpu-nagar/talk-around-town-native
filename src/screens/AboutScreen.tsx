import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {NavigationProp} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

interface AboutScreenProps {
  navigation: NavigationProp<any>;
}

const FEATURES = [
  {
    icon: <Ionicons name="location-outline" size={22} color="#6366F1" />,
    title: 'Location-Based Tips',
    description:
      'Get parenting advice the moment you arrive at places like parks, grocery stores, and libraries.',
  },
  {
    icon: <Icon name="child-care" size={22} color="#6366F1" />,
    title: 'Age-Appropriate Guidance',
    description:
      "Tips tailored to your child's exact developmental stage — always relevant, never generic.",
  },
  {
    icon: <Icon name="mic-none" size={22} color="#6366F1" />,
    title: 'Voice Assistance',
    description:
      'Ask parenting questions hands-free and get instant AI-powered answers.',
  },
  {
    icon: <Ionicons name="notifications-outline" size={22} color="#6366F1" />,
    title: 'Custom Reminders',
    description:
      'Schedule day-and-time reminders to keep routines on track for your family.',
  },
  {
    icon: <Icon name="security" size={22} color="#6366F1" />,
    title: 'Privacy-Focused',
    description:
      "Your family's data is used only to personalize your experience — never shared or sold.",
  },
];

const QA_ITEMS = [
  {
    category: 'Locations & Privacy',
    icon: 'location-on',
    color: '#6366F1',
    items: [
      {
        q: 'Can I save my home as a location?',
        a: "Saving your home is discouraged. It compromises your privacy and means you'll receive tip notifications every time you walk in your front door — which gets disruptive fast. ENACT is designed for out-and-about moments: parks, grocery stores, libraries, restaurants.",
      },
      {
        q: "Why is there no 'Home' option in the location type dropdown?",
        a: "It's intentionally omitted to steer users toward locations where in-the-moment parenting tips are genuinely useful. If you want to label a relative's or friend's place, choose \"Other's Home\" instead.",
      },
      {
        q: 'How does ENACT use my location data?',
        a: 'Your location is used only to detect when you arrive at a saved spot and trigger relevant tips. It is never shared with third parties or used for advertising.',
      },
    ],
  },
  {
    category: 'Notifications',
    icon: 'notifications-none',
    color: '#F59E0B',
    items: [
      {
        q: "Why am I not receiving location-based notifications?",
        a: 'Check that location permissions are set to "Always Allow" in your device settings (Settings → ENACT → Location). On iOS, background notifications can be delayed when the OS suspends the app — opening the app in the foreground will always trigger tips for your current location.',
      },
      {
        q: 'How do I set up reminder notifications?',
        a: 'Go to Settings → Reminder Settings. Enable general reminders and add specific day + time slots (e.g. Monday at 9:00 AM).',
      },
      {
        q: 'My scheduled reminder did not arrive on time.',
        a: 'On iOS, the system can delay notifications when battery optimization is active. Ensure notifications are fully enabled for ENACT in device settings. On Android 12+, the app also requires the "Schedule Exact Alarm" permission for reliable reminders.',
      },
    ],
  },
  {
    category: 'Tips',
    icon: 'lightbulb-outline',
    color: '#10B981',
    items: [
      {
        q: 'How do I find tips relevant to my interests?',
        a: 'Go to Settings → Content Preferences and select the areas most important to your family. You can also use the voice search (microphone icon) to ask specific parenting questions.',
      },
      {
        q: 'My tips do not seem relevant to my child\'s age.',
        a: "Make sure your child's date of birth is entered correctly. Go to Settings → Children Information and verify or update their details.",
      },
      {
        q: 'How do I save a tip I like?',
        a: 'Tap the heart icon on any tip. View all your liked tips under Settings → View Liked Tips.',
      },
    ],
  },
  {
    category: 'Offline & Connectivity',
    icon: 'wifi-off',
    color: '#EF4444',
    items: [
      {
        q: 'Does the app work without internet?',
        a: 'Yes. ENACT includes an offline mode with pre-loaded tips available without a connection. A banner indicates when you are offline. Full content and location syncing resume automatically when connectivity is restored.',
      },
    ],
  },
  {
    category: 'Account',
    icon: 'person-outline',
    color: '#3B82F6',
    items: [
      {
        q: 'Can I add multiple children?',
        a: 'Yes. Go to Settings → Children Information and use the Add Child flow to add each child\'s nickname and date of birth.',
      },
      {
        q: 'What happens if I delete my account?',
        a: 'All your data is permanently removed — children\'s profiles, saved locations, liked tips, and preferences. This action cannot be undone.',
      },
    ],
  },
];

const AccordionItem: React.FC<{q: string; a: string}> = ({q, a}) => {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(prev => !prev);
  };

  return (
    <TouchableOpacity
      style={styles.accordionItem}
      onPress={toggle}
      activeOpacity={0.7}>
      <View style={styles.accordionHeader}>
        <Text style={styles.accordionQuestion}>{q}</Text>
        <Icon
          name={open ? 'expand-less' : 'expand-more'}
          size={22}
          color="#6366F1"
        />
      </View>
      {open && <Text style={styles.accordionAnswer}>{a}</Text>}
    </TouchableOpacity>
  );
};

const AboutScreen: React.FC<AboutScreenProps> = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'about' | 'qa'>('about');

  return (
    <LinearGradient
      colors={['#3B82F6', '#8B5CF6']}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={{flex: 1}}>
      <View style={{flex: 1, marginTop: insets.top + 5}}>
        <StatusBar barStyle="light-content" translucent backgroundColor="#4A90E2" />

        {/* Header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>About ENACT</Text>
          <View style={styles.placeholderView} />
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'about' && styles.tabActive]}
            onPress={() => setActiveTab('about')}>
            <Text style={[styles.tabText, activeTab === 'about' && styles.tabTextActive]}>
              About
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'qa' && styles.tabActive]}
            onPress={() => setActiveTab('qa')}>
            <Text style={[styles.tabText, activeTab === 'qa' && styles.tabTextActive]}>
              Q&A
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {activeTab === 'about' ? (
            <>
              {/* Hero */}
              <View style={styles.heroCard}>
                <Text style={styles.tagline}>Parenting Tips When & Where You Need Them</Text>
                <Text style={styles.description}>
                  ENACT is your personalized parenting companion that delivers age-appropriate
                  guidance precisely when and where you need it most — combining location
                  awareness with expert advice to support your journey through parenthood.
                </Text>
              </View>

              {/* Features */}
              <Text style={styles.sectionHeader}>Key Features</Text>
              {FEATURES.map((f, i) => (
                <View key={i} style={styles.featureCard}>
                  <View style={styles.featureIconWrap}>{f.icon}</View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>{f.title}</Text>
                    <Text style={styles.featureDescription}>{f.description}</Text>
                  </View>
                </View>
              ))}
            </>
          ) : (
            <>
              <Text style={styles.qaIntro}>
                Tap a question to see the answer.
              </Text>
              {QA_ITEMS.map((section, si) => (
                <View key={si}>
                  <View style={styles.categoryHeader}>
                    <Icon name={section.icon as any} size={18} color={section.color} />
                    <Text style={[styles.categoryTitle, {color: section.color}]}>
                      {section.category}
                    </Text>
                  </View>
                  <View style={styles.accordionCard}>
                    {section.items.map((item, ii) => (
                      <React.Fragment key={ii}>
                        <AccordionItem q={item.q} a={item.a} />
                        {ii < section.items.length - 1 && <View style={styles.divider} />}
                      </React.Fragment>
                    ))}
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
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
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
  },
  tabTextActive: {
    color: '#6366F1',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 36,
  },
  // About tab
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  tagline: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 23,
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 4,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 19,
  },
  // Q&A tab
  qaIntro: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 16,
    marginLeft: 4,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginLeft: 4,
    gap: 6,
  },
  categoryTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  accordionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  accordionItem: {
    padding: 16,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  accordionQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 20,
  },
  accordionAnswer: {
    marginTop: 10,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },
});

export default AboutScreen;
