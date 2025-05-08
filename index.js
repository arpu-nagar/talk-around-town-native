/**
 * @format
 */
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import 'react-native-get-random-values';
import PushNotification from 'react-native-push-notification';
import { navigationRef } from './src/ref/NavigationRef';
import {Platform} from 'react-native';
import messaging from '@react-native-firebase/messaging';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Background message received:', remoteMessage);
  
  // Create a local notification from the background message
  PushNotification.localNotification({
    channelId: 'location-tips',
    title: remoteMessage.data?.title || remoteMessage.notification?.title || 'New notification',
    message: remoteMessage.data?.message || remoteMessage.notification?.body || 'You have a new notification',
    userInfo: remoteMessage.data || {},
    playSound: true,
    soundName: 'default',
    importance: 'high',
    priority: 'high',
    data: {
      ...remoteMessage.data,
      navigateOnClick: true,
    }
  });
  
  return Promise.resolve();
});

// Clear existing channels and create main channel
if (Platform.OS === 'ios') {
  messaging().onMessage(async remoteMessage => {
    console.log('Foreground message received on iOS:', remoteMessage);
    
    // Create a local notification to be displayed immediately
    PushNotification.localNotification({
      channelId: 'location-tips',
      title: remoteMessage.notification?.title || 'New notification',
      message: remoteMessage.notification?.body || 'You have a new notification',
      userInfo: remoteMessage.data || {},
      playSound: true,
      soundName: 'default',
    });
  });
}
PushNotification.getChannels(function (channel_ids) {
  channel_ids.forEach(id => {
    PushNotification.deleteChannel(id);
  });
});

// Create single persistent channel
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

// Navigation helper function
// const navigateToNotification = (title, message, data) => {
//   if (navigationRef.current) {
//     // First ensure we're in the Main navigator
//     if (navigationRef.current.getCurrentRoute()?.name !== 'Main') {
//       navigationRef.current.navigate('Main');
//     }
    
//     // Then navigate to the appropriate tab
//     // You can modify this to navigate to specific screens based on notification type
//     navigationRef.current.navigate('Main', {
//       screen: 'Home',
//       params: {
//         notificationData: {
//           title,
//           message,
//           ...data
//         }
//       }
//     });
//   }
// };
const navigateToNotification = (title, message, data) => {
  console.log('Attempting to navigate with:', { title, message, data });
  
  // Add a small delay to ensure navigation is ready
  setTimeout(() => {
    if (navigationRef.current) {
      console.log('Navigation ref is available');
      
      // First ensure we're in the Main navigator
      if (navigationRef.current.getCurrentRoute()?.name !== 'Main') {
        console.log('Navigating to Main first');
        navigationRef.current.navigate('Main');
        
        // Add a small delay before navigating to the specific screen
        setTimeout(() => {
          console.log('Now navigating to Tips screen with notification data');
          navigationRef.current.navigate('Main', {
            screen: 'Tips', // Changed from 'Home' to 'Tips'
            params: {
              notificationData: {
                title,
                message,
                ...data
              }
            }
          });
        }, 100);
      } else {
        // Already in Main, navigate directly
        console.log('Already in Main, navigating to Tips');
        navigationRef.current.navigate('Main', {
          screen: 'Tips', // Changed from 'Home' to 'Tips'
          params: {
            notificationData: {
              title,
              message,
              ...data
            }
          }
        });
      }
    } else {
      console.log('Navigation ref not available');
    }
  }, 100);
};
PushNotification.configure({
  onRegister: function (token) {
    console.log('TOKEN:', token);
  },

  onNotification: function (notification) {
    const {message, title, userInteraction, foreground, data} = notification;
    
    // Safety checks for notification content
    const safeTitle = title || 'New Notification';
    const safeMessage = message || 'You have a new notification';
    
    console.log('NOTIFICATION RECEIVED:', {
      title: safeTitle,
      body: safeMessage,
      userInteraction,
      foreground,
      data,
    });

    // Only create local notification if it's a new FCM notification
    // and not user clicking an existing notification
    if (!userInteraction && !foreground) {
      PushNotification.localNotification({
        channelId: 'location-tips',
        title: safeTitle,
        message: safeMessage,
        userInfo: data,
        autoCancel: true,
        onlyAlertOnce: true,
        importance: 'high',
        priority: 'high',
        // Add data for navigation when clicked
        data: {
          ...data,
          navigateOnClick: true,
        }
      });
    }

    // Handle notification click
    if (userInteraction) {
      console.log('User clicked notification:', {
        title: safeTitle,
        message: safeMessage,
        data,
      });
      
      // Navigate when notification is clicked
      navigateToNotification(safeTitle, safeMessage, data);
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

AppRegistry.registerComponent(appName, () => App);