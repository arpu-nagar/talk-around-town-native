import React, { useContext, useState, useEffect } from 'react';
import {
  Button,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext, AuthContextType } from '../context/AuthContext';
import { NavigationProp } from '@react-navigation/native';
import messaging from '@react-native-firebase/messaging';

interface LoginScreenProps {
  navigation: NavigationProp<any>;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { isLoading, login } = useContext<AuthContextType>(AuthContext);
  
  // Function to get and store FCM token
  const getAndStoreToken = async () => {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        const fcmToken = await messaging().getToken();
        console.log('FCM Token:', fcmToken);
        
        // Store token locally
        const tokenData = {
          os: Platform.OS,
          token: fcmToken,
        };
        await AsyncStorage.setItem('deviceToken', JSON.stringify(tokenData));
        
        // Send token to server
        const userInfo = await AsyncStorage.getItem('userInfo');
        if (userInfo) {
          const { access_token } = JSON.parse(userInfo);
          await updateServerToken(fcmToken, access_token);
        }
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
    }
  };

  // Function to update token on server
  const updateServerToken = async (fcmToken: string, accessToken: string) => {
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

      if (!response.ok) {
        throw new Error('Failed to update token on server');
      }

      console.log('Token updated on server successfully');
    } catch (error) {
      console.error('Error updating token on server:', error);
    }
  };

  // Log authentication information
  const logAuthInfo = async () => {
    try {
      const userInfo = await AsyncStorage.getItem('userInfo');
      const deviceToken = await AsyncStorage.getItem('deviceToken');
      
      console.log('\n=== AUTH INFORMATION ===');
      if (userInfo) {
        const parsedInfo = JSON.parse(userInfo);
        console.log('User Info:', {
          ...parsedInfo,
          access_token: parsedInfo.access_token ? `${parsedInfo.access_token.slice(0, 10)}...` : null,
        });
        console.log('Full Access Token:', parsedInfo.access_token);
      } else {
        console.log('No user info found');
      }
      
      console.log('Device Token:', deviceToken ? JSON.parse(deviceToken) : null);
      console.log('========================\n');
    } catch (error) {
      console.error('Error logging auth info:', error);
    }
  };

  // Initialize FCM when component mounts
  useEffect(() => {
    getAndStoreToken();
  }, []);

  // Enhanced login handler
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await login(email, password);
      
      // After successful login, get and store FCM token
      await getAndStoreToken();
      
      // Log updated auth info
      setTimeout(logAuthInfo, 1000);
    } catch (error) {
      Alert.alert('Error', 'Login failed. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Spinner visible={isLoading} />
      <View style={styles.wrapper}>
        <Text style={styles.title}>Talk Around Town v1.0</Text>
        <TextInput
          style={styles.input}
          value={email}
          placeholder="Enter email"
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          value={password}
          placeholder="Enter password"
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        <Button title="Login" onPress={handleLogin} />
        <View style={styles.registerContainer}>
          <Text>Don't have an account? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            accessibilityLabel="Register for a new account"
          >
            <Text style={styles.link}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  wrapper: {
    width: '80%',
    maxWidth: 400,
  },
  title: {
    padding: 10,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 16,
  },
  registerContainer: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'center',
  },
  link: {
    color: 'blue',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;