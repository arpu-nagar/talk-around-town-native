// AppRegistry.registerComponent(appName, () => App);
/**
 * @format
 */
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import 'react-native-get-random-values';
import PushNotification from 'react-native-push-notification';
import {navigationRef} from './src/ref/NavigationRef';
import {Platform} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import BackgroundFetch from 'react-native-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from '@react-native-community/geolocation';
import {BASE_URL} from './src/config';

// Enable comprehensive notification logging
const enableNotificationLogging = () => {
  // Log FCM token refreshes
  messaging().onTokenRefresh(token => {
    console.log('FCM token refreshed:', token);
  });

  // Log when app is opened by clicking a notification
  messaging().onNotificationOpenedApp(message => {
    console.log('App opened via notification:', message);
  });

  // Log initial notification if app was launched by notification
  messaging()
    .getInitialNotification()
    .then(message => {
      if (message) {
        console.log('App launched via notification:', message);
      }
    });
};

// Call this function to enable all notification logging
enableNotificationLogging();

console.log('🔔 Registering FCM message handlers...');

// Enhanced background message handler with better data preservation
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('📩 Background message received:', remoteMessage);

  // Store complete data including metadata to help with debugging
  const enhancedData = {
    ...remoteMessage.data,
    _receivedAt: new Date().toISOString(),
    _isBackground: true,
  };

  // Extract title and message correctly from the incoming FCM message
  const title =
    remoteMessage.data?.title ||
    remoteMessage.notification?.title ||
    'New notification';

  const message =
    remoteMessage.data?.message ||
    remoteMessage.notification?.body ||
    'You have a new notification';

  // Store the title and message explicitly in the enhancedData
  enhancedData.title = title;
  enhancedData.message = message;

  // Parse tips data if present to ensure it's accessible when notification is clicked
  let parsedTips = [];
  if (remoteMessage.data?.tips) {
    try {
      parsedTips = JSON.parse(remoteMessage.data.tips);
      enhancedData.parsedTips = parsedTips;
    } catch (error) {
      console.error('Error parsing tips from background notification:', error);
    }
  }

  // Create a local notification with all necessary data
  PushNotification.localNotification({
    channelId: 'location-tips',
    title: title,
    message: message,
    userInfo: enhancedData,
    playSound: true,
    soundName: 'default',
    importance: 'high',
    priority: 'high',
    // Ensure data is duplicated here as some devices need it in different places
    data: enhancedData,
  });

  return Promise.resolve();
});

// Foreground notification handling (both iOS and Android)
console.log('🔔 Registering foreground message handler...');
messaging().onMessage(async remoteMessage => {
  console.log('📩 Foreground message received:', remoteMessage);

  const enhancedData = {
    ...remoteMessage.data,
    _receivedAt: new Date().toISOString(),
    _isForeground: true,
  };

  // Extract title and message
  const title =
    remoteMessage.data?.title ||
    remoteMessage.notification?.title ||
    'New notification';

  const message =
    remoteMessage.data?.message ||
    remoteMessage.notification?.body ||
    'You have a new notification';

  enhancedData.title = title;
  enhancedData.message = message;

  // Parse tips if present
  if (remoteMessage.data?.tips) {
    try {
      const parsedTips = JSON.parse(remoteMessage.data.tips);
      enhancedData.parsedTips = parsedTips;
    } catch (error) {
      console.error('Error parsing tips from foreground notification:', error);
    }
  }

  // Create local notification to display while app is in foreground
  PushNotification.localNotification({
    channelId: 'location-tips',
    title: title,
    message: message,
    userInfo: enhancedData,
    data: enhancedData,
    playSound: true,
    soundName: 'default',
    importance: 'high',
    priority: 'high',
  });
});

// Request permissions explicitly for iOS
if (Platform.OS === 'ios') {
  messaging()
    .requestPermission()
    .then(authStatus => {
      console.log('iOS notification permission status:', authStatus);
    });
}

// Create notification channels (don't delete existing - just ensure they exist)
console.log('📱 Setting up notification channels...');

PushNotification.channelExists('location-tips', exists => {
  if (!exists) {
    PushNotification.createChannel(
      {
        channelId: 'location-tips',
        channelName: 'Location Tips',
        channelDescription: 'Notifications for location updates',
        importance: 4,
        vibrate: true,
      },
      created => console.log(`Main channel created: ${created}`),
    );
  } else {
    console.log('Main channel already exists');
  }
});

PushNotification.channelExists('app-reminders', exists => {
  if (!exists) {
    PushNotification.createChannel(
      {
        channelId: 'app-reminders',
        channelName: 'App Reminders',
        channelDescription: 'Reminders to open the app',
        importance: 4,
        vibrate: true,
      },
      created => console.log(`Reminders channel created: ${created}`),
    );
  } else {
    console.log('Reminders channel already exists');
  }
});

// Improved navigation function with retry mechanism
const navigateToNotification = (title, message, data) => {
  console.log('⭐ NAVIGATION ATTEMPT with data:', {
    title,
    message,
    locationType: data?.locationType,
    locationName: data?.locationName,
    dataKeys: Object.keys(data || {}),
  });

  // Use a more robust approach with multiple retries
  const maxAttempts = 5;
  let attempts = 0;

  const attemptNavigation = () => {
    attempts++;
    console.log(`Navigation attempt ${attempts}/${maxAttempts}`);

    if (navigationRef.current) {
      try {
        // First ensure we're in the Main navigator
        const currentRoute = navigationRef.current.getCurrentRoute();
        console.log('Current route:', currentRoute?.name);

        if (currentRoute?.name !== 'Main') {
          console.log('Navigating to Main first');
          navigationRef.current.navigate('Main');

          // Then navigate to Tips after a longer delay
          setTimeout(() => {
            console.log('Now navigating to Tips screen with notification data');
            navigationRef.current.navigate('Tips', {
              notificationData: {
                title,
                message,
                ...data,
              },
            });
            console.log('Navigation completed');
          }, 500); // Increased delay for better reliability
        } else {
          // Already in Main, navigate directly
          console.log('Already in Main, navigating to Tips');
          navigationRef.current.navigate('Tips', {
            notificationData: {
              title,
              message,
              ...data,
            },
          });
          console.log('Navigation completed');
        }
        return true; // Navigation succeeded
      } catch (error) {
        console.error('Navigation error:', error);
        return false; // Navigation failed
      }
    } else {
      console.log('Navigation ref not available');
      return false;
    }
  };

  // Try immediately
  if (attemptNavigation()) {
    return; // Success on first try
  }

  // If first attempt fails, retry a few times with increasing delays
  const retryInterval = setInterval(() => {
    if (attempts >= maxAttempts || attemptNavigation()) {
      clearInterval(retryInterval);
      if (attempts >= maxAttempts) {
        console.error('Failed to navigate after maximum attempts');
      }
    }
  }, 800);
};

// Enhanced notification configuration with better debugging
PushNotification.configure({
  onRegister: function (token) {
    console.log('PushNotification TOKEN:', token);
  },

  onNotification: function (notification) {
    const {message, title, userInteraction, foreground, data} = notification;

    // Safety checks for notification content
    const safeTitle = title || 'New Notification';
    const safeMessage = message || 'You have a new notification';

    // Add more detailed logging for debugging
    console.log('======== NOTIFICATION RECEIVED ========');
    console.log('Title:', safeTitle);
    console.log('Message:', safeMessage);
    console.log('User Interaction:', userInteraction);
    console.log('Foreground:', foreground);
    console.log('Raw data object:', data);

    // Enhanced logging for background notification clicks
    if (userInteraction) {
      console.log('👆 USER CLICKED NOTIFICATION - DETAILED DATA:');
      console.log('data object keys:', Object.keys(data || {}));
      console.log('message contains:', safeMessage.substring(0, 50) + '...');

      // Ensure we pass the complete message content as tipDetail for TipsScreen
      const enhancedNavigationData = {
        ...data,
        tipDetail: safeMessage, // Add the full message as tipDetail
        tipCategory: data?.locationType || 'Tip', // Use locationType as category
      };

      console.log('Enhanced navigation data:', enhancedNavigationData);

      // Navigate with enhanced data
      navigateToNotification(safeTitle, safeMessage, enhancedNavigationData);
    }

    // Required on iOS
    notification.finish && notification.finish();
  },

  permissions: {
    alert: true,
    badge: true,
    sound: true,
  },

  popInitialNotification: true,
  requestPermissions: true,
});

// Headless task for BackgroundFetch - runs when app is killed
const headlessTask = async (event) => {
  const taskId = event.taskId;
  const isTimeout = event.timeout;

  if (isTimeout) {
    console.log('[BackgroundFetch Headless] Task timed out:', taskId);
    BackgroundFetch.finish(taskId);
    return;
  }

  console.log('[BackgroundFetch Headless] Starting task:', taskId);

  try {
    const userInfoStr = await AsyncStorage.getItem('userInfo');
    if (!userInfoStr) {
      console.log('[BackgroundFetch Headless] No user info, skipping');
      BackgroundFetch.finish(taskId);
      return;
    }

    const userInfo = JSON.parse(userInfoStr);
    if (!userInfo.access_token) {
      console.log('[BackgroundFetch Headless] No access token, skipping');
      BackgroundFetch.finish(taskId);
      return;
    }

    // Get current position
    const coords = await new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        error => reject(error),
        {
          enableHighAccuracy: false,
          timeout: 30000,
          maximumAge: 60000,
        },
      );
    });

    console.log('[BackgroundFetch Headless] Got location:', coords);

    // Send to server for geofence check
    const response = await fetch(`${BASE_URL}/endpoint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.access_token}`,
      },
      body: JSON.stringify({
        latitude: coords.latitude,
        longitude: coords.longitude,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('[BackgroundFetch Headless] Server response:', result);
    }
  } catch (error) {
    console.error('[BackgroundFetch Headless] Error:', error);
  }

  BackgroundFetch.finish(taskId);
};

// Register the headless task for Android
BackgroundFetch.registerHeadlessTask(headlessTask);

AppRegistry.registerComponent(appName, () => App);
