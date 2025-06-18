// import React, {useContext, useEffect, useRef, useState, useCallback} from 'react';
// import {
//   View,
//   StyleSheet,
//   PermissionsAndroid,
//   Platform,
//   Alert,
//   Text,
//   TouchableOpacity,
//   TextInput,
//   SafeAreaView,
//   StatusBar,
//   Dimensions,
//   TouchableWithoutFeedback,
//   Keyboard,
//   KeyboardAvoidingView,
//   AppState,
//   ScrollView,
//   Modal,
//   ActivityIndicator,
// } from 'react-native';
// import MapView, {
//   PROVIDER_GOOGLE,
//   Marker,
//   Circle,
//   PROVIDER_DEFAULT,
// } from 'react-native-maps';
// import {Dropdown} from 'react-native-element-dropdown';
// import AntDesign from '@expo/vector-icons/AntDesign';
// import Geolocation, { 
//   GeolocationResponse, 
//   GeolocationError 
// } from '@react-native-community/geolocation';
// import {
//   GooglePlacesAutocomplete,
//   GooglePlacesAutocompleteRef,
// } from 'react-native-google-places-autocomplete';
// import {Icon} from 'react-native-elements';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// import Spinner from 'react-native-loading-spinner-overlay';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import LinearGradient from 'react-native-linear-gradient';
// import Voice from '@react-native-voice/voice';
// import Sound from 'react-native-sound';
// import {AuthContext} from '../context/AuthContext';
// import Notification from '../components/Notification';
// import {useNavigation} from '@react-navigation/native';
// import {NativeStackNavigationProp} from '@react-navigation/native-stack';
// import { fetchWithAuth } from '../api/auth';
// import { useChildrenInfo } from '../hooks/useChildrenInfo';
// import { Child } from '../services/ChildrenInfoService';

// // Fast startup configuration - prioritize UI over data accuracy
// const STARTUP_CONFIG = {
//   MAX_STARTUP_TIME: 8000,
//   CRITICAL_OPERATIONS_TIMEOUT: 5000,
//   BACKGROUND_TIMEOUT: 30000,
//   QUICK_LOCATION_TIMEOUT: 3000,
// };

// const LOCATION_CONFIG = {
//   TIMEOUTS: {
//     QUICK: 3000,
//     NORMAL: 15000,
//     BACKGROUND: 30000,
//   },
//   DELTAS: {
//     LATITUDE: 0.015,
//     LONGITUDE: 0.0121,
//   },
//   CACHE_KEYS: {
//     LAST_LOCATION: 'lastKnownLocation',
//     CHILDREN_INFO: 'childrenInfoCache',
//     USER_LOCATIONS: 'userLocationsCache',
//   },
// };

// const API_ENDPOINTS = {
//   BASE_URL: 'http://68.183.102.75:1337',
//   ASSISTANT_BASE_URL: 'http://68.183.102.75:4000',
//   LOCATIONS: '/endpoint/locations',
//   ADD_LOCATION: '/endpoint/addLocation',
//   SEND_LOCATION: '/endpoint',
//   CHILDREN: '/endpoint/children',
//   UPDATE_CHILDREN: '/endpoint/updateChildren',
// };

// // Default location (fallback)
// const DEFAULT_LOCATION = {
//   latitude: 37.7749,
//   longitude: -122.4194,
//   latitudeDelta: LOCATION_CONFIG.DELTAS.LATITUDE,
//   longitudeDelta: LOCATION_CONFIG.DELTAS.LONGITUDE,
// };

// // Assistant Types
// interface Tip {
//   id: number;
//   title: string;
//   body: string;
//   details: string;
//   audioUrl: string | null;
//   categories?: string[];
// }

// interface Location {
//   latitude: number;
//   longitude: number;
//   latitudeDelta: number;
//   longitudeDelta: number;
// }

// interface Props {
//   navigation: NativeStackNavigationProp<any>;
// }

// const App: React.FC<Props> = ({navigation}) => {
//   // UI State
//   const [showUpdateModal, setShowUpdateModal] = useState(false);
//   const [mainLoading, setMainLoading] = useState(true);
//   const [backgroundLoading, setBackgroundLoading] = useState(true);
  
//   // Data State
//   const [location, setLocation] = useState<Location | null>(null);
//   const [locations, setLocations] = useState<Location[]>([]);
//   const [details, setDetails] = useState<Array<{title: string; description: string; pinColor: string}>>([]);
  
//   // Form State
//   const [newLocation, setNewLocation] = useState<Location | null>(null);
//   const [name, setName] = useState<string>('');
//   const [description, setDescription] = useState<string>('');
//   const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
//   // Status State
//   const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error' | 'disabled'>('loading');
//   const [apiStatus, setApiStatus] = useState<'loading' | 'success' | 'error'>('loading');
//   const [statusMessage, setStatusMessage] = useState<string>('Starting app...');

//   // Assistant State
//   const [isListening, setIsListening] = useState(false);
//   const [searchText, setSearchText] = useState('');
//   const [tips, setTips] = useState<Tip[]>([]);
//   const [isAssistantLoading, setIsAssistantLoading] = useState(false);
//   const [showTipsModal, setShowTipsModal] = useState(false);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [activeAudioIndex, setActiveAudioIndex] = useState<number | null>(null);
//   const [audioLoadingIndex, setAudioLoadingIndex] = useState<number | null>(null);
//   const [contentPreferences, setContentPreferences] = useState<string[]>(['language']);
//   const [showAgePrompt, setShowAgePrompt] = useState(false);
//   const [lastQuery, setLastQuery] = useState('');

//   const ref = useRef<GooglePlacesAutocompleteRef>(null);
//   const {userInfo, isLoading, logout} = useContext<any>(AuthContext);
//   const currentSound = useRef<Sound | null>(null);
//   const lastResult = useRef<string>('');
//   const audioCache = useRef<Map<number, string>>(new Map());

//   // Use the enhanced children info hook
//   const {
//     children: childrenInfo,
//     isLoading: childrenLoading,
//     error: childrenError,
//     isFromCache: childrenFromCache,
//     fetchChildren,
//     updateChildren,
//     clearError: clearChildrenError,
//     retryFetch: retryChildrenFetch,
//     needsProfileCompletion,
//   } = useChildrenInfo();

//   const options = [
//     {label: 'Grocery Store', value: 'Grocery Store'},
//     {label: 'Bus/Walk', value: 'Bus/Walk'},
//     {label: 'Library', value: 'Library'},
//     {label: 'Park', value: 'Park'},
//     {label: 'Restaurant', value: 'Restaurant'},
//     {label: 'Waiting Room', value: 'Waiting Room'},
//     {label: "Other's Home", value: "Other's Home"},
//   ];

//   // Assistant Helper Functions
//   const calculateAge = (dateOfBirth: string): number => {
//     const today = new Date();
//     const birthDate = new Date(dateOfBirth);
//     let age = today.getFullYear() - birthDate.getFullYear();
//     const monthDiff = today.getMonth() - birthDate.getMonth();

//     if (
//       monthDiff < 0 ||
//       (monthDiff === 0 && today.getDate() < birthDate.getDate())
//     ) {
//       age--;
//     }
//     return age;
//   };

//   const detectChildNameInQuery = (query: string, childrenInfo: Child[]) => {
//     if (!childrenInfo || childrenInfo.length === 0) {
//       console.log('No children info available');
//       return null;
//     }
    
//     const normalizedQuery = query.toLowerCase();
//     console.log('Searching for child names in query:', normalizedQuery);
    
//     for (const child of childrenInfo) {
//       const nickname = child.nickname?.toLowerCase();
      
//       if (!nickname) {
//         console.log('Child missing nickname:', child);
//         continue;
//       }
      
//       console.log('Checking child:', nickname);
      
//       const patterns = [
//         ` for ${nickname}`,
//         ` ${nickname}'s `,
//         ` ${nickname} `,
//         `^${nickname} `,
//         ` ${nickname}$`,
//         `^${nickname}$`,
//         `${nickname}'s`,
//         `${nickname} `,
//         ` ${nickname}`,
//         `^${nickname}`,
//       ];
      
//       for (const pattern of patterns) {
//         const regex = new RegExp(pattern);
//         if (normalizedQuery.match(regex)) {
//           console.log(`Found match with pattern "${pattern}" for child:`, child);
//           return child;
//         }
//       }
//     }
    
//     console.log('No child name detected in query');
//     return null;
//   };

//   // Voice Recognition Functions
//   const initializeVoice = async () => {
//     try {
//       await requestMicrophonePermission();
//       Voice.onSpeechResults = onSpeechResults;
//       Voice.onSpeechError = onSpeechError;
//       Voice.onSpeechEnd = () => {
//         if (isListening) {
//           Voice.start('en-US');
//         }
//       };
//     } catch (error) {
//       console.error('Failed to initialize voice:', error);
//     }
//   };

//   const cleanupVoice = () => {
//     Voice.destroy().then(Voice.removeAllListeners);
//   };

//   const cleanupSound = () => {
//     if (currentSound.current) {
//       currentSound.current.stop();
//       currentSound.current.release();
//       currentSound.current = null;
//     }
//     setIsPlaying(false);
//     setActiveAudioIndex(null);
//   };

//   const requestMicrophonePermission = async () => {
//     if (Platform.OS === 'android') {
//       try {
//         const granted = await PermissionsAndroid.request(
//           PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
//           {
//             title: 'Microphone Permission',
//             message: 'This app needs access to your microphone for voice recognition.',
//             buttonNeutral: 'Ask Me Later',
//             buttonNegative: 'Cancel',
//             buttonPositive: 'OK',
//           },
//         );
//         if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
//           Alert.alert('Permission Denied', 'Voice recognition requires microphone access');
//         }
//       } catch (err) {
//         Alert.alert('Error', 'Failed to request microphone permission');
//         console.error(err);
//       }
//     }
//   };

//   const onSpeechResults = (e: any) => {
//     if (e.value && e.value[0]) {
//       const newResult = e.value[0];
//       if (newResult !== lastResult.current) {
//         lastResult.current = newResult;
//         setSearchText(newResult);
//       }
//     }
//   };

//   const onSpeechError = (e: any) => {
//     console.error('Speech recognition error:', e);
//     if (isListening) {
//       Voice.start('en-US').catch(error => {
//         console.error('Failed to restart voice recognition:', error);
//         setIsListening(false);
//         Alert.alert('Error', 'Failed to restart voice recognition. Please try again.');
//       });
//     }
//   };

//   const toggleListening = async () => {
//     try {
//       if (isListening) {
//         await Voice.stop();
//         setIsListening(false);
//         if (searchText.trim()) {
//           await getTips(searchText);
//         }
//         lastResult.current = '';
//       } else {
//         const isAvailable = await Voice.isAvailable();
//         if (isAvailable) {
//           setSearchText('');
//           lastResult.current = '';
//           await Voice.start('en-US');
//           setIsListening(true);
//         } else {
//           Alert.alert('Error', 'Voice recognition is not available on this device.');
//         }
//       }
//     } catch (error) {
//       console.error('Voice toggle error:', error);
//       Alert.alert('Error', 'Failed to toggle voice recognition');
//       setIsListening(false);
//     }
//   };

//   // Test function to check child detection without API call
//   const testChildDetection = (query: string) => {
//     console.log('\n=== TESTING CHILD DETECTION ===');
//     console.log('Query:', query);
//     console.log('Children available:', childrenInfo);
    
//     const detectedChild = detectChildNameInQuery(query, childrenInfo);
//     console.log('Detected child:', detectedChild);
    
//     if (detectedChild) {
//       const age = calculateAge(detectedChild.date_of_birth);
//       const enhancedQuery = `${query} for ${age} year old`;
//       console.log('Enhanced query would be:', enhancedQuery);
      
//       Alert.alert(
//         'Child Detection Test',
//         `Child: ${detectedChild.nickname}\nAge: ${age}\nEnhanced Query: "${enhancedQuery}"`,
//         [{ text: 'OK' }]
//       );
//     } else {
//       Alert.alert('Child Detection Test', 'No child detected in query');
//     }
//     console.log('=== END TEST ===\n');
//   };

//   const handleAgeSubmit = (age: string) => {
//     setShowAgePrompt(false);
//     const queryWithAge = `${lastQuery} for ${age} year old`;
//     setSearchText(queryWithAge);
//     getTips(queryWithAge);
//   };

//   // Assistant API Functions
//   const getTips = async (query = searchText) => {
//     if (!query.trim()) {
//       Alert.alert('Input Required', 'Please enter a question or use voice input');
//       return;
//     }

//     setIsAssistantLoading(true);
//     setTips([]);

//     // Enhanced child name detection
//     const detectedChild = detectChildNameInQuery(query, childrenInfo);
    
//     if (detectedChild) {
//       const age = calculateAge(detectedChild.date_of_birth);
//       query = `${query} for ${age} year old`;
//     }

//     // Ensure contentPreferences is properly formatted
//     const validContentPreferences = Array.isArray(contentPreferences) && contentPreferences.length > 0 
//       ? contentPreferences 
//       : ['language'];

//     console.log('Sending request with:', {
//       prompt: query,
//       contentPreferences: validContentPreferences
//     });

//     try {
//       const response = await fetch(`${API_ENDPOINTS.ASSISTANT_BASE_URL}/generate-tips`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ 
//           prompt: query, 
//           contentPreferences: validContentPreferences,
//         }),
//       });

//       console.log('Response status:', response.status);
      
//       if (!response.ok) {
//         let errorData;
//         try {
//           errorData = await response.json();
//           console.log('Error response body:', errorData);
//         } catch (e) {
//           console.log('Could not parse error response');
//           throw new Error(`Server responded with ${response.status}`);
//         }
        
//         // Handle age_required error by showing child selection modal
//         if (errorData.error === 'age_required') {
//           setLastQuery(query);
//           setShowAgePrompt(true);
//           return;
//         }
        
//         throw new Error(`Server responded with ${response.status}${errorData.message ? ': ' + errorData.message : ''}`);
//       }

//       const data = await response.json();
//       console.log('Received tips:', data);
      
//       if (data.tips && Array.isArray(data.tips)) {
//         setTips(data.tips);
//         setShowTipsModal(true);
//       } else {
//         throw new Error('Invalid response format');
//       }
      
//     } catch (error) {
//       console.error('Error fetching tips:', error);
//       Alert.alert(
//         'Error', 
//         `Failed to fetch tips: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your connection and try again.`
//       );
//     } finally {
//       setIsAssistantLoading(false);
//     }
//   };

//   // Cache utilities
//   const loadFromCache = async (key: string) => {
//     try {
//       const cached = await AsyncStorage.getItem(key);
//       if (cached) {
//         const data = JSON.parse(cached);
//         console.log(`Loaded cached data for ${key}`);
//         return data;
//       }
//     } catch (error) {
//       console.warn(`Failed to load cache for ${key}:`, error);
//     }
//     return null;
//   };

//   const saveToCache = async (key: string, data: any) => {
//     try {
//       await AsyncStorage.setItem(key, JSON.stringify(data));
//       console.log(`Cached data for ${key}`);
//     } catch (error) {
//       console.warn(`Failed to cache ${key}:`, error);
//     }
//   };

//   // Location functions
//   const getQuickLocation = useCallback(async (): Promise<Location> => {
//     console.log('Getting quick location...');
    
//     const cached = await loadFromCache(LOCATION_CONFIG.CACHE_KEYS.LAST_LOCATION);
//     if (cached && cached.latitude && cached.longitude) {
//       console.log('Using cached location for quick startup');
//       setLocationStatus('success');
//       return cached;
//     }

//     return new Promise((resolve) => {
//       const timeout = setTimeout(() => {
//         console.log('Quick location timeout, using default location');
//         setLocationStatus('error');
//         resolve(DEFAULT_LOCATION);
//       }, STARTUP_CONFIG.QUICK_LOCATION_TIMEOUT);

//       Geolocation.getCurrentPosition(
//         (position: GeolocationResponse) => {
//           clearTimeout(timeout);
//           const newLocation = {
//             latitude: position.coords.latitude,
//             longitude: position.coords.longitude,
//             latitudeDelta: LOCATION_CONFIG.DELTAS.LATITUDE,
//             longitudeDelta: LOCATION_CONFIG.DELTAS.LONGITUDE,
//           };
          
//           console.log('Got fresh location quickly');
//           setLocationStatus('success');
//           saveToCache(LOCATION_CONFIG.CACHE_KEYS.LAST_LOCATION, newLocation);
//           resolve(newLocation);
//         },
//         (error: GeolocationError) => {
//           clearTimeout(timeout);
//           console.warn('Quick location failed, using default:', error.message);
//           setLocationStatus('error');
//           resolve(DEFAULT_LOCATION);
//         },
//         {
//           enableHighAccuracy: false,
//           timeout: STARTUP_CONFIG.QUICK_LOCATION_TIMEOUT - 500,
//           maximumAge: 60000,
//         }
//       );
//     });
//   }, []);

//   const improveLocationInBackground = useCallback(async () => {
//     if (locationStatus === 'success') {
//       console.log('Location already good, skipping background improvement');
//       return;
//     }

//     console.log('Improving location in background...');
    
//     if (Platform.OS === 'android') {
//       try {
//         const granted = await PermissionsAndroid.request(
//           PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//           {
//             title: 'Location Permission',
//             message: 'This app needs access to your location for personalized tips.',
//             buttonNeutral: 'Ask Me Later',
//             buttonNegative: 'Cancel',
//             buttonPositive: 'OK',
//           },
//         );
        
//         if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
//           console.log('Location permission denied');
//           setLocationStatus('disabled');
//           return;
//         }
//       } catch (err) {
//         console.warn('Permission request failed:', err);
//         return;
//       }
//     }

//     Geolocation.getCurrentPosition(
//       (position: GeolocationResponse) => {
//         const newLocation = {
//           latitude: position.coords.latitude,
//           longitude: position.coords.longitude,
//           latitudeDelta: LOCATION_CONFIG.DELTAS.LATITUDE,
//           longitudeDelta: LOCATION_CONFIG.DELTAS.LONGITUDE,
//         };
        
//         console.log('Improved location obtained in background');
//         setLocation(newLocation);
//         setLocationStatus('success');
//         saveToCache(LOCATION_CONFIG.CACHE_KEYS.LAST_LOCATION, newLocation);
//       },
//       (error: GeolocationError) => {
//         console.warn('Background location improvement failed:', error.message);
//         setLocationStatus('error');
//       },
//       {
//         enableHighAccuracy: true,
//         timeout: LOCATION_CONFIG.TIMEOUTS.BACKGROUND,
//         maximumAge: 0,
//       }
//     );
//   }, [locationStatus]);

//   const loadCachedDataFirst = useCallback(async () => {
//     console.log('Loading cached data first...');
    
//     try {
//       const cachedLocations = await loadFromCache(LOCATION_CONFIG.CACHE_KEYS.USER_LOCATIONS);
//       if (cachedLocations) {
//         console.log('Loaded cached locations');
//         setLocations(cachedLocations.locations || []);
//         setDetails(cachedLocations.details || []);
//       }

//       try {
//         const savedPreferences = await AsyncStorage.getItem('contentPreferences');
//         console.log('Raw stored preferences:', savedPreferences);
        
//         if (savedPreferences) {
//           const parsedPreferences = JSON.parse(savedPreferences);
//           console.log('Parsed preferences:', parsedPreferences);
          
//           if (Array.isArray(parsedPreferences) && parsedPreferences.length > 0) {
//             setContentPreferences(parsedPreferences);
//           } else {
//             console.log('Invalid preferences format, using default');
//             setContentPreferences(['language']);
//           }
//         } else {
//           console.log('No saved preferences, using default');
//           setContentPreferences(['language']);
//         }
//       } catch (prefError) {
//         console.warn('Failed to load content preferences:', prefError);
//         setContentPreferences(['language']);
//       }
//     } catch (error) {
//       console.warn('Failed to load cached data:', error);
//     }
//   }, []);

//   const refreshDataInBackground = useCallback(async () => {
//     if (!userInfo?.access_token) {
//       console.log('No auth token, skipping API calls');
//       setApiStatus('error');
//       return;
//     }

//     console.log('Refreshing data in background...');
    
//     try {
//       const locationsPromise = fetchWithAuth(
//         `${API_ENDPOINTS.BASE_URL}${API_ENDPOINTS.LOCATIONS}`,
//         {
//           method: 'POST',
//           headers: {
//             Accept: 'application/json',
//             'Content-Type': 'application/json',
//             Authorization: `Bearer ${userInfo.access_token}`,
//           },
//         },
//       ).then(async (response) => {
//         if (response.ok) {
//           const data = await response.json();
//           if (Array.isArray(data.locations) && Array.isArray(data.details)) {
//             setLocations(data.locations);
//             setDetails(data.details);
            
//             await saveToCache(LOCATION_CONFIG.CACHE_KEYS.USER_LOCATIONS, {
//               locations: data.locations,
//               details: data.details,
//             });
            
//             console.log('Locations refreshed successfully');
//             return true;
//           }
//         }
//         throw new Error(`HTTP ${response.status}`);
//       }).catch(error => {
//         console.warn('Failed to refresh locations:', error);
//         return false;
//       });

//       const results = await Promise.allSettled([
//         Promise.race([locationsPromise, new Promise(resolve => setTimeout(() => resolve(false), 10000))]),
//       ]);

//       const successCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
//       setApiStatus(successCount > 0 ? 'success' : 'error');
      
//       console.log(`Background refresh completed: ${successCount}/1 successful`);
      
//     } catch (error) {
//       console.error('Background refresh failed:', error);
//       setApiStatus('error');
//     } finally {
//       setBackgroundLoading(false);
//     }
//   }, [userInfo]);

//   // Fast startup initialization
//   useEffect(() => {
//     let mounted = true;
    
//     const startupSequence = async () => {
//       console.log('=== FAST STARTUP SEQUENCE BEGIN ===');
      
//       try {
//         await loadCachedDataFirst();
        
//         setStatusMessage('Getting your location...');
//         const quickLocation = await getQuickLocation();
        
//         if (mounted) {
//           setLocation(quickLocation);
//           console.log('Quick location set:', quickLocation);
//         }
        
//         setStatusMessage('Loading interface...');
//         await new Promise(resolve => setTimeout(resolve, 100));
        
//         if (mounted) {
//           console.log('Showing main UI');
//           setMainLoading(false);
//         }
        
//         console.log('Starting background operations...');
        
//         Promise.allSettled([
//           initializeVoice(),
//           improveLocationInBackground(),
//           refreshDataInBackground(),
//         ]).then(() => {
//           if (mounted) {
//             console.log('Background operations completed');
//             setBackgroundLoading(false);
//           }
//         });
        
//       } catch (error) {
//         console.error('Startup sequence error:', error);
        
//         if (mounted) {
//           setLocation(DEFAULT_LOCATION);
//           setMainLoading(false);
//           setBackgroundLoading(false);
//         }
//       }
      
//       console.log('=== FAST STARTUP SEQUENCE END ===');
//     };

//     startupSequence();

//     const failsafeTimeout = setTimeout(() => {
//       if (mounted && mainLoading) {
//         console.log('Failsafe: Forcing UI to show after timeout');
//         setLocation(prev => prev || DEFAULT_LOCATION);
//         setMainLoading(false);
//         setBackgroundLoading(false);
//       }
//     }, STARTUP_CONFIG.MAX_STARTUP_TIME);

//     return () => {
//       mounted = false;
//       clearTimeout(failsafeTimeout);
//       cleanupVoice();
//       cleanupSound();
//     };
//   }, [getQuickLocation, loadCachedDataFirst, improveLocationInBackground, refreshDataInBackground, mainLoading]);

//   // Location management functions
//   const handleUpdateChildren = async (updatedChildren: any[]) => {
//     try {
//       const response = await fetch(
//         `${API_ENDPOINTS.BASE_URL}${API_ENDPOINTS.UPDATE_CHILDREN}`,
//         {
//           method: 'POST',
//           headers: {
//             Accept: 'application/json',
//             'Content-Type': 'application/json',
//             Authorization: `Bearer ${userInfo.access_token}`,
//           },
//           body: JSON.stringify({children: updatedChildren}),
//         },
//       );

//       if (!response.ok) {
//         throw new Error('Failed to update children');
//       }
//       Alert.alert('Success', 'Children information updated successfully');
//     } catch (error) {
//       console.error('Error updating children:', error);
//       Alert.alert('Error', 'Failed to update children information');
//     }
//   };

//   const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
//     const R = 6371e3;
//     const φ1 = (lat1 * Math.PI) / 180;
//     const φ2 = (lat2 * Math.PI) / 180;
//     const Δφ = ((lat2 - lat1) * Math.PI) / 180;
//     const Δλ = ((lon2 - lon1) * Math.PI) / 180;

//     const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//     return R * c;
//   };

//   const isLocationNearby = (newLat: number, newLon: number) => {
//     return locations.some(loc => {
//       const distance = calculateDistance(newLat, newLon, loc.latitude, loc.longitude);
//       return distance <= 100;
//     });
//   };

//   const addLocation = async () => {
//     if (name === '' || description === '' || !selectedOption) {
//       Alert.alert('Missing Information', 'Please enter a title, description, and select a location type.');
//       return;
//     }
    
//     if (newLocation) {
//       if (isLocationNearby(newLocation.latitude, newLocation.longitude)) {
//         Alert.alert('Duplicate Location', 'A location already exists within 100 meters of this point.');
//         return;
//       }

//       try {
//         const response = await fetchWithAuth(
//           `${API_ENDPOINTS.BASE_URL}${API_ENDPOINTS.ADD_LOCATION}`,
//           {
//             method: 'POST',
//             headers: {
//               Accept: 'application/json',
//               'Content-Type': 'application/json',
//               Authorization: `Bearer ${userInfo.access_token}`,
//             },
//             body: JSON.stringify({
//               latitude: newLocation.latitude,
//               longitude: newLocation.longitude,
//               name,
//               description,
//               type: selectedOption,
//             }),
//           },
//         );
        
//         if (!response.ok) {
//           throw new Error(`HTTP error! status: ${response.status}`);
//         }
        
//         await refreshDataInBackground();
//         Alert.alert('Success', 'Location added successfully!');
        
//         setNewLocation(null);
//         setName('');
//         setDescription('');
//         setSelectedOption(null);
//         ref.current?.clear();
//       } catch (error) {
//         console.error('Error adding location:', error);
//         Alert.alert('Error', 'Failed to add location. Please try again.');
//       }
//     }
//   };

//   // Audio functions for tips
//   const loadAudio = async (tip: Tip, index: number) => {
//     if (audioCache.current.has(tip.id)) {
//       return audioCache.current.get(tip.id);
//     }

//     if (tip.audioUrl) {
//       const fullAudioUrl = `${API_ENDPOINTS.ASSISTANT_BASE_URL}/audio${tip.audioUrl}`;
//       audioCache.current.set(tip.id, fullAudioUrl);
//       return fullAudioUrl;
//     }

//     setAudioLoadingIndex(index);
//     try {
//       const response = await fetch(`${API_ENDPOINTS.ASSISTANT_BASE_URL}/generate-tip-audio`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           tipId: tip.id,
//           title: tip.title,
//           body: tip.body,
//           details: tip.details,
//         }),
//       });

//       if (!response.ok) {
//         throw new Error('Failed to generate audio');
//       }

//       const { audioUrl } = await response.json();
//       const fullAudioUrl = `${API_ENDPOINTS.ASSISTANT_BASE_URL}/audio${audioUrl}`;
      
//       tip.audioUrl = audioUrl;
//       audioCache.current.set(tip.id, fullAudioUrl);
      
//       return fullAudioUrl;
//     } catch (error) {
//       console.error('Audio generation error:', error);
//       Alert.alert('Error', 'Failed to generate audio. Please try again.');
//       return null;
//     } finally {
//       setAudioLoadingIndex(null);
//     }
//   };

//   const speakTip = useCallback(async (tip: Tip, index: number) => {
//     cleanupSound();
//     setActiveAudioIndex(index);

//     try {
//       const audioUrl = await loadAudio(tip, index);
//       if (!audioUrl) return;

//       setIsPlaying(true);

//       currentSound.current = new Sound(audioUrl, '', error => {
//         if (error) {
//           console.error('Failed to load sound:', error);
//           Alert.alert('Error', 'Failed to play audio. Please try again.');
//           cleanupSound();
//           return;
//         }

//         currentSound.current?.play(success => {
//           if (!success) {
//             Alert.alert('Error', 'Audio playback failed. Please try again.');
//           }
//           cleanupSound();
//         });
//       });
//     } catch (error) {
//       console.error('Audio playback error:', error);
//       cleanupSound();
//     }
//   }, []);

//   // Periodic location updates
//   useEffect(() => {
//     const intervalId = setInterval(async () => {
//       if (AppState.currentState === 'active' && location && userInfo?.access_token) {
//         try {
//           await fetchWithAuth(`${API_ENDPOINTS.BASE_URL}${API_ENDPOINTS.SEND_LOCATION}`, {
//             method: 'POST',
//             headers: {
//               Accept: 'application/json',
//               'Content-Type': 'application/json',
//               Authorization: `Bearer ${userInfo.access_token}`,
//             },
//             body: JSON.stringify({
//               latitude: location.latitude,
//               longitude: location.longitude,
//             }),
//           });
//         } catch (error) {
//           console.warn('Location update failed:', error);
//         }
//       }
//     }, 30000);
    
//     return () => clearInterval(intervalId);
//   }, [location, userInfo]);

//   // Render functions
//   const renderTipItem = (tip: Tip, index: number) => (
//     <View key={index} style={styles.tipItem}>
//       <LinearGradient colors={['#ffffff', '#f8f9fa']} style={styles.tipGradient}>
//         <View style={styles.tipHeader}>
//           <MaterialIcons name="lightbulb" size={24} color="#FFA726" style={styles.tipIcon} />
//           <Text style={styles.tipTitle}>{tip.title}</Text>
//         </View>
//         <Text style={styles.tipBody}>{tip.body}</Text>
//         <Text style={styles.tipDetails}>{tip.details}</Text>
//         <TouchableOpacity
//           style={[
//             styles.playButton,
//             activeAudioIndex === index && isPlaying && styles.stopButton,
//             audioLoadingIndex === index && styles.loadingButton,
//           ]}
//           onPress={() => {
//             if (activeAudioIndex === index && isPlaying) {
//               cleanupSound();
//             } else {
//               speakTip(tip, index);
//             }
//           }}
//           disabled={audioLoadingIndex === index}>
//           {audioLoadingIndex === index ? (
//             <ActivityIndicator color="white" size="small" />
//           ) : (
//             <MaterialIcons
//               name={activeAudioIndex === index && isPlaying ? 'stop' : 'play-arrow'}
//               size={20}
//               color="white"
//             />
//           )}
//           <Text style={styles.playButtonText}>
//             {audioLoadingIndex === index 
//               ? 'Loading...' 
//               : activeAudioIndex === index && isPlaying 
//               ? 'Stop' 
//               : 'Play Audio'}
//           </Text>
//         </TouchableOpacity>
//       </LinearGradient>
//     </View>
//   );

//   const TipsModal = () => (
//     <Modal visible={showTipsModal} animationType="slide" presentationStyle="pageSheet">
//       <SafeAreaView style={styles.modalContainer}>
//         <View style={styles.modalHeader}>
//           <Text style={styles.modalTitle}>Parenting Tips</Text>
//           <TouchableOpacity
//             style={styles.closeModalButton}
//             onPress={() => setShowTipsModal(false)}>
//             <MaterialIcons name="close" size={24} color="#666" />
//           </TouchableOpacity>
//         </View>
//         <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
//           {tips.map((tip, index) => renderTipItem(tip, index))}
//           <View style={{height: 20}} />
//         </ScrollView>
//       </SafeAreaView>
//     </Modal>
//   );

//   const AgePromptModal = () => (
//     <Modal visible={showAgePrompt} transparent={true} animationType="slide">
//       <View style={styles.modalOverlay}>
//         <View style={styles.modalContent}>
//           <Text style={styles.modalTitle}>Select Child</Text>
//           <Text style={styles.modalText}>
//             Please select which child you're asking about:
//           </Text>
//           {childrenInfo.map(child => {
//             const age = calculateAge(child.date_of_birth);
//             return (
//               <TouchableOpacity
//                 key={child.id}
//                 style={styles.ageButton}
//                 onPress={() => handleAgeSubmit(age.toString())}>
//                 <Text style={styles.ageButtonText}>
//                   {child.nickname || `Child ${child.id}`} ({age} year
//                   {age !== 1 ? 's' : ''} old)
//                 </Text>
//               </TouchableOpacity>
//             );
//           })}
//           <TouchableOpacity
//             style={styles.cancelButton}
//             onPress={() => setShowAgePrompt(false)}>
//             <Text style={styles.cancelButtonText}>Cancel</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </Modal>
//   );

//   // Show loading screen only briefly
//   if (mainLoading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <Spinner visible={true} />
//         <Text style={styles.loadingText}>{statusMessage}</Text>
//         <Text style={styles.loadingSubtext}>
//           {Date.now() % 2000 < 1000 ? 'Almost ready...' : 'Just a moment...'}
//         </Text>
//         <Notification />
//       </View>
//     );
//   }

//   return (
//     <>
//       <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
//       <Notification />
      
//       {/* Background loading indicator */}
//       {backgroundLoading && (
//         <View style={styles.backgroundLoadingBanner}>
//           <View style={styles.backgroundLoadingContent}>
//             <Text style={styles.backgroundLoadingText}>🔄 Refreshing data...</Text>
//           </View>
//         </View>
//       )}
      
//       <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
//         <KeyboardAvoidingView 
//           behavior={Platform.OS === "ios" ? "padding" : "height"}
//           style={{ flex: 1 }}
//         >
//           <SafeAreaView style={styles.safeArea}>
//             <View style={styles.container}>
//               {/* Search Bar */}
//               <View style={styles.searchWrapper}>
//                 <View style={styles.searchContainer}>
//                   <GooglePlacesAutocomplete
//                     placeholder="Search and add location"
//                     fetchDetails={true}
//                     styles={{
//                       container: { flex: 0 },
//                       textInputContainer: {
//                         backgroundColor: 'white',
//                         borderRadius: 12,
//                         borderWidth: 0,
//                       },
//                       textInput: {
//                         height: 45,
//                         color: '#333',
//                         fontSize: 16,
//                         borderRadius: 12,
//                         paddingHorizontal: 15,
//                       },
//                       listView: {
//                         backgroundColor: 'white',
//                         borderRadius: 12,
//                         marginTop: 5,
//                       },
//                       row: { padding: 13, height: 50 },
//                     }}
//                     onPress={(data, details = null) => {
//                       if (details) {
//                         const latitude = details.geometry.location.lat;
//                         const longitude = details.geometry.location.lng;
//                         setNewLocation({
//                           latitude,
//                           longitude,
//                           latitudeDelta: LOCATION_CONFIG.DELTAS.LATITUDE,
//                           longitudeDelta: LOCATION_CONFIG.DELTAS.LONGITUDE,
//                         });
//                       }
//                     }}
//                     query={{ key: 'AIzaSyBczo2yBRbSwa4IVQagZKNfTje0JJ_HEps', language: 'en' }}
//                     renderRightButton={() => (
//                       <TouchableOpacity
//                         style={styles.clearButton}
//                         onPress={() => {
//                           ref.current?.clear();
//                           setName('');
//                           setDescription('');
//                           setNewLocation(null);
//                           setSelectedOption(null);
//                         }}>
//                         <Icon name="close" size={20} color="#666" />
//                       </TouchableOpacity>
//                     )}
//                     ref={ref}
//                   />
//                 </View>
//               </View>

//               {/* Map Container */}
//               <View style={styles.mapContainer}>
//                 {location && (
//                   <MapView
//                     provider={Platform.OS === 'ios' ? PROVIDER_DEFAULT : PROVIDER_GOOGLE}
//                     style={styles.map}
//                     initialRegion={location}
//                     region={newLocation || location}
//                     showsUserLocation
//                     mapType="standard"
//                     userInterfaceStyle="light">
//                     {locations.map((loc, index) => (
//                       <React.Fragment key={`location-${index}`}>
//                         <Marker
//                           coordinate={loc}
//                           title={details[index]?.title || `Location ${index + 1}`}
//                           description={details[index]?.description || ''}
//                           pinColor={details[index]?.pinColor || '#FF4B4B'}
//                         />
//                         <Circle
//                           center={loc}
//                           radius={100}
//                           strokeColor="rgba(65, 105, 225, 0.5)"
//                           fillColor="rgba(65, 105, 225, 0.1)"
//                           zIndex={2}
//                         />
//                       </React.Fragment>
//                     ))}
//                   </MapView>
//                 )}
//               </View>

//               {/* Location Form */}
//               {newLocation && (
//                 <LinearGradient
//                   colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.98)']}
//                   style={styles.formContainer}>
//                   <Text style={styles.formTitle}>Add New Location</Text>
//                   <Dropdown
//                     style={styles.dropdown}
//                     placeholderStyle={styles.dropdownPlaceholder}
//                     selectedTextStyle={styles.dropdownSelected}
//                     data={options}
//                     maxHeight={300}
//                     labelField="label"
//                     valueField="value"
//                     placeholder="Select location type"
//                     value={selectedOption}
//                     onChange={item => setSelectedOption(item.value)}
//                     renderLeftIcon={() => (
//                       <AntDesign style={styles.dropdownLeftIcon} color="#333" name="Safety" size={20} />
//                     )}
//                   />
//                   <TextInput
//                     placeholder="Location name"
//                     style={styles.input}
//                     value={name}
//                     onChangeText={setName}
//                     placeholderTextColor="#666"
//                   />
//                   <TextInput
//                     placeholder="Description"
//                     style={[styles.input, styles.textArea]}
//                     value={description}
//                     onChangeText={setDescription}
//                     placeholderTextColor="#666"
//                     multiline
//                     numberOfLines={3}
//                   />
//                   <TouchableOpacity style={styles.addButton} onPress={addLocation}>
//                     <Text style={styles.addButtonText}>Add Location</Text>
//                   </TouchableOpacity>
//                 </LinearGradient>
//               )}

//               {/* Assistant Interface */}
//               {!newLocation && (
//                 <LinearGradient
//                   colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.98)']}
//                   style={styles.welcomeContainer}>
//                   <View style={styles.welcomeContent}>
//                     <Text style={styles.welcomeTitle}>
//                       Welcome, {userInfo?.user?.name || 'User'}
//                     </Text>
                    
//                     {/* Assistant Search Interface */}
//                     <View style={styles.assistantContainer}>
//                       <Text style={styles.assistantTitle}>🤖 Parenting Assistant</Text>
//                       <Text style={styles.assistantSubtitle}>Ask any parenting question</Text>
                      
//                       <View style={styles.assistantSearchContainer}>
//                         <View style={styles.assistantSearchWrapper}>
//                           <MaterialIcons name="search" size={20} color="#666" style={styles.assistantSearchIcon} />
//                           <TextInput
//                             style={styles.assistantSearchInput}
//                             value={searchText}
//                             onChangeText={setSearchText}
//                             placeholder={isListening ? 'Listening...' : 'Ask a parenting question...'}
//                             returnKeyType="search"
//                             onSubmitEditing={() => getTips()}
//                             editable={!isListening}
//                             placeholderTextColor="#999"
//                           />
//                           {searchText.length > 0 && !isListening && (
//                             <TouchableOpacity
//                               style={styles.assistantClearButton}
//                               onPress={() => setSearchText('')}
//                               hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
//                               <MaterialIcons name="clear" size={20} color="#999" />
//                             </TouchableOpacity>
//                           )}
//                         </View>
//                         <TouchableOpacity
//                           style={[styles.assistantMicButton, isListening && styles.assistantMicButtonActive]}
//                           onPress={toggleListening}>
//                           <MaterialIcons
//                             name={isListening ? 'mic-off' : 'mic'}
//                             size={20}
//                             color="white"
//                           />
//                         </TouchableOpacity>
//                       </View>

//                       <TouchableOpacity
//                         style={styles.assistantSubmitButton}
//                         onPress={() => getTips()}
//                         disabled={isAssistantLoading || isListening}>
//                         {isAssistantLoading ? (
//                           <ActivityIndicator color="white" size="small" />
//                         ) : (
//                           <>
//                             <MaterialIcons name="psychology" size={20} color="white" />
//                             <Text style={styles.assistantSubmitText}>Get Parenting Tips</Text>
//                           </>
//                         )}
//                       </TouchableOpacity>

//                       {/* Debug button for testing */}
//                       {/* <TouchableOpacity
//                         style={[styles.assistantSubmitButton, { backgroundColor: '#FF9500', marginTop: 8 }]}
//                         onPress={() => {
//                           setSearchText('How do I help my child with homework?');
//                           getTips('How do I help my child with homework?');
//                         }}>
//                         <MaterialIcons name="bug-report" size={16} color="white" />
//                         <Text style={[styles.assistantSubmitText, { fontSize: 12 }]}>Test API</Text>
//                       </TouchableOpacity> */}
//                     </View>

//                     <View style={styles.buttonContainer}>
//                       <TouchableOpacity
//                         style={[styles.button, styles.locationsButton]}
//                         onPress={() => {
//                           navigation.navigate('LocationList', { locations, details });
//                         }}>
//                         <Text style={styles.buttonText}>
//                           Locations ({locations.length})
//                         </Text>
//                       </TouchableOpacity>
//                       <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={logout}>
//                         <Text style={styles.buttonText}>Logout</Text>
//                       </TouchableOpacity>
//                     </View>
//                   </View>
//                 </LinearGradient>
//               )}
//             </View>
//           </SafeAreaView>
//         </KeyboardAvoidingView>
//       </TouchableWithoutFeedback>

//       <TipsModal />
//       <AgePromptModal />
//     </>
//   );
// };

// const styles = StyleSheet.create({
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#FFFFFF',
//     padding: 20,
//   },
//   loadingText: {
//     marginTop: 20,
//     fontSize: 16,
//     color: '#333',
//     textAlign: 'center',
//     fontWeight: '500',
//   },
//   loadingSubtext: {
//     marginTop: 8,
//     fontSize: 14,
//     color: '#666',
//     textAlign: 'center',
//   },
//   backgroundLoadingBanner: {
//     position: 'absolute',
//     top: Platform.OS === 'ios' ? 50 : 25,
//     left: 0,
//     right: 0,
//     zIndex: 20,
//     backgroundColor: 'rgba(74, 144, 226, 0.9)',
//     paddingVertical: 8,
//     paddingHorizontal: 16,
//   },
//   backgroundLoadingContent: {
//     alignItems: 'center',
//   },
//   backgroundLoadingText: {
//     color: '#FFFFFF',
//     fontSize: 14,
//     fontWeight: '500',
//   },
//   safeArea: {
//     flex: 1,
//     backgroundColor: '#FFFFFF',
//   },
//   container: {
//     flex: 1,
//   },
//   searchWrapper: {
//     position: 'absolute',
//     top: Platform.OS === 'ios' ? 50 : 40,
//     left: 0,
//     right: 0,
//     zIndex: 10,
//     paddingHorizontal: 16,
//   },
//   searchContainer: {
//     backgroundColor: 'white',
//     borderRadius: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   clearButton: {
//     padding: 12,
//   },
//   mapContainer: {
//     flex: 1,
//   },
//   map: {
//     ...StyleSheet.absoluteFillObject,
//   },
//   formContainer: {
//     position: 'absolute',
//     bottom: 20,
//     left: 16,
//     right: 16,
//     backgroundColor: 'white',
//     borderRadius: 16,
//     padding: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   formTitle: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 16,
//   },
//   dropdown: {
//     height: 50,
//     borderColor: '#E8E8E8',
//     borderWidth: 1,
//     borderRadius: 12,
//     paddingHorizontal: 12,
//     marginBottom: 16,
//   },
//   dropdownPlaceholder: {
//     fontSize: 16,
//     color: '#666',
//   },
//   dropdownSelected: {
//     fontSize: 16,
//     color: '#333',
//   },
//   dropdownLeftIcon: {
//     marginRight: 8,
//   },
//   input: {
//     height: 50,
//     borderColor: '#E8E8E8',
//     borderWidth: 1,
//     borderRadius: 12,
//     paddingHorizontal: 16,
//     fontSize: 16,
//     color: '#333',
//     backgroundColor: '#FFFFFF',
//     marginBottom: 16,
//   },
//   textArea: {
//     height: 100,
//     textAlignVertical: 'top',
//     paddingTop: 12,
//   },
//   addButton: {
//     backgroundColor: '#4A90E2',
//     borderRadius: 12,
//     height: 50,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   addButtonText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   welcomeContainer: {
//     position: 'absolute',
//     bottom: 20,
//     left: 16,
//     right: 16,
//     borderRadius: 16,
//     overflow: 'hidden',
//   },
//   welcomeContent: {
//     padding: 20,
//   },
//   welcomeTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#333',
//     marginBottom: 12,
//     textAlign: 'center',
//   },
  
//   // Assistant Styles
//   assistantContainer: {
//     backgroundColor: 'rgba(74, 144, 226, 0.05)',
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 16,
//     borderWidth: 1,
//     borderColor: 'rgba(74, 144, 226, 0.1)',
//   },
//   assistantTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#4A90E2',
//     textAlign: 'center',
//     marginBottom: 4,
//   },
//   assistantSubtitle: {
//     fontSize: 14,
//     color: '#666',
//     textAlign: 'center',
//     marginBottom: 12,
//   },
//   assistantSearchContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   assistantSearchWrapper: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'white',
//     borderRadius: 20,
//     paddingHorizontal: 12,
//     marginRight: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//     elevation: 2,
//   },
//   assistantSearchIcon: {
//     marginRight: 8,
//   },
//   assistantSearchInput: {
//     flex: 1,
//     height: 40,
//     fontSize: 14,
//     color: '#333',
//     paddingRight: 30,
//   },
//   assistantClearButton: {
//     position: 'absolute',
//     right: 12,
//     top: 10,
//     width: 20,
//     height: 20,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   assistantMicButton: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: '#4A90E2',
//     justifyContent: 'center',
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.15,
//     shadowRadius: 2,
//     elevation: 3,
//   },
//   assistantMicButtonActive: {
//     backgroundColor: '#FF3B30',
//   },
//   assistantSubmitButton: {
//     backgroundColor: '#4A90E2',
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     borderRadius: 8,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.15,
//     shadowRadius: 3,
//     elevation: 3,
//   },
//   assistantSubmitText: {
//     color: 'white',
//     fontSize: 14,
//     fontWeight: '600',
//     marginLeft: 6,
//   },
  
//   buttonContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   button: {
//     flex: 1,
//     height: 45,
//     borderRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginHorizontal: 6,
//   },
//   locationsButton: {
//     backgroundColor: '#34C759',
//   },
//   logoutButton: {
//     backgroundColor: '#FF3B30',
//   },
//   buttonText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '600',
//   },
  
//   // Tips Modal Styles
//   modalContainer: {
//     flex: 1,
//     backgroundColor: '#f0f2f5',
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     backgroundColor: 'white',
//     borderBottomWidth: 1,
//     borderBottomColor: '#E8E8E8',
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   closeModalButton: {
//     padding: 8,
//   },
//   modalContent: {
//     flex: 1,
//     paddingHorizontal: 16,
//     paddingTop: 16,
//   },
//   tipItem: {
//     marginBottom: 16,
//   },
//   tipGradient: {
//     borderRadius: 16,
//     padding: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   tipHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   tipIcon: {
//     marginRight: 12,
//   },
//   tipTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#333',
//     flex: 1,
//   },
//   tipBody: {
//     fontSize: 16,
//     color: '#444',
//     lineHeight: 24,
//     marginBottom: 12,
//   },
//   tipDetails: {
//     fontSize: 14,
//     color: '#666',
//     lineHeight: 20,
//     marginBottom: 16,
//   },
//   playButton: {
//     backgroundColor: '#007AFF',
//     paddingVertical: 10,
//     paddingHorizontal: 16,
//     borderRadius: 8,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   stopButton: {
//     backgroundColor: '#FF3B30',
//   },
//   loadingButton: {
//     backgroundColor: '#999',
//   },
//   playButtonText: {
//     color: 'white',
//     fontSize: 14,
//     fontWeight: '600',
//     marginLeft: 8,
//   },
  
//   // Modal styles for age prompt
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   // modalContent: {
//   //   backgroundColor: 'white',
//   //   borderRadius: 16,
//   //   padding: 24,
//   //   width: '90%',
//   //   maxWidth: 400,
//   // },
//   // modalTitle: {
//   //   fontSize: 20,
//   //   fontWeight: 'bold',
//   //   textAlign: 'center',
//   //   marginBottom: 16,
//   //   color: '#333',
//   // },
//   modalText: {
//     fontSize: 16,
//     textAlign: 'center',
//     marginBottom: 20,
//     color: '#666',
//     lineHeight: 22,
//   },
//   ageButton: {
//     backgroundColor: '#4A90E2',
//     paddingVertical: 14,
//     paddingHorizontal: 20,
//     borderRadius: 8,
//     marginBottom: 12,
//   },
//   ageButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: '600',
//     textAlign: 'center',
//   },
//   cancelButton: {
//     backgroundColor: '#f0f0f0',
//     paddingVertical: 14,
//     paddingHorizontal: 20,
//     borderRadius: 8,
//     marginTop: 8,
//   },
//   cancelButtonText: {
//     color: '#333',
//     fontSize: 16,
//     fontWeight: '600',
//     textAlign: 'center',
//   },
// });

// export default App;
import React, {useContext, useEffect, useRef, useState, useCallback} from 'react';
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
} from 'react-native';
import MapView, {
  PROVIDER_GOOGLE,
  Marker,
  Circle,
  PROVIDER_DEFAULT,
} from 'react-native-maps';
import {Dropdown} from 'react-native-element-dropdown';
import AntDesign from '@expo/vector-icons/AntDesign';
import Geolocation, { 
  GeolocationResponse, 
  GeolocationError 
} from '@react-native-community/geolocation';
import {
  GooglePlacesAutocomplete,
  GooglePlacesAutocompleteRef,
} from 'react-native-google-places-autocomplete';
import {Icon} from 'react-native-elements';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Spinner from 'react-native-loading-spinner-overlay';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Voice from '@react-native-voice/voice';
import Sound from 'react-native-sound';
import {AuthContext} from '../context/AuthContext';
import Notification from '../components/Notification';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import { fetchWithAuth } from '../api/auth';

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
  id: number;
  title: string;
  body: string;
  details: string;
  audioUrl: string | null;
  categories?: string[];
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

const App: React.FC<Props> = ({navigation}) => {
  // UI State
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [mainLoading, setMainLoading] = useState(true);
  const [backgroundLoading, setBackgroundLoading] = useState(true);
  
  // Data State
  const [userChildren, setUserChildren] = useState<Child[]>([]);
  const [location, setLocation] = useState<Location | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [details, setDetails] = useState<Array<{title: string; description: string; pinColor: string}>>([]);
  
  // Form State
  const [newLocation, setNewLocation] = useState<Location | null>(null);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  // Status State
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error' | 'disabled'>('loading');
  const [apiStatus, setApiStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [statusMessage, setStatusMessage] = useState<string>('Starting app...');

  // Assistant State
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
  
  // Child detection state
  const [showChildPrompt, setShowChildPrompt] = useState(false);
  const [detectedChildName, setDetectedChildName] = useState<string>('');
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [showAgeInput, setShowAgeInput] = useState(false);
  const [tempAge, setTempAge] = useState<string>('');

  // Refs and context
  const ref = useRef<GooglePlacesAutocompleteRef>(null);
  const {userInfo, isLoading, logout} = useContext<any>(AuthContext);
  const currentSound = useRef<Sound | null>(null);
  const lastResult = useRef<string>('');
  const audioCache = useRef<Map<number, string>>(new Map());

  // Early return if context is loading


  const options = [
    {label: 'Grocery Store', value: 'Grocery Store'},
    {label: 'Bus/Walk', value: 'Bus/Walk'},
    {label: 'Library', value: 'Library'},
    {label: 'Park', value: 'Park'},
    {label: 'Restaurant', value: 'Restaurant'},
    {label: 'Waiting Room', value: 'Waiting Room'},
    {label: "Other's Home", value: "Other's Home"},
  ];

  // Helper functions
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
            title: 'Microphone Permission',
            message: 'This app needs access to your microphone for voice recognition.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
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

  // Assistant API Functions
  const getTips = async (query = searchText, providedAge?: string) => {
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
      }
    }

    try {
      const response = await fetch(`${API_ENDPOINTS.ASSISTANT_BASE_URL}/generate-tips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: finalQuery, 
          contentPreferences: contentPreferences
        })
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      setTips(data.tips);
      setShowTipsModal(true);
      
    } catch (error) {
      console.error('Error fetching tips:', error);
      Alert.alert('Error', 'Failed to fetch tips. Please check your connection and try again.');
    } finally {
      setIsAssistantLoading(false);
    }
  };

  // Cache utilities
  const loadFromCache = async (key: string) => {
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
  };

  const saveToCache = async (key: string, data: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
      console.log(`Cached data for ${key}`);
    } catch (error) {
      console.warn(`Failed to cache ${key}:`, error);
    }
  };

  // Location functions
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
  }, []);

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
  }, [locationStatus]);

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
  }, []);

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
  }, [userInfo]);
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Spinner visible={true} />
        <Text style={styles.loadingText}>Initializing...</Text>
        <Notification />
      </View>
    );
  }
  // Startup initialization
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
          initializeVoice(),
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
      cleanupVoice();
      cleanupSound();
    };
  }, [getQuickLocation, loadCachedDataFirst, improveLocationInBackground, refreshDataInBackground, mainLoading]);

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
          body: JSON.stringify({children: updatedChildren})
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
        ref.current?.clear();
      } catch (error) {
        console.error('Error adding location:', error);
        Alert.alert('Error', 'Failed to add location. Please try again.');
      }
    }
  };

  // Audio functions
  const loadAudio = async (tip: Tip, index: number) => {
    if (audioCache.current.has(tip.id)) {
      return audioCache.current.get(tip.id);
    }

    if (tip.audioUrl) {
      const fullAudioUrl = `${API_ENDPOINTS.ASSISTANT_BASE_URL}/audio${tip.audioUrl}`;
      audioCache.current.set(tip.id, fullAudioUrl);
      return fullAudioUrl;
    }

    setAudioLoadingIndex(index);
    try {
      const response = await fetch(`${API_ENDPOINTS.ASSISTANT_BASE_URL}/generate-tip-audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipId: tip.id,
          title: tip.title,
          body: tip.body,
          details: tip.details
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }

      const { audioUrl } = await response.json();
      const fullAudioUrl = `${API_ENDPOINTS.ASSISTANT_BASE_URL}/audio${audioUrl}`;
      
      tip.audioUrl = audioUrl;
      audioCache.current.set(tip.id, fullAudioUrl);
      
      return fullAudioUrl;
    } catch (error) {
      console.error('Audio generation error:', error);
      Alert.alert('Error', 'Failed to generate audio. Please try again.');
      return null;
    } finally {
      setAudioLoadingIndex(null);
    }
  };

  const speakTip = useCallback(async (tip: Tip, index: number) => {
    cleanupSound();
    setActiveAudioIndex(index);

    try {
      const audioUrl = await loadAudio(tip, index);
      if (!audioUrl) return;

      setIsPlaying(true);

      currentSound.current = new Sound(audioUrl, '', error => {
        if (error) {
          console.error('Failed to load sound:', error);
          Alert.alert('Error', 'Failed to play audio. Please try again.');
          cleanupSound();
          return;
        }

        currentSound.current?.play(success => {
          if (!success) {
            Alert.alert('Error', 'Audio playback failed. Please try again.');
          }
          cleanupSound();
        });
      });
    } catch (error) {
      console.error('Audio playback error:', error);
      cleanupSound();
    }
  }, []);

  // Child prompt handlers
  const handleAddChild = () => {
    setShowChildPrompt(false);
    Alert.alert(
      'Add Child', 
      `You can add ${detectedChildName} to your profile in the Settings menu for personalized age-based tips.`,
      [
        { text: 'Later', style: 'cancel' },
        { text: 'Go to Settings', onPress: () => {
          navigation.navigate('Settings' as never);
        }}
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
      } else {
        // Add to saved
        const updatedSavedTips = [tip, ...savedTips];
        setSavedTips(updatedSavedTips);
        await saveToCache('savedTips', updatedSavedTips);
        Alert.alert('Tip Saved', 'Tip saved for later reference');
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
      } else {
        // Add to liked
        const updatedLikedTips = [tip, ...likedTips];
        setLikedTips(updatedLikedTips);
        await saveToCache('likedTips', updatedLikedTips);
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

  // Periodic location updates
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

  // Render functions
  const renderTipItem = (tip: Tip, index: number, source: 'search' | 'saved' | 'liked' = 'search') => (
    <View key={`${source}-${index}`} style={styles.tipItem}>
      <LinearGradient colors={['#ffffff', '#f8f9fa']} style={styles.tipGradient}>
        <View style={styles.tipHeader}>
          <MaterialIcons name="lightbulb" size={24} color="#FFA726" style={styles.tipIcon} />
          <Text style={styles.tipTitle}>{tip.title || ''}</Text>
        </View>
        <Text style={styles.tipBody}>{tip.body || ''}</Text>
        <Text style={styles.tipDetails}>{tip.details || ''}</Text>
        
        {/* Action buttons row */}
        <View style={styles.tipActions}>
          <TouchableOpacity
            style={[
              styles.playButton,
              activeAudioIndex === index && isPlaying && styles.stopButton,
              audioLoadingIndex === index && styles.loadingButton,
            ]}
            onPress={() => {
              if (activeAudioIndex === index && isPlaying) {
                cleanupSound();
              } else {
                speakTip(tip, index);
              }
            }}
            disabled={audioLoadingIndex === index}>
            {audioLoadingIndex === index ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <MaterialIcons
                name={activeAudioIndex === index && isPlaying ? 'stop' : 'play-arrow'}
                size={16}
                color="white"
              />
            )}
            <Text style={styles.playButtonText}>
              {audioLoadingIndex === index 
                ? 'Loading...' 
                : activeAudioIndex === index && isPlaying 
                ? 'Stop' 
                : 'Play'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, isTipSaved(tip.id) && styles.actionButtonActive]}
            onPress={() => handleSaveTip(tip)}>
            <MaterialIcons
              name={isTipSaved(tip.id) ? 'bookmark' : 'bookmark-border'}
              size={16}
              color={isTipSaved(tip.id) ? '#4A90E2' : '#666'}
            />
            <Text style={[styles.actionButtonText, isTipSaved(tip.id) && styles.actionButtonTextActive]}>
              {isTipSaved(tip.id) ? 'Saved' : 'Save'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, isTipLiked(tip.id) && styles.actionButtonActive]}
            onPress={() => handleLikeTip(tip)}>
            <MaterialIcons
              name={isTipLiked(tip.id) ? 'favorite' : 'favorite-border'}
              size={16}
              color={isTipLiked(tip.id) ? '#FF3B30' : '#666'}
            />
            <Text style={[styles.actionButtonText, isTipLiked(tip.id) && styles.actionButtonTextActive]}>
              {isTipLiked(tip.id) ? 'Liked' : 'Like'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  const TipsModal = () => (
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
        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {tips.map((tip, index) => renderTipItem(tip, index, 'search'))}
          <View style={{height: 20}} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const SavedTipsModal = () => (
    <Modal visible={showSavedTipsModal} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Saved Tips ({savedTips.length})</Text>
          <TouchableOpacity
            style={styles.closeModalButton}
            onPress={() => setShowSavedTipsModal(false)}>
            <MaterialIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {savedTips.length > 0 ? (
            savedTips.map((tip, index) => renderTipItem(tip, index, 'saved'))
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="bookmark-border" size={64} color="#ccc" />
              <Text style={styles.emptyStateTitle}>No Saved Tips</Text>
              <Text style={styles.emptyStateText}>
                Save tips by tapping the bookmark icon on any tip
              </Text>
            </View>
          )}
          <View style={{height: 20}} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const LikedTipsModal = () => (
    <Modal visible={showLikedTipsModal} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Liked Tips ({likedTips.length})</Text>
          <TouchableOpacity
            style={styles.closeModalButton}
            onPress={() => setShowLikedTipsModal(false)}>
            <MaterialIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {likedTips.length > 0 ? (
            likedTips.map((tip, index) => renderTipItem(tip, index, 'liked'))
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="favorite-border" size={64} color="#ccc" />
              <Text style={styles.emptyStateTitle}>No Liked Tips</Text>
              <Text style={styles.emptyStateText}>
                Like tips by tapping the heart icon on any tip
              </Text>
            </View>
          )}
          <View style={{height: 20}} />
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
      
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
              <View style={styles.searchWrapper}>
                <View style={styles.searchContainer}>
                  <GooglePlacesAutocomplete
                    placeholder="Search location..."
                    fetchDetails={true}
                    styles={{
                      container: { flex: 0 },
                      textInputContainer: {
                        backgroundColor: 'white',
                        borderRadius: 12,
                        borderWidth: 0,
                      },
                      textInput: {
                        height: 45,
                        color: '#333',
                        fontSize: 16,
                        borderRadius: 12,
                        paddingHorizontal: 15,
                      },
                      listView: {
                        backgroundColor: 'white',
                        borderRadius: 12,
                        marginTop: 5,
                      },
                      row: { padding: 13, height: 50 },
                    }}
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
                      <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => {
                          ref.current?.clear();
                          setName('');
                          setDescription('');
                          setNewLocation(null);
                          setSelectedOption(null);
                        }}>
                        <Icon name="close" size={20} color="#666" />
                      </TouchableOpacity>
                    )}
                    ref={ref}
                  />
                </View>
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
                <LinearGradient
                  colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.98)']}
                  style={styles.formContainer}>
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
                      <AntDesign style={styles.dropdownLeftIcon} color="#333" name="Safety" size={20} />
                    )}
                  />
                  <TextInput
                    placeholder="Location name"
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholderTextColor="#666"
                  />
                  <TextInput
                    placeholder="Description"
                    style={[styles.input, styles.textArea]}
                    value={description}
                    onChangeText={setDescription}
                    placeholderTextColor="#666"
                    multiline
                    numberOfLines={3}
                  />
                  <TouchableOpacity style={styles.addButton} onPress={addLocation}>
                    <Text style={styles.addButtonText}>Add Location</Text>
                  </TouchableOpacity>
                </LinearGradient>
              )}

              {!newLocation && (
                <LinearGradient
                  colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.98)']}
                  style={styles.welcomeContainer}>
                  <View style={styles.welcomeContent}>
                    <Text style={styles.welcomeTitle}>
                      Welcome, {userInfo?.user?.name || 'User'}
                    </Text>
                    
                    <View style={styles.assistantContainer}>
                      <Text style={styles.assistantTitle}>🤖 Parenting Assistant</Text>
                      <Text style={styles.assistantSubtitle}>Ask any parenting question</Text>
                      
                      {/* Assistant tabs */}
                      <View style={styles.assistantTabs}>
                        <TouchableOpacity
                          style={[styles.assistantTab, assistantView === 'search' && styles.assistantTabActive]}
                          onPress={() => setAssistantView('search')}>
                          <MaterialIcons name="search" size={16} color={assistantView === 'search' ? '#4A90E2' : '#666'} />
                          <Text style={[styles.assistantTabText, assistantView === 'search' && styles.assistantTabTextActive]}>
                            Search
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[styles.assistantTab, assistantView === 'saved' && styles.assistantTabActive]}
                          onPress={() => setAssistantView('saved')}>
                          <MaterialIcons name="bookmark" size={16} color={assistantView === 'saved' ? '#4A90E2' : '#666'} />
                          <Text style={[styles.assistantTabText, assistantView === 'saved' && styles.assistantTabTextActive]}>
                            Saved ({savedTips.length})
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[styles.assistantTab, assistantView === 'liked' && styles.assistantTabActive]}
                          onPress={() => setAssistantView('liked')}>
                          <MaterialIcons name="favorite" size={16} color={assistantView === 'liked' ? '#4A90E2' : '#666'} />
                          <Text style={[styles.assistantTabText, assistantView === 'liked' && styles.assistantTabTextActive]}>
                            Liked ({likedTips.length})
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* Search View */}
                      {assistantView === 'search' && (
                        <>
                          <View style={styles.assistantSearchContainer}>
                            <View style={styles.assistantSearchWrapper}>
                              <MaterialIcons name="search" size={20} color="#666" style={styles.assistantSearchIcon} />
                              <TextInput
                                style={styles.assistantSearchInput}
                                value={searchText}
                                onChangeText={setSearchText}
                                placeholder={isListening ? 'Listening...' : 'Ask a parenting question...'}
                                returnKeyType="search"
                                onSubmitEditing={() => getTips()}
                                editable={!isListening}
                                placeholderTextColor="#999"
                              />
                              {searchText.length > 0 && !isListening && (
                                <TouchableOpacity
                                  style={styles.assistantClearButton}
                                  onPress={() => setSearchText('')}
                                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                  <MaterialIcons name="clear" size={20} color="#999" />
                                </TouchableOpacity>
                              )}
                            </View>
                            <TouchableOpacity
                              style={[styles.assistantMicButton, isListening && styles.assistantMicButtonActive]}
                              onPress={toggleListening}>
                              <MaterialIcons
                                name={isListening ? 'mic-off' : 'mic'}
                                size={20}
                                color="white"
                              />
                            </TouchableOpacity>
                          </View>

                          <TouchableOpacity
                            style={styles.assistantSubmitButton}
                            onPress={() => getTips()}
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
                        </>
                      )}

                      {/* Saved Tips View */}
                      {assistantView === 'saved' && (
                        <View style={styles.assistantContentView}>
                          {savedTips.length > 0 ? (
                            <TouchableOpacity
                              style={styles.assistantViewButton}
                              onPress={() => setShowSavedTipsModal(true)}>
                              <MaterialIcons name="bookmark" size={20} color="white" />
                              <Text style={styles.assistantSubmitText}>View All Saved Tips</Text>
                            </TouchableOpacity>
                          ) : (
                            <View style={styles.assistantEmptyView}>
                              <MaterialIcons name="bookmark-border" size={32} color="#ccc" />
                              <Text style={styles.assistantEmptyText}>No saved tips yet</Text>
                              <Text style={styles.assistantEmptySubtext}>Save tips from search results</Text>
                            </View>
                          )}
                        </View>
                      )}

                      {/* Liked Tips View */}
                      {assistantView === 'liked' && (
                        <View style={styles.assistantContentView}>
                          {likedTips.length > 0 ? (
                            <TouchableOpacity
                              style={styles.assistantViewButton}
                              onPress={() => setShowLikedTipsModal(true)}>
                              <MaterialIcons name="favorite" size={20} color="white" />
                              <Text style={styles.assistantSubmitText}>View All Liked Tips</Text>
                            </TouchableOpacity>
                          ) : (
                            <View style={styles.assistantEmptyView}>
                              <MaterialIcons name="favorite-border" size={32} color="#ccc" />
                              <Text style={styles.assistantEmptyText}>No liked tips yet</Text>
                              <Text style={styles.assistantEmptySubtext}>Like tips from search results</Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>

                    <View style={styles.buttonContainer}>
                      <TouchableOpacity
                        style={[styles.button, styles.locationsButton]}
                        onPress={() => {
                          navigation.navigate('LocationList', { locations, details });
                        }}>
                        <Text style={styles.buttonText}>
                          Locations ({locations.length || 0})
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={logout}>
                        <Text style={styles.buttonText}>Logout</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </LinearGradient>
              )}
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

      <TipsModal />
      <SavedTipsModal />
      <LikedTipsModal />
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
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  searchWrapper: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 16,
  },
  searchContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  clearButton: {
    padding: 12,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  formContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
  },
  dropdownLeftIcon: {
    marginRight: 8,
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
  welcomeContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  welcomeContent: {
    padding: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  assistantContainer: {
    backgroundColor: 'rgba(74, 144, 226, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.1)',
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
  assistantSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  assistantSearchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 12,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  assistantSearchIcon: {
    marginRight: 8,
  },
  assistantSearchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: '#333',
    paddingRight: 30,
  },
  assistantClearButton: {
    position: 'absolute',
    right: 12,
    top: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#FF3B30',
  },
  assistantSubmitButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
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
  
  // Assistant tabs
  assistantTabs: {
    flexDirection: 'row',
    backgroundColor: '#F0F2F5',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  assistantTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  assistantTabActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  assistantTabText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  assistantTabTextActive: {
    color: '#4A90E2',
    fontWeight: '600',
  },
  
  // Assistant content views
  assistantContentView: {
    paddingVertical: 8,
  },
  assistantViewButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  assistantEmptyView: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  assistantEmptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    fontWeight: '500',
  },
  assistantEmptySubtext: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 4,
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
  },
  locationsButton: {
    backgroundColor: '#34C759',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
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