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
} from 'react-native';
import MapView, {
  PROVIDER_GOOGLE,
  Marker,
  Circle,
  PROVIDER_DEFAULT,
} from 'react-native-maps';
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
import Notification from '../components/Notification';
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

// Update the component props interface
interface Props {
  navigation: NativeStackNavigationProp<MainTabParamList>;
}
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
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import { fetchWithAuth } from '../api/auth';

const App: React.FC<Props> = ({navigation}) => {
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
  const {aiTips, setAITips} = useContext<any>(AuthContext);
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
        // Alert.alert('Error', 'Unable to fetch current location');
        setLoading(false);
      },
      {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
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
          body: JSON.stringify({children: updatedChildren}),
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
        const response = await fetchWithAuth(
          'http://68.183.102.75:1337/endpoint/children',
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

    checkChildrenInfo();
    setupLocation();
    fetchLocations();

    const intervalId = setInterval(fetchLocationAndSendData, 30000);
    return () => clearInterval(intervalId);
  }, []);
  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(
        'http://68.183.102.75:1337/endpoint/locations',
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
        {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
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

  // Function to check if location already exists
  const isLocationNearby = (newLat: number, newLon: number) => {
    const threshold = 100; // 100 meters radius
    return locations.some(loc => {
      const distance = calculateDistance(
        newLat,
        newLon,
        loc.latitude,
        loc.longitude,
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
          'A location already exists within 100 meters of this point. Please choose a different location.',
        );
        return;
      }
      // make an HTTP POST request to endpoint: http://68.183.102.75:1337/endpoint/addLocation
      // with the following data: {latitude: newLocation.latitude, longitude: newLocation.longitude, name, description}

      try {
        setLoading(true);
        const response = await fetchWithAuth(
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
      } catch (error) {
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
          const response = await fetchWithAuth('http://68.183.102.75:1337/endpoint', {
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
                  console.log(data);
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
                onFail={error => console.error('Error:', error)}
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
                  <React.Fragment key={index}>
                    <Marker
                      coordinate={loc}
                      title={details[index]?.title || `Location ${index + 1}`}
                      description={details[index]?.desription || ''}
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
                  Welcome, {userInfo.user.name}
                </Text>
                <Text style={styles.welcomeText}>
                  Search for a location on the map and follow the instructions
                  to add a point of interest.
                </Text>
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.button, styles.aiButton]}
                    onPress={() => {
                      console.log(location, details);
                      navigation.navigate('LocationList', {
                        locations: locations,
                        details: details,
                      });
                    }}>
                    <Text style={styles.buttonText}>Show locations</Text>
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
