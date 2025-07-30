import React, { useContext, useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  Alert,
  Text,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  AppState,
  ScrollView,
  Modal,
  ActivityIndicator,
  Appearance,
} from 'react-native';
import MapView, {
  PROVIDER_GOOGLE,
  Marker,
  Circle,
  PROVIDER_DEFAULT,
} from 'react-native-maps';
import { Dropdown } from 'react-native-element-dropdown';
import AntDesign from '@expo/vector-icons/AntDesign';
import Geolocation, {
  GeolocationResponse,
  GeolocationError
} from '@react-native-community/geolocation';
import {
  GooglePlacesAutocomplete,
  GooglePlacesAutocompleteRef,
} from 'react-native-google-places-autocomplete';
import { Icon } from 'react-native-elements';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Spinner from 'react-native-loading-spinner-overlay';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Voice from '@react-native-voice/voice';
import Sound from 'react-native-sound';
import { AuthContext } from '../context/AuthContext';
import Notification from '../components/Notification';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fetchWithAuth } from '../api/auth';
import LocationBottomSheet from '../components/LocationBottomSheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheetContext } from '../context/BottomSheetContext';

// Configuration constants
const STARTUP_CONFIG = {
  MAX_STARTUP_TIME: 8000,
  CRITICAL_OPERATIONS_TIMEOUT: 5000,
  BACKGROUND_TIMEOUT: 30000,
  QUICK_LOCATION_TIMEOUT: 3000,
};

const LOCATION_CONFIG = {
  TIMEOUTS: {
    QUICK: 3000,
    NORMAL: 15000,
    BACKGROUND: 30000,
  },
  DELTAS: {
    LATITUDE: 0.015,
    LONGITUDE: 0.0121,
  },
  CACHE_KEYS: {
    LAST_LOCATION: 'lastKnownLocation',
    CHILDREN_INFO: 'childrenInfoCache',
    USER_LOCATIONS: 'userLocationsCache',
  },
};

const API_ENDPOINTS = {
  BASE_URL: 'http://68.183.102.75:1337',
  ASSISTANT_BASE_URL: 'http://68.183.102.75:4000',
  LOCATIONS: '/endpoint/locations',
  ADD_LOCATION: '/endpoint/addLocation',
  SEND_LOCATION: '/endpoint',
  CHILDREN: '/endpoint/children',
  UPDATE_CHILDREN: '/endpoint/updateChildren',
};

const DEFAULT_LOCATION = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: LOCATION_CONFIG.DELTAS.LATITUDE,
  longitudeDelta: LOCATION_CONFIG.DELTAS.LONGITUDE,
};

// Type definitions
interface Tip {
  id: number | string;
  title: string;
  body: string;
  details: string;
  audioUrl: string | null;
  categories?: string[];
  similarity_score?: number;
  query_relevance?: number;
  personal_match?: number;
  isGenerated?: boolean;
}

interface Child {
  id?: number;
  nickname: string;
  date_of_birth: string;
}

interface Location {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

interface TipsModalProps {
  showTipsModal: boolean;
  setShowTipsModal: (value: boolean) => void;
};

interface UserPreferenceProfile {
  liked_tips: number;
}

const colorScheme = Appearance.getColorScheme(); // 'light' or 'dark'
const isDark = colorScheme === 'dark';

const App: React.FC<Props> = ({ navigation }) => {
  // ===== ALL HOOKS MUST BE AT THE TOP - NEVER AFTER CONDITIONAL RETURNS =====

  // Context and refs
  const { userInfo, isLoading, logout } = useContext<any>(AuthContext);
  const ref = useRef<GooglePlacesAutocompleteRef>(null);
  const currentSound = useRef<Sound | null>(null);
  const lastResult = useRef<string>('');
  const audioCache = useRef<Map<number, string>>(new Map());

  // State hooks - ALL declared here at the top
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [mainLoading, setMainLoading] = useState(true);
  const [backgroundLoading, setBackgroundLoading] = useState(true);
  const [userChildren, setUserChildren] = useState<Child[]>([]);
  const [location, setLocation] = useState<Location | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [details, setDetails] = useState<Array<{ title: string; description: string; pinColor: string }>>([]);
  const [newLocation, setNewLocation] = useState<Location | null>(null);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error' | 'disabled'>('loading');
  const [apiStatus, setApiStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [statusMessage, setStatusMessage] = useState<string>('Starting app...');
  const [isListening, setIsListening] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [tips, setTips] = useState<Tip[]>([]);
  const [savedTips, setSavedTips] = useState<Tip[]>([]);
  const [likedTips, setLikedTips] = useState<Tip[]>([]);
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [showSavedTipsModal, setShowSavedTipsModal] = useState(false);
  const [showLikedTipsModal, setShowLikedTipsModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeAudioIndex, setActiveAudioIndex] = useState<number | null>(null);
  const [audioLoadingIndex, setAudioLoadingIndex] = useState<number | null>(null);
  const [contentPreferences, setContentPreferences] = useState<string[]>(['language']);
  const [assistantView, setAssistantView] = useState<'search' | 'saved' | 'liked'>('search');
  const [showChildPrompt, setShowChildPrompt] = useState(false);
  const [detectedChildName, setDetectedChildName] = useState<string>('');
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [showAgeInput, setShowAgeInput] = useState(false);
  const [tempAge, setTempAge] = useState<string>('');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [personalizationEnabled, setPersonalizationEnabled] = useState(true);
  const [generateMode, setGenerateMode] = useState<'hybrid' | 'database' | 'generate'>('hybrid');
  const [lastTipSource, setLastTipSource] = useState<string>('');
  const [userPreferenceProfile, setUserPreferenceProfile] = useState<UserPreferenceProfile | null>(null);

  // Context hooks
  const { sheetIsOpen, setSheetIsOpen } = useContext(BottomSheetContext);
  const insets = useSafeAreaInsets();

  // Cache utilities (defined as useCallback)
  const loadFromCache = useCallback(async (key: string) => {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const data = JSON.parse(cached);
        console.log(`Loaded cached data for ${key}`);
        return data;
      }
    } catch (error) {
      console.warn(`Failed to load cache for ${key}:`, error);
    }
    return null;
  }, []);

  const saveToCache = useCallback(async (key: string, data: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
      console.log(`Cached data for ${key}`);
    } catch (error) {
      console.warn(`Failed to cache ${key}:`, error);
    }
  }, []);

  // Location functions (defined as useCallback)
  const getQuickLocation = useCallback(async (): Promise<Location> => {
    console.log('Getting quick location...');

    const cached = await loadFromCache(LOCATION_CONFIG.CACHE_KEYS.LAST_LOCATION);
    if (cached && cached.latitude && cached.longitude) {
      console.log('Using cached location for quick startup');
      setLocationStatus('success');
      return cached;
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log('Quick location timeout, using default location');
        setLocationStatus('error');
        resolve(DEFAULT_LOCATION);
      }, STARTUP_CONFIG.QUICK_LOCATION_TIMEOUT);

      Geolocation.getCurrentPosition(
        (position: GeolocationResponse) => {
          clearTimeout(timeout);
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            latitudeDelta: LOCATION_CONFIG.DELTAS.LATITUDE,
            longitudeDelta: LOCATION_CONFIG.DELTAS.LONGITUDE,
          };

          console.log('Got fresh location quickly');
          setLocationStatus('success');
          saveToCache(LOCATION_CONFIG.CACHE_KEYS.LAST_LOCATION, newLocation);
          resolve(newLocation);
        },
        (error: GeolocationError) => {
          clearTimeout(timeout);
          console.warn('Quick location failed, using default:', error.message);
          setLocationStatus('error');
          resolve(DEFAULT_LOCATION);
        },
        {
          enableHighAccuracy: false,
          timeout: STARTUP_CONFIG.QUICK_LOCATION_TIMEOUT - 500,
          maximumAge: 60000,
        }
      );
    });
  }, [loadFromCache, saveToCache]);

  const improveLocationInBackground = useCallback(async () => {
    if (locationStatus === 'success') {
      console.log('Location already good, skipping background improvement');
      return;
    }

    console.log('Improving location in background...');

    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location for personalized tips.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Location permission denied');
          setLocationStatus('disabled');
          return;
        }
      } catch (err) {
        console.warn('Permission request failed:', err);
        return;
      }
    }

    Geolocation.getCurrentPosition(
      (position: GeolocationResponse) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          latitudeDelta: LOCATION_CONFIG.DELTAS.LATITUDE,
          longitudeDelta: LOCATION_CONFIG.DELTAS.LONGITUDE,
        };

        console.log('Improved location obtained in background');
        setLocation(newLocation);
        setLocationStatus('success');
        saveToCache(LOCATION_CONFIG.CACHE_KEYS.LAST_LOCATION, newLocation);
      },
      (error: GeolocationError) => {
        console.warn('Background location improvement failed:', error.message);
        setLocationStatus('error');
      },
      {
        enableHighAccuracy: true,
        timeout: LOCATION_CONFIG.TIMEOUTS.BACKGROUND,
        maximumAge: 0,
      }
    );
  }, [locationStatus, saveToCache]);

  const loadCachedDataFirst = useCallback(async () => {
    console.log('Loading cached data first...');

    try {
      const cachedLocations = await loadFromCache(LOCATION_CONFIG.CACHE_KEYS.USER_LOCATIONS);
      if (cachedLocations) {
        console.log('Loaded cached locations');
        setLocations(cachedLocations.locations || []);
        setDetails(cachedLocations.details || []);
      }

      const cachedChildren = await loadFromCache(LOCATION_CONFIG.CACHE_KEYS.CHILDREN_INFO);
      if (cachedChildren) {
        console.log('Loaded cached children info');
        setUserChildren(cachedChildren);
      }

      const savedPreferences = await AsyncStorage.getItem('contentPreferences');
      if (savedPreferences) {
        const parsedPreferences = JSON.parse(savedPreferences);
        if (Array.isArray(parsedPreferences) && parsedPreferences.length > 0) {
          setContentPreferences(parsedPreferences);
        }
      }

      // Load saved and liked tips
      const savedTipsData = await loadFromCache('savedTips');
      if (savedTipsData && Array.isArray(savedTipsData)) {
        setSavedTips(savedTipsData);
      }

      const likedTipsData = await loadFromCache('likedTips');
      if (likedTipsData && Array.isArray(likedTipsData)) {
        setLikedTips(likedTipsData);
      }
    } catch (error) {
      console.warn('Failed to load cached data:', error);
    }
  }, [loadFromCache]);

  const refreshDataInBackground = useCallback(async () => {
    if (!userInfo?.access_token) {
      console.log('No auth token, skipping API calls');
      setApiStatus('error');
      return;
    }

    console.log('Refreshing data in background...');

    try {
      const locationsPromise = fetchWithAuth(
        `${API_ENDPOINTS.BASE_URL}${API_ENDPOINTS.LOCATIONS}`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userInfo.access_token}`,
          },
        },
      ).then(async (response) => {
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data.locations) && Array.isArray(data.details)) {
            setLocations(data.locations);
            setDetails(data.details);

            await saveToCache(LOCATION_CONFIG.CACHE_KEYS.USER_LOCATIONS, {
              locations: data.locations,
              details: data.details,
            });

            console.log('Locations refreshed successfully');
            return true;
          }
        }
        throw new Error(`HTTP ${response.status}`);
      }).catch(error => {
        console.warn('Failed to refresh locations:', error);
        return false;
      });

      const childrenPromise = fetchWithAuth(
        `${API_ENDPOINTS.BASE_URL}${API_ENDPOINTS.CHILDREN}`,
        {
          headers: {
            Authorization: `Bearer ${userInfo.access_token}`,
          },
        },
      ).then(async (response) => {
        if (response.ok) {
          const data = await response.json();
          if (data.children) {
            setUserChildren(data.children);
            if (data.children.some((child: any) => !child.nickname || !child.date_of_birth)) {
              setShowUpdateModal(true);
            }

            await saveToCache(LOCATION_CONFIG.CACHE_KEYS.CHILDREN_INFO, data.children);

            console.log('Children info refreshed successfully');
            return true;
          }
        }
        throw new Error(`HTTP ${response.status}`);
      }).catch(error => {
        console.warn('Failed to refresh children info:', error);
        return false;
      });

      const results = await Promise.allSettled([
        Promise.race([locationsPromise, new Promise(resolve => setTimeout(() => resolve(false), 10000))]),
        Promise.race([childrenPromise, new Promise(resolve => setTimeout(() => resolve(false), 10000))])
      ]);

      const successCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
      setApiStatus(successCount > 0 ? 'success' : 'error');

      console.log(`Background refresh completed: ${successCount}/2 successful`);

    } catch (error) {
      console.error('Background refresh failed:', error);
      setApiStatus('error');
    } finally {
      setBackgroundLoading(false);
    }
  }, [userInfo, saveToCache]);

  const speakTip = useCallback(async (tip: Tip, id: number) => {
    // Clean up any existing sound
    if (currentSound.current) {
      currentSound.current.stop();
      currentSound.current.release();
      currentSound.current = null;
    }
    setIsPlaying(false);
    setActiveAudioIndex(id);

    try {
      // Load audio function (simplified for this example)
      let audioUrl = audioCache.current.get(id);

      if (!audioUrl) {
        if (tip.audioUrl) {
          audioUrl = `${API_ENDPOINTS.ASSISTANT_BASE_URL}/audio${tip.audioUrl}`;
          audioCache.current.set(id, audioUrl);
        } else {
          setAudioLoadingIndex(id);
          try {
            const response = await fetch(`${API_ENDPOINTS.ASSISTANT_BASE_URL}/generate-tip-audio`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                tipId: id,
                title: tip.title,
                body: tip.body,
                details: tip.details
              })
            });

            if (!response.ok) {
              throw new Error('Failed to generate audio');
            }

            const { audioUrl: newAudioUrl } = await response.json();
            audioUrl = `${API_ENDPOINTS.ASSISTANT_BASE_URL}/audio${newAudioUrl}`;

            tip.audioUrl = newAudioUrl;
            audioCache.current.set(id, audioUrl);
          } catch (error) {
            console.error('Audio generation error:', error);
            Alert.alert('Error', 'Failed to generate audio. Please try again.');
            return;
          } finally {
            setAudioLoadingIndex(null);
          }
        }
      }

      if (!audioUrl) return;

      setIsPlaying(true);

      currentSound.current = new Sound(audioUrl, '', error => {
        if (error) {
          console.error('Failed to load sound:', error);
          Alert.alert('Error', 'Failed to play audio. Please try again.');
          setIsPlaying(false);
          setActiveAudioIndex(null);
          return;
        }

        currentSound.current?.play(success => {
          if (!success) {
            Alert.alert('Error', 'Audio playback failed. Please try again.');
          }
          setIsPlaying(false);
          setActiveAudioIndex(null);
          if (currentSound.current) {
            currentSound.current.release();
            currentSound.current = null;
          }
        });
      });
    } catch (error) {
      console.error('Audio playback error:', error);
      setIsPlaying(false);
      setActiveAudioIndex(null);
    }
  }, []);

  // Track tip interaction for personalization
  const trackTipInteraction = useCallback(async (tipId: number, interactionType: string) => {
    if (!personalizationEnabled || !userInfo?.access_token) return;
    
    try {
      const response = await fetchWithAuth(
        `${API_ENDPOINTS.BASE_URL}/api/personalization/interactions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userInfo.access_token}`,
          },
          body: JSON.stringify({
            tipId,
            interactionType
          })
        }
      );
  
      if (!response.ok) {
        throw new Error(`Failed to track interaction: ${response.status}`);
      }
  
      console.log(`Tracked ${interactionType} for tip ${tipId}`);
    } catch (error) {
      console.warn('Failed to track tip interaction:', error);
    }
  }, [personalizationEnabled, userInfo]);
  
  // Load user preference profile
  const loadUserPreferenceProfile = useCallback(async () => {
    if (!personalizationEnabled || !userInfo?.access_token) return;
  
    try {
      const response = await fetchWithAuth(
        `${API_ENDPOINTS.BASE_URL}/api/personalization/profile`,
        {
          headers: {
            Authorization: `Bearer ${userInfo.access_token}`,
          },
        }
      );
  
      if (response.ok) {
        const data = await response.json();
        setUserPreferenceProfile(data.profile);
        console.log('Loaded user preference profile:', data.profile);
      }
    } catch (error) {
      console.warn('Failed to load user preference profile:', error);
    }
  }, [personalizationEnabled, userInfo]);
  
  // Get personalized recommendations
  const getPersonalizedRecommendations = useCallback(async () => {
    if (!personalizationEnabled || !userInfo?.access_token) return;
  
    try {
      setIsAssistantLoading(true);
      
      const response = await fetchWithAuth(
        `${API_ENDPOINTS.BASE_URL}/api/personalization/recommendations?limit=10`,
        {
          headers: {
            Authorization: `Bearer ${userInfo.access_token}`,
          },
        }
      );
  
      if (response.ok) {
        const data = await response.json();
        if (data.tips.length > 0) {
          setTips(data.tips);
          setShowTipsModal(true);
          Alert.alert(
            'Personalized Tips', 
            'These tips are tailored based on your preferences!'
          );
        } else {
          Alert.alert(
            'No Recommendations', 
            'Like more tips to get personalized recommendations!'
          );
        }
      }
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      Alert.alert('Error', 'Failed to get personalized recommendations');
    } finally {
      setIsAssistantLoading(false);
    }
  }, [personalizationEnabled, userInfo]);

  // ALL useEffect hooks go here at the top level

  // JWT Token logging - Log token whenever userInfo changes
  useEffect(() => {
    if (userInfo?.access_token) {
      console.log('JWT TOKEN:', userInfo.access_token);
      console.log('User Info:', JSON.stringify(userInfo, null, 2));
    } else {
      console.log('No JWT token available');
    }
  }, [userInfo]);

  // Sheet open status logging
  useEffect(() => {
    console.log("sheetIsOpen", sheetIsOpen);
  }, [sheetIsOpen]);

  // Startup initialization useEffect
  useEffect(() => {
    let mounted = true;

    const startupSequence = async () => {
      console.log('=== FAST STARTUP SEQUENCE BEGIN ===');

      try {
        await loadCachedDataFirst();

        setStatusMessage('Getting your location...');
        const quickLocation = await getQuickLocation();

        if (mounted) {
          setLocation(quickLocation);
          console.log('Quick location set:', quickLocation);
        }

        setStatusMessage('Loading interface...');
        await new Promise(resolve => setTimeout(resolve, 100));

        if (mounted) {
          console.log('Showing main UI');
          setMainLoading(false);
        }

        console.log('Starting background operations...');

        Promise.allSettled([
          improveLocationInBackground(),
          refreshDataInBackground()
        ]).then(() => {
          if (mounted) {
            console.log('Background operations completed');
            setBackgroundLoading(false);
          }
        });

      } catch (error) {
        console.error('Startup sequence error:', error);

        if (mounted) {
          setLocation(DEFAULT_LOCATION);
          setMainLoading(false);
          setBackgroundLoading(false);
        }
      }

      console.log('=== FAST STARTUP SEQUENCE END ===');
    };

    startupSequence();

    const failsafeTimeout = setTimeout(() => {
      if (mounted && mainLoading) {
        console.log('Failsafe: Forcing UI to show after timeout');
        setLocation(prev => prev || DEFAULT_LOCATION);
        setMainLoading(false);
        setBackgroundLoading(false);
      }
    }, STARTUP_CONFIG.MAX_STARTUP_TIME);

    return () => {
      mounted = false;
      clearTimeout(failsafeTimeout);

      // Cleanup voice and sound
      Voice.destroy().then(Voice.removeAllListeners);
      if (currentSound.current) {
        currentSound.current.stop();
        currentSound.current.release();
        currentSound.current = null;
      }
      setIsPlaying(false);
      setActiveAudioIndex(null);
    };
  }, [getQuickLocation, loadCachedDataFirst, improveLocationInBackground, refreshDataInBackground, mainLoading]);

  // Periodic location updates useEffect
  useEffect(() => {
    const intervalId = setInterval(async () => {
      if (AppState.currentState === 'active' && location && userInfo?.access_token) {
        try {
          await fetchWithAuth(`${API_ENDPOINTS.BASE_URL}${API_ENDPOINTS.SEND_LOCATION}`, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              Authorization: `Bearer ${userInfo.access_token}`,
            },
            body: JSON.stringify({
              latitude: location.latitude,
              longitude: location.longitude
            })
          });
        } catch (error) {
          console.warn('Location update failed:', error);
        }
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [location, userInfo]);

  // Voice initialization useEffect
  useEffect(() => {
    const initializeVoice = async () => {
      try {
        if (Platform.OS === 'android') {
          try {
            const granted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
              {
                title: 'Microphone Permission',
                message: 'This app needs access to your microphone for voice recognition.',
                buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
              },
            );
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
              Alert.alert('Permission Denied', 'Voice recognition requires microphone access');
              return;
            }
          } catch (err) {
            Alert.alert('Error', 'Failed to request microphone permission');
            console.error(err);
            return;
          }
        }

        Voice.onSpeechResults = (e: any) => {
          if (e.value && e.value[0]) {
            const newResult = e.value[0];
            if (newResult !== lastResult.current) {
              lastResult.current = newResult;
              setSearchText(newResult);
            }
          }
        };

        Voice.onSpeechError = (e: any) => {
          console.error('Speech recognition error:', e);
          if (isListening) {
            Voice.start('en-US').catch(error => {
              console.error('Failed to restart voice recognition:', error);
              setIsListening(false);
              Alert.alert('Error', 'Failed to restart voice recognition. Please try again.');
            });
          }
        };

        Voice.onSpeechEnd = () => {
          if (isListening) {
            Voice.start('en-US');
          }
        };
      } catch (error) {
        console.error('Failed to initialize voice:', error);
      }
    };

    initializeVoice();
  }, [isListening]);

  // Load personalization profile when user info is available
  useEffect(() => {
    if (userInfo?.access_token) {
      loadUserPreferenceProfile();
    }
  }, [userInfo, loadUserPreferenceProfile]);

  // ===== END OF ALL HOOKS - NOW SAFE TO DO CONDITIONAL RETURNS =====

  // Early returns AFTER all hooks
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Spinner visible={true} />
        <Text style={styles.loadingText}>Initializing...</Text>
        <Notification />
      </View>
    );
  }

  if (!userInfo || !userInfo.access_token) {
    return (
      <View style={styles.loadingContainer}>
        <Spinner visible={true} />
        <Text style={styles.loadingText}>Please log in...</Text>
        <Notification />
      </View>
    );
  }

  if (mainLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Spinner visible={true} />
        <Text style={styles.loadingText}>{statusMessage || 'Loading...'}</Text>
        <Text style={styles.loadingSubtext}>
          {Date.now() % 2000 < 1000 ? 'Almost ready...' : 'Just a moment...'}
        </Text>
        <Notification />
      </View>
    );
  }

  // Safety check for required data
  if (!userInfo) {
    return (
      <View style={styles.loadingContainer}>
        <Spinner visible={true} />
        <Text style={styles.loadingText}>Please wait...</Text>
        <Notification />
      </View>
    );
  }

  // Helper functions (these can be defined after hooks since they're not hooks themselves)
  const options = [
    { label: 'Grocery Store', value: 'Grocery Store' },
    { label: 'Bus/Walk', value: 'Bus/Walk' },
    { label: 'Library', value: 'Library' },
    { label: 'Park', value: 'Park' },
    { label: 'Restaurant', value: 'Restaurant' },
    { label: 'Waiting Room', value: 'Waiting Room' },
    { label: "Other's Home", value: "Other's Home" },
  ];

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

  const detectChildNameInQuery = (query: string, childrenInfo: Child[]) => {
    if (!childrenInfo || childrenInfo.length === 0) {
      return null;
    }

    const normalizedQuery = query.toLowerCase();

    for (const child of childrenInfo) {
      const nickname = child.nickname?.toLowerCase();

      if (!nickname) continue;

      const patterns = [
        ` for ${nickname}`,
        ` ${nickname}'s `,
        ` ${nickname} `,
        `^${nickname} `,
        ` ${nickname}$`,
        `^${nickname}$`
      ];

      if (patterns.some(pattern => normalizedQuery.match(pattern))) {
        return child;
      }
    }

    return null;
  };

  const detectPotentialChildName = (query: string) => {
    const normalizedQuery = query.toLowerCase();

    const childPatterns = [
      / for (\w+)/g,
      / (\w+)'s /g,
      / help (\w+) /g,
      / (\w+) is /g,
      / (\w+) has /g,
      / (\w+) needs /g,
      / (\w+) wants /g,
      / my (\w+) /g,
      / with (\w+) /g,
    ];

    for (const pattern of childPatterns) {
      const matches = normalizedQuery.matchAll(pattern);
      for (const match of matches) {
        const potentialName = match[1];

        const skipWords = ['child', 'kids', 'children', 'baby', 'toddler', 'son', 'daughter',
          'homework', 'reading', 'bedtime', 'eating', 'playing', 'school',
          'help', 'them', 'this', 'that', 'when', 'what', 'how', 'why'];

        if (!skipWords.includes(potentialName) && potentialName.length > 2) {
          return potentialName.charAt(0).toUpperCase() + potentialName.slice(1);
        }
      }
    }

    return null;
  };

  // Voice Recognition Functions
  const toggleListening = async () => {
    try {
      if (isListening) {
        await Voice.stop();
        setIsListening(false);
        if (searchText.trim()) {
          await getTips(searchText, undefined);
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

  // Assistant API Functions
  // Replace your getTips function with this enhanced version:

  const getTips = async (query: string = searchText, providedAge: string | undefined, mode: string = generateMode) => {
    if (!query.trim()) {
      Alert.alert('Input Required', 'Please enter a question or use voice input');
      return;
    }
  
    setIsAssistantLoading(true);
    setTips([]);
  
    const detectedChild = detectChildNameInQuery(query, userChildren);
    let finalQuery = query;
    
    if (detectedChild) {
      const age = calculateAge(detectedChild.date_of_birth);
      finalQuery = `${query} for ${age} year old`;
    } else {
      const potentialChildName = detectPotentialChildName(query);
      if (potentialChildName && !providedAge) {
        setDetectedChildName(potentialChildName);
        setCurrentQuery(query);
        setShowChildPrompt(true);
        setIsAssistantLoading(false);
        return;
      } else if (providedAge) {
        finalQuery = `${query} for ${providedAge} year old`;
      } else {
        setDetectedChildName('');
        setCurrentQuery(query);
        setShowChildPrompt(true);
        setIsAssistantLoading(false);
        return;
      }
    }
  
    try {
      const endpoint = personalizationEnabled && userInfo?.access_token 
        ? `${API_ENDPOINTS.BASE_URL}/api/personalization/enhanced-tips`
        : `${API_ENDPOINTS.ASSISTANT_BASE_URL}/generate-tips`;
  
      const headers = {
        'Content-Type': 'application/json',
        ...(personalizationEnabled && userInfo?.access_token && {
          Authorization: `Bearer ${userInfo.access_token}`
        })
      };
  
      console.log(`Requesting tips for: "${finalQuery}" (mode: ${mode})`);
  
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: finalQuery,
          contentPreferences: contentPreferences,
          generateMode: mode
        })
      });
  
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
  
      const data = await response.json();
      
      if (data.tips && data.tips.length > 0) {
        setTips(data.tips);
        setLastTipSource(data.source);
        setShowTipsModal(true);
  
        // Show appropriate success message based on the source
        let alertMessage = '';
        
        if (data.source === 'ai_generated' || data.source === 'ai_generated_fallback') {
          alertMessage = data.isPersonalized 
            ? `🤖✨ Generated ${data.tips.length} personalized tips about "${query}" based on your preferences!`
            : `🤖 Generated ${data.tips.length} custom tips about "${query}"`;
        } else if (data.source === 'database_found') {
          alertMessage = data.isPersonalized 
            ? `📚✨ Found ${data.tips.length} tips about "${query}" tailored to your preferences`
            : `📚 Found ${data.tips.length} relevant tips about "${query}"`;
        }
  
        console.log(alertMessage);
        
      } else {
        Alert.alert('No Tips Found', data.message || 'No tips found for your query. Try rephrasing or asking about a different topic.');
      }
  
    } catch (error) {
      console.error('Error fetching tips:', error);
      Alert.alert('Error', 'Failed to fetch tips. Please check your connection and try again.');
    } finally {
      setIsAssistantLoading(false);
    }
  };
  
  // Function to specifically generate AI tips
  const generateAITips = async () => {
    if (!searchText.trim()) {
      Alert.alert('Input Required', 'Please enter a question first');
      return;
    }
    await getTips(searchText, undefined, 'generate');
  };

  // Location management functions
  const handleUpdateChildren = async (updatedChildren: any[]) => {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.BASE_URL}${API_ENDPOINTS.UPDATE_CHILDREN}`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userInfo.access_token}`,
          },
          body: JSON.stringify({ children: updatedChildren })
        },
      );

      if (!response.ok) {
        throw new Error('Failed to update children');
      }
      Alert.alert('Success', 'Children information updated successfully');
    } catch (error) {
      console.error('Error updating children:', error);
      Alert.alert('Error', 'Failed to update children information');
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const isLocationNearby = (newLat: number, newLon: number) => {
    return locations.some(loc => {
      const distance = calculateDistance(newLat, newLon, loc.latitude, loc.longitude);
      return distance <= 100;
    });
  };

  const addLocation = async () => {
    if (name === '' || description === '' || !selectedOption) {
      Alert.alert('Missing Information', 'Please enter a title, description, and select a location type.');
      return;
    }

    if (newLocation) {
      if (isLocationNearby(newLocation.latitude, newLocation.longitude)) {
        Alert.alert('Duplicate Location', 'A location already exists within 100 meters of this point.');
        return;
      }

      try {
        const response = await fetchWithAuth(
          `${API_ENDPOINTS.BASE_URL}${API_ENDPOINTS.ADD_LOCATION}`,
          {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              Authorization: `Bearer ${userInfo.access_token}`,
            },
            body: JSON.stringify({
              latitude: newLocation.latitude,
              longitude: newLocation.longitude,
              name,
              description,
              type: selectedOption
            })
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        await refreshDataInBackground();
        Alert.alert('Success', 'Location added successfully!');

        setNewLocation(null);
        setName('');
        setDescription('');
        setSelectedOption(null);
        ref.current?.clear?.();
      } catch (error) {
        console.error('Error adding location:', error);
        Alert.alert('Error', 'Failed to add location. Please try again.');
      }
    }
  };

  // Child prompt handlers
  const handleAddChild = () => {
    setShowChildPrompt(false);
    Alert.alert(
      'Add Child',
      `You can add ${detectedChildName} to your profile in the Settings menu for personalized age-based tips.`,
      [
        { text: 'Later', style: 'cancel' },
        {
          text: 'Go to Settings', onPress: () => {
            navigation.navigate('Settings' as never);
          }
        }
      ]
    );
  };

  const handleProvideAge = () => {
    setShowChildPrompt(false);
    setShowAgeInput(true);
  };

  const handleAgeSubmit = () => {
    if (!tempAge.trim() || isNaN(Number(tempAge))) {
      Alert.alert('Invalid Age', 'Please enter a valid age in years.');
      return;
    }

    setShowAgeInput(false);
    getTips(currentQuery, tempAge);
    setTempAge('');
  };

  const handleCancelChildPrompt = () => {
    setShowChildPrompt(false);
    setShowAgeInput(false);
    setDetectedChildName('');
    setCurrentQuery('');
    setTempAge('');
  };

  // Tip management handlers
  const handleSaveTip = async (tip: Tip) => {
    try {
      const isAlreadySaved = savedTips.some(savedTip => savedTip.id === tip.id);
      
      if (isAlreadySaved) {
        // Remove from saved
        const updatedSavedTips = savedTips.filter(savedTip => savedTip.id !== tip.id);
        setSavedTips(updatedSavedTips);
        await saveToCache('savedTips', updatedSavedTips);
        Alert.alert('Tip Removed', 'Tip removed from saved tips');
        
        // Track unsave interaction for personalization
        await trackTipInteraction(Number(tip.id), 'unsave');
      } else {
        // Add to saved
        const updatedSavedTips = [tip, ...savedTips];
        setSavedTips(updatedSavedTips);
        await saveToCache('savedTips', updatedSavedTips);
        Alert.alert('Tip Saved', 'Tip saved for later reference');
        
        // Track save interaction for personalization
        await trackTipInteraction(Number(tip.id), 'save');
      }
    } catch (error) {
      console.error('Error saving tip:', error);
      Alert.alert('Error', 'Failed to save tip');
    }
  };

  const handleLikeTip = async (tip: Tip) => {
    try {
      const isAlreadyLiked = likedTips.some(likedTip => likedTip.id === tip.id);
      
      if (isAlreadyLiked) {
        // Remove from liked
        const updatedLikedTips = likedTips.filter(likedTip => likedTip.id !== tip.id);
        setLikedTips(updatedLikedTips);
        await saveToCache('likedTips', updatedLikedTips);
        
        // Track dislike interaction for personalization
        await trackTipInteraction(Number(tip.id), 'dislike');
      } else {
        // Add to liked
        const updatedLikedTips = [tip, ...likedTips];
        setLikedTips(updatedLikedTips);
        await saveToCache('likedTips', updatedLikedTips);
        
        // Track like interaction for personalization
        await trackTipInteraction(Number(tip.id), 'like');
      }
    } catch (error) {
      console.error('Error liking tip:', error);
      Alert.alert('Error', 'Failed to like tip');
    }
  };

  const isTipSaved = (tipId: number) => {
    return savedTips.some(tip => tip.id === tipId);
  };

  const isTipLiked = (tipId: number) => {
    return likedTips.some(tip => tip.id === tipId);
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

  const PersonalizedRecommendationsButton = () => (
    <TouchableOpacity
      style={styles.personalizedButton}
      onPress={getPersonalizedRecommendations}
      disabled={isAssistantLoading}>
      <MaterialIcons name="psychology" size={20} color="white" />
      <Text style={styles.personalizedButtonText}>Get Personal Tips</Text>
    </TouchableOpacity>
  );

  const renderTipItem = (tip: Tip, id: number | string, source: string = 'search') => (
    <View key={`${source}-${id}`} style={styles.tipItem}>
      <LinearGradient 
        colors={tip.isGenerated ? ['#f0f8ff', '#e6f3ff'] : ['#ffffff', '#f8f9fa']} 
        style={styles.tipGradient}
      >
        <View style={styles.tipHeader}>
          <MaterialIcons 
            name={tip.isGenerated ? "auto-awesome" : "lightbulb"} 
            size={24} 
            color={tip.isGenerated ? "#6C63FF" : "#FFA726"} 
            style={styles.tipIcon} 
          />
          <Text style={styles.tipTitle}>{tip.title || ''}</Text>
          
          {/* AI Generated Badge */}
          {tip.isGenerated && (
            <View style={styles.aiGeneratedBadge}>
              <MaterialIcons name="auto-awesome" size={12} color="#6C63FF" />
              <Text style={styles.aiGeneratedBadgeText}>AI Generated</Text>
            </View>
          )}
          
          {/* Existing badges */}
          {tip.query_relevance && tip.query_relevance > 0.7 && !tip.isGenerated && (
            <View style={styles.relevanceBadge}>
              <MaterialIcons name="search" size={14} color="#4CAF50" />
              <Text style={styles.relevanceBadgeText}>Relevant</Text>
            </View>
          )}
          
          {tip.personal_match && tip.personal_match > 0.7 && (
            <View style={styles.personalizedBadge}>
              <MaterialIcons name="psychology" size={14} color="#4A90E2" />
              <Text style={styles.personalizedBadgeText}>For You</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.tipBody}>{tip.body || ''}</Text>
        <Text style={styles.tipDetails}>{tip.details || ''}</Text>
        
        {/* Show scoring details */}
        {(tip.query_relevance || tip.personal_match) && (
          <View style={styles.scoringDetails}>
            <Text style={styles.scoringText}>
              {tip.isGenerated ? 'AI Generated • ' : ''}
              {tip.query_relevance ? `Relevance: ${(tip.query_relevance * 100).toFixed(0)}% • ` : ''}
              {tip.personal_match ? `Personal Match: ${(tip.personal_match * 100).toFixed(0)}%` : ''}
            </Text>
          </View>
        )}
        
        {/* Existing action buttons */}
        <View style={{ flexDirection: 'row', marginTop: 12, alignItems: 'center' }}>
          {/* Play, Save, Like buttons remain the same */}
          <TouchableOpacity
            style={[
              styles.playButton,
              activeAudioIndex === id && isPlaying && styles.stopButton,
              audioLoadingIndex === id && styles.loadingButton,
            ]}
            onPress={() => {
              if (activeAudioIndex === id && isPlaying) {
                cleanupSound();
              } else {
                speakTip(tip, typeof id === 'string' ? parseInt(id.split('_')[1]) || 0 : id);
              }
            }}
            disabled={audioLoadingIndex === id}>
            {audioLoadingIndex === id ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <MaterialIcons
                name={activeAudioIndex === id && isPlaying ? 'stop' : 'play-arrow'}
                size={16}
                color="white"
              />
            )}
            <Text style={styles.playButtonText}>
              {audioLoadingIndex === id
                ? 'Loading...'
                : activeAudioIndex === id && isPlaying
                ? 'Stop'
                : 'Play'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={{ marginLeft: 10, padding: 6 }}
            onPress={() => handleSaveTip(tip)}
            accessibilityLabel={isTipSaved(typeof tip.id === 'string' ? parseInt(tip.id.split('_')[1]) || 0 : tip.id) ? 'Remove from saved tips' : 'Save tip'}>
            <MaterialIcons
              name={isTipSaved(typeof tip.id === 'string' ? parseInt(tip.id.split('_')[1]) || 0 : tip.id) ? 'bookmark' : 'bookmark-border'}
              size={22}
              color={isTipSaved(typeof tip.id === 'string' ? parseInt(tip.id.split('_')[1]) || 0 : tip.id) ? '#4A90E2' : '#999'}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={{ marginLeft: 4, padding: 6 }}
            onPress={() => handleLikeTip(tip)}
            accessibilityLabel={isTipLiked(typeof tip.id === 'string' ? parseInt(tip.id.split('_')[1]) || 0 : tip.id) ? 'Unlike tip' : 'Like tip'}>
            <MaterialIcons
              name={isTipLiked(typeof tip.id === 'string' ? parseInt(tip.id.split('_')[1]) || 0 : tip.id) ? 'favorite' : 'favorite-border'}
              size={22}
              color={isTipLiked(typeof tip.id === 'string' ? parseInt(tip.id.split('_')[1]) || 0 : tip.id) ? '#FF3B30' : '#999'}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
  
  // Add generation mode selector component
  const GenerationModeSelector = () => (
    <View style={styles.modeSelector}>
      <Text style={styles.modeSelectorLabel}>Tip Source:</Text>
      <View style={styles.modeButtons}>
        <TouchableOpacity
          style={[styles.modeButton, generateMode === 'hybrid' && styles.modeButtonActive]}
          onPress={() => setGenerateMode('hybrid')}>
          <Text style={[styles.modeButtonText, generateMode === 'hybrid' && styles.modeButtonTextActive]}>
            Smart
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, generateMode === 'database' && styles.modeButtonActive]}
          onPress={() => setGenerateMode('database')}>
          <Text style={[styles.modeButtonText, generateMode === 'database' && styles.modeButtonTextActive]}>
            Database
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, generateMode === 'generate' && styles.modeButtonActive]}
          onPress={() => setGenerateMode('generate')}>
          <Text style={[styles.modeButtonText, generateMode === 'generate' && styles.modeButtonTextActive]}>
            AI Generate
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  // Enhanced AI Generation Button
  const AIGenerationButton = () => (
    <TouchableOpacity
      style={styles.aiGenerateButton}
      onPress={generateAITips}
      disabled={isAssistantLoading}>
      <MaterialIcons name="auto-awesome" size={20} color="white" />
      <Text style={styles.aiGenerateButtonText}>Generate AI Tips</Text>
    </TouchableOpacity>
  );
  

  const TipsModal: React.FC<TipsModalProps> = ({ showTipsModal, setShowTipsModal }) => (
    <Modal visible={showTipsModal} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Parenting Tips</Text>
          <TouchableOpacity
            style={styles.closeModalButton}
            onPress={() => setShowTipsModal(false)}>
            <MaterialIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        
        {/* Source Indicator */}
        {lastTipSource && (
          <View style={styles.sourceIndicator}>
            <Text style={styles.sourceIndicatorText}>
              {lastTipSource === 'ai_generated' || lastTipSource === 'ai_generated_fallback' 
                ? '🤖 AI Generated Tips - Personalized for You'
                : lastTipSource === 'database_found'
                ? '📚 Database Tips - Matched to Your Preferences'  
                : '💡 Tips from Database'}
            </Text>
          </View>
        )}
        
        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {tips.map((tip, index) => renderTipItem(tip, tip.id, 'search'))}
          <View style={{ height: 20 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const ChildPromptModal = () => (
    <Modal visible={showChildPrompt} transparent={true} animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <MaterialIcons name="child-care" size={48} color="#4A90E2" style={styles.modalIcon} />
          <Text style={styles.modalTitle}>Child Detected: {detectedChildName || 'Unknown'}</Text>
          <Text style={styles.modalText}>
            I noticed you mentioned "{detectedChildName || 'a child'}" but they're not in your profile yet.
            Would you like to add them for personalized tips, or just provide their age for this question?
          </Text>

          <TouchableOpacity style={styles.primaryButton} onPress={handleAddChild}>
            <MaterialIcons name="person-add" size={20} color="white" />
            <Text style={styles.primaryButtonText}>Add {detectedChildName || 'child'} to Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleProvideAge}>
            <MaterialIcons name="schedule" size={20} color="#4A90E2" />
            <Text style={styles.secondaryButtonText}>Just Provide Age</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={handleCancelChildPrompt}>
            <Text style={styles.cancelButtonText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const AgeInputModal = () => (
    <Modal visible={showAgeInput} transparent={true} animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <MaterialIcons name="cake" size={48} color="#FFA726" style={styles.modalIcon} />
          <Text style={styles.modalTitle}>How old is {detectedChildName || 'your child'}?</Text>
          <Text style={styles.modalText}>
            Please enter {detectedChildName || 'your child'}'s age in years to get age-appropriate tips.
          </Text>

          <TextInput
            style={styles.ageInput}
            value={tempAge}
            onChangeText={setTempAge}
            placeholder="Age in years"
            keyboardType="numeric"
            maxLength={2}
            autoFocus
          />

          <TouchableOpacity style={styles.primaryButton} onPress={handleAgeSubmit}>
            <MaterialIcons name="check" size={20} color="white" />
            <Text style={styles.primaryButtonText}>Get Tips</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={handleCancelChildPrompt}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Main component render
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <Notification />

      {backgroundLoading && (
        <View style={styles.backgroundLoadingBanner}>
          <View style={styles.backgroundLoadingContent}>
            <Text style={styles.backgroundLoadingText}>🔄 Refreshing data...</Text>
          </View>
        </View>
      )}

      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container}>
          <View style={[styles.assistantContainer, { top: Platform.OS === "ios" ? insets.top : insets.top + 35 }]}>
            <GooglePlacesAutocomplete
              placeholder="Search location..."
              suppressDefaultStyles={true}
              debounce={500}
              renderLeftButton={() => <MaterialIcons name="search" size={20} color="#666" style={{ marginRight: 10 }} />}
              textInputProps={{
                placeholderTextColor: '#d3d3d3'
              }}
              styles={{
                textInputContainer: {
                  backgroundColor: 'rgba(74, 144, 226, 0.05)',
                  borderRadius: 14,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                },
                textInput: {
                  flex: 1,
                  height: 40,
                  fontSize: 16,
                  color: '#000',
                },
                listView: {
                  backgroundColor: 'rgba(74, 144, 226, 0.05)',
                  borderRadius: 14,
                  marginTop: 8,
                  paddingVertical: 4,
                },
                row: {
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderBottomColor: '#E0E0E0',
                  borderBottomWidth: 1,
                },
                description: {
                  fontSize: 15,
                  color: '#000',
                },
                separator: {
                  height: 0,
                },
                poweredContainer: {
                  padding: 10
                }
              }}
              fetchDetails={true}
              onPress={(data, details = null) => {
                if (details) {
                  const latitude = details.geometry.location.lat;
                  const longitude = details.geometry.location.lng;
                  setNewLocation({
                    latitude,
                    longitude,
                    latitudeDelta: LOCATION_CONFIG.DELTAS.LATITUDE,
                    longitudeDelta: LOCATION_CONFIG.DELTAS.LONGITUDE,
                  });
                }
              }}
              query={{ key: 'AIzaSyBczo2yBRbSwa4IVQagZKNfTje0JJ_HEps', language: 'en' }}
              renderRightButton={() => (
                <TouchableOpacity onPress={() => { setSheetVisible(true); setSheetIsOpen(true) }}>
                  <MaterialIcons name="bookmark" size={24} color={'#4A90E2'} />
                </TouchableOpacity>
              )}
              ref={ref}
            />
          </View>

          <View style={styles.mapContainer}>
            {location && location.latitude && location.longitude && (
              <MapView
                provider={Platform.OS === 'ios' ? PROVIDER_DEFAULT : PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={location}
                region={newLocation || location}
                showsUserLocation
                mapType="standard"
                userInterfaceStyle="light">
                {locations && locations.length > 0 && locations.map((loc, index) => (
                  <React.Fragment key={`location-${index}`}>
                    <Marker
                      coordinate={loc}
                      title={details[index]?.title || `Location ${index + 1}`}
                      description={details[index]?.description || ''}
                      pinColor={details[index]?.pinColor || '#FF4B4B'}
                    />
                    <Circle
                      center={loc}
                      radius={100}
                      strokeColor="rgba(65, 105, 225, 0.5)"
                      fillColor="rgba(65, 105, 225, 0.1)"
                      zIndex={2}
                    />
                  </React.Fragment>
                ))}
              </MapView>
            )}
          </View>

          {newLocation && (
            <View
              style={[styles.formContainer, { bottom: Platform.OS === "ios" ? insets.bottom + 55 : insets.bottom + 80 }]}>
              <Text style={styles.formTitle}>Add New Location</Text>
              <Dropdown
                style={styles.dropdown}
                placeholderStyle={styles.dropdownPlaceholder}
                selectedTextStyle={styles.dropdownSelected}
                data={options}
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder="Select location type"
                value={selectedOption}
                onChange={item => setSelectedOption(item.value)}
                renderLeftIcon={() => (
                  <AntDesign style={styles.dropdownLeftIcon} name="Safety" size={20} color="#333" />
                )}
                renderItem={item => (
                  <View style={styles.dropDownItem}>
                    <Text style={styles.dropDownItemText}>{item.label}</Text>
                  </View>
                )}
              />
              <TextInput
                placeholder="Location name"
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholderTextColor="#d3d3d3"
              />
              <TextInput
                placeholder="Description"
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholderTextColor="#d3d3d3"
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity style={styles.addButton} onPress={addLocation}>
                <Text style={styles.addButtonText}>Add Location</Text>
              </TouchableOpacity>
            </View>
          )}

          {!newLocation && (
            <View
              style={[styles.assistantContainer, { bottom: Platform.OS === "ios" ? insets.bottom + 55 : insets.bottom + 80 }]}>

              {/* Mode Selector */}
          {personalizationEnabled && userPreferenceProfile && userPreferenceProfile.liked_tips > 2 && (
            <GenerationModeSelector />
          )}
              
              <View style={{
                backgroundColor: 'rgba(74, 144, 226, 0.05)',
                borderRadius: 14,
                paddingHorizontal: 12,
                paddingVertical: 8,
                flexDirection: 'row', alignItems: 'center'
              }}>
                <MaterialIcons name="search" size={20} color="#666" style={styles.assistantSearchIcon} />

                <TextInput
                  style={{
                    flex: 1,
                    height: 40,
                    fontSize: 16,
                    color: '#000',
                    padding: 0,
                  }}
                  value={searchText}
                  onChangeText={setSearchText}
                  placeholder={isListening ? 'Listening...' : 'Ask a parenting question...'}
                  returnKeyType="search"
                  onSubmitEditing={() => getTips(searchText, undefined)}
                  editable={!isListening}
                  placeholderTextColor="#d3d3d3"
                />

                {searchText.length > 0 && !isListening && (
                  <TouchableOpacity
                    style={styles.assistantClearButton}
                    onPress={() => setSearchText('')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <MaterialIcons name="clear" size={20} color="#999" />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[isListening && styles.assistantMicButtonActive]}
                  onPress={toggleListening}>
                  <MaterialIcons
                    name={isListening ? 'mic-off' : 'mic'}
                    size={24}
                    color="#4A90E2"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.assistantSubmitButton}
                onPress={() => getTips(searchText, undefined)}
                disabled={isAssistantLoading || isListening}>
                {isAssistantLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <MaterialIcons name="psychology" size={20} color="white" />
                    <Text style={styles.assistantSubmitText}>Get Parenting Tips</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* AI Generation Button - show when user has preferences and search text */}
    {personalizationEnabled && userPreferenceProfile && userPreferenceProfile.liked_tips > 2 && searchText.trim() && (
      <AIGenerationButton />
    )}

    {/* Existing personalized recommendations button */}
    {userPreferenceProfile && userPreferenceProfile.liked_tips > 2 && (
      <PersonalizedRecommendationsButton />
    )}

            </View>
          )}

        </View>
      </TouchableWithoutFeedback>

      <LocationBottomSheet visible={sheetVisible} onClose={() => { setSheetVisible(false); setSheetIsOpen(false) }} />

      {showTipsModal && (
        <TipsModal
          showTipsModal={showTipsModal}
          setShowTipsModal={setShowTipsModal}
        />
      )}
      <ChildPromptModal />
      <AgeInputModal />
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  relevanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 4,
  },
  relevanceBadgeText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 3,
  },
  aiGeneratedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F0FF',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 4,
    borderWidth: 1,
    borderColor: '#6C63FF',
  },
  aiGeneratedBadgeText: {
    fontSize: 10,
    color: '#6C63FF',
    fontWeight: '700',
    marginLeft: 3,
  },

  // Mode Selector
  modeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  modeSelectorLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginRight: 8,
  },
  modeButtons: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    padding: 2,
    flex: 1,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#4A90E2',
  },
  modeButtonText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: 'white',
  },

  // AI Generation Button
  aiGenerateButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 7,
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiGenerateButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },

  // Enhanced scoring display
  scoringDetails: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#E9ECEF',
  },
  scoringText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },

  // Source indicator in modal
  sourceIndicator: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
    alignSelf: 'center',
  },
  sourceIndicatorText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '600',
    textAlign: 'center',
  },
  perfectMatchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 4,
  },
  perfectMatchBadgeText: {
    fontSize: 11,
    color: '#FF9800',
    fontWeight: '600',
    marginLeft: 3,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  backgroundLoadingBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 25,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: 'rgba(74, 144, 226, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  backgroundLoadingContent: {
    alignItems: 'center',
  },
  backgroundLoadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  assistantContainer: {
    backgroundColor: 'white',
    borderRadius: 14,
    position: 'absolute',
    padding: 16,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A90E2',
    textAlign: 'center',
    marginBottom: 8,
  },
  personalizedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  personalizedBadgeText: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '600',
    marginLeft: 4,
  },
  personalizedButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 7,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  personalizedButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  clearButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    height: "100%",
    width: "100%"
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  formContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  dropdown: {
    height: 50,
    borderColor: '#E8E8E8',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: '#666',
  },
  dropdownSelected: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  dropdownLeftIcon: {
    marginRight: 10,
  },
  dropDownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  dropDownItemText: {
    fontSize: 16,
    color: '#333',
  },
  input: {
    height: 50,
    borderColor: '#E8E8E8',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  addButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  assistantTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A90E2',
    textAlign: 'center',
    marginBottom: 4,
  },
  assistantSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  assistantSearchIcon: {
    marginRight: 8,
  },
  assistantClearButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  assistantMicButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  assistantMicButtonActive: {
    // backgroundColor: '#FF3B30',
  },
  assistantSubmitButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 7,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  assistantSubmitText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },

  // Tip actions
  tipActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  actionButtonActive: {
    backgroundColor: '#EDF4FF',
    borderColor: '#4A90E2',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  actionButtonTextActive: {
    color: '#4A90E2',
    fontWeight: '600',
  },

  // Empty states
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  button: {
    flex: 1,
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeModalButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tipItem: {
    marginBottom: 16,
  },
  tipGradient: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipIcon: {
    marginRight: 12,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  tipBody: {
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
    marginBottom: 12,
  },
  tipDetails: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  playButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  loadingButton: {
    backgroundColor: '#999',
  },
  playButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalIcon: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: 'white',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  secondaryButtonText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  ageInput: {
    borderWidth: 2,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
  },
});

export default App;