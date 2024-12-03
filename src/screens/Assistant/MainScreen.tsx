import React, { useState, useCallback, useEffect, useRef, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, TextInput, SafeAreaView, ActivityIndicator, Modal } from 'react-native';
import Voice from '@react-native-voice/voice';
import Sound from 'react-native-sound';
import { Platform, PermissionsAndroid } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Loader from './Loader';
import messaging from '@react-native-firebase/messaging';
import ChildInfoModal from '../ChildInfoModal';
import { AuthContext, AuthContextType } from '../../context/AuthContext';

interface Child {
  id: number;
  nickname?: string;
  date_of_birth: string;
  age?: number;
}

interface Tip {
  title: string;
  body: string;
  details: string;
  audioUrl: string;
}
const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};


const API_BASE_URL = 'http://68.183.102.75:4000';

const MainScreen: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [tips, setTips] = useState<Tip[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeAudioIndex, setActiveAudioIndex] = useState<number | null>(null);
  const [showAgePrompt, setShowAgePrompt] = useState(false);
  const [lastQuery, setLastQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const { userInfo, isLoading: contextLoading } = useContext<AuthContextType>(AuthContext);
  
  const currentSound = useRef<Sound | null>(null);
  const lastResult = useRef<string>('');
  const [showChildInfo, setShowChildInfo] = useState(false);
const [childrenInfo, setChildrenInfo] = useState<Child[]>([]);

const fetchChildrenInfo = async () => {
  if (!userInfo?.access_token) {
    console.error('No access token available');
    return;
  }

  try {
    setIsLoading(true); // Add loading state
    const response = await fetch('http://68.183.102.75:1337/endpoint/children', {
      headers: {
        'Authorization': `Bearer ${userInfo.access_token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data && data.children) {
      setChildrenInfo(data.children);
    } else {
      setChildrenInfo([]);
    }
  } catch (error) {
    console.error('Error fetching children info:', error);
    Alert.alert(
      'Error',
      'Failed to fetch children information. Please try again later.'
    );
    setChildrenInfo([]);
  } finally {
    setIsLoading(false);
  }
};

useEffect(() => {
  fetchChildrenInfo();
}, [userInfo.access_token]); // Add dependency to refresh when token changes


  const initializeVoice = async () => {
    try {
      await requestMicrophonePermission();
      Voice.onSpeechResults = onSpeechResults;
      Voice.onSpeechError = onSpeechError;
      Voice.onSpeechEnd = () => {
        if (isListening) {
          Voice.start('en-US');
        }
      };
    } catch (error) {
      console.error('Failed to initialize voice:', error);
    }
  };

  const cleanupVoice = () => {
    Voice.destroy().then(Voice.removeAllListeners);
  };

  const cleanupSound = () => {
    if (currentSound.current) {
      currentSound.current.stop();
      currentSound.current.release();
      currentSound.current = null;
    }
    setIsPlaying(false);
    setActiveAudioIndex(null);
  };

  const requestMicrophonePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: "Microphone Permission",
            message: "This app needs access to your microphone for voice recognition.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Voice recognition requires microphone access');
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to request microphone permission');
        console.error(err);
      }
    }
  };

  const onSpeechResults = (e: any) => {
    if (e.value && e.value[0]) {
      const newResult = e.value[0];
      if (newResult !== lastResult.current) {
        lastResult.current = newResult;
        setSearchText(newResult);
      }
    }
  };

  const onSpeechError = (e: any) => {
    console.error('Speech recognition error:', e);
    if (isListening) {
      Voice.start('en-US').catch(error => {
        console.error('Failed to restart voice recognition:', error);
        setIsListening(false);
        Alert.alert('Error', 'Failed to restart voice recognition. Please try again.');
      });
    }
  };

  const toggleListening = async () => {
    try {
      if (isListening) {
        await Voice.stop();
        setIsListening(false);
        if (searchText.trim()) {
          await getTips(searchText);
        }
        lastResult.current = '';
      } else {
        const isAvailable = await Voice.isAvailable();
        if (isAvailable) {
          setSearchText('');
          lastResult.current = '';
          await Voice.start('en-US');
          setIsListening(true);
        } else {
          Alert.alert('Error', 'Voice recognition is not available on this device.');
        }
      }
    } catch (error) {
      console.error('Voice toggle error:', error);
      Alert.alert('Error', 'Failed to toggle voice recognition');
      setIsListening(false);
    }
  };

  useEffect(() => {
    initializeVoice();
    return () => {
      cleanupVoice();
      cleanupSound();
    };
  }, []);

  const speakTip = useCallback(async (audioUrl: string, index: number) => {
    cleanupSound();
    
    setIsPlaying(true);
    setActiveAudioIndex(index);
    
    const fullAudioUrl = `${API_BASE_URL}/audio${audioUrl}`;
    
    currentSound.current = new Sound(fullAudioUrl, '', (error) => {
      if (error) {
        console.error('Failed to load sound:', error);
        Alert.alert('Error', 'Failed to play audio. Please try again.');
        cleanupSound();
        return;
      }

      currentSound.current?.play((success) => {
        if (!success) {
          Alert.alert('Error', 'Audio playback failed. Please try again.');
        }
        cleanupSound();
      });
    });
  }, []);

  

  const renderTipItem = (tip: Tip, index: number) => (
    <View key={index} style={styles.tipItem}>
      <Text style={styles.tipTitle}>{tip.title}</Text>
      <Text style={styles.tipBody}>{tip.body}</Text>
      <Text style={styles.tipDetails}>{tip.details}</Text>
      <View style={styles.audioButtonsContainer}>
        {isPlaying && activeAudioIndex === index ? (
          <TouchableOpacity
            style={[styles.playButton, styles.stopButton]}
            onPress={cleanupSound}
          >
            <Text style={styles.buttonText}>Stop</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.playButton}
            onPress={() => speakTip(tip.audioUrl, index)}
            disabled={isPlaying}
          >
            <Text style={styles.buttonText}>
              {isPlaying ? 'Playing...' : 'Play'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const getTips = async (query: string = searchText) => {
    if (!query.trim()) {
      Alert.alert('Input Required', 'Please enter a question or use voice input');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/generate-tips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: query }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error === 'age_required') {
          setLastQuery(query);
          setShowAgePrompt(true);
          return;
        }
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const data = await response.json();
      setTips(data.tips);
      setHasSearched(true);
    } catch (error) {
      console.error('Error fetching tips:', error);
      Alert.alert('Error', 'Failed to fetch tips. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (searchText.trim()) {
      getTips(searchText);
    }
  };


  const handleAgeSubmit = (age: string) => {
    setShowAgePrompt(false);
    const queryWithAge = `${lastQuery} for ${age} year old`;
    setSearchText(queryWithAge);
    getTips(queryWithAge);
  };

  const AgePromptModal = () => (
    <Modal
      visible={showAgePrompt}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Child</Text>
          <Text style={styles.modalText}>Please select which child you're asking about:</Text>
          {childrenInfo.map((child) => {
            const age = calculateAge(child.date_of_birth);
            return (
              <TouchableOpacity
                key={child.id}
                style={styles.ageButton}
                onPress={() => handleAgeSubmit(age.toString())}
              >
                <Text style={styles.ageButtonText}>
                  {child.nickname || `Child ${child.id}`} ({age} year{age !== 1 ? 's' : ''} old)
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowAgePrompt(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholder={isListening ? "Listening..." : "Ask a parenting question..."}
            returnKeyType="search"
            onSubmitEditing={() => getTips()}
            editable={!isListening}
          />
          <TouchableOpacity
            style={[styles.micButton, isListening && styles.micButtonActive]}
            onPress={toggleListening}
          >
            <Icon 
              name={isListening ? 'mic-off' : 'mic'} 
              size={24} 
              color="white" 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.searchButton, styles.buttonFlex]}
            onPress={() => getTips()}
            disabled={isLoading || isListening}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Get Parenting Tips</Text>
            )}
          </TouchableOpacity>
  
          {hasSearched && (
            <TouchableOpacity
              style={[styles.retryButton, styles.buttonFlex]}
              onPress={handleRetry}
              disabled={isLoading || isListening}
            >
              <Text style={styles.buttonText}>Try Another Response</Text>
            </TouchableOpacity>
          )}
        </View>
  
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {tips.map((tip, index) => renderTipItem(tip, index))}
          
          {/* Add some padding at the bottom of ScrollView for the button */}
          <View style={{ height: 70 }} />
        </ScrollView>
  
        {/* Position the button at the bottom */}
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity 
            style={styles.childInfoButton}
            onPress={() => setShowChildInfo(true)}
          >
            <Text style={styles.childInfoButtonText}>View Children Information</Text>
          </TouchableOpacity>
        </View>
  
        {userInfo.access_token ? (
  <ChildInfoModal
    visible={showChildInfo}
    onClose={() => setShowChildInfo(false)}
    children={childrenInfo}
    userToken={userInfo.access_token}
    onChildrenUpdate={fetchChildrenInfo}
  />
) : showChildInfo && (
  <Modal
    visible={true}
    transparent={true}
    animationType="slide"
    onRequestClose={() => setShowChildInfo(false)}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Not Logged In</Text>
        <Text style={styles.modalText}>Please log in to view and manage children information.</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setShowChildInfo(false)}
        >
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
)}
        
        <Loader isLoading={isLoading} />
        <AgePromptModal />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: '#FF9500', // Orange color to distinguish it
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 48,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  micButton: {
    width: 48,
    height: 48,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginLeft: 12,
  },
  childInfoButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  childItem: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  childName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#1C1C1E',
  },
  childInfo: {
    fontSize: 14,
    color: '#636366',
  },
  childrenList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  noChildrenText: {
    fontSize: 16,
    color: '#636366',
    textAlign: 'center',
    marginVertical: 20,
  },
  closeButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'transparent',
  },
  childInfoButton: {
    backgroundColor: '#5856D6',
    padding: 14,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  micButtonActive: {
    backgroundColor: '#FF3B30',
  },
  searchButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  tipItem: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1C1C1E',
  },
  tipBody: {
    fontSize: 16,
    marginBottom: 8,
    color: '#3A3A3C',
    lineHeight: 24,
  },
  tipDetails: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 16,
    color: '#636366',
  },
  audioButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  playButton: {
    backgroundColor: '#34C759',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  buttonFlex: {
    flex: 1,
  },
  retryButton: {
    backgroundColor: '#34C759',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  ageButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  ageButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  cancelButton: {
    padding: 12,
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default MainScreen;