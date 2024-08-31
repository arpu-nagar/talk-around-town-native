// import React, {useContext, useState} from 'react';
// import {
//   Button,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
//   StyleSheet,
// } from 'react-native';
// import Spinner from 'react-native-loading-spinner-overlay';
// import {AuthContext} from '../context/AuthContext';

// const RegisterScreen = ({navigation}: any) => {
//   const [name, setName] = useState('');
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');

//   const {isLoading, register} = useContext<any>(AuthContext);

//   return (
//     <View style={styles.container}>
//       <Spinner visible={isLoading} />
//       <Text style={{padding: 10, fontSize: 28, fontWeight: 'bold', textAlign: 'center'}}>Talk Around Town</Text>
//       <View style={styles.wrapper}>
//         <TextInput
//           style={styles.input}
//           value={name}
//           placeholder="Enter name"
//           onChangeText={text => setName(text)}
//         />

//         <TextInput
//           style={styles.input}
//           value={email}
//           placeholder="Enter email"
//           onChangeText={text => setEmail(text)}
//         />

//         <TextInput
//           style={styles.input}
//           value={password}
//           placeholder="Enter password"
//           onChangeText={text => setPassword(text)}
//           secureTextEntry
//         />

//         <Button
//           title="Register"
//           onPress={() => {
//             register(name, email, password);
//           }}
//         />

//         <View style={{flexDirection: 'row', marginTop: 20}}>
//           <Text>Already have an account? </Text>
//           <TouchableOpacity onPress={() => navigation.navigate('Login')}>
//             <Text style={styles.link}>Login</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   wrapper: {
//     width: '80%',
//   },
//   input: {
//     marginBottom: 12,
//     borderWidth: 1,
//     borderColor: '#bbb',
//     borderRadius: 5,
//     paddingHorizontal: 14,
//   },
//   link: {
//     color: 'blue',
//   },
// });

// export default RegisterScreen;

import React, {useState, useRef, useEffect, useContext} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {AuthContext} from '../context/AuthContext';
import {Ionicons} from '@expo/vector-icons';
import {MaterialIcons} from '@expo/vector-icons'; // or 'react-native-vector-icons/MaterialIcons'

import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';
import MapView, {Circle, Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import {Dimensions} from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';

const {width, height} = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.015;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const HomeAddress: React.FC<{onLocationChange: (location: any) => void}> = ({
  onLocationChange,
}) => {
  const [location, setLocation] = useState<any>({});
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    if (mapReady && Object.keys(location).length > 0) {
      setTimeout(() => {
        mapRef.current?.animateToRegion(
          {
            ...location,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          },
          1000,
        );
      }, 500);
    }
  }, [location, mapReady]);

  const handleLocationChange = (newLocation: any) => {
    setLocation(newLocation);
    onLocationChange(newLocation);
  };

  return (
    <View
      style={{
        display: 'flex',
        flexDirection: 'column',
        // justifyContent: 'center',
        width: '100%',
        height: '60%',
      }}>
      <GooglePlacesAutocomplete
        placeholder="Search for your home location"
        fetchDetails={true}
        styles={locationSearchStyles}
        onPress={(data, details = null) => {
          if (details) {
            const {lat, lng} = details.geometry.location;
            const newLocation = {
              latitude: lat,
              longitude: lng,
            };
            handleLocationChange(newLocation);
          }
        }}
        query={{
          key: 'AIzaSyDBAL_WlpNc9Jvmtx6OPszKr30cJe3Kwew',
          language: 'en',
        }}
        renderRightButton={() => (
          <TouchableOpacity
            style={locationSearchStyles.clearButton}
            onPress={() => {
              handleLocationChange({});
            }}>
            <MaterialIcons name="close" size={25} color="black" />
          </TouchableOpacity>
        )}
      />
      {Object.keys(location).length !== 0 && (
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={locationSearchStyles.map}
          initialRegion={{
            ...location,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          }}
          onMapReady={() => setMapReady(true)}>
          <Marker coordinate={location} />
          <Circle
            center={location}
            radius={100}
            fillColor="rgba(0, 0, 255, 0.1)"
            strokeColor="rgba(0, 0, 255, 0.3)"
          />
        </MapView>
      )}
    </View>
    // {/* </> */}
  );
};

const locationSearchStyles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '100%',
    maxHeight: '55%',
  },
  textInputContainer: {
    width: '100%',
  },
  textInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  clearButton: {
    padding: 10,
  },
  map: {
    // width: '100%',
    // minHeight: '60%',
    // maxHeight: '60%',
    // height: '60%',
    padding: 10,
    height: '83%',
    marginTop: '3%',
    marginBottom: '3%',
  },
});

const RegisterScreen = ({navigation}: any) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const {isLoading, register} = useContext<any>(AuthContext);
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLocationChange = (newLocation: any) => {
    setLocation(newLocation);
  };
  const ref = useRef();

  const handleNext = async () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      await handleRegister();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleRegister = async () => {
    console.log(
      JSON.stringify({
        name,
        email,
        password,
        location,
      }),
    );
    try {
      register(name, email, password, location).then((response: any) => {
          console.log('Registration successful');
          navigation.navigate('Login');
        
      });
      // console.log(response)
    } catch (error) {
      console.error('Error during registration:', error);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Text style={styles.title}>Enter your name</Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={name}
              onChangeText={setName}
            />
          </>
        );
      case 2:
        return (
          <>
            <Text style={styles.title}>Enter your email</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
          </>
        );
      case 3:
        return (
          <>
            <Text style={styles.title}>Enter a password</Text>
            <View style={passwordBox.inputContainer}>
              <TextInput
                style={passwordBox.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={togglePasswordVisibility}
                style={passwordBox.eyeButton}>
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={24}
                  color="gray"
                />
              </TouchableOpacity>
            </View>
          </>
        );
      case 4:
        return (
          // <View>
          <HomeAddress onLocationChange={handleLocationChange} />
          // </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Spinner visible={isLoading} />
      {step > 1 && (
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <MaterialIcons name="arrow-back" size={25} color="black" />
        </TouchableOpacity>
      )}
      {/* <Text style={styles.title}>Step {step} of 4</Text> */}
      {renderStep()}
      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>
          {step === 4 ? 'Register' : 'Next'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const passwordBox = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    width: '70%',
    height: 40,
    borderColor: 'gray',
  },
  eyeButton: {
    padding: 10,
  },
});

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    margin: 10,
    height: '100%',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  button: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
    width: 80,
    height: 40,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
  },
  // googlePlacesInput: {
  //   textInputContainer: {
  //     width: '100%',
  //   },
  //   textInput: {
  //     height: 40,
  //     borderColor: 'gray',
  //     borderWidth: 1,
  //     borderRadius: 5,
  //     paddingHorizontal: 10,
  //   },
  // },
  // clearButton: {
  //   padding: 10,
  // },
});

export default RegisterScreen;
