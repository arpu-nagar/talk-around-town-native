import React, {useState, useRef, useEffect, useContext} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import {AuthContext} from '../context/AuthContext';
import {Ionicons} from '@expo/vector-icons';
import {MaterialIcons} from '@expo/vector-icons';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';
import MapView, {Circle, Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import Spinner from 'react-native-loading-spinner-overlay';
import {Picker} from '@react-native-picker/picker';

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
  const googlePlacesRef = useRef<any>(null);

  const initialRegion = {
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  };

  useEffect(() => {
    if (mapReady && Object.keys(location).length > 0 && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          ...location,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        },
        1000,
      );
    }
  }, [location, mapReady]);

  const handleLocationChange = (newLocation: any) => {
    setLocation(newLocation);
    onLocationChange(newLocation);
  };

  return (
    <View style={styles.addressContainer}>
      <View style={styles.searchContainer}>
        <GooglePlacesAutocomplete
          ref={googlePlacesRef}
          placeholder="Search for your home location"
          fetchDetails={true}
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
          enablePoweredByContainer={false}
          styles={{
            container: styles.googlePlacesContainer,
            textInput: styles.searchInput,
            listView: styles.searchListView,
          }}
          renderRightButton={() => (
            <MaterialIcons
              name="close"
              size={25}
              color="black"
              style={styles.clearButton}
              onPress={() => {
                googlePlacesRef.current?.setAddressText('');
                handleLocationChange({});
              }}
            />
          )}
        />
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={initialRegion}
          onMapReady={() => setMapReady(true)}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {Object.keys(location).length > 0 && (
            <>
              <Marker coordinate={location} />
              <Circle
                center={location}
                radius={100}
                fillColor="rgba(0, 0, 255, 0.1)"
                strokeColor="rgba(0, 0, 255, 0.3)"
              />
            </>
          )}
        </MapView>
      </View>
    </View>
  );
};

const RegisterScreen = ({navigation}: any) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState<{ latitude?: number; longitude?: number }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [numberOfChildren, setNumberOfChildren] = useState('');
  const [childrenAges, setChildrenAges] = useState<string[]>([]);
  const {isLoading, register} = useContext<any>(AuthContext);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (text.length > 0 && !validateEmail(text)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLocationChange = (newLocation: any) => {
    setLocation(newLocation);
  };

  const handleNext = async () => {
    if (step === 1 && !name.trim()) {
      Alert.alert('Invalid Name', 'Please enter your name');
      return;
    }
  
    if (step === 2 && !validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }
  
    if (step === 3 && !password.trim()) {
      Alert.alert('Invalid Password', 'Please enter a password');
      return;
    }
  
    if (step === 4 && !numberOfChildren.trim()) {
      Alert.alert('Number Required', 'Please enter the number of children');
      return;
    }
  
    if (step === 5 && childrenAges.some(age => !age)) {
      Alert.alert('Ages Required', 'Please enter ages for all children');
      return;
    }
  
    if (step === 6 && Object.keys(location).length === 0) {
      Alert.alert('Location Required', 'Please select your location');
      return;
    }
  
    if (step < 6) {
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
    try {
      console.log('Starting registration process');
      
      if (!name.trim() || !email.trim() || !password.trim()) {
        Alert.alert('Missing Information', 'Please fill in all required fields');
        return;
      }
  
      const registrationData = {
        numberOfChildren: parseInt(numberOfChildren),
        childrenDetails: childrenDetails.map(child => ({
          nickname: child.nickname || `Child_${childrenDetails.indexOf(child) + 1}`,
          date_of_birth: `${child.birthYear}-${child.birthMonth}-01`
        }))
      };
  
      console.log('Registration data:', {
        name: name.trim(),
        email: email.trim(),
        password,
        location,
        childrenData: registrationData
      });
  
      const success = await register(
        name.trim(),
        email.trim(),
        password,
        location,
        registrationData
      );
  
      if (success) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
  
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert(
        'Registration Failed',
        (error as any).message || 'An error occurred during registration'
      );
    }
  };

  const [childrenDetails, setChildrenDetails] = useState<Array<{
    nickname: string;
    birthYear: string;
    birthMonth: string;
  }>>([]);

  // Add these helper arrays for the pickers
  const currentYear = new Date().getFullYear();
const years = Array.from(
  { length: 12 }, 
  (_, i) => String(currentYear - i)
);
  
  const months = [
    {label: 'January', value: '01'},
    {label: 'February', value: '02'},
    {label: 'March', value: '03'},
    {label: 'April', value: '04'},
    {label: 'May', value: '05'},
    {label: 'June', value: '06'},
    {label: 'July', value: '07'},
    {label: 'August', value: '08'},
    {label: 'September', value: '09'},
    {label: 'October', value: '10'},
    {label: 'November', value: '11'},
    {label: 'December', value: '12'},
  ];

  // Update the number of children handler
  const handleNumberOfChildrenChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    setNumberOfChildren(numericValue);
    
    const num = parseInt(numericValue) || 0;
    setChildrenDetails(prevDetails => {
      if (num > prevDetails.length) {
        return [
          ...prevDetails,
          ...Array(num - prevDetails.length).fill({
            nickname: '',
            birthYear: new Date().getFullYear().toString(),
            birthMonth: '01'
          })
        ];
      } else {
        return prevDetails.slice(0, num);
      }
    });
  };

  // Add handler for child details changes
  const handleChildDetailChange = (index: number, field: string, value: string) => {
    setChildrenDetails(prevDetails => {
      const newDetails = [...prevDetails];
      newDetails[index] = {
        ...newDetails[index],
        [field]: value
      };
      return newDetails;
    });
  };

  const handleChildAgeChange = (index: number, age: string) => {
    const numericAge = age.replace(/[^0-9]/g, '');
    setChildrenAges(prevAges => {
      const newAges = [...prevAges];
      newAges[index] = numericAge;
      return newAges;
    });
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Enter your name</Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Enter your email</Text>
            <TextInput
              style={[styles.input, emailError ? styles.inputError : null]}
              placeholder="Email"
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {emailError ? (
              <Text style={styles.errorText}>{emailError}</Text>
            ) : null}
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Enter a password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={togglePasswordVisibility}
                style={styles.eyeButton}>
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={24}
                  color="gray"
                />
              </TouchableOpacity>
            </View>
          </View>
        );
        case 4:
          return (
            <View style={styles.stepContainer}>
              <Text style={styles.title}>How many children do you have?</Text>
              <TextInput
                style={styles.input}
                placeholder="Number of children"
                value={numberOfChildren}
                onChangeText={handleNumberOfChildrenChange}
                keyboardType="numeric"
                maxLength={2}
              />
            </View>
          );
          case 5:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Enter children details</Text>
            <ScrollView 
              style={styles.childrenScrollView}
              contentContainerStyle={styles.scrollContentContainer}
              showsVerticalScrollIndicator={true}
            >
              {Array.from({length: parseInt(numberOfChildren)}).map((_, index) => (
                <View key={index} style={styles.childDetailContainer}>
                  <Text style={styles.childTitle}>Child {index + 1}</Text>
                  
                  <TextInput
                    style={styles.childInput}
                    placeholder={`Nickname for Child ${index + 1}`}
                    value={childrenDetails[index]?.nickname || ''}
                    onChangeText={(text) => handleChildDetailChange(index, 'nickname', text)}
                    maxLength={50}
                  />

                  <View style={styles.dateContainer}>
                    <View style={styles.pickerContainer}>
                      <Text style={styles.pickerLabel}>Birth Month</Text>
                      <Picker
                        selectedValue={childrenDetails[index]?.birthMonth || '01'}
                        style={styles.picker}
                        onValueChange={(value) => handleChildDetailChange(index, 'birthMonth', value)}
                      >
                        {months.map((month) => (
                          <Picker.Item 
                            key={month.value} 
                            label={month.label} 
                            value={month.value}
                          />
                        ))}
                      </Picker>
                    </View>

                    <View style={styles.pickerContainer}>
                      <Text style={styles.pickerLabel}>Birth Year</Text>
                      <Picker
                        selectedValue={childrenDetails[index]?.birthYear || currentYear.toString()}
                        style={styles.picker}
                        onValueChange={(value) => handleChildDetailChange(index, 'birthYear', value)}
                      >
                        {years.map((year) => (
                          <Picker.Item 
                            key={year} 
                            label={year} 
                            value={year}
                          />
                        ))}
                      </Picker>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        );
        
        case 6:
          return <HomeAddress onLocationChange={handleLocationChange} />;
        default:
          return null;
      }
    };

    const getButtonStyle = () => {
      const isDisabled =
        (step === 2 && !validateEmail(email) && email.length > 0) ||
        (step === 4 && !numberOfChildren.trim()) ||
        (step === 5 && childrenAges.some(age => !age)) ||
        (step === 6 && Object.keys(location).length === 0);
    
      return [styles.button, isDisabled ? styles.buttonDisabled : null];
    };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled">
        <Spinner visible={isLoading} />
        {step > 1 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <MaterialIcons name="arrow-back" size={25} color="black" />
          </TouchableOpacity>
        )}
        {renderStep()}
        <TouchableOpacity
  style={getButtonStyle()}
  onPress={handleNext}
  disabled={
    (step === 2 && !validateEmail(email) && email.length > 0) ||
    (step === 4 && !numberOfChildren.trim()) ||
    (step === 5 && childrenAges.some(age => !age)) ||
    (step === 6 && Object.keys(location).length === 0)
  }>
  <Text style={styles.buttonText}>
    {step === 6 ? 'Register' : 'Next'}
  </Text>
</TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  agesScrollView: {
    width: '100%',
    maxHeight: 300,
  },
  childrenScrollView: {
    width: '100%',
    maxHeight: height * 0.6, // Adjust based on screen height
    backgroundColor: '#fff',
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },
  childDetailContainer: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    width: '100%',
  },
  ageInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    width: '100%',
  },
  ageLabel: {
    fontSize: 16,
    marginRight: 15,
    width: 80,
  },
  ageInput: {
    flex: 1,
    height: 45,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 10,
    paddingTop: Platform.OS === 'ios' ? 60 : 10,
  },
  stepContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 40,
  },
  addressContainer: {
    width: '100%',
    height: Platform.OS === 'ios' ? height * 0.65 : '60%',
    marginTop: Platform.OS === 'ios' ? 20 : 0,
  },
  searchContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    padding: 10,
  },
  googlePlacesContainer: {
    flex: 0,
    width: '100%',
    zIndex: 2,
  },
  mapContainer: {
    flex: 1,
    marginTop: 60,
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: '600',
    color: '#000',
  },
  input: {
    width: '100%',
    height: 45,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  passwordContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  passwordInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
  },
  eyeButton: {
    padding: 10,
  },
  searchInput: {
    height: 45,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  childTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  childInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  pickerContainer: {
    flex: 1,
    marginHorizontal: 5,
  },
  pickerLabel: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
  picker: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  searchListView: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    position: 'absolute',
    top: 55,
    left: 10,
    right: 10,
    zIndex: 3,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  clearButton: {
    padding: 8,
    position: 'absolute',
    right: 5,
    top: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 20,
    minWidth: 120,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 40 : 20,
    left: 20,
    padding: 10,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: -15,
    marginBottom: 15,
    alignSelf: 'flex-start',
  },
});

export default RegisterScreen;