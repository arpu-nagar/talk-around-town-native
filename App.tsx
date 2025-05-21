'use strict';
import React, {useEffect, useState} from 'react';
import {StatusBar, Platform, Alert, PermissionsAndroid} from 'react-native';
import Navigation from './src/components/Navigation';
import {AuthProvider} from './src/context/AuthContext';
import {LocationProvider} from './src/context/LocationContext';
// import RemoteNotification from './src/components/RemoteNotification';
import messaging from '@react-native-firebase/messaging';
import AppStateTracker from './src/components/AppStateTracker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WELCOME_SHOWN_KEY = 'welcome_message_shown';

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  const checkApplicationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
      } catch (error) {
        console.error(error);
      }
    }
  };

  const showWelcomeMessage = async () => {
    try {
      // Check if welcome message has been shown before
      const welcomeShown = await AsyncStorage.getItem(WELCOME_SHOWN_KEY);
      
      if (welcomeShown !== 'true') {
        const message = Platform.select({
          ios:
            'To provide you with the best experience, we need to:\n\n' +
            '1. Send you notifications about nearby points of interest\n' +
            "2. Access your location to detect when you're near points of interest\n\n" +
            'Please allow these permissions in the following prompts.',
          android:
            'To provide you with the best experience, we need to:\n\n' +
            '1. Send you notifications about nearby points of interest\n' +
            "2. Access your location to detect when you're near points of interest\n\n" +
            'Please allow these permissions when prompted.',
          default: '',
        });
        
        // Show the welcome message
        Alert.alert('Welcome!', message, [
          {
            text: 'OK',
            onPress: async () => {
              // Mark welcome message as shown
              await AsyncStorage.setItem(WELCOME_SHOWN_KEY, 'true');
              checkApplicationPermission();
              console.log('User clicked OK for the welcome message');
            },
          },
        ]);
      } else {
        // If welcome was already shown, check permissions silently
        checkApplicationPermission();
      }
    } catch (error) {
      console.error('Error checking welcome status:', error);
      // In case of error, still check permissions
      checkApplicationPermission();
    }
  };

  const logStartupInfo = async () => {
    if (__DEV__) {
      console.log('\n============= APP STARTUP =============');
      console.log('Platform:', Platform.OS);
      console.log('Version:', Platform.Version);
      // iOS specific checks
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().hasPermission();
        const notificationSettings = await messaging().requestPermission();
        console.log('\n-------- iOS Permissions --------');
        console.log('FCM Auth Status:', authStatus);
        console.log('Notification Settings:', notificationSettings);
        console.log(
          'Background Modes Enabled:',
          messaging().isAutoInitEnabled,
        );
        // Log notification authorization status
        console.log('Notification Auth Status:', notificationSettings);
      }
      // Log general app info
      console.log('\n-------- App Settings --------');
      console.log('Development Mode:', __DEV__ ? 'Yes' : 'No');
      console.log(
        'Bundle ID:',
        Platform.select({
          ios: 'com.yourapp.bundle', // Replace with your actual bundle ID
          android: 'com.yourapp.package', // Replace with your actual package name
          default: 'unknown',
        }),
      );
      console.log('\n====================================\n');
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Show welcome message on first launch
        await showWelcomeMessage();
        
        // Log startup information
        await logStartupInfo();
      } catch (error) {
        console.error('Error during app initialization:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  return (
    <AuthProvider>
      <LocationProvider>
        <StatusBar backgroundColor="#06bcee" />
        <AppStateTracker />
        {/* <RemoteNotification /> */}
        <Navigation />
      </LocationProvider>
    </AuthProvider>
  );
};

export default App;