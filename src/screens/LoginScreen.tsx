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

const { width } = Dimensions.get('window');
const inputWidth = Math.min(width * 0.85, 400);

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isLoading, login } = useContext<AuthContextType>(AuthContext);

  const updateServerToken = useCallback(async (fcmToken: string, accessToken: string) => {
    try {
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
      
      if (!response.ok) throw new Error('Failed to update token on server');
    } catch (error) {
      console.error('Error updating token on server:', error);
    }
  }, []);

  const getAndStoreToken = useCallback(async () => {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled = 
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) return;

      const fcmToken = await messaging().getToken();
      const tokenData: TokenData = {
        os: Platform.OS,
        token: fcmToken,
      };
      
      await AsyncStorage.setItem('deviceToken', JSON.stringify(tokenData));
      
      const userInfo = await AsyncStorage.getItem('userInfo');
      if (userInfo) {
        const { access_token } = JSON.parse(userInfo);
        await updateServerToken(fcmToken, access_token);
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
    }
  }, [updateServerToken]);

  useEffect(() => {
    getAndStoreToken();
  }, [getAndStoreToken]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      await getAndStoreToken();
    } catch (error) {
      Alert.alert('Error', 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#4A90E2', '#357ABD']}
        style={styles.gradientBackground}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <Spinner visible={isLoading} />
          <View style={styles.contentContainer}>
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
          </View>
        </KeyboardAvoidingView>
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
  },
  keyboardView: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 40,
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
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
  },
  loginButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
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
  },
  forgotPasswordText: {
    color: '#4A90E2',
    fontSize: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
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