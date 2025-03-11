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

// Navigation helper function
const navigateToNotification = (title, message, data) => {
  if (navigationRef.current) {
    // First ensure we're in the Main navigator
    if (navigationRef.current.getCurrentRoute()?.name !== 'Main') {
      navigationRef.current.navigate('Main');
    }
    
    // Then navigate to the appropriate tab
    // You can modify this to navigate to specific screens based on notification type
    navigationRef.current.navigate('Main', {
      screen: 'Home',
      params: {
        notificationData: {
          title,
          message,
          ...data
        }
      }
    });
  }
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