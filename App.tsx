'use strict';
import React, {useEffect} from 'react';
import {StatusBar, Platform, Alert, PermissionsAndroid} from 'react-native';
import Navigation from './src/components/Navigation';
import {AuthProvider} from './src/context/AuthContext';
import {LocationProvider} from './src/context/LocationContext';
// import RemoteNotification from './src/components/RemoteNotification';
import messaging from '@react-native-firebase/messaging';
import AppStateTracker from './src/components/AppStateTracker';

const App = () => {
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
  useEffect(() => {
    const showWelcomeMessage = () => {
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

      Alert.alert('Welcome!', message, [
        {
          text: 'OK',
          onPress: () => {
            checkApplicationPermission();
            console.log('User clicked OK for the welcome message');
          },
        },
      ]);
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

    // Show welcome message on first launch
    showWelcomeMessage();

    // Log startup information
    logStartupInfo().catch(error => {
      console.error('Error logging startup info:', error);
    });
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
