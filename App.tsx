// import React from 'react';
import {
  PermissionsAndroid,
  Platform,
  StatusBar,
  Text,
  View,
} from 'react-native';
import Navigation from './src/components/Navigation';
import {AuthProvider} from './src/context/AuthContext';
import {LocationProvider} from './src/context/LocationContext';
import Geolocation from '@react-native-community/geolocation';

import React, {useEffect} from 'react';
import {AppRegistry} from 'react-native';

// import BackgroundFetch from 'react-native-background-fetch';
import fetchLocationAndSendData from './src/components/Location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackgroundFetch from 'react-native-background-fetch';
import GetLocation1 from 'react-native-get-location';
Geolocation.setRNConfiguration({
  enableBackgroundLocationUpdates: true,
  skipPermissionRequests: true,
});

const App = () => {
  BackgroundFetch.configure(
    {
      minimumFetchInterval: 15, // Minimum interval in minutes
      stopOnTerminate: false, // Keep running in the background
    },
    async taskID => {
      // Perform background tasks here
      console.log('bg task started in app');
      const userInfo = await AsyncStorage.getItem('userInfo');
      if (!userInfo) {
        console.log('No user info found');
        return;
      }
      let access_token = JSON.parse(userInfo || '{}').access_token;
      console.log('Access token:', access_token);
      GetLocation1.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
      })
        .then(async location  => {
          console.log(location);
          // make the API call here
          let {latitude, longitude} = location;
          try {
            const response = await fetch('http://localhost:1337/endpoint', {
              method: 'POST',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${access_token}`,
              },
              body: JSON.stringify({
                latitude,
                longitude,
              }),
            });
            // const jsonResponse = await response.json();
            console.log('Data sent to server in:', response.status);
          } catch (error) {
            console.error('Error sending location data:', error);
          }
        })
        .catch(error => {
          const {code, message} = error;
          console.warn(code, message);
        });
      // await fetchLocationAndSendData();
      BackgroundFetch.finish(taskID);
    },
    error => {
      console.error('Background fetch error:', error);
    },
  );

  return (
    <AuthProvider>
      <LocationProvider>
        <StatusBar backgroundColor="#06bcee" />
        <Navigation />
      </LocationProvider>
    </AuthProvider>
  );
};

export default App;
