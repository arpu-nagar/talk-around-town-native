import React, {
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
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
  ScrollView,
  Modal,
  ActivityIndicator,
  Keyboard,
  Animated,
  Easing,
  Pressable,
} from 'react-native';
import MapView, {
  PROVIDER_GOOGLE,
  Marker,
  Circle,
  PROVIDER_DEFAULT,
} from 'react-native-maps';
import {Dropdown} from 'react-native-element-dropdown';
import {useFocusEffect} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Geolocation, {
  GeolocationResponse,
  GeolocationError,
} from '@react-native-community/geolocation';
import {
  GooglePlacesAutocomplete,
  GooglePlacesAutocompleteRef,
} from 'react-native-google-places-autocomplete';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Spinner from 'react-native-loading-spinner-overlay';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import NetInfo from '@react-native-community/netinfo';
import Voice from '@react-native-voice/voice';
import Sound from 'react-native-sound';
import {AuthContext} from '../context/AuthContext';
import Notification from '../components/Notification';

import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {fetchWithAuth} from '../api/auth';
import PersonalizationSurvey from '../components/PersonalizationSurvey';

const STARTUP_CONFIG = {
  MAX_STARTUP_TIME: 8000,
  CRITICAL_OPERATIONS_TIMEOUT: 5000,
  BACKGROUND_TIMEOUT: 30000,
  QUICK_LOCATION_TIMEOUT: 3000,
};

const LOCATION_CONFIG = {
  TIMEOUTS: {QUICK: 3000, NORMAL: 15000, BACKGROUND: 30000},
  DELTAS: {LATITUDE: 0.015, LONGITUDE: 0.0121},
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

const MapViewModal = React.memo(function MapViewModal({
  visible,
  onClose,
  locations,
  details,
  initialRegion,
  token,
  onRefresh,
}: {
  visible: boolean;
  onClose: () => void;
  locations: Location[];
  details: Array<{title: string; description: string; pinColor: string}>;
  initialRegion: Location | null;
  token: string;
  onRefresh: () => Promise<void>;
}) {
  const placesRef = useRef<GooglePlacesAutocompleteRef>(null);

  // Local-only state (isolated from parent re-renders)
  const [newLocation, setNewLocation] = useState<Location | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const reset = useCallback(() => {
    setNewLocation(null);
    setName('');
    setDescription('');
    setSelectedOption(null);
    placesRef.current?.clear?.();
  }, []);

  const addLocation = useCallback(async () => {
    if (
      !newLocation ||
      !name.trim() ||
      !description.trim() ||
      !selectedOption
    ) {
      Alert.alert(
        'Missing Information',
        'Please enter a name, description and select a location type.',
      );
      return;
    }
    try {
      const res = await fetchWithAuth(
        `${API_ENDPOINTS.BASE_URL}${API_ENDPOINTS.ADD_LOCATION}`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            latitude: newLocation.latitude,
            longitude: newLocation.longitude,
            name: name.trim(),
            description: description.trim(),
            type: selectedOption,
          }),
        },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      await onRefresh();
      Alert.alert('Success', 'Location added successfully!');
      reset();
      onClose();
    } catch (e) {
      console.error('addLocation error:', e);
      Alert.alert('Error', 'Failed to add location. Please try again.');
    }
  }, [
    newLocation,
    name,
    description,
    selectedOption,
    token,
    onRefresh,
    reset,
    onClose,
  ]);

  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}>
      <LinearGradient
        colors={['#EFF6FF', '#FFFFFF', '#F5F3FF']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.mapModalContainer}>
        <View
          style={{
            flex: 1,
            paddingTop: insets.top - 10,
          }}>
          {/* Header */}
          <View style={styles.mapHeader}>
            <TouchableOpacity
              onPress={() => {
                reset();
                onClose();
              }}>
              <MaterialIcons name="arrow-back" size={20} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.mapHeaderTitle}>Find Nearby Locations</Text>
            <View style={{width: 24}} />
          </View>

          {/* Search */}
          <View style={styles.searchBarWrapper}>
            <GooglePlacesAutocomplete
              placeholder="Search by name or address"
              fetchDetails
              minLength={2}
              debounce={200}
              keyboardShouldPersistTaps="handled"
              enablePoweredByContainer={false}
              onFail={e => console.log('Places error:', e)}
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
              query={{
                key: 'AIzaSyBczo2yBRbSwa4IVQagZKNfTje0JJ_HEps',
                language: 'en',
              }}
              ref={placesRef}
              textInputProps={{
                placeholderTextColor: '#1F2937', // placeholder color
              }}
              styles={{
                container: {flex: 0, zIndex: 10000, elevation: 10000},

                // Your input
                textInput: {
                  ...styles.searchInput,
                  // color: 'red',
                },

                // 🔴 Make suggestion text visible
                description: {
                  // pick one:
                  color: '#1F2937', // matches your theme
                  fontSize: 16,
                },

                // (optional) make the secondary text (e.g., city) visible too
                // 'secondaryText' isn't an exposed style; description covers the whole line.

                listView: {
                  position: 'absolute',
                  top: 52,
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  borderRadius: 12,
                  overflow: 'hidden',
                  zIndex: 10002,
                  elevation: 10002,
                  shadowColor: '#000',
                  shadowOffset: {width: 0, height: 2},
                  shadowOpacity: 0.15,
                  shadowRadius: 6,
                },
                row: {
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  backgroundColor: 'white',
                },
                separator: {height: 1.5, backgroundColor: '#F3F4F6'},
              }}
            />
          </View>

          {/* Map */}
          {initialRegion && (
            <MapView
              provider={
                Platform.OS === 'ios' ? PROVIDER_DEFAULT : PROVIDER_GOOGLE
              }
              style={styles.fullMap}
              initialRegion={initialRegion}
              region={newLocation || initialRegion}
              showsUserLocation
              mapType="standard"
              onPress={e => {
                const {latitude, longitude} = e.nativeEvent.coordinate;
                setNewLocation({
                  latitude,
                  longitude,
                  latitudeDelta: LOCATION_CONFIG.DELTAS.LATITUDE,
                  longitudeDelta: LOCATION_CONFIG.DELTAS.LONGITUDE,
                });
              }}>
              {newLocation && (
                <Marker
                  coordinate={newLocation}
                  title="New Location"
                  pinColor="#4A90E2"
                />
              )}
              {locations.map((loc, i) => (
                <React.Fragment key={`loc-${i}`}>
                  <Marker
                    coordinate={loc}
                    title={details[i]?.title || `Location ${i + 1}`}
                    description={details[i]?.description || ''}
                    pinColor="#FF4B4B"
                  />
                  <Circle
                    center={loc}
                    radius={100}
                    strokeColor="rgba(255,75,75,0.5)"
                    fillColor="rgba(255,75,75,0.1)"
                  />
                </React.Fragment>
              ))}
            </MapView>
          )}

          {/* Bottom add form */}
          {newLocation && (
            <View style={styles.addLocationForm}>
              <Text style={styles.formTitle}>Add New Location</Text>

              <Dropdown
                style={styles.dropdown}
                placeholderStyle={styles.dropdownPlaceholder}
                selectedTextStyle={styles.dropdownSelected}
                data={[
                  {label: 'Grocery Store', value: 'Grocery Store'},
                  {label: 'Bus/Walk', value: 'Bus/Walk'},
                  {label: 'Library', value: 'Library'},
                  {label: 'Park', value: 'Park'},
                  {label: 'Restaurant', value: 'Restaurant'},
                  {label: 'Waiting Room', value: 'Waiting Room'},
                  {label: "Other's Home", value: "Other's Home"},
                ]}
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder="Select location type"
                value={selectedOption}
                onChange={item => setSelectedOption(item.value)}
              />

              <TextInput
                placeholder="Location name"
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholderTextColor="#999"
              />
              <TextInput
                placeholder="Description"
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity style={styles.addButton} onPress={addLocation}>
                <Text style={styles.addButtonText}>Add Location</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </LinearGradient>
    </Modal>
  );
});

interface SurveyData {
  contentPreferences: string[];
  challengeAreas: string[];
  parentingGoals: string[]; // kept for forward-compat; not used in UI steps right now
  engagementFrequency: string;
  currentChallenge?: string;
  additionalNotes?: string;
}

// ---- helpers
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const REMIND_EVERY_DAYS = 2;

const surveyKeys = (userKey: string) => ({
  completed: `survey_completed:${userKey}`,
  lastPrompt: `survey_last_prompt:${userKey}`,
});

const isDue = (lastPromptTs?: number | null, days = REMIND_EVERY_DAYS) => {
  if (!lastPromptTs) return true; // never prompted → show
  return Date.now() - Number(lastPromptTs) >= days * MS_PER_DAY;
};

const MainScreen: React.FC<Props> = ({navigation}) => {
  const insets = useSafeAreaInsets();

  // Context & refs
  const {userInfo, isLoading} = useContext<any>(AuthContext);
  const placesRef = useRef<GooglePlacesAutocompleteRef>(null);
  const audioCache = useRef<Map<string, string>>(new Map());
  const lastResult = useRef<string>('');
  const currentSound = useRef<Sound | null>(null);

  // UI
  const [mainLoading, setMainLoading] = useState(true);
  const [backgroundLoading, setBackgroundLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string>('Starting app...');
  const [showMapView, setShowMapView] = useState(false);
  const [showTipsModal, setShowTipsModal] = useState(false);

  // Data
  const [userChildren, setUserChildren] = useState<Child[]>([]);
  const [location, setLocation] = useState<Location | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [details, setDetails] = useState<
    Array<{title: string; description: string; pinColor: string}>
  >([]);
  const [newLocation, setNewLocation] = useState<Location | null>(null);

  // Add-location form
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // States
  const [locationStatus, setLocationStatus] = useState<
    'loading' | 'success' | 'error' | 'disabled'
  >('loading');
  const [apiStatus, setApiStatus] = useState<'loading' | 'success' | 'error'>(
    'loading',
  );

  // Companion
  const [isListening, setIsListening] = useState(false);
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [tips, setTips] = useState<Tip[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  // Preferences
  const [contentPreferences, setContentPreferences] = useState<string[]>([
    'language',
  ]);
  const [likedTips, setLikedTips] = useState<Tip[]>([]);
  const [dislikedTips, setDislikedTips] = useState<Tip[]>([]);
  const [activeAudioKey, setActiveAudioKey] = useState<string | null>(null);
  const nameInputRef = useRef<TextInput>(null);
  const descriptionInputRef = useRef<TextInput>(null);

  const [userPreferenceProfile, setUserPreferenceProfile] = useState<any>(null);
  // --- state ---
  const [agePromptVisible, setAgePromptVisible] = useState(false);
  const [ageYearsInput, setAgeYearsInput] = useState<string>('');
  const [ageMonthsInput, setAgeMonthsInput] = useState<string>('');
  const [pendingUnknownName, setPendingUnknownName] = useState<string | null>(
    null,
  );
  const [tempChildContext, setTempChildContext] = useState<
    Array<{name: string; agePretty: string; ageYears: number}>
  >([]);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const [showSurvey, setShowSurvey] = useState(false);
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const [bootChecked, setBootChecked] = useState(false); // ensure we decide once per mount
  const [headerHeight, setHeaderHeight] = useState(0);

  const userKey =
    userInfo?.user?.id?.toString?.() ||
    userInfo?.id?.toString?.() ||
    userInfo?.email ||
    'anon';

  const KEYS = surveyKeys(userKey);

  const loadStatus = useCallback(async () => {
    // 1) server completion check (optional but nice for cross-device)
    let completed = false;
    try {
      const res = await fetchWithAuth(
        `http://68.183.102.75:1337/api/personalization/survey/me`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userInfo?.access_token}`,
          },
        },
      );
      if (res.ok) {
        const json = await res.json();
        // shape depends on your API; adapt as needed:
        // expect json.data?.completed === true/false
        completed = !!json?.data?.completed;
      }
    } catch (_) {
      // ignore network errors; we’ll fall back to local flags
    }

    // 2) fallback to local flag if server didn’t say completed
    if (!completed) {
      const localCompleted = await AsyncStorage.getItem(KEYS.completed);
      completed = localCompleted === 'true';
    }

    setSurveyCompleted(completed);

    if (completed) {
      setShowSurvey(false);
      setBootChecked(true);
      return;
    }

    // 3) cadence check
    const lastPromptStr = await AsyncStorage.getItem(KEYS.lastPrompt);
    const lastPromptTs = lastPromptStr ? Number(lastPromptStr) : undefined;

    if (isDue(lastPromptTs, REMIND_EVERY_DAYS)) {
      setShowSurvey(true);
    } else {
      setShowSurvey(false);
    }
    setBootChecked(true);
  }, [userInfo?.access_token, KEYS.completed, KEYS.lastPrompt]);

  // First mount → decide whether to show
  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Optional: re-evaluate when screen regains focus (prevents accidental double prompts)
  useFocusEffect(
    useCallback(() => {
      if (!bootChecked) return;
      // re-check on focus only if not completed & we're not already showing it
      if (!surveyCompleted && !showSurvey) {
        loadStatus();
      }
    }, [bootChecked, surveyCompleted, showSurvey, loadStatus]),
  );

  // Handlers coming from the survey
  const handleSurveyComplete = async (_data: any) => {
    await AsyncStorage.setItem(KEYS.completed, 'true');
    setSurveyCompleted(true);
    setShowSurvey(false);
  };

  const handleSurveySkip = async () => {
    await AsyncStorage.setItem(KEYS.lastPrompt, String(Date.now()));
    setShowSurvey(false);
  };

  // --- Animation Setup ---
  // 1. Use a ref to hold the animated value. 0 = blurred, 1 = focused.
  const animation = useRef(new Animated.Value(0)).current;

  // 2. Functions to handle focus and blur events
  const handleFocus = () => {
    Animated.timing(animation, {
      toValue: 1,
      duration: 350, // Animation duration in ms
      easing: Easing.out(Easing.ease), // Smooth easing out
      useNativeDriver: true, // For better performance
    }).start();
  };

  const handleBlur = () => {
    Animated.timing(animation, {
      toValue: 0,
      duration: 350,
      easing: Easing.in(Easing.ease), // Smooth easing in
      useNativeDriver: true,
    }).start();
  };

  // 3. Interpolate the animated value to create dynamic styles
  const preferencesCardStyle = {
    opacity: animation.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
    }),
    transform: [
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 100], // Move up by 60 pixels
        }),
      },
    ],
  };

  const askCompanionCardStyle = {
    transform: [
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -290], // Move up more to fill the space
        }),
      },
    ],
  };
  // --- End of Animation Setup ---

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setIsKeyboardVisible(true);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
        // handleBlur();
      },
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  function buildAgeFromInputs(yy: string, mm: string) {
    const y = Math.max(0, parseInt(yy || '0', 10) || 0);
    const m = Math.max(0, Math.min(11, parseInt(mm || '0', 10) || 0));
    const pretty = y > 0 && m > 0 ? `${y}y ${m}m` : y > 0 ? `${y}y` : `${m}m`;
    const yearsFloat = y + m / 12;
    return {pretty, yearsFloat};
  }

  // Reload content preferences on focus
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        try {
          const saved = await AsyncStorage.getItem('contentPreferences');
          if (alive && saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) setContentPreferences(parsed);
          }
        } catch (e) {
          console.warn('reload contentPreferences failed:', e);
        }
      })();
      return () => {
        alive = false;
      };
    }, []),
  );

  // Cache helpers
  const loadFromCache = useCallback(async (key: string) => {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const data = JSON.parse(cached);
        console.log(`Loaded cached data for ${key}`);
        return data;
      }
    } catch (e) {
      console.warn(`cache load error [${key}]`, e);
    }
    return null;
  }, []);

  const saveToCache = useCallback(async (key: string, data: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
      console.log(`Cached data for ${key}`);
    } catch (e) {
      console.warn(`cache save error [${key}]`, e);
    }
  }, []);

  // Location quick fetch
  const getQuickLocation = useCallback(async (): Promise<Location> => {
    console.log('Getting quick location...');
    const cached = await loadFromCache(
      LOCATION_CONFIG.CACHE_KEYS.LAST_LOCATION,
    );
    if (cached?.latitude && cached?.longitude) {
      console.log('Using cached location');
      setLocationStatus('success');
      return cached;
    }

    return new Promise(resolve => {
      const timeout = setTimeout(() => {
        console.log('Quick location timeout, using default');
        setLocationStatus('error');
        resolve(DEFAULT_LOCATION);
      }, STARTUP_CONFIG.QUICK_LOCATION_TIMEOUT);

      Geolocation.getCurrentPosition(
        (pos: GeolocationResponse) => {
          clearTimeout(timeout);
          const loc = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            latitudeDelta: LOCATION_CONFIG.DELTAS.LATITUDE,
            longitudeDelta: LOCATION_CONFIG.DELTAS.LONGITUDE,
          };
          setLocationStatus('success');
          saveToCache(LOCATION_CONFIG.CACHE_KEYS.LAST_LOCATION, loc);
          resolve(loc);
        },
        (err: GeolocationError) => {
          clearTimeout(timeout);
          console.warn('Quick location error:', err.message);
          setLocationStatus('error');
          resolve(DEFAULT_LOCATION);
        },
        {
          enableHighAccuracy: false,
          timeout: STARTUP_CONFIG.QUICK_LOCATION_TIMEOUT - 500,
          maximumAge: 60000,
        },
      );
    });
  }, [loadFromCache, saveToCache]);

  // Background refresh
  const refreshDataInBackground = useCallback(async () => {
    if (!userInfo?.access_token) {
      console.log('No auth token; skip background calls');
      setApiStatus('error');
      return;
    }

    try {
      // Locations
      const locationsResponse = await fetchWithAuth(
        `${API_ENDPOINTS.BASE_URL}${API_ENDPOINTS.LOCATIONS}`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userInfo.access_token}`,
          },
        },
      );

      if (locationsResponse.ok) {
        const data = await locationsResponse.json();
        if (Array.isArray(data.locations) && Array.isArray(data.details)) {
          setLocations(data.locations);
          setDetails(data.details);
          await saveToCache(LOCATION_CONFIG.CACHE_KEYS.USER_LOCATIONS, {
            locations: data.locations,
            details: data.details,
          });
        }
      }

      // Children
      const childrenResponse = await fetchWithAuth(
        `${API_ENDPOINTS.BASE_URL}${API_ENDPOINTS.CHILDREN}`,
        {
          headers: {Authorization: `Bearer ${userInfo.access_token}`},
        },
      );

      if (childrenResponse.ok) {
        const data = await childrenResponse.json();
        if (data.children) {
          setUserChildren(data.children);
          await saveToCache(
            LOCATION_CONFIG.CACHE_KEYS.CHILDREN_INFO,
            data.children,
          );
        }
      }

      // Preference profile
      const profileResponse = await fetchWithAuth(
        `${API_ENDPOINTS.BASE_URL}/api/personalization/profile`,
        {
          headers: {Authorization: `Bearer ${userInfo.access_token}`},
        },
      );
      if (profileResponse.ok) {
        const data = await profileResponse.json();
        setUserPreferenceProfile(data.profile);
      }

      setApiStatus('success');
    } catch (e) {
      console.error('Background refresh failed:', e);
      setApiStatus('error');
    } finally {
      setBackgroundLoading(false);
    }
  }, [userInfo, saveToCache]);

  // Startup sequence
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Cached first
        const cachedLocs = await loadFromCache(
          LOCATION_CONFIG.CACHE_KEYS.USER_LOCATIONS,
        );
        if (cachedLocs) {
          setLocations(cachedLocs.locations || []);
          setDetails(cachedLocs.details || []);
        }
        const cachedKids = await loadFromCache(
          LOCATION_CONFIG.CACHE_KEYS.CHILDREN_INFO,
        );
        if (cachedKids) setUserChildren(cachedKids);
        const liked = await loadFromCache('likedTips');
        if (Array.isArray(liked)) setLikedTips(liked);
        const disliked = await loadFromCache('dislikedTips');
        if (Array.isArray(disliked)) setDislikedTips(disliked);
        const savedPrefs = await AsyncStorage.getItem('contentPreferences');
        if (savedPrefs) {
          const parsed = JSON.parse(savedPrefs);
          if (Array.isArray(parsed) && parsed.length)
            setContentPreferences(parsed);
        }

        // Quick location
        setStatusMessage('Getting your location...');
        const quickLoc = await getQuickLocation();
        if (mounted) setLocation(quickLoc);

        // Show UI
        setStatusMessage('Loading interface...');
        await new Promise(r => setTimeout(r, 100));
        if (mounted) setMainLoading(false);

        // Background refresh
        refreshDataInBackground();
      } catch (e) {
        console.error('startup error', e);
        if (mounted) {
          setLocation(DEFAULT_LOCATION);
          setMainLoading(false);
          setBackgroundLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
      Voice.destroy().then(Voice.removeAllListeners);
      if (currentSound.current) {
        currentSound.current.stop();
        currentSound.current.release();
        currentSound.current = null;
      }
    };
  }, [getQuickLocation, loadFromCache, refreshDataInBackground]);

  // Voice
  useEffect(() => {
    const initVoice = async () => {
      try {
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            {
              title: 'Microphone Permission',
              message:
                'This app needs access to your microphone for voice recognition.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            },
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) return;
        }

        Voice.onSpeechResults = (e: any) => {
          if (e.value?.[0]) {
            const res = e.value[0];
            if (res !== lastResult.current) {
              lastResult.current = res;
              setSearchText(res);
            }
          }
        };
        Voice.onSpeechError = () => setIsListening(false);
        Voice.onSpeechEnd = () => {
          if (isListening) Voice.start('en-US');
        };
      } catch (e) {
        console.error('voice init error', e);
      }
    };
    initVoice();
  }, [isListening]);

  // Queue & network sync for reactions
  const flushAIReactionsQueue = useCallback(async () => {
    const queue = (await loadFromCache('aiReactionsQueue')) ?? [];
    if (!queue.length || !userInfo?.access_token) return;
    try {
      const res = await fetchWithAuth(
        `${API_ENDPOINTS.BASE_URL}/api/personalization/ai-interactions/batch`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userInfo.access_token}`,
          },
          body: JSON.stringify({interactions: queue}),
        },
      );
      if (res.ok) await saveToCache('aiReactionsQueue', []);
    } catch (e) {
      console.warn('AI reaction sync error:', e);
    }
  }, [userInfo, loadFromCache, saveToCache]);

  useEffect(() => {
    const unsub = NetInfo.addEventListener(s => {
      if (s.isConnected) flushAIReactionsQueue();
    });
    flushAIReactionsQueue();
    return () => unsub();
  }, [flushAIReactionsQueue]);

  // Helpers
  const calculateAge = (dob: string) => {
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const toggleListening = async () => {
    try {
      if (isListening) {
        await Voice.stop();
        setIsListening(false);
        lastResult.current = '';
      } else {
        const ok = await Voice.isAvailable();
        if (!ok)
          return Alert.alert(
            'Error',
            'Voice recognition is not available on this device.',
          );
        setSearchText('');
        lastResult.current = '';
        await Voice.start('en-US');
        setIsListening(true);
      }
    } catch (e) {
      console.error('toggle mic error', e);
      setIsListening(false);
    }
  };

  const tinyHash = (s: string) =>
    [...s].reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0).toString();
  const tipKey = (t: Tip) =>
    typeof t.id === 'number' && !t.isGenerated
      ? `db:${t.id}`
      : `ai:${tinyHash(`${t.title || ''}|${t.body || ''}|${t.details || ''}`)}`;

  // --- Non-parenting domains to block clearly off-scope queries ---
  const NON_PARENTING_PATTERNS: RegExp[] = [
    // finance / business
    /\b(crypto|bitcoin|stock(s)?|options|forex|etf|dividends?|retirement|401k|tax(es)?|deductions?|withholding|real estate investing)\b/i,
    // jobs / careers
    /\b(resume|cv|cover letter|job interview|salary negotiation|promotion|manager|okr|kpi|performance review)\b/i,
    // software / it
    /\b(code|coding|program(ming)?|javascript|typescript|react native|react|python|sql|bug fix|devops|docker|kubernetes|api)\b/i,
    // politics / news / gossip
    /\b(election|president|senate|congress|politics|celebrity|gossip)\b/i,
    // gambling
    /\b(casino|blackjack|roulette|poker|sports betting|parlay|odds)\b/i,
    // adult relationships
    /\b(dating|tinder|bumble|grindr|relationship advice for partner|sex life)\b/i,
  ];

  const HELP_WORDS =
    /\b(tips?|how to|how-to|ideas?|tricks?|help|advice|guide|activities?)\b/i;

  const hasAny = (q: string, regs: RegExp[]) => regs.some(re => re.test(q));
  const wordCount = (q: string) => (q.trim().match(/\S+/g) || []).length;
  // ------- Parenting Guardrails -------
  const DIY_TERMS = [
    'diy',
    'craft',
    'crafts',
    'arts and crafts',
    'art project',
    'project',
    'science experiment',
    'experiments',
    'stem activity',
    'stem activities',
    'maker',
    'lego',
    'sensory',
    'sensory play',
    'sensory bin',
    'playdough',
    'play-dough',
    'slime',
    'origami',
    'paper craft',
    'rainy day',
  ];

  const NEUTRAL_PARENTING_ENV = [
    'grocery',
    'supermarket',
    'shopping',
    'store',
    'errands',
    'restaurant',
    'waiting room',
    'library',
    'park',
    'bath',
    'bath time',
    'shower',
    'hygiene',
    'tooth brushing',
    'toothbrush',
    'car seat',
    'car ride',
    'road trip',
    'flight',
    'plane',
    'airport',
    'bus',
    'train',
    'travel',
    // add DIY contexts as neutral environments too
    ...DIY_TERMS,
  ];
  // Words that strongly indicate the user is asking about a child/parenting topic
  const CHILD_TERMS = [
    'child',
    'kid',
    'toddler',
    'baby',
    'infant',
    'newborn',
    'teen',
    'teenager',
    'preteen',
    'son',
    'daughter',
    'my boy',
    'my girl',
    'my kid',
    'my child',
    'my toddler',
    'my baby',
    'students',
    'kids',
    'children',
    'parent',
    'parenting',
    'daycare',
    'preschool',
    'school',
  ];

  // Common parenting topics you want to allow through
  const PARENTING_TOPICS = [
    'bedtime',
    'sleep',
    'tantrum',
    'behavior',
    'discipline',
    'potty',
    'toilet',
    'diaper',
    'screen time',
    'homework',
    'reading',
    'milestone',
    'play',
    'activity',
    'activities',
    'language',
    'speech',
    'feeding',
    'picky eater',
    'vegetables',
    'routine',
    'chores',
    'bullying',
    'friends',
    'social',
    'sharing',
    'attention',
    'focus',
    'study',
    'grades',
    'sleep',
    'tantrum',
    'meltdown',
    'behavior',
    'discipline',
    'routine',
    'screen time',
    'homework',
    'reading',
    'literacy',
    'milestone',
    'play',
    'activity',
    'activities',
    'language',
    'speech',
    'feeding',
    'picky eater',
    'vegetables',
    'toilet',
    'potty',
    'diaper',
    'social',
    'sharing',
    'bullying',
    'focus',
    'study',
    'grades',
    'friends',
    // hygiene & self-care
    'bath',
    'bath time',
    'shower',
    'hygiene',
    'tooth brushing',
    'toothbrush',
    'toileting',
    // out-and-about / errands
    'grocery',
    'supermarket',
    'shopping',
    'store',
    'errands',
    'restaurant',
    'waiting room',
    'library',
    'park',
    // travel & logistics
    'car seat',
    'car ride',
    'road trip',
    'flight',
    'plane',
    'airport',
    'bus',
    'train',
    'travel',
    // transitions / routines
    'morning routine',
    'evening routine',
    'after school',
    'bedtime routine',
    'nap',
    'naptime',
    // DIY / crafts / experiments
    ...DIY_TERMS,
  ];

  // Phrases that carry obvious safety/legal/medical/adult risk → always refuse
  const DANGEROUS_PATTERNS: RegExp[] = [
    // violence/illegal
    /\b(kill|murder|harm|poison|steal|buy\s*gun|make\s*bomb|break in|hack)\b/i,
    // self-harm
    /\b(suicide|self[-\s]?harm|cutting|kill myself)\b/i,
    // adult/sexual
    /\b(porn|nsfw|sex positions?|onlyfans|erotic|fetish|nude|sext)\b/i,
    // drugs
    /\b(cocaine|heroin|meth|lsd|ecstasy|marijuana|weed|vape|how to get high)\b/i,
    // medical & legal (you can tune this)
    /\b(diagnos(e|is)|prescribe|dosage|treat|medicine|antibiotic|legal advice|contract|tax advice)\b/i,
  ];

  // --- High-risk substances & paraphernalia (compact but robust) ---
  const DRUG_TERMS = new RegExp(
    '\\b(' +
      'cocaine|coke|crack|' +
      'heroin|fentanyl|opioid|opioids?|' +
      'oxycodone|oxycontin|xanax|alprazolam|benzodiazepines?|benzos?|' +
      'meth(?:amphetamine)?|speed|ice|adderall|' +
      'mdma|ecstasy|molly|' +
      'lsd|acid|ketamine|psilocybin|shrooms?|mushrooms?|' +
      'marijuana|cannabis|weed|hash|dab|dabs|edibles?|' +
      'vape|nicotine|juul|' +
      'lean|sizzurp|promethazine|codeine' +
      ')\\b',
    'i',
  );

  const DRUG_ACTIONS = new RegExp(
    '\\b(' +
      'buy|purchase|sell|make|cook|grow|synth(?:es|is|ize)|extract|' +
      'where\\s+to\\s+buy|how\\s+to\\s+get|how\\s+do\\s+i\\s+get|how\\s+can\\s+i\\s+get' +
      ')\\b',
    'i',
  );

  // Very short queries like just "cocaine" → treat as misuse intent by default
  const isDrugMisuseIntent = (q: string) => {
    const n = q.trim().toLowerCase();
    const wc = (n.match(/\S+/g) || []).length;
    return DRUG_TERMS.test(n) && (DRUG_ACTIONS.test(n) || wc <= 2);
  };

  // Age patterns like "3yo", "3 yo", "3-year-old", "18 months old"
  const AGE_PATTERNS: RegExp[] = [
    /\b\d{1,2}\s?(yo|yrs?|years?)\b/i,
    /\b\d{1,2}\s?(-|\s)?year[-\s]?old\b/i,
    /\b\d{1,2}\s?(months?|mos?)\s?old\b/i,
  ];

  const normalize = (s: string) => s.toLowerCase().trim();

  const hasDangerousIntent = (q: string) => {
    return DANGEROUS_PATTERNS.some(re => re.test(q));
  };

  // Replace your mentionsChildContext with this:
  const mentionsChildContext = (q: string, hasSavedKids = false) => {
    const n = normalize(q);

    // 1) Safety (you still call hasDangerousIntent separately, but harmless to double-check)
    if (hasAny(n, DANGEROUS_PATTERNS)) return false;

    // 2) Explicit signals → allow
    const childTermHit = CHILD_TERMS.some(w => n.includes(w));
    const topicHit = PARENTING_TOPICS.some(w => n.includes(w)); // keep your expanded list
    const ageHit = AGE_PATTERNS.some(re => re.test(n));
    if (childTermHit || topicHit || ageHit) return true;

    // 3) Clear non-parenting domains → block
    if (hasAny(n, NON_PARENTING_PATTERNS)) return false;

    // 4) Ambiguous/general queries:
    // If the user has saved kids and is asking for tips/how-to/ideas or the query is very short,
    // default to treating it as parenting (we'll inject "for kids" downstream).
    const genericAsk = HELP_WORDS.test(n);
    const shortAsk = wordCount(n) <= 3; // e.g., "fishing tips", "diy ideas", "travel hacks"
    if (hasSavedKids && (genericAsk || shortAsk)) return true;

    // Otherwise, treat as non-parenting.
    return false;
  };

  const showParentingOnlyAlert = () => {
    Alert.alert(
      'Parenting Assistant Only',
      'We only provide parenting tips.\n\nTry asking about:\n• Bedtime routines\n• Handling tantrums\n• Potty training\n• Age-appropriate activities\n• Picky eating\n• Developmental milestones',
      [{text: 'OK'}],
    );
  };

  // ---- Child name → age context helpers ----

  // simple levenshtein for fuzzy name match (handles typos/nicknames)
  function levenshtein(a: string, b: string) {
    a = normalize(a);
    b = normalize(b);
    const m = Array.from({length: a.length + 1}, (_, i) => [
      i,
      ...Array(b.length).fill(0),
    ]);
    for (let j = 1; j <= b.length; j++) m[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        m[i][j] = Math.min(
          m[i - 1][j] + 1,
          m[i][j - 1] + 1,
          m[i - 1][j - 1] + cost,
        );
      }
    }
    return m[a.length][b.length];
  }

  const similar = (a: string, b: string, maxDist = 1) =>
    levenshtein(a, b) <= maxDist;

  // Age in years & months for nicer prompts
  const ageYMMM = (dob: string) => {
    const birth = new Date(dob);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    let days = now.getDate() - birth.getDate();
    if (days < 0) {
      months -= 1;
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    // e.g., "3y 2m", "11m", "4y"
    if (years <= 0 && months > 0) return `${months}m`;
    if (years >= 0 && months > 0) return `${years}y ${months}m`;
    return `${years}y`;
  };

  // Extract child mentions by exact or fuzzy name match
  function resolveChildrenFromQuery(query: string, children: Child[]) {
    const q = normalize(query);
    const words = new Set(q.split(/[^a-zA-Z0-9]+/).filter(Boolean)); // tokens
    const hits: Array<{child: Child; how: 'exact' | 'fuzzy'}> = [];

    for (const c of children) {
      const name = normalize(c.nickname || '');
      if (!name) continue;
      // exact word hit (handles "Aarav", "Aarav's")
      const exact =
        words.has(name) || q.includes(`${name}'s`) || q.includes(`my ${name}`);
      if (exact) {
        hits.push({child: c, how: 'exact'});
        continue;
      }

      // fuzzy within small distance for short names
      const tokens = Array.from(words);
      if (tokens.some(w => similar(w, name, name.length <= 5 ? 1 : 2))) {
        hits.push({child: c, how: 'fuzzy'});
      }
    }

    // Deduplicate (prefer exact over fuzzy)
    const uniq: Record<string, {child: Child; how: 'exact' | 'fuzzy'}> = {};
    for (const h of hits) {
      const key = normalize(h.child.nickname || '');
      if (!uniq[key] || (uniq[key].how === 'fuzzy' && h.how === 'exact'))
        uniq[key] = h;
    }
    return Object.values(uniq).map(x => x.child);
  }
  // If you store aliases later: Child & { aliases?: string[] }
  function tokenize(str: string) {
    return (str || '').toLowerCase().match(/[a-z0-9']+/g) || [];
  }

  function extractCandidateNames(query: string) {
    // crude: words that start uppercase in original text OR possessives (X's), plus tokens after "my"
    // since we're lowercasing elsewhere, just return all tokens & handle in fuzzy logic
    return Array.from(new Set(tokenize(query)));
  }

  function resolveChildrenAndUnknownNames(query: string, children: Child[]) {
    const tokens = extractCandidateNames(query);
    const known: Child[] = [];
    const unknown: string[] = [];

    // exact/fuzzy compare each token to each saved child nickname
    for (const t of tokens) {
      let matched: Child | null = null;
      for (const c of children) {
        const name = (c.nickname || '').toLowerCase();
        if (!name) continue;
        if (t === name) {
          matched = c;
          break;
        }
        // tiny fuzzy room
        const dist = levenshtein(t, name);
        if (dist <= (name.length <= 5 ? 1 : 2)) {
          matched = c;
          break;
        }
      }
      if (matched) {
        if (
          !known.find(
            k =>
              (k.nickname || '').toLowerCase() ===
              (matched!.nickname || '').toLowerCase(),
          )
        ) {
          known.push(matched);
        }
      } else {
        // Keep token if it looks like a name-ish token (3–20 chars, letters only)
        if (/^[a-z]{3,20}$/.test(t)) unknown.push(t);
      }
    }

    // De-dupe unknowns, and remove anything that equals "my", "kid", etc.
    const STOP = new Set([
      'my',
      'kid',
      'child',
      'daughter',
      'son',
      'the',
      'a',
      'an',
      'baby',
      'toddler',
      'teen',
      'years',
      'year',
      'old',
    ]);
    const uniqUnknown = Array.from(new Set(unknown.filter(n => !STOP.has(n))));

    return {known, unknown: uniqUnknown};
  }

  const getPersonalizedTips = async () => {
    const query = searchText?.trim();
    if (!query)
      return Alert.alert(
        'Input Required',
        'Please enter what you need help with',
      );

    if (isDrugMisuseIntent(query)) {
      Alert.alert(
        "I can't help with that",
        "We don't provide guidance on drugs. If you're worried about a child, I can share general tips on talking with kids about substance use.",
        [
          {
            text: 'Talk to my child about drugs',
            onPress: () =>
              setSearchText('How do I talk to my child about drugs?'),
          },
          {text: 'Cancel', style: 'cancel'},
        ],
      );
      return;
    }

    if (hasDangerousIntent(query)) {
      Alert.alert('Sorry', 'We only provide parenting tips.');
      return;
    }

    if (!mentionsChildContext(query, userChildren.length > 0)) {
      showParentingOnlyAlert();
      return;
    }

    setIsAssistantLoading(true);
    setTips([]);

    try {
      // Your existing child detection code
      const mentioned = resolveChildrenFromQuery(query, userChildren);
      const childLines = (mentioned.length ? mentioned : userChildren).map(
        c => {
          const nm = c.nickname || 'Child';
          return `${nm}: ${ageYMMM(c.date_of_birth)} old`;
        },
      );

      const childContext = childLines.join(', ');
      const childrenContext = (mentioned.length ? mentioned : userChildren).map(
        c => ({
          name: c.nickname,
          dob: c.date_of_birth,
          agePretty: ageYMMM(c.date_of_birth),
          ageYears: calculateAge(c.date_of_birth),
        }),
      );

      const explicitlyChildish =
        CHILD_TERMS.some(w => normalize(query).includes(w)) ||
        AGE_PATTERNS.some(re => re.test(query));

      const ambiguityHint = explicitlyChildish
        ? ''
        : ' Please tailor this for kids.';
      const prompt =
        mentioned.length > 0
          ? `${query}${ambiguityHint} (Focus on: ${childContext}).`
          : `${query}${ambiguityHint}. Child context: ${childContext}.`;

      const endpoint = '/api/personalization/enhanced-tips';

      const enhancedContext = {
        prompt,
        contentPreferences,
        generateMode: 'hybrid',
        strictParenting: true,
        childrenContext,
      };

      const res = await fetchWithAuth(`${API_ENDPOINTS.BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.access_token}`,
        },
        body: JSON.stringify(enhancedContext),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'safety' || data.error === 'non_parenting') {
          Alert.alert(
            'We only provide parenting tips',
            data.message || 'Please ask a parenting-related question.',
          );
          return;
        }
        throw new Error(
          `Server responded with ${res.status}: ${
            data.message || 'Unknown error'
          }`,
        );
      }

      if (Array.isArray(data.tips) && data.tips.length) {
        setTips(data.tips);
        setShowTipsModal(true);

        // Log personalization success
        if (data.hasSurveyPersonalization) {
          console.log('🎯 Tips personalized using survey data!');
        }
      } else {
        Alert.alert(
          'No Tips Found',
          'Try asking about bedtime routines, tantrums, potty training, language activities, or milestones.',
        );
      }
    } catch (e) {
      console.error('tips error', e);
      Alert.alert(
        'Error',
        'Failed to get advice. Please check your connection and try again.',
      );
    } finally {
      setIsAssistantLoading(false);
    }
  };

  const showParentingExamples = (suggestions: string[]) => {
    const examples = [
      'Bedtime routine for 3 year old',
      "My toddler won't eat vegetables",
      'Language development activities',
      'How to handle tantrums',
      'Potty training tips',
      'Reading activities for kids',
      ...suggestions,
    ];

    Alert.alert(
      'Try asking about parenting topics like:',
      examples
        .slice(0, 6)
        .map(ex => `• ${ex}`)
        .join('\n'),
      [
        {text: 'OK', style: 'default'},
        {
          text: 'Use Example',
          style: 'default',
          onPress: () => setSearchText(examples[0]),
        },
      ],
    );
  };

  const speakTip = useCallback(
    async (tip: Tip) => {
      const key = tipKey(tip);

      // If this tip is already playing, toggle to stop
      if (activeAudioKey === key && isPlaying) {
        if (currentSound.current) {
          currentSound.current.stop();
          currentSound.current.release();
          currentSound.current = null;
        }
        setIsPlaying(false);
        setActiveAudioKey(null);
        return;
      }

      // Stop anything else that might be playing
      if (currentSound.current) {
        currentSound.current.stop();
        currentSound.current.release();
        currentSound.current = null;
      }
      setIsPlaying(false);
      setActiveAudioKey(key);

      try {
        let audioUrl = audioCache.current.get(key);

        if (!audioUrl) {
          if (tip.audioUrl) {
            audioUrl = `${API_ENDPOINTS.ASSISTANT_BASE_URL}/audio${tip.audioUrl}`;
            audioCache.current.set(key, audioUrl);
          } else {
            const res = await fetch(
              `${API_ENDPOINTS.ASSISTANT_BASE_URL}/generate-tip-audio`,
              {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                  tipId: typeof tip.id === 'number' ? tip.id : null,
                  key,
                  title: tip.title,
                  body: tip.body,
                  details: tip.details,
                }),
              },
            );
            if (!res.ok) throw new Error('Failed to generate audio');
            const {audioUrl: newUrl} = await res.json();
            audioUrl = `${API_ENDPOINTS.ASSISTANT_BASE_URL}/audio${newUrl}`;
            tip.audioUrl = newUrl;
            audioCache.current.set(key, audioUrl);
          }
        }

        if (!audioUrl) return;

        currentSound.current = new Sound(audioUrl, '', err => {
          if (err) {
            console.error('load sound error', err);
            Alert.alert('Error', 'Failed to play audio. Please try again.');
            setIsPlaying(false);
            setActiveAudioKey(null);
            return;
          }
          setIsPlaying(true);
          currentSound.current?.play(success => {
            if (!success)
              Alert.alert('Error', 'Audio playback failed. Please try again.');
            setIsPlaying(false);
            setActiveAudioKey(null);
            currentSound.current?.release();
            currentSound.current = null;
          });
        });
      } catch (e) {
        console.error('playback error', e);
        setIsPlaying(false);
        setActiveAudioKey(null);
      }
    },
    [activeAudioKey, isPlaying],
  );

  const cleanupSound = () => {
    if (currentSound.current) {
      currentSound.current.stop();
      currentSound.current.release();
      currentSound.current = null;
    }
    setIsPlaying(false);
    setActiveAudioKey(null);
  };

  // Like/Dislike
  const isTipLiked = (tip: Tip) =>
    likedTips.some(x => tipKey(x) === tipKey(tip));
  const isTipDisliked = (tip: Tip) =>
    dislikedTips.some(x => tipKey(x) === tipKey(tip));
  const setLikedCache = async (arr: Tip[]) => saveToCache('likedTips', arr);
  const setDislikedCache = async (arr: Tip[]) =>
    saveToCache('dislikedTips', arr);

  const postInteraction = async (
    tipId: number,
    interactionType: 'like' | 'dislike',
  ) => {
    const res = await fetchWithAuth(
      `${API_ENDPOINTS.BASE_URL}/api/personalization/interactions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.access_token}`,
        },
        body: JSON.stringify({tipId, interactionType}),
      },
    );
    if (!res.ok) {
      const msg = await res.text().catch(() => '');
      throw new Error(msg || `Failed to post ${interactionType}`);
    }
  };

  const queueAIInteraction = async (tip: Tip, reaction: 'like' | 'dislike') => {
    const key = tipKey(tip);
    const queued = (await loadFromCache('aiReactionsQueue')) ?? [];
    const entry = {
      key,
      reaction,
      title: tip.title,
      body: tip.body,
      details: tip.details,
      at: Date.now(),
    };
    await saveToCache('aiReactionsQueue', [entry, ...queued]);
  };

  const setReaction = async (tip: Tip, reaction: 'like' | 'dislike') => {
    const prevLiked = likedTips;
    const prevDisliked = dislikedTips;
    const sameKey = (a: Tip, b: Tip) => tipKey(a) === tipKey(b);

    try {
      if (reaction === 'like') {
        const nextLikes = isTipLiked(tip) ? likedTips : [tip, ...likedTips];
        const nextDislikes = dislikedTips.filter(t => !sameKey(t, tip));
        setLikedTips(nextLikes);
        setDislikedTips(nextDislikes);
        await Promise.all([
          setLikedCache(nextLikes),
          setDislikedCache(nextDislikes),
        ]);
      } else {
        const nextDislikes = isTipDisliked(tip)
          ? dislikedTips
          : [tip, ...dislikedTips];
        const nextLikes = likedTips.filter(t => !sameKey(t, tip));
        setDislikedTips(nextDislikes);
        setLikedTips(nextLikes);
        await Promise.all([
          setDislikedCache(nextDislikes),
          setLikedCache(nextLikes),
        ]);
      }

      if (typeof tip.id === 'number' && !tip.isGenerated)
        await postInteraction(tip.id, reaction);
      else await queueAIInteraction(tip, reaction);
    } catch (e) {
      console.error(e);
      setLikedTips(prevLiked);
      setDislikedTips(prevDisliked);
      Alert.alert(
        'Error',
        'Could not update your preference. Please try again.',
      );
    }
  };

  // Render tip item
  const renderTipItem = (tip: Tip) => {
    const k = tipKey(tip);
    const playing = activeAudioKey === k && isPlaying;
    return (
      <View key={`tip-${k}`} style={styles.tipItem}>
        <View style={styles.tipCardShadow}>
          <LinearGradient
            colors={['#ffffff', '#f8f9fa']}
            style={styles.tipGradient}>
            <View style={styles.tipHeader}>
              <MaterialIcons
                name="auto-awesome"
                size={24}
                color="#8B5CF6"
                style={{marginRight: 12}}
              />
              <Text style={styles.tipTitle}>{tip.title || ''}</Text>
            </View>

            <Text style={styles.tipBody}>{tip.body || ''}</Text>
            <Text style={styles.tipDetails}>{tip.details || ''}</Text>

            <View style={styles.tipActions}>
              <TouchableOpacity
                style={[styles.playButton, playing && styles.stopButton]}
                onPress={() => {
                  if (playing) cleanupSound();
                  else speakTip(tip);
                }}>
                <MaterialIcons
                  name={playing ? 'stop' : 'play-arrow'}
                  size={20}
                  color="#fff"
                />
                <Text style={styles.playButtonText}>
                  {playing ? 'Stop' : 'Play'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  marginLeft: 8,
                  padding: 6,
                  opacity: tip.isGenerated ? 0.4 : 1,
                }}
                onPress={() => setReaction(tip, 'like')}>
                <MaterialIcons
                  name={isTipLiked(tip) ? 'favorite' : 'favorite-border'}
                  size={22}
                  color={isTipLiked(tip) ? '#FF3B30' : '#999'}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  marginLeft: 4,
                  padding: 6,
                  opacity: tip.isGenerated ? 0.4 : 1,
                }}
                onPress={() => setReaction(tip, 'dislike')}>
                <MaterialIcons
                  name={
                    isTipDisliked(tip) ? 'thumb-down' : 'thumb-down-off-alt'
                  }
                  size={22}
                  color={isTipDisliked(tip) ? '#8B5CF6' : '#999'}
                />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    );
  };

  // Add Location
  const addLocation = async () => {
    if (
      !newLocation ||
      !name.trim() ||
      !description.trim() ||
      !selectedOption
    ) {
      return Alert.alert(
        'Missing Information',
        'Please enter a name, description and select a location type.',
      );
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
            type: selectedOption,
          }),
        },
      );
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      await refreshDataInBackground();
      Alert.alert('Success', 'Location added successfully!');
      setNewLocation(null);
      setName('');
      setDescription('');
      setSelectedOption(null);
      setShowMapView(false);
      placesRef.current?.clear?.();
    } catch (e) {
      console.error('addLocation error:', e);
      Alert.alert('Error', 'Failed to add location. Please try again.');
    }
  };

  <MapViewModal
    visible={showMapView}
    onClose={() => setShowMapView(false)}
    locations={locations}
    details={details}
    initialRegion={location}
    token={userInfo.access_token}
    onRefresh={refreshDataInBackground}
  />;

  // Tips Modal
  const TipsModal = () => (
    <Modal
      visible={showTipsModal}
      animationType="slide"
      presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Personalized Advice</Text>
          <TouchableOpacity
            style={styles.closeModalButton}
            onPress={() => setShowTipsModal(false)}>
            <MaterialIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalContent}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{paddingBottom: 28}}
          showsVerticalScrollIndicator={false}>
          {tips.map(t => renderTipItem(t))}
          <View style={{height: 20}} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  <Modal visible={agePromptVisible} transparent animationType="fade">
    <View
      style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      }}>
      <View
        style={{
          width: '100%',
          borderRadius: 16,
          backgroundColor: '#fff',
          padding: 16,
        }}>
        <Text style={{fontSize: 16, fontWeight: '600', marginBottom: 8}}>
          Add age for {pendingUnknownName ? `"${pendingUnknownName}"` : 'child'}
        </Text>
        <Text style={{color: '#6b7280', marginBottom: 12}}>
          We can personalize tips for this question using just an age (no need
          to save the child).
        </Text>

        <View style={{flexDirection: 'row', gap: 12}}>
          <View style={{flex: 1}}>
            <Text style={{fontSize: 13, color: '#6b7280'}}>Years</Text>
            <TextInput
              keyboardType="number-pad"
              value={ageYearsInput}
              onChangeText={setAgeYearsInput}
              style={{
                borderWidth: 1,
                borderColor: '#e5e7eb',
                borderRadius: 10,
                height: 44,
                paddingHorizontal: 12,
                marginTop: 6,
              }}
            />
          </View>
          <View style={{flex: 1}}>
            <Text style={{fontSize: 13, color: '#6b7280'}}>Months</Text>
            <TextInput
              keyboardType="number-pad"
              value={ageMonthsInput}
              onChangeText={setAgeMonthsInput}
              style={{
                borderWidth: 1,
                borderColor: '#e5e7eb',
                borderRadius: 10,
                height: 44,
                paddingHorizontal: 12,
                marginTop: 6,
              }}
            />
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            marginTop: 16,
          }}>
          <TouchableOpacity
            onPress={() => {
              setAgePromptVisible(false);
              setPendingUnknownName(null);
              setAgeYearsInput('');
              setAgeMonthsInput('');
            }}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 14,
              marginRight: 8,
            }}>
            <Text style={{color: '#6b7280'}}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              const {pretty, yearsFloat} = buildAgeFromInputs(
                ageYearsInput,
                ageMonthsInput,
              );
              if (
                yearsFloat <= 0 &&
                ageMonthsInput.trim() === '' &&
                ageYearsInput.trim() === ''
              ) {
                Alert.alert('Age required', 'Enter years and/or months.');
                return;
              }
              if (pendingUnknownName) {
                setTempChildContext(prev => [
                  {
                    name: pendingUnknownName,
                    agePretty: pretty,
                    ageYears: Math.max(
                      0,
                      parseInt(ageYearsInput || '0', 10) || 0,
                    ),
                  },
                  ...prev,
                ]);
              }
              setAgePromptVisible(false);
              setPendingUnknownName(null);
              setAgeYearsInput('');
              setAgeMonthsInput('');
              // Optionally trigger the request again if you paused it
            }}
            style={{
              backgroundColor: '#4A90E2',
              borderRadius: 10,
              paddingVertical: 10,
              paddingHorizontal: 14,
            }}>
            <Text style={{color: '#fff', fontWeight: '600'}}>Use This Age</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>;

  // Early returns
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Spinner visible />
        <Text style={styles.loadingText}>Initializing...</Text>
        <Notification />
      </View>
    );
  }

  if (!userInfo?.access_token) {
    return (
      <View style={styles.loadingContainer}>
        <Spinner visible />
        <Text style={styles.loadingText}>Please log in...</Text>
        <Notification />
      </View>
    );
  }

  if (mainLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Spinner visible />
        <Text style={styles.loadingText}>{statusMessage || 'Loading...'}</Text>
        <Notification />
      </View>
    );
  }

  if (!bootChecked) {
    return <View style={{flex: 1, backgroundColor: 'white'}} />; // or skeleton
  }

  // Main render (no ScrollView)
  return (
    <>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <Notification />

      <PersonalizationSurvey
        visible={showSurvey}
        onClose={() => setShowSurvey(false)} // close from back button/etc
        onComplete={handleSurveyComplete}
        onSkip={handleSurveySkip}
        isOptional
      />

      <View style={{flex: 1}}>
        {/* Blue header only behind ENACT */}
        <LinearGradient
          colors={['#3B82F6', '#8B5CF6']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          onLayout={e => setHeaderHeight(e.nativeEvent.layout.height)}
          style={[
            styles.headerBar,
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              paddingTop:
                Platform.OS === 'ios' ? insets.top + 5 : insets.top + 15,
              height: 230,
            },
          ]}>
          <View style={styles.topRow}>
            <View>
              <Text style={styles.appName}>ENACT</Text>
              <Text style={styles.tagline}>
                Your trusted Parenting Companion
              </Text>
            </View>

            <TouchableOpacity
              onPress={() =>
                navigation.navigate('LocationList', {locations, details})
              }
              style={styles.iconBtn}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <MaterialIcons name="bookmark" size={22} color="#5973FF" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchRow}>
            <TouchableOpacity
              style={styles.heroSearch}
              activeOpacity={0.9}
              onPress={() => setShowMapView(true)}>
              <MaterialIcons name="location-on" size={18} color="#9AA0A6" />
              <Text style={styles.heroSearchText}>
                Find nearby locations...
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={{flex: 1, marginTop: headerHeight}}>
          <Pressable onPress={Keyboard.dismiss}>
            {/* Content Preferences Card */}
            <Animated.View
              style={[{paddingHorizontal: 20}, preferencesCardStyle]}>
              <View
                style={[
                  styles.card,
                  {marginTop: Platform.OS === 'ios' ? -27.5 : -47.5},
                ]}>
                <Text style={styles.cardTitle}>Content Preferences</Text>
                <View style={styles.prefGrid}>
                  <TouchableOpacity
                    style={[
                      styles.prefTile,
                      contentPreferences.includes('language') &&
                        styles.prefTileActive,
                    ]}
                    onPress={() => navigation.navigate('ContentSelection')}
                    activeOpacity={0.9}>
                    <MaterialIcons
                      name="chat"
                      size={26}
                      color={
                        contentPreferences.includes('language')
                          ? '#4A90E2'
                          : '#9AA0A6'
                      }
                    />
                    <Text
                      style={[
                        styles.prefTitle,
                        contentPreferences.includes('language') &&
                          styles.prefTitleActive,
                      ]}>
                      Language
                    </Text>
                    <Text style={styles.prefSub}>Development</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.prefTile,
                      contentPreferences.includes('science') &&
                        styles.prefTileActive,
                    ]}
                    onPress={() => navigation.navigate('ContentSelection')}
                    activeOpacity={0.9}>
                    <MaterialIcons
                      name="science"
                      size={26}
                      color={
                        contentPreferences.includes('science')
                          ? '#4A90E2'
                          : '#9AA0A6'
                      }
                    />
                    <Text
                      style={[
                        styles.prefTitle,
                        contentPreferences.includes('science') &&
                          styles.prefTitleActive,
                      ]}>
                      Science
                    </Text>
                    <Text style={styles.prefSub}>Skills</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.prefTile,
                      !contentPreferences.includes('literacy') &&
                        styles.prefTileDisabled,
                      contentPreferences.includes('literacy') &&
                        styles.prefTileActive,
                    ]}
                    onPress={() => navigation.navigate('ContentSelection')}
                    activeOpacity={0.9}>
                    <MaterialIcons
                      name="menu-book"
                      size={26}
                      color={
                        contentPreferences.includes('literacy')
                          ? '#4A90E2'
                          : '#D1D5DB'
                      }
                    />
                    <Text
                      style={[
                        styles.prefTitle,
                        contentPreferences.includes('literacy')
                          ? styles.prefTitleActive
                          : styles.prefTitleMuted,
                      ]}>
                      Literacy
                    </Text>
                    <Text style={[styles.prefSub, styles.prefSubMuted]}>
                      Soon
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.prefTile,
                      !contentPreferences.includes('social') &&
                        styles.prefTileDisabled,
                      contentPreferences.includes('social') &&
                        styles.prefTileActive,
                    ]}
                    onPress={() => navigation.navigate('ContentSelection')}
                    activeOpacity={0.9}>
                    <MaterialIcons
                      name="people"
                      size={26}
                      color={
                        contentPreferences.includes('social')
                          ? '#4A90E2'
                          : '#D1D5DB'
                      }
                    />
                    <Text
                      style={[
                        styles.prefTitle,
                        contentPreferences.includes('social')
                          ? styles.prefTitleActive
                          : styles.prefTitleMuted,
                      ]}>
                      Social
                    </Text>
                    <Text style={[styles.prefSub, styles.prefSubMuted]}>
                      Soon
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>

            {/* Ask your companion Card */}
            <Animated.View
              style={[{paddingHorizontal: 20}, askCompanionCardStyle]}>
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitleRow}>Ask your companion</Text>
                  <Text style={styles.cardSub}>Get personalized advice</Text>
                </View>

                <View style={styles.inputField}>
                  <MaterialIcons
                    name="chat-bubble-outline"
                    size={18}
                    color="#9AA0A6"
                  />
                  <TextInput
                    style={styles.fieldText}
                    value={searchText}
                    onChangeText={setSearchText}
                    placeholder={
                      isListening ? 'Listening...' : 'How can I help you today?'
                    }
                    placeholderTextColor="#9AA0A6"
                    multiline
                    editable={!isListening}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                  <TouchableOpacity
                    style={styles.micPill}
                    onPress={toggleListening}
                    activeOpacity={0.8}>
                    <MaterialIcons
                      name={isListening ? 'mic-off' : 'mic'}
                      size={18}
                      color={isListening ? '#FF3B30' : '#6366F1'}
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  activeOpacity={0.9}
                  disabled={isAssistantLoading}
                  onPress={getPersonalizedTips}
                  style={{borderRadius: 22, overflow: 'hidden'}}>
                  <LinearGradient
                    colors={['#3B82F6', '#7C4DFF']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={styles.ctaGradient}>
                    {isAssistantLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.ctaText}>Get Parenting Advice</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </Pressable>
        </View>

        {/* Floating pill nav */}
        {!isKeyboardVisible && (
          <View style={styles.pillNav}>
            <TouchableOpacity style={[styles.pillItem, styles.pillItemActive]}>
              <Text style={[styles.pillText, styles.pillTextActive]}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.pillItem}
              onPress={() => navigation.navigate('Settings')}>
              <Text style={styles.pillText}>Settings</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Modals */}
      <TipsModal />

      <MapViewModal
        visible={showMapView}
        onClose={() => setShowMapView(false)}
        locations={locations}
        details={details}
        initialRegion={location}
        token={userInfo?.access_token || ''}
        onRefresh={refreshDataInBackground}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F8F9FA'},

  modalContainer: {flex: 1, backgroundColor: '#fff'},
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  modalTitle: {fontSize: 18, fontWeight: '600', color: '#333'},
  closeModalButton: {padding: 8},
  modalContent: {flex: 1, padding: 16},

  // Header wrapper gives shadow (not applied to LinearGradient to avoid warnings)
  headerShadow: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 6,
  },
  headerBar: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandingContainer: {flex: 1},
  appName: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  tagline: {fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 4},

  searchRow: {
    alignItems: 'center',
    marginTop: 20,
    flexDirection: 'row',
  },
  heroSearch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  heroSearchText: {flex: 1, marginLeft: 8, color: '#9AA0A6', fontSize: 15},
  iconBtn: {
    height: 44,
    width: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  cardHeaderRow: {marginBottom: 12},
  cardTitleRow: {fontSize: 18, fontWeight: '600', color: '#1F2937'},
  cardSub: {fontSize: 13, color: '#9AA0A6'},

  // Pref grid
  prefGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  prefTile: {
    height: 96,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    flexBasis: '48%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefTileActive: {
    borderWidth: 2,
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  prefTileDisabled: {opacity: 0.6},
  prefTitle: {marginTop: 6, fontSize: 14, fontWeight: '600', color: '#4B5563'},
  prefTitleActive: {color: '#4A90E2'},
  prefTitleMuted: {color: '#A1A1AA'},
  prefSub: {fontSize: 12, color: '#9AA0A6', marginTop: 2},
  prefSubMuted: {color: '#D1D5DB'},

  // Input field
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FB',
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  fieldText: {flex: 1, marginLeft: 8, color: '#111827', fontSize: 15},
  micPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // CTA
  ctaGradient: {
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {color: '#fff', fontWeight: '700', fontSize: 15},

  // Small avatar dot
  avatarDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5FF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  // Floating pill nav
  pillNav: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 22,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  pillItem: {
    flex: 1,
    height: 38,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillItemActive: {backgroundColor: '#F1F5FF'},
  pillText: {fontSize: 14, color: '#6B7280', fontWeight: '600'},
  pillTextActive: {color: '#111827'},

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Tips
  tipItem: {marginBottom: 16},
  tipCardShadow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tipGradient: {borderRadius: 16, padding: 20, elevation: 5},
  tipHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 12},
  tipTitle: {fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1},
  tipBody: {fontSize: 16, color: '#444', lineHeight: 24, marginBottom: 12},
  tipDetails: {fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 16},
  tipActions: {flexDirection: 'row', alignItems: 'center', marginTop: 6},
  playButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minWidth: 96,
  },
  stopButton: {backgroundColor: '#FF3B30'},
  playButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },

  // Map modal
  mapModalContainer: {flex: 1},
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  mapHeaderTitle: {fontSize: 18, fontWeight: '600', color: '#1F2937'},
  fullMap: {flex: 1, zIndex: 0},
  searchBarWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    zIndex: 10000,
    elevation: 10000,
  },
  searchInput: {
    color: '#1F2937',
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addLocationForm: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  formTitle: {fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 16},
  dropdown: {
    height: 50,
    borderColor: '#E8E8E8',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  dropdownPlaceholder: {fontSize: 16, color: '#666'},
  dropdownSelected: {fontSize: 16, color: '#333', fontWeight: '500'},
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
  textArea: {height: 100, textAlignVertical: 'top', paddingTop: 12},
  addButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {color: '#FFFFFF', fontSize: 16, fontWeight: '600'},

  // Survey button
  surveyPromptButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 12,
  },
  surveyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  surveyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  personalizationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF5FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  personalizationText: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '500',
    marginLeft: 4,
  },
});

export default MainScreen;
