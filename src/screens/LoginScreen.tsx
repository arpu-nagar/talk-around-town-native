import React, { useContext, useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  Alert,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
  Dimensions,
  StatusBar,
  ScrollView,
} from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext, AuthContextType } from '../context/AuthContext';
import { NavigationProp } from '@react-navigation/native';
import messaging from '@react-native-firebase/messaging';
import LinearGradient from 'react-native-linear-gradient';

interface LoginScreenProps {
  navigation: NavigationProp<any>;
}

interface TokenData {
  os: string;
  token: string;
}

// Use exact width values instead of percentage-based calculations
const { width, height } = Dimensions.get('window');
const inputWidth = Math.min(width * 0.85, 400);

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fcmTokenStatus, setFcmTokenStatus] = useState<'loading' | 'success' | 'error' | 'skipped'>('loading');
  const { isLoading, login } = useContext<AuthContextType>(AuthContext);

  const updateServerToken = useCallback(async (fcmToken: string, accessToken: string) => {
    try {
      console.log('SENDING TO SERVER - Token:', fcmToken?.substring(0, 20) + '...', 'Platform:', Platform.OS);
      
      const response = await fetch('http://68.183.102.75:1337/api/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          token: fcmToken,
          platform: Platform.OS,
        }),
      });
      
      const responseData = await response.json();
      console.log('SERVER RESPONSE:', responseData);
      
      if (!response.ok) throw new Error('Failed to update token on server');
    } catch (error) {
      console.error('Error updating token on server:', error);
      // Don't throw - this shouldn't prevent login
    }
  }, []);

  // Enhanced FCM token handling with iOS-specific fixes
  const getAndStoreToken = useCallback(async (retryCount = 0) => {
    const maxRetries = 3;
    
    try {
      console.log(`Attempting to get FCM token (attempt ${retryCount + 1}/${maxRetries + 1})`);
      
      // Step 1: Check if messaging is available (especially important for iOS simulator)
      if (Platform.OS === 'ios') {
        console.log('iOS: Registering device for remote messages...');
        await messaging().registerDeviceForRemoteMessages();
      }

      // Step 2: Request permission with iOS-specific handling
      let authStatus;
      try {
        authStatus = await messaging().requestPermission();
        console.log('Permission status:', authStatus);
      } catch (permissionError) {
        console.error('Permission request failed:', permissionError);
        
        if (Platform.OS === 'ios') {
          // On iOS, try alternative permission approach
          try {
            authStatus = await messaging().requestPermission({
              alert: true,
              badge: true,
              sound: true,
            });
          } catch (altPermissionError) {
            console.error('Alternative permission request failed:', altPermissionError);
            setFcmTokenStatus('error');
            return;
          }
        } else {
          setFcmTokenStatus('error');
          return;
        }
      }

      const enabled = 
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log('Push notifications not enabled');
        setFcmTokenStatus('skipped');
        return;
      }

      // Step 3: Get FCM token with iOS-specific error handling
      let fcmToken;
      try {
        // Add a delay for iOS to ensure APNs token is ready
        if (Platform.OS === 'ios') {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        fcmToken = await messaging().getToken();
        
        if (!fcmToken) {
          throw new Error('No FCM token received');
        }
        
        console.log('FCM TOKEN RECEIVED:', fcmToken?.substring(0, 20) + '...');
        
      } catch (tokenError) {
        console.error('FCM token retrieval failed:', tokenError);
        
        // iOS-specific retry logic
        if (Platform.OS === 'ios' && retryCount < maxRetries) {
          console.log(`iOS: Retrying FCM token retrieval in ${(retryCount + 1) * 2} seconds...`);
          await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
          return getAndStoreToken(retryCount + 1);
        }
        
        // Handle specific iOS errors
        if (tokenError instanceof Error && tokenError.message.includes('cannot parse response')) {
          console.error('iOS FCM Configuration Error: This usually indicates an issue with APNs or Firebase setup');
          Alert.alert(
            'Notification Setup',
            'Push notifications may not work properly. Please check your Firebase configuration.',
            [{ text: 'OK', style: 'default' }]
          );
        }
        
        setFcmTokenStatus('error');
        return;
      }

      // Step 4: Store token
      const tokenData: TokenData = {
        os: Platform.OS,
        token: fcmToken,
      };
      
      await AsyncStorage.setItem('deviceToken', JSON.stringify(tokenData));
      console.log('TOKEN SAVED TO ASYNC STORAGE');
      
      // Step 5: Send to server
      const userInfo = await AsyncStorage.getItem('userInfo');
      if (userInfo) {
        const { access_token } = JSON.parse(userInfo);
        await updateServerToken(fcmToken, access_token);
      }
      
      setFcmTokenStatus('success');
      
    } catch (error) {
      console.error('Unexpected error in getAndStoreToken:', error);
      
      // Final retry for unexpected errors
      if (retryCount < maxRetries) {
        console.log(`Retrying due to unexpected error in ${(retryCount + 1) * 2} seconds...`);
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
        return getAndStoreToken(retryCount + 1);
      }
      
      setFcmTokenStatus('error');
    }
  }, [updateServerToken]);

  // Initialize FCM token on component mount
  useEffect(() => {
    // Delay FCM token retrieval to allow app to fully initialize
    const initializeFCM = async () => {
      // Wait a bit for the app to settle, especially important on iOS
      await new Promise(resolve => setTimeout(resolve, 1000));
      await getAndStoreToken();
    };

    initializeFCM();
  }, [getAndStoreToken]);

  // Listen for token refresh (important for iOS)
  useEffect(() => {
    const unsubscribe = messaging().onTokenRefresh(async (token) => {
      console.log('FCM Token refreshed:', token?.substring(0, 20) + '...');
      
      const tokenData: TokenData = {
        os: Platform.OS,
        token,
      };
      
      await AsyncStorage.setItem('deviceToken', JSON.stringify(tokenData));
      
      // Update server with new token
      const userInfo = await AsyncStorage.getItem('userInfo');
      if (userInfo) {
        const { access_token } = JSON.parse(userInfo);
        await updateServerToken(token, access_token);
      }
    });

    return unsubscribe;
  }, [updateServerToken]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      
      // Try to get FCM token after successful login if not already obtained
      if (fcmTokenStatus !== 'success') {
        await getAndStoreToken();
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Debug component to show FCM status (remove in production)
  const FCMStatusIndicator = () => {
    if (__DEV__) {
      const getStatusColor = () => {
        switch (fcmTokenStatus) {
          case 'success': return '#34C759';
          case 'error': return '#FF3B30';
          case 'loading': return '#FF9500';
          case 'skipped': return '#8E8E93';
          default: return '#8E8E93';
        }
      };

      const getStatusText = () => {
        switch (fcmTokenStatus) {
          case 'success': return '✓ Push notifications ready';
          case 'error': return '⚠️ Push notifications error';
          case 'loading': return '⏳ Setting up notifications...';
          case 'skipped': return '➖ Push notifications disabled';
          default: return '';
        }
      };

      return (
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#4A90E2', '#357ABD']}
        style={styles.gradientBackground}
        useAngle={true}
        angle={135}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header Section */}
          <View style={styles.headerContainer}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>ENACT</Text>
              <Text style={styles.subtitle}>Discover learning moments everywhere</Text>
              <View style={styles.versionBadge}>
                <Text style={styles.version}>v1.0</Text>
              </View>
            </View>
          </View>

          {/* FCM Status Indicator (Debug only) */}
          <FCMStatusIndicator />

          {/* Form Section */}
          <View style={styles.formContainer}>
            <InputField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!isSubmitting}
            />
            
            <InputField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              editable={!isSubmitting}
            />

            <TouchableOpacity
              style={[styles.loginButton, isSubmitting && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>New to ENACT? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Register')}
                disabled={isSubmitting}
              >
                <Text style={styles.link}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        
        {/* Loading Spinner */}
        <Spinner visible={isLoading} />
      </LinearGradient>
    </SafeAreaView>
  );
};

interface InputFieldProps extends React.ComponentProps<typeof TextInput> {
  label: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, ...props }) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      style={styles.input}
      placeholderTextColor="#A0A0A0"
      {...props}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 18,
    color: '#E0E0E0',
    marginBottom: 16,
    textAlign: 'center',
  },
  versionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  version: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
    maxWidth: inputWidth,
    alignSelf: 'center',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  formContainer: {
    width: inputWidth,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    alignSelf: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 16,
    color: '#333333',
  },
  loginButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    backgroundColor: '#A5C8F2',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 16,
    height: 20,
  },
  forgotPasswordText: {
    color: '#4A90E2',
    fontSize: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    height: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    color: '#666666',
    paddingHorizontal: 16,
    fontSize: 14,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    height: 20,
  },
  registerText: {
    color: '#666666',
    fontSize: 14,
  },
  link: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen;