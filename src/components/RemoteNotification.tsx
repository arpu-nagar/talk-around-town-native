import { useEffect, useContext, useRef, useCallback, useState } from 'react';
import Geolocation from '@react-native-community/geolocation';
import messaging from '@react-native-firebase/messaging';
import notifee, {
  AndroidImportance,
  AndroidStyle,
  EventType,
} from '@notifee/react-native';
import { AuthContext, AuthContextType } from '../context/AuthContext';
import { AppState, AppStateStatus } from 'react-native';
  
const RemoteNotification: React.FC = () => {

  const { userInfo } = useContext<AuthContextType>(AuthContext);
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const lastNotificationId = useRef<string | null>(null);
  const lastPressTime = useRef<number>(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const appState = useRef(AppState.currentState);
  const setupCompleted = useRef(false);

  const verifyAuth = async (token: string) => {
    try {
      const response = await fetch('http://68.183.102.75:1337/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          headers: {
            authorization: `Bearer ${token}`
          }
        }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
        return true;
      }
      setIsAuthenticated(false);
      return false;
    } catch (error) {
      console.error('Auth verification error:', error);
      setIsAuthenticated(false);
      return false;
    }
  };

  let tokenUpdateInProgress = false;

const setupFCM = async () => {
  try {
    if (tokenUpdateInProgress) {
      console.log('Token update already in progress, skipping');
      return null;
    }

    tokenUpdateInProgress = true;
    const token = await messaging().getToken();
    console.log('FCM Token:', token);

    if (userInfo?.access_token && token) {
      const response = await fetch('http://68.183.102.75:1337/api/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.access_token}`,
        },
        body: JSON.stringify({
          token,
          platform: 'ios'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update token on server');
      }
      
      console.log('Token successfully updated on server');
    }

    return token;
  } catch (error) {
    console.error('Error setting up FCM:', error);
    return null;
  } finally {
    tokenUpdateInProgress = false;
  }
};

// Add debounce function
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const locationCheck = useCallback(async () => {
  if (!userInfo?.access_token || !isAuthenticated) {
    console.log('No valid auth token available');
    return;
  }

  try {
    // Get current position
    const position = await new Promise<any>((resolve, reject) => {
      Geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 60000,
          maximumAge: 10000,
        }
      );
    });

    const { latitude, longitude } = position.coords;
    
    // Check if location has changed significantly
    if (lastLocationRef.current) {
      const distance = calculateDistance(
        lastLocationRef.current.latitude,
        lastLocationRef.current.longitude,
        latitude,
        longitude
      );
      
      setIsMoving(distance > 10);
      
      if (distance <= 10) {
        console.log('Location hasn\'t changed significantly, skipping server check');
        return;
      }
    }

    lastLocationRef.current = { latitude, longitude };
    console.log(`📍 Location update: ${latitude}, ${longitude}`);

    // Send location to endpoint to check for nearby locations
    const response = await fetch('http://68.183.102.75:1337/endpoint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.access_token}`,
      },
      body: JSON.stringify({
        latitude,
        longitude,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Server response:', result);
    
    // If we found a nearby location, fetch and display tips
    if (result.status === 'success' && result.location) {
      // Get tips for this location type
      const tipsResponse = await fetch('http://68.183.102.75:1337/api/tips/get-tips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.access_token}`,
        },
        body: JSON.stringify({
          type: result.type
        }),
      });

      if (!tipsResponse.ok) {
        throw new Error('Failed to fetch tips');
      }

      const tipsData = await tipsResponse.json();
      
      if (!Array.isArray(tipsData) || tipsData.length === 0) {
        console.log('No tips available for location');
        return;
      }

      // Format tips text
      const tipsText = tipsData
        .map(tip => `${tip.title}\n${tip.description}`)
        .join('\n\n');

      if (!tipsText.trim()) {
        console.log('Tips text is empty, skipping notification');
        return;
      }

      // Display notification with tips
      await displayFullNotification(
        `You have arrived at ${result.location}`,
        `${result.type} Tips:\n\n${tipsText}`,
        {
          notificationId: result.notificationId || String(Date.now()),
          locationType: String(result.type || ''),
          locationId: String(result.locationId || ''),
          locationName: String(result.location || '')
        }
      );
    }
    
  } catch (error) {
    console.error('❌ Location check error:', error);
    if (error instanceof Error && error.message.includes('401')) {
      setIsAuthenticated(false);
    }
  }
}, [userInfo?.access_token, isAuthenticated]);

  // Update your setup function in useEffect
  useEffect(() => {
    const setup = async () => {
      try {
        if (!userInfo?.access_token || setupCompleted.current) {
          console.log('Setup already completed or no access token');
          return;
        }

        const isValid = await verifyAuth(userInfo.access_token);
        if (!isValid) {
          console.log('Initial auth verification failed');
          return;
        }

        const authStatus = await messaging().requestPermission();
        if (authStatus !== messaging.AuthorizationStatus.AUTHORIZED) {
          console.log('❌ Notification permission denied');
          return;
        }

        await setupFCM();

        // Handle notification press in foreground
        const unsubscribeNotifeePress = notifee.onForegroundEvent(({ type, detail }) => {
          if (type === EventType.PRESS) {
            const now = Date.now();
            if (now - lastPressTime.current < 1000) {
              console.log('Debouncing notification press');
              return;
            }
            lastPressTime.current = now;
            console.log('Notification pressed:', detail.notification);
            // Handle notification press here
          }
        });

        // Handle notification display events
        const unsubscribeNotifeeDisplay = notifee.onForegroundEvent(({ type, detail }) => {
          if (type === EventType.DELIVERED) {
            console.log('Notification delivered:', detail.notification);
          }
        });

        // Handle background notification press
        messaging().onNotificationOpenedApp(async remoteMessage => {
          console.log('Background notification pressed:', remoteMessage);
          // Handle background notification press here
        });

        // Handle quit state notification press
        const initialNotification = await messaging().getInitialNotification();
        if (initialNotification) {
          console.log('Quit state notification pressed:', initialNotification);
          // Handle quit state notification press here
        }

        // Start location checking
        await locationCheck();
        locationIntervalRef.current = setInterval(
          locationCheck, 
          isMoving ? 30000 : 60000
        );

        setupCompleted.current = true;

        return () => {
          unsubscribeNotifeePress();
          unsubscribeNotifeeDisplay();
          if (locationIntervalRef.current) {
            clearInterval(locationIntervalRef.current);
          }
          setupCompleted.current = false;
        };
      } catch (error) {
        console.error('❌ Setup error:', error);
        setupCompleted.current = false;
      }
    };

    if (userInfo?.access_token) {
      setup();
    }

    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, [userInfo?.access_token, locationCheck, isMoving]);

  const displayFullNotification = async (title: string, body: string, data: any) => {
    try {
      const channelId = await notifee.createChannel({
        id: 'location-tips',
        name: 'Location Tips',
        importance: AndroidImportance.HIGH,
      });
  
      // Ensure all data values are strings
      const notificationData = {
        notificationId: String(data.notificationId || ''),
        locationType: String(data.locationType || ''),
        locationId: String(data.locationId || ''),
        locationName: String(data.locationName || '')
      };
  
      await notifee.displayNotification({
        id: notificationData.notificationId,
        title,
        body,
        data: notificationData,
        android: {
          channelId,
          importance: AndroidImportance.HIGH,
          style: {
            type: AndroidStyle.BIGTEXT,
            text: body,
          },
          pressAction: {
            id: 'default',
          },
        },
        ios: {
          critical: true,
          interruptionLevel: 'active',
          foregroundPresentationOptions: {
            badge: true,
            sound: true,
            banner: true,
            list: true,
          },
        },
      });
    } catch (error) {
      console.error('Error displaying notification:', error);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c * 1000; // Convert to meters
  };

  return null;
};

export default RemoteNotification;
