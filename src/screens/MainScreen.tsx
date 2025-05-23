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
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  AppState,
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
import Spinner from 'react-native-loading-spinner-overlay';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import {AuthContext} from '../context/AuthContext';
import Notification from '../components/Notification';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import { fetchWithAuth } from '../api/auth';

// Fast startup configuration - prioritize UI over data accuracy
const STARTUP_CONFIG = {
  // Maximum time to show loading screen before showing UI
  MAX_STARTUP_TIME: 8000, // 8 seconds max
  
  // Time to wait for critical operations before showing UI anyway
  CRITICAL_OPERATIONS_TIMEOUT: 5000, // 5 seconds
  
  // Background operations can continue after UI loads
  BACKGROUND_TIMEOUT: 30000, // 30 seconds for background tasks
  
  // Quick location timeout for startup
  QUICK_LOCATION_TIMEOUT: 3000, // 3 seconds for initial location
};

const LOCATION_CONFIG = {
  TIMEOUTS: {
    QUICK: 3000,      // For startup - fail fast
    NORMAL: 15000,    // For user-initiated requests
    BACKGROUND: 30000, // For background updates
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
  LOCATIONS: '/endpoint/locations',
  ADD_LOCATION: '/endpoint/addLocation',
  SEND_LOCATION: '/endpoint',
  CHILDREN: '/endpoint/children',
  UPDATE_CHILDREN: '/endpoint/updateChildren',
};

// Default location (fallback)
const DEFAULT_LOCATION = {
  latitude: 37.7749,    // San Francisco
  longitude: -122.4194,
  latitudeDelta: LOCATION_CONFIG.DELTAS.LATITUDE,
  longitudeDelta: LOCATION_CONFIG.DELTAS.LONGITUDE,
};

// Define the Props type
interface Props {
  navigation: NativeStackNavigationProp<any>;
}

const App: React.FC<Props> = ({navigation}) => {
  // UI State
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [mainLoading, setMainLoading] = useState(true); // Main app loading
  const [backgroundLoading, setBackgroundLoading] = useState(true); // Background operations
  
  // Data State
  interface Child {
    nickname: string;
    date_of_birth: string;
  }

  const [userChildren, setUserChildren] = useState<Child[]>([]);
  // Define the Location type
  interface Location {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }
  
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

  const ref = useRef<GooglePlacesAutocompleteRef>(null);
  const {userInfo, isLoading, logout} = useContext<any>(AuthContext);
  const {aiTips, setAITips} = useContext<any>(AuthContext);

  const options = [
    {label: 'Grocery Store', value: 'Grocery Store'},
    {label: 'Bus/Walk', value: 'Bus/Walk'},
    {label: 'Library', value: 'Library'},
    {label: 'Park', value: 'Park'},
    {label: 'Restaurant', value: 'Restaurant'},
    {label: 'Waiting Room', value: 'Waiting Room'},
    {label: "Other's Home", value: "Other's Home"},
  ];

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

  // Fast location fetch with immediate fallback
  const getQuickLocation = useCallback(async (): Promise<Location> => {
    console.log('Getting quick location...');
    
    // First, try to load cached location immediately
    const cached = await loadFromCache(LOCATION_CONFIG.CACHE_KEYS.LAST_LOCATION);
    if (cached && cached.latitude && cached.longitude) {
      console.log('Using cached location for quick startup');
      setLocationStatus('success');
      return cached;
    }

    // Try to get fresh location with short timeout
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
          
          // Cache the new location
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
          enableHighAccuracy: false, // Faster but less accurate for startup
          timeout: STARTUP_CONFIG.QUICK_LOCATION_TIMEOUT - 500,
          maximumAge: 60000, // Accept cached location up to 1 minute old
        }
      );
    });
  }, []);

  // Background location improvement
  const improveLocationInBackground = useCallback(async () => {
    if (locationStatus === 'success') {
      console.log('Location already good, skipping background improvement');
      return;
    }

    console.log('Improving location in background...');
    
    // Request permissions properly
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

    // Get high-accuracy location
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

  // Fast API data loading with cache fallback
  const loadCachedDataFirst = useCallback(async () => {
    console.log('Loading cached data first...');
    
    try {
      // Load cached locations
      const cachedLocations = await loadFromCache(LOCATION_CONFIG.CACHE_KEYS.USER_LOCATIONS);
      if (cachedLocations) {
        console.log('Loaded cached locations');
        setLocations(cachedLocations.locations || []);
        setDetails(cachedLocations.details || []);
      }

      // Load cached children info
      const cachedChildren = await loadFromCache(LOCATION_CONFIG.CACHE_KEYS.CHILDREN_INFO);
      if (cachedChildren) {
        console.log('Loaded cached children info');
        setUserChildren(cachedChildren);
      }
    } catch (error) {
      console.warn('Failed to load cached data:', error);
    }
  }, []);

  // Background API calls
  const refreshDataInBackground = useCallback(async () => {
    if (!userInfo?.access_token) {
      console.log('No auth token, skipping API calls');
      setApiStatus('error');
      return;
    }

    console.log('Refreshing data in background...');
    
    try {
      // Fetch locations in background
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
            
            // Cache the fresh data
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

      // Fetch children info in background
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
            if (data.children.some((child: any) => !child.nickname || !child.date_of_birth)) {
              setUserChildren(data.children);
              setShowUpdateModal(true);
            }
            
            // Cache the fresh data
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

      // Wait for both with timeout
      const results = await Promise.allSettled([
        Promise.race([locationsPromise, new Promise(resolve => setTimeout(() => resolve(false), 10000))]),
        Promise.race([childrenPromise, new Promise(resolve => setTimeout(() => resolve(false), 10000))]),
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

  // Fast startup initialization
  useEffect(() => {
    let mounted = true;
    
    const startupSequence = async () => {
      console.log('=== FAST STARTUP SEQUENCE BEGIN ===');
      
      try {
        // Step 1: Load cached data immediately (non-blocking)
        await loadCachedDataFirst();
        
        // Step 2: Get location quickly (with fallback)
        setStatusMessage('Getting your location...');
        const quickLocation = await getQuickLocation();
        
        if (mounted) {
          setLocation(quickLocation);
          console.log('Quick location set:', quickLocation);
        }
        
        // Step 3: Show main UI quickly
        setStatusMessage('Loading interface...');
        
        // Small delay to let UI render
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (mounted) {
          console.log('Showing main UI');
          setMainLoading(false); // SHOW MAIN UI NOW
        }
        
        // Step 4: Continue background operations
        console.log('Starting background operations...');
        
        // These run in background after UI is shown
        Promise.allSettled([
          improveLocationInBackground(),
          refreshDataInBackground(),
        ]).then(() => {
          if (mounted) {
            console.log('Background operations completed');
            setBackgroundLoading(false);
          }
        });
        
      } catch (error) {
        console.error('Startup sequence error:', error);
        
        if (mounted) {
          // Even if something fails, show the UI
          setLocation(DEFAULT_LOCATION);
          setMainLoading(false);
          setBackgroundLoading(false);
        }
      }
      
      console.log('=== FAST STARTUP SEQUENCE END ===');
    };

    startupSequence();

    // Failsafe: Always show UI after max startup time
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
    };
  }, [getQuickLocation, loadCachedDataFirst, improveLocationInBackground, refreshDataInBackground, mainLoading]);

  // Existing methods (keeping your current implementation)
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
          body: JSON.stringify({children: updatedChildren}),
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
              type: selectedOption,
            }),
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

  // Periodic location updates (existing logic)
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
              longitude: location.longitude,
            }),
          });
        } catch (error) {
          console.warn('Location update failed:', error);
        }
      }
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [location, userInfo]);

  // Show loading screen only briefly
  if (mainLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Spinner visible={true} />
        <Text style={styles.loadingText}>{statusMessage}</Text>
        <Text style={styles.loadingSubtext}>
          {Date.now() % 2000 < 1000 ? 'Almost ready...' : 'Just a moment...'}
        </Text>
        <Notification />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <Notification />
      
      {/* Background loading indicator */}
      {backgroundLoading && (
        <View style={styles.backgroundLoadingBanner}>
          <View style={styles.backgroundLoadingContent}>
            <Text style={styles.backgroundLoadingText}>🔄 Refreshing data...</Text>
            <Text style={styles.backgroundLoadingSubtext}>
              Location: {locationStatus === 'success' ? '✓' : locationStatus === 'loading' ? '⏳' : '⚠️'} | 
              Data: {apiStatus === 'success' ? '✓' : apiStatus === 'loading' ? '⏳' : '⚠️'}
            </Text>
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
              {/* Search Bar */}
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

              {/* Map Container */}
              <View style={styles.mapContainer}>
                {location && (
                  <MapView
                    provider={Platform.OS === 'ios' ? PROVIDER_DEFAULT : PROVIDER_GOOGLE}
                    style={styles.map}
                    initialRegion={location}
                    region={newLocation || location}
                    showsUserLocation
                    mapType="standard"
                    userInterfaceStyle="light">
                    {locations.map((loc, index) => (
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

              {/* Location Form */}
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

              {/* Welcome Card */}
              {!newLocation && (
                <LinearGradient
                  colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.98)']}
                  style={styles.welcomeContainer}>
                  <View style={styles.welcomeContent}>
                    <Text style={styles.welcomeTitle}>
                      Welcome, {userInfo?.user?.name || 'User'}
                    </Text>
                    <Text style={styles.welcomeText}>
                      Search for a location and add points of interest for personalized parenting tips.
                    </Text>
                    
                    {/* Status indicators */}
                    <View style={styles.statusContainer}>
                      <Text style={styles.statusText}>
                        📍 Location: {locationStatus === 'success' ? 'Ready' : 
                                    locationStatus === 'loading' ? 'Getting...' : 
                                    locationStatus === 'disabled' ? 'Disabled' : 'Using default'}
                      </Text>
                      <Text style={styles.statusText}>
                        🔄 Data: {apiStatus === 'success' ? 'Current' : 
                                  apiStatus === 'loading' ? 'Refreshing...' : 'Using cached'}
                      </Text>
                    </View>

                    <View style={styles.buttonContainer}>
                      <TouchableOpacity
                        style={[styles.button, styles.aiButton]}
                        onPress={() => {
                          navigation.navigate('LocationList', { locations, details });
                        }}>
                        <Text style={styles.buttonText}>
                          Show Locations ({locations.length})
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
  backgroundLoadingSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
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
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
    lineHeight: 22,
  },
  statusContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#4A90E2',
    marginBottom: 4,
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
  aiButton: {
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
});

export default App;