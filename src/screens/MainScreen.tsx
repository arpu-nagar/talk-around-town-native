import React, {useContext, useEffect, useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  Alert,
  Text,
  // Button,
  TouchableOpacity,
  TextInput,
  Pressable,
  ViewStyle,
  TextStyle,
  // KeyboardAvoidingView,
  StyleProp,
} from 'react-native';
import MapView, {PROVIDER_GOOGLE, Marker, Circle} from 'react-native-maps';
import {Dropdown} from 'react-native-element-dropdown';
import AntDesign from '@expo/vector-icons/AntDesign';
import Geolocation from '@react-native-community/geolocation';
import {
  GooglePlacesAutocomplete,
  GooglePlacesAutocompleteRef,
} from 'react-native-google-places-autocomplete';
import RemoteNotification from '../components/RemoteNotification';
import {Icon} from 'react-native-elements';
import Spinner from 'react-native-loading-spinner-overlay';
import {AuthContext} from '../context/AuthContext';
import UserLocation from '../../UserLocation';

// RemoteNotification()

interface Location {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

const App: React.FC = () => {
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
      setLocations(jsonResponse.locations);
      setDetails(jsonResponse.details);
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
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Location permission denied');
          return;
        }
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
      }
      let options_loc = {
        enableHighAccuracy: false,
        timeout: 60000,
        maximumAge: 0,
      };
      Geolocation.getCurrentPosition(
        async position => {
          // console.log(position);
          const {latitude, longitude} = position.coords;
          console.log(latitude, longitude);
          setLoading(false);
          setLocation({
            latitude,
            longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.0121,
          });
          console.log('fetchLocations called');
        },
        error => {
          console.log(error, 'fetchLocations');
          Alert.alert('Error', 'Unable to fetch location in fetchLocations');
        },
        options_loc,
      );
      // setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error('Error fetching locations:', error);
    }
  };
  const addLocation = async () => {
    console.log('Add location');
    if (name === '' || description === '' || !selectedOption) {
      Alert.alert('Please enter a title and description');
      return;
    }
    if (newLocation) {
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
      } catch (error) {
        console.error('Error adding location:', error);
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
      {enableHighAccuracy: false, timeout: 60000, maximumAge: 0},
    );
  };

  useEffect(() => {
    // fetch an API from /endpoint/locations and set the locations and details state variables
    fetchLocations();
    console.log('fetchLocations called');
    // Set up the interval to call fetchLocationAndSendData every 30 seconds
    const intervalId = setInterval(fetchLocationAndSendData, 30000);

    // Clean up the interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // background task

  if (loading) {
    return (
      <View>
        <Spinner visible={loading} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {location && (
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={newLocation ? newLocation : location}
          showsUserLocation
          mapType="standard"
          userInterfaceStyle="light">
          {locations.map((loc, index) => (
            <React.Fragment key={index}>
              <Marker
                coordinate={loc}
                title={details[index].title}
                description={details[index].desription}
                pinColor={details[index].pinColor}
              />
              <Circle
                center={loc}
                radius={100} // radius in meters
                strokeColor="rgba(0,0,255,0.5)"
                fillColor="rgba(0,0,255,0.1)"
                zIndex={2}
              />
            </React.Fragment>
          ))}
        </MapView>
      )}
      <>
        <GooglePlacesAutocomplete
          placeholder="Search"
          fetchDetails={true}
          styles={styles1}
          onPress={(data, details = null) => {
            // 'details' is provided when fetchDetails = true
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
              style={styles1.clearButton}
              onPress={() => {
                ref.current && ref.current.clear();
                setName('');
                setDescription('');
                setNewLocation(null);
              }}>
              <Icon name="close" size={25} color="black" />
            </TouchableOpacity>
          )}
          ref={ref}
        />
        {/* two text input boxes, one for title and one for description. Only visible when newLocation not null */}
        {newLocation && (
          <>
            <View style={styles.bg}>
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
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                }}>
                <Pressable style={styles1.button} onPress={addLocation}>
                  <Text style={styles1.buttonText}>Add location</Text>
                </Pressable>
              </View>
            </View>
          </>
        )}

        {!newLocation && (
          <>
            <View style={styles.tile}>
              <Text style={styles.heading}>Welcome, {userInfo.user.name} </Text>
              <Text style={styles.body_text}>
                Please search for a location on the map, and follow instructions
                to add a location of interest.
              </Text>
            </View>
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-around',
              }}>
              <UserLocation />
              <Pressable style={styles1.button_logout} onPress={logout}>
                <Text style={styles1.buttonText}>Logout</Text>
              </Pressable>
            </View>
          </>
        )}
      </>
      <RemoteNotification />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    height: '100%',
    // display: 'flex',
    // flexDirection: 'column',
    // justifyContent: 'space-around',
    // alignItems: 'center',
  },
  tile: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    height: '80%',
    // margin: '3%',
    // marginTop: '17%',
    // borderBlockColor: 'black',
  },
  bar: {
    // height: '10%',
    margin: '3%',
  },
  input: {
    height: 40,
    borderColor: 'black',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  bg: {
    backgroundColor: 'white',
    padding: 10,
  },

  heading: {
    // make this look like a heading
    fontSize: 32,
    marginBottom: 10,
    marginLeft: 10,
    paddingTop: 0,
    fontWeight: 'bold',
    color: 'black',
  },
  body_text: {
    fontSize: 14,
    marginLeft: 10,
    fontWeight: 'normal',
    color: 'black',
  },
});

const styles1 = StyleSheet.create({
  clearButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 10,
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    margin: 10,
  },
  textInput: {
    height: 40,
    color: '#5d5d5d',
    fontSize: 16,
    flex: 1,
  },
  button: {
    backgroundColor: 'blue',
    color: 'white',
    padding: 5,
    width: 120,
    margin: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  button_logout: {
    backgroundColor: 'red',
    color: 'white',
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
  bg: {
    padding: 16,
    backgroundColor: 'white',
  },
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
