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
// import RemoteNotification from '../components/RemoteNotification';
import Notification from '../components/Notification';

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
        Alert.alert('Error', 'Unable to fetch current location');
        setLoading(false);
      },
      {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
    );
  };

  const handleUpdateChildren = async (updatedChildren: any[]) => {
    try {
      const response = await fetch(
        'http://localhost:1337/endpoint/updateChildren',
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
        const response = await fetch(
          'http://localhost:1337/endpoint/children',
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
      const response = await fetch('http://localhost:1337/endpoint/locations', {
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
      // make an HTTP POST request to endpoint: http://localhost:1337/endpoint/addLocation
      // with the following data: {latitude: newLocation.latitude, longitude: newLocation.longitude, name, description}

      try {
        setLoading(true);
        const response = await fetch(
          'http://localhost:1337/endpoint/addLocation',
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
          const response = await fetch('http://localhost:1337/endpoint', {
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
      <Notification />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.searchContainer}>
            <GooglePlacesAutocomplete
              placeholder="Search"
              fetchDetails={true}
              styles={{
                container: {
                  flex: 0,
                },
                textInputContainer: {
                  backgroundColor: 'white',
                  borderRadius: 5,
                  borderWidth: 1,
                  borderColor: '#ddd',
                },
                textInput: {
                  height: 38,
                  color: '#5d5d5d',
                  fontSize: 16,
                },
                listView: {
                  backgroundColor: 'white',
                },
              }}
              onPress={(data, details = null) => {
                console.log('Search pressed', data);
                if (details) {
                  console.log('Location details:', details);
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
                  style={styles1.clearButton}
                  onPress={() => {
                    console.log('Clear button pressed');
                    ref.current?.clear();
                    setName('');
                    setDescription('');
                    setNewLocation(null);
                  }}>
                  <Icon name="close" size={25} color="black" />
                </TouchableOpacity>
              )}
              ref={ref}
            />
          </View>

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
                      pinColor={details[index]?.pinColor || 'red'}
                    />
                    <Circle
                      center={loc}
                      radius={100}
                      strokeColor="rgba(0,0,255,0.5)"
                      fillColor="rgba(0,0,255,0.1)"
                      zIndex={2}
                    />
                  </React.Fragment>
                ))}
              </MapView>
            )}
          </View>

          {newLocation && (
            <View style={styles.formContainer}>
              <Text>Please fill out everything:</Text>
              <Dropdown
                style={drop.dropdown}
                placeholderStyle={drop.placeholderStyle}
                selectedTextStyle={drop.selectedTextStyle}
                inputSearchStyle={drop.inputSearchStyle}
                iconStyle={drop.iconStyle}
                data={options}
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder="Select an option"
                searchPlaceholder="Search..."
                value={selectedOption}
                onChange={item => setSelectedOption(item.value)}
                renderLeftIcon={() => (
                  <AntDesign
                    style={drop.icon}
                    color="black"
                    name="Safety"
                    size={20}
                  />
                )}
              />
              <TextInput
                placeholder="Title"
                style={[drop.input, drop.placeholderStyle]}
                value={name}
                onChange={e => setName(e.nativeEvent.text)}
                placeholderTextColor={drop.placeholderStyle.color}
              />
              <TextInput
                placeholder="Description"
                style={[drop.input, drop.placeholderStyle]}
                value={description}
                onChange={e => setDescription(e.nativeEvent.text)}
                placeholderTextColor={drop.placeholderStyle.color}
              />
              <View style={{flexDirection: 'row', justifyContent: 'flex-end'}}>
                <Pressable style={styles1.button} onPress={addLocation}>
                  <Text style={styles1.buttonText}>Add location</Text>
                </Pressable>
              </View>
            </View>
          )}

          {!newLocation && (
            <View style={styles.welcomeContainer}>
              <View style={styles.tile}>
                <Text style={styles.heading}>
                  Welcome, {userInfo.user.name}
                </Text>
                <Text style={styles.body_text}>
                  Please search for a location on the map, and follow
                  instructions to add a location of interest.
                </Text>
              </View>
              <View
                style={{flexDirection: 'row', justifyContent: 'space-around'}}>
                <Pressable
                  style={styles1.button_ai}
                  onPress={() => {
                    setAITips(!aiTips);
                  }}>
                  <Text style={styles1.buttonText}>
                    {aiTips ? 'Disable AI Tips' : 'Enable AI Tips'}
                  </Text>
                </Pressable>
                <Pressable style={styles1.button_logout} onPress={logout}>
                  <Text style={styles1.buttonText}>Logout</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: 'white',
    zIndex: 10,
    elevation: 3,
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
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
    zIndex: 5,
    elevation: 2,
  },
  welcomeContainer: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
    zIndex: 5,
    elevation: 2,
  },
  tile: {
    marginBottom: 10,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 5,
  },
  body_text: {
    fontSize: 14,
    color: 'black',
  },
});

const styles1 = StyleSheet.create({
  clearButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 10,
  },
  button: {
    backgroundColor: 'blue',
    padding: 5,
    width: 120,
    margin: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  button_logout: {
    backgroundColor: 'red',
    padding: 5,
    width: 120,
    margin: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  button_ai: {
    backgroundColor: 'green',
    padding: 5,
    width: 120,
    margin: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
  },
});

const drop = StyleSheet.create({
  placeholderStyle: {
    fontSize: 16,
    color: 'gray',
  },
  input: {
    height: 50,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  dropdown: {
    margin: 16,
    height: 50,
    borderBottomColor: 'gray',
    borderBottomWidth: 1,
  },
  selectedTextStyle: {
    fontSize: 16,
    color: 'black',
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  icon: {
    marginRight: 5,
  },
});

export default App;
