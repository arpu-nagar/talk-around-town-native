/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import 'react-native-get-random-values';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
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
    console.log('LOCAL NOTIFICATION ==>', notification);
    const {message, channelId} = notification;
    let notificationId = notification.data.notificationId;
    let title = 'REMOTE NOTIFICATION';
    let strTitle = JSON.stringify(title).split('"').join('');
    let strBody = JSON.stringify(message).split('"').join('');
    const key = JSON.stringify(notificationId).split('"').join('');
    // console.log('REMOTE NOTIFICATION ==>', title, strTitle, key);
    PushNotification.createChannel(
      {
        channelId: channelId, // (required & must be unique)
        channelName: 'remote messasge', // (required)
        channelDescription: 'Notification for remote message', // (optional) default: undefined.
        // (optional) default: true. Creates the default vibration patten if true.
      },
      created => console.log(`createChannel returned '${created}'`), // (optional) callback returns whether the channel was created, false means it already existed.
    );
    PushNotification.localNotification({
      channelId: channelId, //this must be same with channelId in createchannel
      title: strTitle,
      message: strBody,
    });
    // console.log('REMOTE NOTIFICATION ==>', title, message, id, notification);
  },
  senderID: '96534916371',
  popInitialNotification: true,
  requestPermissions: true,
});


AppRegistry.registerComponent(appName, () => App);
