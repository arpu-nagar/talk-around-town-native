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
  Pressable,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import MapView, {PROVIDER_GOOGLE, Marker, Circle, PROVIDER_DEFAULT} from 'react-native-maps';
import {Dropdown} from 'react-native-element-dropdown';
import AntDesign from '@expo/vector-icons/AntDesign';
import Geolocation from '@react-native-community/geolocation';

import {
  GooglePlacesAutocomplete,
  GooglePlacesAutocompleteRef,
} from 'react-native-google-places-autocomplete';
import {Icon} from 'react-native-elements';
import Spinner from 'react-native-loading-spinner-overlay';
import {AuthContext} from '../context/AuthContext';
import RemoteNotification from '../components/RemoteNotification';
import LinearGradient from 'react-native-linear-gradient';

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
const App: React.FC = () => {

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [userChildren, setUserChildren] = useState<Child[]>([]);

  const [location, setLocation] = useState<Location | null>();
  const ref = useRef<GooglePlacesAutocompleteRef>(null);
  const {userInfo, isLoading, logout} = useContext<any>(AuthContext);
  // add a loader state variable
  const [loading, setLoading] = useState<boolean>(true);
  // const [pinged, SetPinged] = useState<boolean>(false);
  const [newLocation, setNewLocation] = useState<Location | null>(null);
  
  // a state variable for name and description
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const { aiTips, setAITips } = useContext<any>(AuthContext);
  const [details, setDetails] = useState<
    Array<{title: string; desription: string; pinColor: string}>
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

  const fetchCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude} = position.coords;
        const newLocation = {
          latitude,
          longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.0121,
        };
        setLocation(newLocation);
        setLoading(false);
        console.log('Current location set:', newLocation);
      },
      error => {
        console.error('Error getting current position:', error);
        Alert.alert('Error', 'Unable to fetch current location');
        setLoading(false);
      },
      {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000}
    );
  };

  const handleUpdateChildren = async (updatedChildren: any[]) => {
    try {
      const response = await fetch(
        'http://68.183.102.75:1337/endpoint/updateChildren',
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userInfo.access_token}`,
          },
          body: JSON.stringify({ children: updatedChildren }),
        },
      );
      
      if (!response.ok) {
        throw new Error('Failed to update children');
      }
      
      // Optionally refresh user data here
      Alert.alert('Success', 'Children information updated successfully');
    } catch (error) {
      console.error('Error updating children:', error);
      Alert.alert('Error', 'Failed to update children information');
    }
  };

  useEffect(() => {
    const setupLocation = async () => {
      if (Platform.OS === 'ios') {
        Geolocation.requestAuthorization();
        fetchCurrentLocation();
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
            fetchCurrentLocation();
          } else {
            Alert.alert('Location permission denied');
          }
        } catch (err) {
          console.warn(err);
        }
      }
    };
    const checkChildrenInfo = async () => {
      try {
        const response = await fetch(
          'http://68.183.102.75:1337/endpoint/children',
          {
            headers: {
              Authorization: `Bearer ${userInfo.access_token}`,
            },
          },
        );
        const data = await response.json();
        
        if (data.children.some(
          (child: any) => !child.nickname || !child.date_of_birth
        )) {
          setUserChildren(data.children);
          setShowUpdateModal(true);
        }
      } catch (error) {
        console.error('Error checking children info:', error);
      }
    };
  
    checkChildrenInfo();
    setupLocation();
    fetchLocations();
    
    const intervalId = setInterval(fetchLocationAndSendData, 30000);
    return () => clearInterval(intervalId);
  }, []);
  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://68.183.102.75:1337/endpoint/locations', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.access_token}`,
        },
      });
      const jsonResponse = await response.json();
      console.log(jsonResponse);
      
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
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
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
          setLocation({
            latitude,
            longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.0121,
          });
          setLoading(false);
        },
        error => {
          console.error('Error getting current position:', error);
          Alert.alert('Error', 'Unable to fetch location');
          setLoading(false);
        },
        {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000}
      );
    } catch (error) {
      setLoading(false);
      console.error('Error fetching locations:', error);
      Alert.alert('Error', 'Unable to fetch locations');
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
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

  // Function to check if location already exists
  const isLocationNearby = (newLat: number, newLon: number) => {
    const threshold = 100; // 100 meters radius
    return locations.some(loc => {
      const distance = calculateDistance(
        newLat,
        newLon,
        loc.latitude,
        loc.longitude
      );
      return distance <= threshold;
    });
  };


  const addLocation = async () => {
    console.log('Add location');
    if (name === '' || description === '' || !selectedOption) {
      Alert.alert('Please enter a title and description');
      return;
    }
    if (newLocation) {
      // Check if location already exists nearby
      if (isLocationNearby(newLocation.latitude, newLocation.longitude)) {
        Alert.alert(
          'Duplicate Location',
          'A location already exists within 100 meters of this point. Please choose a different location.'
        );
        return;
      }
      // make an HTTP POST request to endpoint: http://68.183.102.75:1337/endpoint/addLocation
      // with the following data: {latitude: newLocation.latitude, longitude: newLocation.longitude, name, description}

      try {
        setLoading(true);
        const response = await fetch(
          'http://68.183.102.75:1337/endpoint/addLocation',
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
        setLoading(false);
        fetchLocations();
        Alert.alert('Location added!');
        console.log('Location added:', response.status);
        // Reset form
        setNewLocation(null);
        setName('');
        setDescription('');
        setSelectedOption(null);
      } 
      catch (error) {
        console.error('Error adding location:', error);
        Alert.alert('Error', 'Failed to add location. Please try again.');
      }
      setNewLocation(null);
      setName('');
      setDescription('');
      setSelectedOption(null);
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
    Geolocation.getCurrentPosition(
      async position => {
        // console.log(position);
        const {latitude, longitude} = position.coords;
        console.log(latitude, longitude);
        setLocation({
          latitude,
          longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.0121,
        });

        if (loading) setLoading(false);
        // Now send the location data to your server
        try {
          const response = await fetch('http://68.183.102.75:1337/endpoint', {
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
          // const jsonResponse = await response.json();
          console.log('Data sent to server:', response.status);
        } catch (error) {
          console.error('Error sending location data:', error);
        }
      },
      error => {
        Alert.alert('Error', 'Unable to fetch location');
        console.log(error);
      },
      {enableHighAccuracy: true, timeout: 60000, maximumAge: 0},
    );
  };

  useEffect(() => {
    fetchLocations();
    console.log('fetchLocations called');
    const intervalId = setInterval(fetchLocationAndSendData, 30000);
    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return (
      <View>
        <Spinner visible={loading} />
        <RemoteNotification />
      </View>
    );
  }

  
  return (
    <>
      <RemoteNotification />
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Location Finder</Text>
            <Text style={styles.headerSubtitle}>Discover and add places of interest</Text>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <GooglePlacesAutocomplete
              placeholder="Search locations..."
              fetchDetails={true}
              styles={{
                container: styles.searchBarContainer,
                textInputContainer: styles.searchInputContainer,
                textInput: styles.searchInput,
                listView: styles.searchListView,
                row: styles.searchRow,
                description: styles.searchDescription,
              }}
              onPress={(data, details = null) => {
                if (details) {
                  const latitude = details.geometry.location.lat;
                  const longitude = details.geometry.location.lng;
                  setNewLocation({
                    latitude,
                    longitude,
                    latitudeDelta: 0.015,
                    longitudeDelta: 0.0121,
                  });
                }
              }}
              query={{
                key: 'AIzaSyDBAL_WlpNc9Jvmtx6OPszKr30cJe3Kwew',
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
                  }}>
                  <Icon name="close" size={20} color="#666" />
                </TouchableOpacity>
              )}
              ref={ref}
            />
          </View>

          {/* Content Container */}
          <View style={styles.contentContainer}>
            {/* Map */}
            {location && (
              <MapView
                provider={Platform.OS === 'ios' ? PROVIDER_DEFAULT : PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={location}
                region={newLocation || location}
                showsUserLocation
                mapType="standard"
                userInterfaceStyle="light"
              >
                {locations.map((loc, index) => (
                  <React.Fragment key={index}>
                    <Marker
                      coordinate={loc}
                      title={details[index]?.title || `Location ${index + 1}`}
                      description={details[index]?.desription || ''}
                      pinColor={details[index]?.pinColor || '#FF3B30'}
                    />
                    <Circle
                      center={loc}
                      radius={100}
                      strokeColor="rgba(0, 122, 255, 0.5)"
                      fillColor="rgba(0, 122, 255, 0.1)"
                      zIndex={2}
                    />
                  </React.Fragment>
                ))}
              </MapView>
            )}

            {/* Bottom Panel - Form or Welcome */}
            <View style={styles.bottomPanel}>
              {newLocation ? (
                <LinearGradient
                  colors={['#FFFFFF', '#F8F9FF']}
                  style={styles.formContainer}>
                  <Text style={styles.formTitle}>Add New Location</Text>
                  
                  <Dropdown
                    style={styles.dropdown}
                    placeholderStyle={styles.dropdownPlaceholder}
                    selectedTextStyle={styles.dropdownSelectedText}
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
                      <AntDesign style={styles.dropdownLeftIcon} name="enviromento" size={20} color="#007AFF" />
                    )}
                  />

                  <TextInput
                    placeholder="Location name"
                    style={styles.input}
                    value={name}
                    onChange={e => setName(e.nativeEvent.text)}
                    placeholderTextColor="#8E8E93"
                  />

                  <TextInput
                    placeholder="Description"
                    style={[styles.input, styles.textArea]}
                    value={description}
                    onChange={e => setDescription(e.nativeEvent.text)}
                    placeholderTextColor="#8E8E93"
                    multiline
                    numberOfLines={3}
                  />

                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={addLocation}>
                    <LinearGradient
                      colors={['#007AFF', '#5856D6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.gradientButton}>
                      <Icon name="add-location" size={20} color="white" />
                      <Text style={styles.buttonText}>Add Location</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </LinearGradient>
              ) : (
                <LinearGradient
                  colors={['#FFFFFF', '#F8F9FF']}
                  style={styles.welcomeContainer}>
                  <View style={styles.welcomeContent}>
                    <Text style={styles.welcomeTitle}>Welcome, {userInfo.user.name}</Text>
                    <Text style={styles.welcomeText}>
                      Search for a location on the map and follow the instructions to add your points of interest.
                    </Text>
                  </View>

                  <View style={styles.buttonGroup}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.aiButton]}
                      onPress={() => setAITips(!aiTips)}>
                      <LinearGradient
                        colors={aiTips ? ['#34C759', '#30B350'] : ['#8E8E93', '#636366']}
                        style={styles.gradientButton}>
                        <Icon name="psychology" size={20} color="white" />
                        <Text style={styles.buttonText}>
                          {aiTips ? 'Disable AI Tips' : 'Enable AI Tips'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.logoutButton]}
                      onPress={logout}>
                      <LinearGradient
                        colors={['#FF3B30', '#FF2D55']}
                        style={styles.gradientButton}>
                        <Icon name="logout" size={20} color="white" />
                        <Text style={styles.buttonText}>Logout</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    zIndex: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchBarContainer: {
    flex: 0,
  },
  searchInputContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    borderWidth: 0,
    paddingHorizontal: 12,
  },
  searchInput: {
    height: 44,
    color: '#1C1C1E',
    fontSize: 16,
    backgroundColor: 'transparent',
  },
  searchListView: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
  },
  searchRow: {
    padding: 12,
  },
  searchDescription: {
    color: '#1C1C1E',
  },
  clearButton: {
    padding: 12,
  },
  mapWrapper: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    zIndex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  formContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  dropdown: {
    height: 44,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: '#8E8E93',
  },
  dropdownSelectedText: {
    fontSize: 16,
    color: '#1C1C1E',
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
    height: 44,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1C1C1E',
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  addButton: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  welcomeContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  welcomeContent: {
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: '#3A3A3C',
    lineHeight: 22,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  aiButton: {
    backgroundColor: '#34C759',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
  },
});

export default App;