import React, {createContext, useState, useEffect, useRef} from 'react';
import {PermissionsAndroid, Platform, Alert} from 'react-native';
import Geolocation from '@react-native-community/geolocation';

interface Location {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}
interface LocationContextProps {
  cur_location: Location | null;
  loc_loading: boolean;
  setLocation: React.Dispatch<React.SetStateAction<Location | null>>;
}

export const LocationContext = createContext<LocationContextProps | undefined>(
  undefined,
);

export const LocationProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [cur_location, setLocation] = useState<Location | null>(null);
  const [loc_loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocation = async () => {
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
        position => {
          const {latitude, longitude} = position.coords;
          setLocation({
            latitude,
            longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.0121,
          });
          setLoading(false);
        },
        error => {
          Alert.alert('Error', 'Unable to fetch location in Context');
          console.error(error);
        },
        {enableHighAccuracy: false, timeout: 60000, maximumAge: 0},
      );
    };

    fetchLocation();
  }, []);

  return (
    <LocationContext.Provider value={{cur_location, loc_loading, setLocation}}>
      {children}
    </LocationContext.Provider>
  );
};
