import AsyncStorage from '@react-native-async-storage/async-storage';
import {useEffect} from 'react';
import {PermissionsAndroid, Platform} from 'react-native';
import PushNotification from 'react-native-push-notification';
import { navigationRef } from '../ref/NavigationRef';

const checkApplicationPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
    } catch (error) {
      console.error(error);
    }
  }
};

const RemoteNotification = () => {
  // let curtoken: String = '';
  useEffect(() => {
    checkApplicationPermission();
    // Using this function as we are rendering local notification so without this function we will receive multiple notification for same notification
    // We have same channelID for every FCM test server notification.
    PushNotification.getChannels(function (channel_ids) {
      channel_ids.forEach(id => {
        PushNotification.deleteChannel(id);
      });
    });
    PushNotification.configure({
      // (optional) Called when Token is generated (iOS and Android)
      onRegister: async function (token) {
        // curtoken = token.token.toString();
        const androidToken = await AsyncStorage.getItem('android_token');
        if (androidToken) {
          // console.log('Android token already stored:', androidToken);
          return;
        }
        console.log('TOKEN:', token);
        // access local storage and check if android token is already stored
        // get access token from local storage
        const jwt = await AsyncStorage.getItem('userInfo');
        const userInfo = JSON.parse(jwt || '{}');
        console.log('JWT:', userInfo.access_token);
        // send access token to server
        fetch('http://localhost:1337/api/auth/token', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userInfo.access_token}`,
          },
          body: JSON.stringify({
            token: token.token,
          }),
        })
          .then(response => response.json())
          .then(responseJson => {
            // // store token in local storage
            AsyncStorage.setItem('android_token', JSON.stringify(responseJson));
            console.log('Data sent to server:', responseJson);
          })
          .catch(error => {
            console.error('Error sending token data:', error);
          });
      },

      // (required) Called when a remote or local notification is opened or received
      onNotification: function (notification) {
        const {message, id} = notification;
        let title = 'REMOTE NOTIFICATION';
        let strTitle: string = JSON.stringify(title).split('"').join('');
        let strBody: string = JSON.stringify(message).split('"').join('');
        const key: string = JSON.stringify(id).split('"').join('');
        PushNotification.createChannel(
          {
            channelId: key, // (required & must be unique)
            channelName: 'remote messasge', // (required)
            channelDescription: 'Notification for remote message', // (optional) default: undefined.
            importance: 4, // (optional) default: 4. Int value of the Android notification importance
            vibrate: true, // (optional) default: true. Creates the default vibration patten if true.
          },
          created => console.log(`createChannel returned '${created}'`), // (optional) callback returns whether the channel was created, false means it already existed.
        );
        PushNotification.localNotification({
            channelId: key, //this must be same with channelId in createchannel
            title: strTitle,
            message: strBody,
        });
        console.log(
            'REMOTE NOTIFICATION ==>',
            title,
            message,
            id,
            notification,
        );
        (navigationRef.current as any)?.navigate('Home');
        // process the notification here
      },
      // Android only: GCM or FCM Sender ID
      // senderID: '1234567890'
      popInitialNotification: true,
      // senderID: '1234567890',
      requestPermissions: true,
    });
  }, []);
  return null;
};
export default RemoteNotification;
