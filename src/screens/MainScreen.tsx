import React, {useContext, useEffect, useRef, useState} from 'react';
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

// Constants for better maintainability
const LOCATION_CONFIG = {
  TIMEOUTS: {
    NORMAL: 15000,
    BACKGROUND: 60000,
    RETRY: 10000,
    LOADING_TIMEOUT: 45000,
  },
  INTERVALS: {
    LOCATION_UPDATE: 30000,
  },
  ACCURACY: {
    HIGH: true,
    DISTANCE_THRESHOLD: 100, // meters
  },
  DELTAS: {
    LATITUDE: 0.015,
    LONGITUDE: 0.0121,
  },
  CACHE_KEYS: {
    LAST_LOCATION: 'lastKnownLocation',
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

type MainTabParamList = {
  Home: undefined;
  Assistant: undefined;
  LocationList: LocationListProps;
};

interface LocationListProps {
  locations: any;
  details: any;
  navigation?: any;
}

interface Props {
  navigation: NativeStackNavigationProp<MainTabParamList>;
}

interface Location {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface Child {
  id: number;
  age: number;
  nickname?: string;
  date_of_birth?: string;
}

// Enhanced error logging
const logLocationError = (error: GeolocationError, context: string) => {
  const errorMessages = {
    1: 'Permission denied',
    2: 'Position unavailable', 
    3: 'Timeout',
  };
  
  console.error(`Location error (${context}):`, {
    code: error.code,
    message: errorMessages[error.code as keyof typeof errorMessages] || error.message,
    timestamp: new Date().toISOString(),
  });
};

// Location caching utilities
const cacheLocation = async (location: Location) => {
  try {
    await AsyncStorage.setItem(LOCATION_CONFIG.CACHE_KEYS.LAST_LOCATION, JSON.stringify(location));
    console.log('Location cached successfully');
  } catch (error) {
    console.error('Error caching location:', error);
  }
};

const loadCachedLocation = async (): Promise<Location | null> => {
  try {
    const cached = await AsyncStorage.getItem(LOCATION_CONFIG.CACHE_KEYS.LAST_LOCATION);
    if (cached) {
      const location = JSON.parse(cached);
      console.log('Loaded cached location:', location);
      return location;
    }
  } catch (error) {
    console.error('Error loading cached location:', error);
  }
  return null;
};

const App: React.FC<Props> = ({navigation}) => {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [userChildren, setUserChildren] = useState<Child[]>([]);
  const [location, setLocation] = useState<Location | null>(null);
  const ref = useRef<GooglePlacesAutocompleteRef>(null);
  const {userInfo, isLoading, logout} = useContext<any>(AuthContext);
  const [loading, setLoading] = useState<boolean>(true);
  const [newLocation, setNewLocation] = useState<Location | null>(null);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const {aiTips, setAITips} = useContext<any>(AuthContext);
  
  // Fixed typo: desription -> description
  const [details, setDetails] = useState<
    Array<{title: string; description: string; pinColor: string}>
  >([]);

  const options = [
    {label: 'Grocery Store', value: 'Grocery Store'},
    {label: 'Bus/Walk', value: 'Bus/Walk'},
    {label: 'Library', value: 'Library'},
    {label: 'Park', value: 'Park'},
    {label: 'Restaurant', value: 'Restaurant'},
    {label: 'Waiting Room', value: 'Waiting Room'},
    {label: "Other's Home", value: "Other's Home"},
  ];

  // Enhanced fetchCurrentLocation with caching
  const fetchCurrentLocation = async (fromBackground = false): Promise<Location | null> => {
    const timeoutValue = fromBackground ? LOCATION_CONFIG.TIMEOUTS.BACKGROUND : LOCATION_CONFIG.TIMEOUTS.NORMAL;
    
    console.log(`Fetching location with timeout: ${timeoutValue}ms, fromBackground: ${fromBackground}`);
    
    // Load cached location first for immediate UI update
    if (!location) {
      const cached = await loadCachedLocation();
      if (cached) {
        setLocation(cached);
        console.log('Using cached location while fetching fresh location');
      }
    }
    
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position: GeolocationResponse) => {
          const {latitude, longitude} = position.coords;
          const newLocation = {
            latitude,
            longitude,
            latitudeDelta: LOCATION_CONFIG.DELTAS.LATITUDE,
            longitudeDelta: LOCATION_CONFIG.DELTAS.LONGITUDE,
          };
          
          setLocation(newLocation);
          setLoading(false);
          cacheLocation(newLocation);
          
          console.log('Current location set successfully:', newLocation);
          resolve(newLocation);
        },
        (error: GeolocationError) => {
          logLocationError(error, fromBackground ? 'background' : 'foreground');
          
          if (fromBackground) {
            console.log('Retrying location fetch with shorter timeout...');
            setTimeout(() => {
              Geolocation.getCurrentPosition(
                (position: GeolocationResponse) => {
                  const {latitude, longitude} = position.coords;
                  const newLocation = {
                    latitude,
                    longitude,
                    latitudeDelta: LOCATION_CONFIG.DELTAS.LATITUDE,
                    longitudeDelta: LOCATION_CONFIG.DELTAS.LONGITUDE,
                  };
                  setLocation(newLocation);
                  setLoading(false);
                  cacheLocation(newLocation);
                  console.log('Location obtained on retry');
                  resolve(newLocation);
                },
                (retryError: GeolocationError) => {
                  logLocationError(retryError, 'retry');
                  if (AppState.currentState === 'active') {
                    Alert.alert(
                      'Location Error',
                      'Unable to get your location. Please check your GPS settings and try again.',
                      [
                        {
                          text: 'Try Again',
                          onPress: () => fetchCurrentLocation(false)
                        },
                        {
                          text: 'OK',
                          style: 'cancel'
                        }
                      ]
                    );
                  }
                  setLoading(false);
                  reject(retryError);
                },
                {
                  enableHighAccuracy: false, 
                  timeout: LOCATION_CONFIG.TIMEOUTS.RETRY, 
                  maximumAge: 60000
                }
              );
            }, 1000);
          } else {
            if (AppState.currentState === 'active') {
              Alert.alert('Location Services Error', 'Please check your GPS settings.');
            }
            setLoading(false);
            reject(error);
          }
        },
        {
          enableHighAccuracy: LOCATION_CONFIG.ACCURACY.HIGH,
          timeout: timeoutValue,
          maximumAge: fromBackground ? 0 : 10000
        }
      );
    });
  };

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

  const setupLocation = async () => {
    if (Platform.OS === 'ios') {
      Geolocation.requestAuthorization();
      await fetchCurrentLocation();
    } else if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          await fetchCurrentLocation();
        } else {
          Alert.alert('Location permission denied');
          setLoading(false);
        }
      } catch (err) {
        console.warn('Permission request error:', err);
        setLoading(false);
      }
    }
  };

  const checkChildrenInfo = async () => {
    try {
      const response = await fetchWithAuth(
        `${API_ENDPOINTS.BASE_URL}${API_ENDPOINTS.CHILDREN}`,
        {
          headers: {
            Authorization: `Bearer ${userInfo.access_token}`,
          },
        },
      );
      const data = await response.json();

      if (
        data.children.some(
          (child: any) => !child.nickname || !child.date_of_birth,
        )
      ) {
        setUserChildren(data.children);
        setShowUpdateModal(true);
      }
    } catch (error) {
      console.error('Error checking children info:', error);
    }
  };

  // Add loading timeout to prevent infinite loading
  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn('Location loading timed out after 45 seconds');
        setLoading(false);
        Alert.alert(
          'Location Timeout', 
          'Taking longer than expected to get your location. You can continue using the app.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    }, LOCATION_CONFIG.TIMEOUTS.LOADING_TIMEOUT);

    return () => clearTimeout(loadingTimeout);
  }, [loading]);

  useEffect(() => {
    checkChildrenInfo();
    setupLocation();
    fetchLocations();

    const intervalId = setInterval(fetchLocationAndSendData, LOCATION_CONFIG.INTERVALS.LOCATION_UPDATE);
    return () => clearInterval(intervalId);
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(
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
      const jsonResponse = await response.json();
      console.log('Fetched locations:', jsonResponse);

      if (Array.isArray(jsonResponse.locations)) {
        setLocations(jsonResponse.locations);
      } else {
        console.error('Locations is not an array:', jsonResponse.locations);
        setLocations([]);
      }

      if (Array.isArray(jsonResponse.details)) {
        setDetails(jsonResponse.details);
      } else {
        console.error('Details is not an array:', jsonResponse.details);
        setDetails([]);
      }

      // Request location permission and fetch current location
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Location permission denied');
          setLoading(false);
          return;
        }
      }

      Geolocation.getCurrentPosition(
        position => {
          const {latitude, longitude} = position.coords;
          const newLocation = {
            latitude,
            longitude,
            latitudeDelta: LOCATION_CONFIG.DELTAS.LATITUDE,
            longitudeDelta: LOCATION_CONFIG.DELTAS.LONGITUDE,
          };
          setLocation(newLocation);
          cacheLocation(newLocation);
          setLoading(false);
        },
        error => {
          logLocationError(error, 'fetchLocations');
          Alert.alert('Error', 'Unable to fetch location');
          setLoading(false);
        },
        {
          enableHighAccuracy: true, 
          timeout: LOCATION_CONFIG.TIMEOUTS.NORMAL, 
          maximumAge: 10000
        },
      );
    } catch (error) {
      setLoading(false);
      console.error('Error fetching locations:', error);
      Alert.alert('Error', 'Unable to fetch locations');
    }
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const isLocationNearby = (newLat: number, newLon: number) => {
    return locations.some(loc => {
      const distance = calculateDistance(
        newLat,
        newLon,
        loc.latitude,
        loc.longitude,
      );
      return distance <= LOCATION_CONFIG.ACCURACY.DISTANCE_THRESHOLD;
    });
  };

  const addLocation = async () => {
    console.log('Add location');
    if (name === '' || description === '' || !selectedOption) {
      Alert.alert('Missing Information', 'Please enter a title, description, and select a location type.');
      return;
    }
    
    if (newLocation) {
      if (isLocationNearby(newLocation.latitude, newLocation.longitude)) {
        Alert.alert(
          'Duplicate Location',
          `A location already exists within ${LOCATION_CONFIG.ACCURACY.DISTANCE_THRESHOLD} meters of this point. Please choose a different location.`,
        );
        return;
      }

      try {
        setLoading(true);
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
        
        setLoading(false);
        await fetchLocations();
        Alert.alert('Success', 'Location added successfully!');
        console.log('Location added:', response.status);
        
        // Reset form
        setNewLocation(null);
        setName('');
        setDescription('');
        setSelectedOption(null);
        ref.current?.clear();
      } catch (error) {
        console.error('Error adding location:', error);
        setLoading(false);
        Alert.alert('Error', 'Failed to add location. Please try again.');
      }
    }
  };

  const fetchLocationAndSendData = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to your location.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      
      const backgroundGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
        {
          title: 'Background Location Permission',
          message: 'This app needs access to your location in the background',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      
      if (backgroundGranted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Background location permission granted');
      } else {
        console.log('Background location permission denied');
      }
      
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('Location permission denied');
        return;
      }
    }
  
    const getCurrentPositionPromise = (): Promise<GeolocationResponse> => {
      return new Promise((resolve, reject) => {
        const isFromBackground = AppState.currentState !== 'active';
        const timeoutValue = isFromBackground ? LOCATION_CONFIG.TIMEOUTS.BACKGROUND : LOCATION_CONFIG.TIMEOUTS.NORMAL;
        
        Geolocation.getCurrentPosition(
          (position: GeolocationResponse) => resolve(position),
          (error: GeolocationError) => reject(error),
          {
            enableHighAccuracy: true,
            timeout: timeoutValue,
            maximumAge: isFromBackground ? 0 : 10000
          }
        );
      });
    };
  
    try {
      const position = await getCurrentPositionPromise();
      const {latitude, longitude} = position.coords;
      
      const newLocation = {
        latitude,
        longitude,
        latitudeDelta: LOCATION_CONFIG.DELTAS.LATITUDE,
        longitudeDelta: LOCATION_CONFIG.DELTAS.LONGITUDE,
      };
      
      setLocation(newLocation);
      cacheLocation(newLocation);
      
      if (loading) setLoading(false);
      
      // Send location data to server
      try {
        const response = await fetchWithAuth(`${API_ENDPOINTS.BASE_URL}${API_ENDPOINTS.SEND_LOCATION}`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userInfo.access_token}`,
          },
          body: JSON.stringify({
            latitude,
            longitude,
          }),
        });
        console.log('Data sent to server:', response.status);
      } catch (error) {
        console.error('Error sending location data:', error);
      }
    } catch (error) {
      logLocationError(error as GeolocationError, 'fetchLocationAndSendData');
      
      if (AppState.currentState === 'active') {
        Alert.alert('Error', 'Unable to fetch location');
      }
    }
  };

  useEffect(() => {
    const appStateSubscription = AppState.addEventListener('change', nextAppState => {
      console.log('App state changed to:', nextAppState);
      
      if (nextAppState === 'active') {
        console.log('App is now active - refreshing location');
        fetchCurrentLocation(true);
      }
    });

    fetchLocations();
    console.log('fetchLocations called');
    const intervalId = setInterval(fetchLocationAndSendData, LOCATION_CONFIG.INTERVALS.LOCATION_UPDATE);
    
    return () => {
      appStateSubscription.remove();
      clearInterval(intervalId);
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Spinner visible={loading} />
        <Notification />
      </View>
    );
  }

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <Notification />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
              {/* Search Bar with Shadow */}
              <View style={styles.searchWrapper}>
                <View style={styles.searchContainer}>
                  <GooglePlacesAutocomplete
                    placeholder="Search location..."
                    fetchDetails={true}
                    styles={{
                      container: {
                        flex: 0,
                      },
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
                      row: {
                        padding: 13,
                        height: 50,
                      },
                    }}
                    onPress={(data, details = null) => {
                      console.log('Location selected:', data);
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
                    onFail={error => console.error('Places API Error:', error)}
                    onNotFound={() => console.log('No results found')}
                    query={{
                      key: 'AIzaSyBczo2yBRbSwa4IVQagZKNfTje0JJ_HEps',
                      language: 'en',
                    }}
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
                    provider={
                      Platform.OS === 'ios' ? PROVIDER_DEFAULT : PROVIDER_GOOGLE
                    }
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
                          radius={LOCATION_CONFIG.ACCURACY.DISTANCE_THRESHOLD}
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
                    inputSearchStyle={styles.dropdownSearch}
                    iconStyle={styles.dropdownIcon}
                    data={options}
                    maxHeight={300}
                    labelField="label"
                    valueField="value"
                    placeholder="Select location type"
                    searchPlaceholder="Search..."
                    value={selectedOption}
                    onChange={item => setSelectedOption(item.value)}
                    renderLeftIcon={() => (
                      <AntDesign
                        style={styles.dropdownLeftIcon}
                        color="#333"
                        name="Safety"
                        size={20}
                      />
                    )}
                  />
                  <TextInput
                    placeholder="Location name"
                    style={styles.input}
                    value={name}
                    onChange={e => setName(e.nativeEvent.text)}
                    placeholderTextColor="#666"
                  />
                  <TextInput
                    placeholder="Description"
                    style={[styles.input, styles.textArea]}
                    value={description}
                    onChange={e => setDescription(e.nativeEvent.text)}
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
                      Search for a location on the map and follow the instructions
                      to add a point of interest for personalized parenting tips.
                    </Text>
                    <View style={styles.buttonContainer}>
                      <TouchableOpacity
                        style={[styles.button, styles.aiButton]}
                        onPress={() => {
                          console.log('Navigating to LocationList with:', { locations, details });
                          navigation.navigate('LocationList', {
                            locations: locations,
                            details: details,
                          });
                        }}>
                        <Text style={styles.buttonText}>
                          Show Locations ({locations.length})
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.button, styles.logoutButton]}
                        onPress={logout}>
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
  dropdownSearch: {
    height: 40,
    fontSize: 16,
    borderRadius: 8,
  },
  dropdownIcon: {
    width: 20,
    height: 20,
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
    marginBottom: 20,
    lineHeight: 22,
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