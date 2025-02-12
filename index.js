/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import 'react-native-get-random-values';
import PushNotification from 'react-native-push-notification';

PushNotification.getChannels(function (channel_ids) {
  channel_ids.forEach(id => {
    PushNotification.deleteChannel(id);
  });
});

PushNotification.configure({
  onRegister: function (token) {
    console.log('TOKEN --:', token);
  },
  onNotification: function (notification) {
    // @ts-ignore
    const {message, id, title} = notification;

    const safeTitle = title || 'New Notification';
    const safeMessage = message || 'You have a new notification';
    const safeId = id || Date.now().toString();

    let strTitle = safeTitle.toString();
    let strBody = safeMessage.toString();
    let typeMatch = strBody.match(/^(.*?):/);
    // let type = typeMatch ? typeMatch[1].trim() : 'notification';

    console.log('NOTIFICATION RECEIVED:', {
      title: strTitle,
      body: strBody,
      //   type: type
    });
    // App received notification while in foreground or background
    PushNotification.createChannel(
      {
        channelId: safeId,
        channelName: 'Remote Message',
        channelDescription: 'Notification for remote message',
        importance: 4,
        vibrate: true,
      },
      created => console.log(`createChannel returned '${created}'`),
    );

    PushNotification.localNotification({
      channelId: safeId,
      title: strTitle,
      message: strBody,
      //   userInfo: {type: type}, // Pass additional data
    });
  },
  popInitialNotification: true,
  requestPermissions: true,
});

AppRegistry.registerComponent(appName, () => App);
