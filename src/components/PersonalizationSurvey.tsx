import React, {useState, useContext, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {AuthContext} from '../context/AuthContext';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import {fetchWithAuth} from '../api/auth';

const {width, height} = Dimensions.get('window');

interface SurveyData {
  contentPreferences: string[];
  challengeAreas: string[];
  parentingGoals: string[]; // kept for forward-compat; not used in UI steps right now
  engagementFrequency: string;
  currentChallenge?: string;
  additionalNotes?: string;
}

// Update this to match your existing API endpoints
const API_ENDPOINTS = {
  BASE_URL: 'http://68.183.102.75:1337',
};

const PersonalizationSurvey: React.FC<{
  visible: boolean;
  onClose: () => void;
  onComplete: (data: SurveyData) => void;
  onSkip?: () => void;
  isOptional?: boolean;
}> = ({visible, onClose, onComplete, onSkip, isOptional = true}) => {
  const {userInfo} = useContext<any>(AuthContext);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Survey state
  const [contentPreferences, setContentPreferences] = useState<string[]>([]);
  const [challengeAreas, setChallengeAreas] = useState<string[]>([]);
  const [parentingGoals, setParentingGoals] = useState<string[]>([]);
  const [engagementFrequency, setEngagementFrequency] = useState<string>('');
  const [currentChallenge, setCurrentChallenge] = useState<string>('');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');

  const totalSteps = 4;

  const contentOptions = [
    {id: 'activities', label: 'Activity ideas', icon: 'extension'},
    {id: 'discipline', label: 'Discipline strategies', icon: 'gavel'},
    {id: 'emotional', label: 'Emotional support', icon: 'favorite'},
    {id: 'routines', label: 'Routines and schedules', icon: 'schedule'},
    {id: 'sleep', label: 'Sleep help', icon: 'bedtime'},
    {id: 'nutrition', label: 'Nutrition and mealtime', icon: 'restaurant'},
    {id: 'potty', label: 'Potty training', icon: 'wc'},
    {id: 'screen-time', label: 'Screen time management', icon: 'tablet'},
    {id: 'travel', label: 'Traveling with kids', icon: 'flight'},
    {
      id: 'big-feelings',
      label: 'Talking about big feelings',
      icon: 'psychology',
    },
  ];

  const challengeOptions = [
    {
      id: 'tantrums',
      label: 'Tantrums & meltdowns',
      icon: 'sentiment-very-dissatisfied',
    },
    {id: 'bedtime', label: 'Bedtime struggles', icon: 'bedtime'},
    {id: 'picky-eating', label: 'Picky eating', icon: 'no-food'},
    {id: 'sibling-rivalry', label: 'Sibling rivalry', icon: 'people'},
    {
      id: 'screen-battles',
      label: 'Screen time battles',
      icon: 'tablet-android',
    },
    {id: 'public-behavior', label: 'Behavior in public', icon: 'store'},
    {id: 'homework', label: 'Homework resistance', icon: 'school'},
    {
      id: 'transitions',
      label: 'Difficulty with transitions',
      icon: 'swap-horiz',
    },
  ];

  const frequencyOptions = [
    {id: 'daily', label: 'Daily tips', description: 'Quick daily insights'},
    {
      id: 'few-times-week',
      label: 'A few times a week',
      description: 'Regular guidance',
    },
    {id: 'weekly', label: 'Weekly', description: 'Comprehensive weekly advice'},
    {
      id: 'on-demand',
      label: 'Only when I ask',
      description: 'Just-in-time help',
    },
  ];

  const toggleSelection = (
    item: string,
    currentList: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    maxSelection?: number,
  ) => {
    if (currentList.includes(item)) {
      setter(currentList.filter(i => i !== item));
    } else {
      if (maxSelection && currentList.length >= maxSelection) {
        Alert.alert(
          'Selection Limit',
          `Please select up to ${maxSelection} items.`,
        );
        return;
      }
      setter([...currentList, item]);
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const surveyData: SurveyData = {
        contentPreferences,
        challengeAreas,
        parentingGoals,
        engagementFrequency,
        currentChallenge: currentChallenge.trim() || undefined,
        additionalNotes: additionalNotes.trim() || undefined,
      };

      const response = await fetchWithAuth(
        `${API_ENDPOINTS.BASE_URL}/api/personalization/survey`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userInfo.access_token}`,
          },
          body: JSON.stringify({
            surveyData,
            completedAt: new Date().toISOString(),
          }),
        },
      );

      if (!response.ok) throw new Error('Failed to save survey');

      onComplete(surveyData);
      Alert.alert(
        'Thank you! 🎉',
        "Your preferences have been saved. You'll now receive more personalized parenting tips!",
        [{text: 'Great!', onPress: onClose}],
      );
    } catch (error) {
      console.error('Survey submission error:', error);
      Alert.alert(
        'Error',
        'Failed to save your preferences. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // const handleSkip = () => {
  //   Alert.alert(
  //     'Skip Personalization?',
  //     'You can always complete this later in Settings to get more personalized tips.',
  //     [
  //       {text: 'Complete Now', style: 'default'},
  //       {text: 'Skip for Now', style: 'destructive', onPress: onClose},
  //     ],
  //   );
  // };

  const handleSkip = () => {
    Alert.alert(
      'Skip Personalization?',
      'You can always complete this later in Settings to get more personalized tips.',
      [
        {text: 'Complete Now', style: 'default'},
        {
          text: 'Skip for Now',
          style: 'destructive',
          onPress: () => {
            onSkip?.(); // <-- notify Home that this was a skip
            onClose();
          },
        },
      ],
    );
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {width: `${(currentStep / totalSteps) * 100}%`},
          ]}
        />
      </View>
      <Text style={styles.progressText}>
        {currentStep} of {totalSteps}
      </Text>
    </View>
  );

  const renderMultiSelectOptions = (
    options: Array<{id: string; label: string; icon: string}>,
    selectedList: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    maxSelection?: number,
  ) => (
    <View style={styles.optionsGrid}>
      {options.map(option => (
        <TouchableOpacity
          key={option.id}
          style={[
            styles.optionCard,
            selectedList.includes(option.id) && styles.optionCardSelected,
          ]}
          onPress={() =>
            toggleSelection(option.id, selectedList, setter, maxSelection)
          }
          activeOpacity={0.8}>
          <MaterialIcons
            name={option.icon as any}
            size={20}
            color={selectedList.includes(option.id) ? '#4A90E2' : '#666'}
          />
          <Text
            style={[
              styles.optionText,
              selectedList.includes(option.id) && styles.optionTextSelected,
            ]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>
              What kind of tips are most useful to you?
            </Text>
            <Text style={styles.stepSubtitle}>Choose up to 3 areas</Text>
            {renderMultiSelectOptions(
              contentOptions,
              contentPreferences,
              setContentPreferences,
              3,
            )}
            {contentPreferences.length === 0 && (
              <Text style={styles.helperText}>
                Select at least one area to continue
              </Text>
            )}
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>
              What are your biggest challenges?
            </Text>
            <Text style={styles.stepSubtitle}>Select any that apply</Text>
            {renderMultiSelectOptions(
              challengeOptions,
              challengeAreas,
              setChallengeAreas,
            )}
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>How often would you like tips?</Text>
            <Text style={styles.stepSubtitle}>
              Choose your preferred frequency
            </Text>
            <View style={styles.frequencyList}>
              {frequencyOptions.map(option => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.frequencyCard,
                    engagementFrequency === option.id &&
                      styles.frequencyCardSelected,
                  ]}
                  onPress={() => setEngagementFrequency(option.id)}
                  activeOpacity={0.8}>
                  <Text
                    style={[
                      styles.frequencyLabel,
                      engagementFrequency === option.id &&
                        styles.frequencyLabelSelected,
                    ]}>
                    {option.label}
                  </Text>
                  <Text style={styles.frequencyDescription}>
                    {option.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Tell us more (Optional)</Text>
            <Text style={styles.stepSubtitle}>
              Any specific challenges or goals?
            </Text>

            <Text style={styles.inputLabel}>Current biggest challenge:</Text>
            <TextInput
              style={styles.textInput}
              value={currentChallenge}
              onChangeText={setCurrentChallenge}
              placeholder="e.g., My 3-year-old won't listen..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />

            <Text style={styles.inputLabel}>Additional notes:</Text>
            <TextInput
              style={styles.textInput}
              value={additionalNotes}
              onChangeText={setAdditionalNotes}
              placeholder="Anything else we should know?"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>
        );
      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return contentPreferences.length > 0;
      case 2:
        return true; // Optional
      case 3:
        return engagementFrequency !== '';
      case 4:
        return true; // Optional
      default:
        return false;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      presentationStyle="overFullScreen">
      <View style={styles.overlay}>
        <View style={styles.popupContainer}>
          <LinearGradient colors={['#3B82F6', '#8B5CF6']} style={styles.header}>
            <View style={styles.headerContent}>
              <TouchableOpacity
                onPress={currentStep === 1 ? onClose : handleBack}
                style={styles.backButton}>
                <MaterialIcons name="arrow-back" size={20} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>
                Personalize Your Experience
              </Text>
              <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
            </View>
            {renderProgressBar()}
          </LinearGradient>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{flex: 1}}>
            <ScrollView
              style={styles.content}
              contentContainerStyle={{paddingBottom: 20, flexGrow: 1}}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              {renderStep()}
            </ScrollView>

            <View style={styles.bottomContainer}>
              <TouchableOpacity
                style={[
                  styles.nextButton,
                  !canProceed() && styles.nextButtonDisabled,
                ]}
                onPress={handleNext}
                disabled={!canProceed() || isSubmitting}
                activeOpacity={0.8}>
                <LinearGradient
                  colors={
                    canProceed()
                      ? ['#3B82F6', '#7C4DFF']
                      : ['#D1D5DB', '#9CA3AF']
                  }
                  style={styles.nextButtonGradient}>
                  <Text style={styles.nextButtonText}>
                    {isSubmitting
                      ? 'Saving...'
                      : currentStep === totalSteps
                      ? 'Complete'
                      : 'Continue'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
};

const CARD_SIDE_PADDING = 20; // ScrollView padding
const CARD_MARGIN = 6; // each card horizontal/vertical margin
const GRID_COLUMNS = 2;
const CARD_WIDTH =
  (width -
    20 /* modal outer padding */ -
    CARD_SIDE_PADDING * 2 -
    CARD_MARGIN * 2 * GRID_COLUMNS) /
  GRID_COLUMNS;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  popupContainer: {
    width: width - 20,
    maxHeight: height * 0.95,
    minHeight: height * 0.6,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {paddingBottom: 15},
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  backButton: {padding: 8},
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  skipButton: {padding: 8},
  skipText: {color: '#fff', fontSize: 14, fontWeight: '500'},

  progressContainer: {paddingHorizontal: 20, paddingTop: 15},
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {height: '100%', backgroundColor: '#fff', borderRadius: 2},
  progressText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    opacity: 0.9,
  },

  content: {flex: 1, padding: CARD_SIDE_PADDING},

  stepContainer: {flex: 1},
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
    lineHeight: 28,
  },
  stepSubtitle: {fontSize: 14, color: '#6B7280', marginBottom: 14},
  helperText: {marginTop: 10, textAlign: 'center', color: '#6B7280'},

  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -CARD_MARGIN,
  },
  optionCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    width: CARD_WIDTH,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    margin: CARD_MARGIN,
  },
  optionCardSelected: {borderColor: '#4A90E2', backgroundColor: '#EEF5FF'},
  optionText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 6,
  },
  optionTextSelected: {color: '#4A90E2', fontWeight: '600'},

  frequencyList: {marginTop: 4},
  frequencyCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginVertical: 4,
  },
  frequencyCardSelected: {borderColor: '#4A90E2', backgroundColor: '#EEF5FF'},
  frequencyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  frequencyLabelSelected: {color: '#4A90E2'},
  frequencyDescription: {fontSize: 12, color: '#6B7280'},

  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 12,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#374151',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    textAlignVertical: 'top',
    marginBottom: 12,
  },

  bottomContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  nextButton: {borderRadius: 10, overflow: 'hidden'},
  nextButtonDisabled: {opacity: 0.6},
  nextButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {color: '#fff', fontSize: 14, fontWeight: '700'},
});

export default PersonalizationSurvey;
