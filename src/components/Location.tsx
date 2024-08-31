import React, {useContext} from 'react';
import {PermissionsAndroid, Platform, Alert} from 'react-native';

import Geolocation from '@react-native-community/geolocation';
// import {AuthContext} from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const fetchLocationAndSendData = async () => {
  try {
    const userInfo = await AsyncStorage.getItem('userInfo');
    if (!userInfo) {
      console.log('No user info found');
      return;
    }
    const access_token = JSON.parse(userInfo || '{}').access_token;
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to your location.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('Location permission denied');
        return;
      }
      const backgroundGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
        {
          title: 'Background Location Permission',
          message: 'This app needs access to your location in the background',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (backgroundGranted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Background location permission granted');
      } else {
        console.log('Background location permission denied');
      }
    }
    Geolocation.getCurrentPosition(
      async position => {
        // console.log(position);
        const {latitude, longitude} = position.coords;
        console.log(latitude, longitude);
        try {
          const response = await fetch('http://68.183.102.75:1337/endpoint', {
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
          console.log('Data sent to server:', response.status);
        } catch (error) {
          console.error('Error sending location data:', error);
        }
      },
      error => {
        Alert.alert('Error', 'Unable to fetch location in Loc component');
        console.log(error);
      },
      {enableHighAccuracy: false, timeout: 60000, maximumAge: 0},
    );
  } catch (error) {
    console.error('Error fetching location:', error);
  }
};

export default fetchLocationAndSendData;
