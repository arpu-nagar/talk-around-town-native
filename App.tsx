'use strict';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import {
  Alert,
  PermissionsAndroid,
  Platform,
  StatusBar,
  AppState,
} from 'react-native';
import Navigation from './src/components/Navigation';
import {AuthProvider} from './src/context/AuthContext';
import {LocationProvider} from './src/context/LocationContext';
import Geolocation from '@react-native-community/geolocation';
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GetLocation1 from 'react-native-get-location';
import * as BackgroundFetch from 'expo-background-fetch';
import UserLocation from './UserLocation';

const App = () => {
  // React.useEffect(() => {
  //   const subscription = AppState.addEventListener(
  //     'change',
  //     handleAppStateChange,
  //   );
  //   return () => {
  //     // subscription.remove();
  //   };
  // }, [appState]);
  // if (!locationStarted) {
  //   console.log('Location tracking not started yet.');
  //   return <></>;
  // }
  return (
    <AuthProvider>
      <LocationProvider>
        <StatusBar backgroundColor="#06bcee" />
        <Navigation />
        <UserLocation />
      </LocationProvider>
    </AuthProvider>
  );
};

export default App;
