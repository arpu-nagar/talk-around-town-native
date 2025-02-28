import React, { useState, useRef, useEffect, useContext } from 'react';
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
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Spinner from 'react-native-loading-spinner-overlay';
import { Picker } from '@react-native-picker/picker';
import LinearGradient from 'react-native-linear-gradient';
import ChildrenDetailsStep from './ChildrenDetailsStep';


const { width, height } = Dimensions.get('window');
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
  // const [password, setPassword] = useState('');
  const [location, setLocation] = useState<{ latitude?: number; longitude?: number }>({});
  // const [showPassword, setShowPassword] = useState(false);
  const [numberOfChildren, setNumberOfChildren] = useState('');
  const [childrenAges, setChildrenAges] = useState<string[]>([]);
  const {isLoading, register} = useContext<any>(AuthContext);
  const [password, setPassword] = useState('');
const [showPassword, setShowPassword] = useState(false);
const [passwordError, setPasswordError] = useState('');

const handlePasswordChange = (text: string) => {
  setPassword(text);
  
  if (text.length > 0 && text.length < 8) {
    setPasswordError('Password must be at least 8 characters long');
  } else {
    setPasswordError('');
  }
};

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
  
    if (step === 3) {
      if (!password.trim()) {
        Alert.alert('Invalid Password', 'Please enter a password');
        return;
      }
      if (password.length < 8) {
        Alert.alert('Invalid Password', 'Password must be at least 8 characters long');
        return;
      }
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

  const renderProgressBar = () => {
    return (
      <View style={styles.progressContainer}>
        {Array.from({ length: 6 }).map((_, index) => (
          <View key={index} style={styles.progressItemContainer}>
            <View
              style={[
                styles.progressDot,
                {
                  backgroundColor: index < step ? '#4A90E2' : '#E0E0E0',
                },
              ]}
            />
            {index < 5 && (
              <View
                style={[
                  styles.progressLine,
                  {
                    backgroundColor: index < step - 1 ? '#4A90E2' : '#E0E0E0',
                  },
                ]}
              />
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderStep = () => {
    const commonInputStyle = [
      styles.input,
      { borderColor: '#E0E0E0', backgroundColor: '#F5F5F5' },
    ];
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>What's your name?</Text>
            <Text style={styles.stepDescription}>Please enter your full name</Text>
            <TextInput
              style={commonInputStyle}
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
              placeholderTextColor="#A0A0A0"
            />
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Email Address</Text>
            <Text style={styles.stepDescription}>We'll send you a confirmation email</Text>
            <TextInput
              style={[commonInputStyle, emailError ? styles.inputError : null]}
              placeholder="Enter your email"
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#A0A0A0"
            />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>
        );
          case 3:
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Create Password</Text>
      <Text style={styles.stepDescription}>Choose a secure password for your account</Text>
      <View style={[
        styles.passwordContainer, 
        passwordError ? styles.inputError : null
      ]}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Enter your password"
          value={password}
          onChangeText={handlePasswordChange}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor="#A0A0A0"
        />
        <TouchableOpacity
          onPress={togglePasswordVisibility}
          style={styles.eyeButton}>
          <Ionicons
            name={showPassword ? 'eye-off' : 'eye'}
            size={24}
            color="#666666"
          />
        </TouchableOpacity>
      </View>
      {passwordError ? (
        <Text style={styles.errorText}>{passwordError}</Text>
      ) : (
        password.length >= 8 && (
          <Text style={styles.successText}>Password meets requirements ✓</Text>
        )
      )}
      
      <View style={styles.passwordRequirements}>
        <Text style={styles.requirementLabel}>Your password must:</Text>
        <View style={styles.requirementItem}>
          <View style={[
            styles.requirementDot,
            password.length >= 8 ? styles.requirementMet : styles.requirementNotMet
          ]} />
          <Text style={styles.requirementText}>
            Be at least 8 characters long
          </Text>
        </View>
      </View>
    </View>
  );
  
        case 4:
          return (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Family Information</Text>
              <Text style={styles.stepDescription}>How many children do you have?</Text>
              <View style={styles.childrenCountContainer}>
                <TextInput
                  style={[commonInputStyle, styles.childrenCountInput]}
                  placeholder="Number of children"
                  value={numberOfChildren}
                  onChangeText={handleNumberOfChildrenChange}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholderTextColor="#A0A0A0"
                />
              </View>
            </View>
          );
  
          case 5:
            return (
              <ChildrenDetailsStep
                numberOfChildren={parseInt(numberOfChildren, 10)}
                childrenDetails={childrenDetails}
                onChildDetailChange={handleChildDetailChange}
              />
            );
  
        case 6:
          return (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Home Location</Text>
              <Text style={styles.stepDescription}>Help us find learning opportunities near you</Text>
              <HomeAddress onLocationChange={handleLocationChange} />
            </View>
          );
  
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
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#4A90E2', '#357ABD']} style={styles.gradient}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
            <ScrollView
              contentContainerStyle={styles.scrollContainer}
              keyboardShouldPersistTaps="handled">
              <Spinner visible={isLoading} />
              
              <TouchableOpacity 
  style={styles.backButton} 
  onPress={() => step === 1 ? navigation.navigate('Login') : handleBack()}
  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
>
  <MaterialIcons name="arrow-back" size={28} color="#FFFFFF" />
</TouchableOpacity>
  
              {renderProgressBar()}
              
              <View style={styles.contentCard}>
                {renderStep()}
                
                <TouchableOpacity
                  style={[
                    styles.nextButton,
                    (step === 2 && !validateEmail(email) && email.length > 0) ||
                    (step === 4 && !numberOfChildren.trim()) ||
                    (step === 5 && childrenAges.some(age => !age)) ||
                    (step === 6 && Object.keys(location).length === 0)
                      ? styles.buttonDisabled
                      : null,
                  ]}
                  onPress={handleNext}>
                  <Text style={styles.nextButtonText}>
                    {step === 6 ? 'Complete Registration' : 'Continue'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </LinearGradient>
      </SafeAreaView>
    );
  };
  
  const additionalStyles = StyleSheet.create({
    passwordRequirements: {
      marginTop: 16,
      width: '100%', // This is now properly typed through StyleSheet.create
    },
    requirementLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: '#666666',
      marginBottom: 8,
    },
    requirementItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    requirementDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 8,
    },
    requirementMet: {
      backgroundColor: '#34C759',
    },
    requirementNotMet: {
      backgroundColor: '#FF3B30',
    },
    requirementText: {
      fontSize: 14,
      color: '#333333',
    },
    successText: {
      color: '#34C759',
      fontSize: 14,
      marginTop: 8,
    },
  });
  

const styles = StyleSheet.create({
  // Password input styles
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
  },
  eyeButton: {
    padding: 8,
  },

  // Children count styles
  childrenCountContainer: {
    width: '100%',
  },
  childrenCountInput: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '500',
  },

  // Children details styles
  childrenScrollView: {
    maxHeight: height * 0.5,
    width: '100%',
  },
  scrollContentContainer: {
    paddingVertical: 8,
  },
  passwordRequirements: additionalStyles.passwordRequirements,
  requirementLabel: additionalStyles.requirementLabel,
  requirementItem: additionalStyles.requirementItem,
  requirementDot: additionalStyles.requirementDot,
  requirementMet: additionalStyles.requirementMet,
  requirementNotMet: additionalStyles.requirementNotMet,
  requirementText: additionalStyles.requirementText,
  successText: additionalStyles.successText,
  childDetailCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  childNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  childInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  dateSelectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  pickerWrapper: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    backgroundColor: '#FFFFFF',
  },

  // Location selection styles
  addressContainer: {
    width: '100%',
    height: 400,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 16,
  },
  searchContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    padding: 16,
  },
  googlePlacesContainer: {
    flex: 0,
  },
  searchInput: {
    height: 50,
    borderRadius: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchListView: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchRow: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchDescription: {
    color: '#333333',
    fontSize: 16,
  },
  clearButton: {
    position: 'absolute',
    right: 24,
    top: 24,
    padding: 8,
    zIndex: 2,
  },
  mapContainer: {
    flex: 1,
    marginTop: 60,
    borderRadius: 16,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#4A90E2',
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingHorizontal: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  progressItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E0E0E0',
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 20,
  },
  stepContainer: {
    alignItems: 'flex-start',
    width: '100%',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 20 : 40,
    left: 20,
    zIndex: 1,
    padding: 8,
  },
  nextButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: '#A5C8F2',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: -8,
    marginBottom: 16,
  },
  agesScrollView: {
    width: '100%',
    maxHeight: 300,
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
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: '600',
    color: '#000',
  },
  childTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
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
});

export default RegisterScreen;