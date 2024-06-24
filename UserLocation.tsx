import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import {Application} from 'expo-application';
const LOCATION_TRACKING = 'location-tracking-3';
// global variable to track app state
// let isAppInForeground = true;
export default function UserLocation() {
  const [locationStarted, setLocationStarted] = React.useState(false);

  const startLocationTracking = async () => {
    try {
      await Location.startLocationUpdatesAsync(LOCATION_TRACKING, {
        accuracy: Location.Accuracy.Highest,
        timeInterval: 60000,
        distanceInterval: 0,
        foregroundService: {
          notificationTitle: 'Location Tracking',
          notificationBody: 'Background location tracking is on',
          killServiceOnDestroy: true,
        },
      });
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(
        LOCATION_TRACKING,
      );
      setLocationStarted(hasStarted);
      console.log('tracking started?', hasStarted);
    } catch (error) {
      console.log('Error starting location tracking:', error);
    }
  };

  const startLocation = () => {
    startLocationTracking();
  };

  React.useEffect(() => {
    const config = async () => {
      let resf = await Location.requestForegroundPermissionsAsync();
      let resb = await Location.requestBackgroundPermissionsAsync();
      if (resf.status != 'granted' && resb.status !== 'granted') {
        console.log('Permission to access location was denied');
      } else {
        console.log('Permission to access location granted');
      }
    };
    // if (!locationStarted) {
    config();
    // }
  }, []);

  const stopLocation = () => {
    setLocationStarted(false);
    TaskManager.isTaskRegisteredAsync(LOCATION_TRACKING).then(tracking => {
      if (tracking) {
        Location.stopLocationUpdatesAsync(LOCATION_TRACKING);
      }
    });
  };

  return (
    <View>
      {locationStarted ? (
        <TouchableOpacity onPress={stopLocation} style={styles.button}>
          <Text style={styles.btnText}>Stop Tracking</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={startLocation} style={styles.button}>
          <Text style={styles.btnText}>Start Tracking</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  btnText: {
    // fontSize: 20,
    color: 'white',
  },
  button: {
    backgroundColor: 'green',
    color: 'white',
    padding: 5,
    width: 120,
    margin: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
});

TaskManager.defineTask(LOCATION_TRACKING, async ({data, error}) => {
  if (error) {
    console.log('LOCATION_TRACKING task ERROR:', error);
    return;
  }
  console.log('poop');
  // if(locationStarted)
  // get app state ie foreground or background
  if (data) {
    console.log('LOCATION_TRACKING task started:');
    const {locations} = data as any;
    // if (locations.length <= 5) return; // delay

    let latitude = locations[0].coords.latitude;
    let longitude = locations[0].coords.longitude;
    // get access token
    const userInfo = await AsyncStorage.getItem('userInfo');
    if (!userInfo) {
      console.log('No user info found');
      return;
    }
    let access_token = JSON.parse(userInfo || '{}').access_token;
    console.log('Access token:', access_token);
    console.log(
      `${new Date(Date.now()).toLocaleString()}: ${latitude},${longitude}`,
    );
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
      console.log('Data sent to server via bg-task:', response.status);
    } catch (error) {
      console.error('Error sending location data:', error);
    }
  }
});
