import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Circle, PROVIDER_DEFAULT } from 'react-native-maps';
import { useAppStartup } from '../hooks/useAppStartup';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Spinner from 'react-native-loading-spinner-overlay';
import { AuthContext } from '../context/AuthContext';
import { fetchWithAuth } from '../api/auth';
import Notification from '../components/Notification';
import { useLocationTracking } from '../hooks/useLocationTracking';
import { LocationSearchBar } from '../components/LocationSearchBar';
import { LocationForm } from '../components/LocationForm';
import { Location, SavedLocation, LocationDetail, LocationFormData, ExtendedUserInfo } from '../types';

const LOCATION_UPDATE_INTERVAL = 60000; // 1 minute

interface Props {
  navigation: any; // Replace with proper navigation type
}

// Helper function to get user name from userInfo
const getUserName = (userInfo: ExtendedUserInfo | null): string => {
  if (!userInfo) return 'User';
  
  // Try different possible name properties
  if (userInfo.user?.name) return userInfo.user.name;
  if (userInfo.name) return userInfo.name;
  if (userInfo.email) {
    // Fallback to email prefix if no name is available
    const emailName = userInfo.email.split('@')[0];
    return emailName.charAt(0).toUpperCase() + emailName.slice(1);
  }
  
  return 'User';
};

const ImprovedMapScreen: React.FC<Props> = ({ navigation }) => {
  const { userInfo, logout } = useContext(AuthContext);
  const { location, isLoading: locationLoading, locationError, retryLocation } = useLocationTracking();
  
  const [isLoading, setIsLoading] = useState(false);
  const [newLocation, setNewLocation] = useState<Location | null>(null);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [locationDetails, setLocationDetails] = useState<LocationDetail[]>([]);
  const { startupComplete, startupError, retryStartup, isNetworkAvailable } = useAppStartup();

  const fetchLocations = useCallback(async (retry = 0) => {
    if (!userInfo?.access_token) return;
  
    try {
      setIsLoading(true);
      const response = await fetchWithAuth(
        'http://68.183.102.75:1337/endpoint/locations',
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userInfo.access_token}`,
          },
        }
      );
  
      if (!response.ok) {
        // Retry logic with exponential backoff
        if (retry < 3) {
          const delay = Math.pow(2, retry) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          setIsLoading(false);
          return fetchLocations(retry + 1);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      
      if (Array.isArray(data.locations)) {
        setSavedLocations(data.locations);
        // Cache the locations for offline use
        await AsyncStorage.setItem('cachedLocations', JSON.stringify(data.locations));
      } else {
        console.warn('Expected locations array, got:', typeof data.locations);
        setSavedLocations([]);
      }
      
      if (Array.isArray(data.details)) {
        setLocationDetails(data.details);
        // Cache the details for offline use
        await AsyncStorage.setItem('cachedLocationDetails', JSON.stringify(data.details));
      } else {
        console.warn('Expected details array, got:', typeof data.details);
        setLocationDetails([]);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      
      // Try to load cached data
      try {
        const cachedLocations = await AsyncStorage.getItem('cachedLocations');
        const cachedDetails = await AsyncStorage.getItem('cachedLocationDetails');
        
        if (cachedLocations) {
          setSavedLocations(JSON.parse(cachedLocations));
        }
        
        if (cachedDetails) {
          setLocationDetails(JSON.parse(cachedDetails));
        }
        
        if (!cachedLocations && !cachedDetails) {
          Alert.alert('Error', 'Unable to fetch saved locations. Please try again.');
        }
      } catch (cacheError) {
        Alert.alert('Error', 'Unable to fetch saved locations. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [userInfo?.access_token]);

  const sendLocationToServer = useCallback(async (currentLocation: Location) => {
    if (!userInfo?.access_token || !currentLocation) return;

    try {
      const response = await fetchWithAuth('http://68.183.102.75:1337/endpoint', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.access_token}`,
        },
        body: JSON.stringify({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        }),
      });
      
      if (response.ok) {
        console.log('Location sent to server successfully');
      } else {
        console.warn('Failed to send location to server:', response.status);
      }
    } catch (error) {
      console.error('Error sending location to server:', error);
    }
  }, [userInfo?.access_token]);

  const handleAddLocation = useCallback(async (formData: LocationFormData) => {
    if (!userInfo?.access_token) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetchWithAuth(
        'http://68.183.102.75:1337/endpoint/addLocation',
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userInfo.access_token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        Alert.alert('Success', 'Location added successfully!');
        setNewLocation(null);
        await fetchLocations();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error adding location:', error);
      Alert.alert('Error', 'Failed to add location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [userInfo?.access_token, fetchLocations]);

  const handleLocationSelect = useCallback((selectedLocation: Location) => {
    setNewLocation(selectedLocation);
  }, []);

  const handleClearSelection = useCallback(() => {
    setNewLocation(null);
  }, []);

  const handleShowLocations = useCallback(() => {
    navigation.navigate('LocationList', {
      locations: savedLocations,
      details: locationDetails,
    });
  }, [navigation, savedLocations, locationDetails]);

  const handleRetry = useCallback(() => {
    if (locationError) {
      retryLocation();
    } else {
      fetchLocations();
    }
  }, [locationError, retryLocation, fetchLocations]);

  // Memoized map markers
  const mapMarkers = useMemo(() => {
    return savedLocations.map((loc, index) => (
      <React.Fragment key={`${loc.id}-${index}`}>
        <Marker
          coordinate={loc}
          title={locationDetails[index]?.title || loc.name}
          description={locationDetails[index]?.desription || loc.description}
          pinColor={locationDetails[index]?.pinColor || '#FF4B4B'}
        />
        <Circle
          center={loc}
          radius={100}
          strokeColor="rgba(65, 105, 225, 0.5)"
          fillColor="rgba(65, 105, 225, 0.1)"
          zIndex={2}
        />
      </React.Fragment>
    ));
  }, [savedLocations, locationDetails]);

  // Get appropriate region for map
  const mapRegion = useMemo(() => {
    const baseLocation = newLocation || location;
    if (!baseLocation) return null;
    
    return {
      latitude: baseLocation.latitude,
      longitude: baseLocation.longitude,
      latitudeDelta: baseLocation.latitudeDelta || 0.015,
      longitudeDelta: baseLocation.longitudeDelta || 0.0121,
    };
  }, [newLocation, location]);

  // Effects
  useEffect(() => {
    if (userInfo?.access_token) {
      fetchLocations();
    }
  }, [fetchLocations, userInfo?.access_token]);

  useEffect(() => {
    if (!location) return;

    sendLocationToServer(location);
    const interval = setInterval(() => {
      sendLocationToServer(location);
    }, LOCATION_UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [location, sendLocationToServer]);

  if (!startupComplete) {
    return (
      <SafeAreaView style={styles.startupContainer}>
        <Spinner visible={!startupError} />
        {startupError && (
          <>
            <Text style={styles.startupErrorText}>{startupError}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={retryStartup}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </>
        )}
        <Notification />
      </SafeAreaView>
    );
  }
  
  // Network error component - add after startup check
  if (!isNetworkAvailable) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>
          No internet connection available. Please check your network settings and try again.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={retryStartup}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Error state
  if (locationError && !location) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Unable to access location services. Please check your settings and try again.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Loading state
  if (locationLoading || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Spinner visible={true} />
        <Notification />
      </View>
    );
  }
  const OfflineIndicator = () => {
    if (isNetworkAvailable) return null;
    
    return (
      <View style={styles.offlineIndicator}>
        <Text style={styles.offlineText}>Limited connectivity. Some features may be unavailable.</Text>
      </View>
    );
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <Notification />
      <OfflineIndicator />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
          <SafeAreaView style={styles.safeArea}>
            <LocationSearchBar 
              onLocationSelect={handleLocationSelect}
              onClear={handleClearSelection}
            />

            {mapRegion && (
              <MapView
                provider={Platform.OS === 'ios' ? PROVIDER_DEFAULT : PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={mapRegion}
                region={mapRegion}
                showsUserLocation
                mapType="standard"
                userInterfaceStyle="light"
                showsMyLocationButton={false}
                showsScale={true}>
                {mapMarkers}
              </MapView>
            )}

            {newLocation && (
              <LocationForm
                location={newLocation}
                onSubmit={handleAddLocation}
                existingLocations={savedLocations}
              />
            )}

            {!newLocation && (
              <LinearGradient
                colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.98)']}
                style={styles.welcomeContainer}>
                <View style={styles.welcomeContent}>
                  <Text style={styles.welcomeTitle}>
                    Welcome, {getUserName(userInfo)}
                  </Text>
                  <Text style={styles.welcomeText}>
                    Search for a location to add points of interest for personalized parenting tips.
                  </Text>
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity style={[styles.button, styles.locationsButton]} onPress={handleShowLocations}>
                      <Text style={styles.buttonText}>Show Locations ({savedLocations.length})</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={logout}>
                      <Text style={styles.buttonText}>Logout</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            )}
          </SafeAreaView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20 },
  retryButton: { backgroundColor: '#4A90E2', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  map: { ...StyleSheet.absoluteFillObject },
  welcomeContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  startupContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20 
  },
  startupErrorText: { 
    fontSize: 16, 
    color: '#666', 
    textAlign: 'center', 
    marginBottom: 20,
    marginTop: 20
  },
  offlineIndicator: {
    backgroundColor: '#FFD700',
    padding: 8,
    position: 'absolute',
    top: Platform.OS === 'ios' ? 40 : 30,
    left: 0,
    right: 0,
    zIndex: 100,
    alignItems: 'center'
  },
  offlineText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500'
  },
  welcomeContent: { padding: 20 },
  welcomeTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  welcomeText: { fontSize: 16, color: '#666', marginBottom: 20, lineHeight: 22 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  button: { flex: 1, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginHorizontal: 6 },
  locationsButton: { backgroundColor: '#34C759' },
  logoutButton: { backgroundColor: '#FF3B30' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});

export default ImprovedMapScreen;