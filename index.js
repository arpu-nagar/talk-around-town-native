// /**
//  * @format
//  */
// import {AppRegistry} from 'react-native';
// import App from './App';
// import {name as appName} from './app.json';
// import 'react-native-get-random-values';
// import PushNotification from 'react-native-push-notification';
// import { navigationRef } from './src/ref/NavigationRef';
// import {Platform} from 'react-native';
// import messaging from '@react-native-firebase/messaging';

// // messaging().setBackgroundMessageHandler(async remoteMessage => {
// //   console.log('Background message received:', remoteMessage);
  
// //   // Create a local notification from the background message
// //   PushNotification.localNotification({
// //     channelId: 'location-tips',
// //     title: remoteMessage.data?.title || remoteMessage.notification?.title || 'New notification',
// //     message: remoteMessage.data?.message || remoteMessage.notification?.body || 'You have a new notification',
// //     userInfo: remoteMessage.data || {},
// //     playSound: true,
// //     soundName: 'default',
// //     importance: 'high',
// //     priority: 'high',
// //     data: {
// //       ...remoteMessage.data,
// //       navigateOnClick: true,
// //     }
// //   });
  
// //   return Promise.resolve();
// // });

// // Clear existing channels and create main channel
// if (Platform.OS === 'ios') {
//   messaging().onMessage(async remoteMessage => {
//     console.log('Foreground message received on iOS:', remoteMessage);
    
//     // Create a local notification to be displayed immediately
//     PushNotification.localNotification({
//       channelId: 'location-tips',
//       title: remoteMessage.notification?.title || 'New notification',
//       message: remoteMessage.notification?.body || 'You have a new notification',
//       userInfo: remoteMessage.data || {},
//       playSound: true,
//       soundName: 'default',
//     });
//   });
// }
// PushNotification.getChannels(function (channel_ids) {
//   channel_ids.forEach(id => {
//     PushNotification.deleteChannel(id);
//   });
// });

// // Create single persistent channel
// PushNotification.createChannel(
//   {
//     channelId: 'location-tips',
//     channelName: 'Location Tips',
//     channelDescription: 'Notifications for location updates',
//     importance: 4,
//     vibrate: true,
//   },
//   created => console.log(`Main channel created: ${created}`),
// );

// PushNotification.createChannel(
//   {
//     channelId: 'app-reminders',
//     channelName: 'App Reminders',
//     channelDescription: 'Reminders to open the app',
//     importance: 4,
//     vibrate: true,
//   },
//   created => console.log(`Reminders channel created: ${created}`),
// );

// // Navigation helper function
// // const navigateToNotification = (title, message, data) => {
// //   if (navigationRef.current) {
// //     // First ensure we're in the Main navigator
// //     if (navigationRef.current.getCurrentRoute()?.name !== 'Main') {
// //       navigationRef.current.navigate('Main');
// //     }
    
// //     // Then navigate to the appropriate tab
// //     // You can modify this to navigate to specific screens based on notification type
// //     navigationRef.current.navigate('Main', {
// //       screen: 'Home',
// //       params: {
// //         notificationData: {
// //           title,
// //           message,
// //           ...data
// //         }
// //       }
// //     });
// //   }
// // };
// const navigateToNotification = (title, message, data) => {
//   console.log('Attempting to navigate with:', { title, message, data });
  
//   // Add a small delay to ensure navigation is ready
//   setTimeout(() => {
//     if (navigationRef.current) {
//       console.log('Navigation ref is available');
      
//       // First ensure we're in the Main navigator
//       if (navigationRef.current.getCurrentRoute()?.name !== 'Main') {
//         console.log('Navigating to Main first');
//         navigationRef.current.navigate('Main');
        
//         // Add a small delay before navigating to the specific screen
//         setTimeout(() => {
//           console.log('Now navigating to Tips screen with notification data');
//           navigationRef.current.navigate('Main', {
//             screen: 'Tips', // Changed from 'Home' to 'Tips'
//             params: {
//               notificationData: {
//                 title,
//                 message,
//                 ...data
//               }
//             }
//           });
//         }, 100);
//       } else {
//         // Already in Main, navigate directly
//         console.log('Already in Main, navigating to Tips');
//         navigationRef.current.navigate('Main', {
//           screen: 'Tips', // Changed from 'Home' to 'Tips'
//           params: {
//             notificationData: {
//               title,
//               message,
//               ...data
//             }
//           }
//         });
//       }
//     } else {
//       console.log('Navigation ref not available');
//     }
//   }, 100);
// };
// PushNotification.configure({
//   onRegister: function (token) {
//     console.log('TOKEN:', token);
//   },

//   onNotification: function (notification) {
//     const {message, title, userInteraction, foreground, data} = notification;
    
//     // Safety checks for notification content
//     const safeTitle = title || 'New Notification';
//     const safeMessage = message || 'You have a new notification';
    
//     console.log('NOTIFICATION RECEIVED:', {
//       title: safeTitle,
//       body: safeMessage,
//       userInteraction,
//       foreground,
//       data,
//     });

//     // Only create local notification if it's a new FCM notification
//     // and not user clicking an existing notification
//     if (!userInteraction && !foreground) {
//       PushNotification.localNotification({
//         channelId: 'location-tips',
//         title: safeTitle,
//         message: safeMessage,
//         userInfo: data,
//         autoCancel: true,
//         onlyAlertOnce: true,
//         importance: 'high',
//         priority: 'high',
//         // Add data for navigation when clicked
//         data: {
//           ...data,
//           navigateOnClick: true,
//         }
//       });
//     }

//     // Handle notification click
//     if (userInteraction) {
//       console.log('User clicked notification:', {
//         title: safeTitle,
//         message: safeMessage,
//         data,
//       });
      
//       // Navigate when notification is clicked
//       navigateToNotification(safeTitle, safeMessage, data);
//     }

//     // Required on iOS
//     notification.finish && notification.finish();
//   },

//   permissions: {
//     alert: true,
//     badge: true,
//     sound: true,
//   },

//   popInitialNotification: true,
//   requestPermissions: true,
// });

// AppRegistry.registerComponent(appName, () => App);
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
  messaging().getInitialNotification().then(message => {
    if (message) {
      console.log('App launched via notification:', message);
    }
  });
};

// Call this function to enable all notification logging
enableNotificationLogging();

// Enhanced background message handler with better data preservation
// Enhanced background message handler with better data preservation
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Background message received:', remoteMessage);
  
  // Store complete data including metadata to help with debugging
  const enhancedData = {
    ...remoteMessage.data,
    _receivedAt: new Date().toISOString(),
    _isBackground: true,
  };
  
  // Extract title and message correctly from the incoming FCM message
  const title = remoteMessage.data?.title || 
                remoteMessage.notification?.title || 
                'New notification';
  
  const message = remoteMessage.data?.message || 
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

// iOS foreground notification handling
if (Platform.OS === 'ios') {
  messaging().onMessage(async remoteMessage => {
    console.log('Foreground message received on iOS:', remoteMessage);
    
    // Similar enhancement of data for iOS
    const enhancedData = {
      ...remoteMessage.data,
      _receivedAt: new Date().toISOString(),
      _isForeground: true,
    };
    
    // Parse tips if present
    if (remoteMessage.data?.tips) {
      try {
        const parsedTips = JSON.parse(remoteMessage.data.tips);
        enhancedData.parsedTips = parsedTips;
      } catch (error) {
        console.error('Error parsing tips from iOS notification:', error);
      }
    }
    
    // Create local notification
    PushNotification.localNotification({
      channelId: 'location-tips',
      title: remoteMessage.notification?.title || 'New notification',
      message: remoteMessage.notification?.body || 'You have a new notification',
      userInfo: enhancedData,
      data: enhancedData,
      playSound: true,
      soundName: 'default',
    });
  });
  
  // Request permissions explicitly for iOS
  messaging().requestPermission().then(authStatus => {
    console.log('iOS notification permission status:', authStatus);
  });
}

// Clear and recreate notification channels
PushNotification.getChannels(function (channel_ids) {
  channel_ids.forEach(id => {
    PushNotification.deleteChannel(id);
  });
});

// Create notification channels
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

// Improved navigation function with retry mechanism
const navigateToNotification = (title, message, data) => {
  console.log('⭐ NAVIGATION ATTEMPT with data:', { 
    title, 
    message, 
    locationType: data?.locationType,
    locationName: data?.locationName,
    dataKeys: Object.keys(data || {})
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
            console.log('Navigation completed');
          }, 500); // Increased delay for better reliability
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

AppRegistry.registerComponent(appName, () => App);