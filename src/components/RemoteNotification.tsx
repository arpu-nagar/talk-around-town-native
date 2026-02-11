import {useEffect, useContext, useRef, useCallback, useState} from 'react';
import Geolocation from '@react-native-community/geolocation';
import messaging from '@react-native-firebase/messaging';
import notifee, {EventType} from '@notifee/react-native';
import {AuthContext, AuthContextType} from '../context/AuthContext';
import {Platform} from 'react-native';
import {BASE_URL} from '../config';

const RemoteNotification: React.FC = () => {
  const {userInfo} = useContext<AuthContextType>(AuthContext);
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const lastLocationRef = useRef<{latitude: number; longitude: number} | null>(
    null,
  );
  const [isMoving, setIsMoving] = useState(false);
  const lastPressTime = useRef<number>(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const setupCompleted = useRef(false);

  const verifyAuth = async (token: string) => {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/verify`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({headers: {authorization: `Bearer ${token}`}}),
      });
      setIsAuthenticated(response.ok);
      return response.ok;
    } catch (error) {
      console.error('Auth verification error:', error);
      setIsAuthenticated(false);
      return false;
    }
  };

  const setupFCM = async () => {
    try {
      const token = await messaging().getToken();
      if (userInfo?.access_token && token) {
        console.log('FCM token:', token);
        console.log('User token:', userInfo.access_token);
        const response = await fetch(`${BASE_URL}/api/auth/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userInfo.access_token}`,
          },
          body: JSON.stringify({token, platform: Platform.OS}),
        });
        if (!response.ok) throw new Error('Failed to update token on server');
      }
      return token;
    } catch (error) {
      console.error('Error setting up FCM:', error);
      return null;
    }
  };

  const locationCheck = useCallback(async () => {
    if (!userInfo?.access_token || !isAuthenticated) return;

    try {
      const position = await new Promise<any>((resolve, reject) => {
        Geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 60000,
          maximumAge: 10000,
        });
      });

      const {latitude, longitude} = position.coords;

      if (lastLocationRef.current) {
        const distance = calculateDistance(
          lastLocationRef.current.latitude,
          lastLocationRef.current.longitude,
          latitude,
          longitude,
        );
        setIsMoving(distance > 10);
        if (distance <= 10) return;
      }

      lastLocationRef.current = {latitude, longitude};

      const response = await fetch(`${BASE_URL}/endpoint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.access_token}`,
        },
        body: JSON.stringify({latitude, longitude}),
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();

      // Backend sends personalized tips via FCM notification
      // No need to fetch tips or display local notification here
      if (result.status === 'success' && result.location) {
        console.log(`Geofence detected: ${result.location} (${result.type})`);
      }
    } catch (error) {
      console.error('Location check error:', error);
      if (error instanceof Error && error.message.includes('401')) {
        setIsAuthenticated(false);
      }
    }
  }, [userInfo?.access_token, isAuthenticated]);

  useEffect(() => {
    const setup = async () => {
      if (!userInfo?.access_token || setupCompleted.current) return;

      try {
        const isValid = await verifyAuth(userInfo.access_token);
        if (!isValid) return;

        const authStatus = await messaging().requestPermission();
        // console.log('FCM Auth Status:', authStatus);
        if (authStatus !== messaging.AuthorizationStatus.AUTHORIZED) return;

        await setupFCM();

        notifee.onForegroundEvent(({type, detail}) => {
          if (type === EventType.PRESS) {
            const now = Date.now();
            if (now - lastPressTime.current < 1000) return;
            lastPressTime.current = now;
            console.log('Notification pressed:', detail.notification);
          }
        });

        messaging().onNotificationOpenedApp(async remoteMessage => {
          console.log('Background notification pressed:', remoteMessage);
        });

        const initialNotification = await messaging().getInitialNotification();
        if (initialNotification) {
          console.log('Quit state notification pressed:', initialNotification);
        }

        await locationCheck();
        locationIntervalRef.current = setInterval(
          locationCheck,
          isMoving ? 30000 : 60000,
        );

        setupCompleted.current = true;
      } catch (error) {
        console.error('Setup error:', error);
        setupCompleted.current = false;
      }
    };

    if (userInfo?.access_token) setup();

    return () => {
      if (locationIntervalRef.current)
        clearInterval(locationIntervalRef.current);
    };
  }, [userInfo?.access_token, locationCheck, isMoving]);

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000;
  };

  return null;
};

export default RemoteNotification;
