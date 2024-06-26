// import AsyncStorage from '@react-native-async-storage/async-storage';
// import {useEffect} from 'react';
// import {PermissionsAndroid, Platform} from 'react-native';
// import PushNotification from 'react-native-push-notification';
// import {navigationRef} from '../ref/NavigationRef';

// const checkApplicationPermission = async () => {
//   if (Platform.OS === 'android') {
//     try {
//       await PermissionsAndroid.request(
//         PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
//       );
//     } catch (error) {
//       console.error(error);
//     }
//   }
// };

// const RemoteNotification = () => {
//   // let curtoken: String = '';
//   useEffect(() => {
//     checkApplicationPermission();
//     // Using this function as we are rendering local notification so without this function we will receive multiple notification for same notification
//     // We have same channelID for every FCM test server notification.
//     PushNotification.getChannels(function (channel_ids) {
//       channel_ids.forEach(id => {
//         PushNotification.deleteChannel(id);
//       });
//     });
//     PushNotification.configure({
//       // (optional) Called when Token is generated (iOS and Android)
//       onRegister: async function (token) {
//         // curtoken = token.token.toString();
//         const androidToken = await AsyncStorage.getItem('android_token');
//         if (androidToken) {
//           // console.log('Android token already stored:', androidToken);
//           return;
//         }
//         console.log('TOKEN:', token);
//         // access local storage and check if android token is already stored
//         // get access token from local storage
//         const jwt = await AsyncStorage.getItem('userInfo');
//         const userInfo = JSON.parse(jwt || '{}');
//         console.log('JWT:', userInfo.access_token);
//         // send access token to server
//         fetch('http://localhost:1337/api/auth/token', {
//           method: 'POST',
//           headers: {
//             Accept: 'application/json',
//             'Content-Type': 'application/json',
//             Authorization: `Bearer ${userInfo.access_token}`,
//           },
//           body: JSON.stringify({
//             token: token.token,
//           }),
//         })
//           .then(response => response.json())
//           .then(responseJson => {
//             // // store token in local storage
//             AsyncStorage.setItem('android_token', JSON.stringify(responseJson));
//             console.log('Data sent to server:', responseJson);
//           })
//           .catch(error => {
//             console.error('Error sending token data:', error);
//           });
//       },

      
//       // onAction: function (notification) {
//       // },
//       // (required) Called when a remote or local notification is opened or received
//       onNotification: function (notification) {
//         // add ignore to the notification object
//         // @ts-ignore
//         const {message, id, title} = notification;

//         // Provide default values if any of the variables are null or undefined
//         const safeTitle = title !== null && title !== undefined ? title : '789';
//         const safeMessage =
//           message !== null && message !== undefined ? message : '456';
//         const safeId = id !== null && id !== undefined ? id : '123';

//         // Convert to strings and remove quotes
//         let strTitle = JSON.stringify(safeTitle).split('"').join('');
//         let strBody = JSON.stringify(safeMessage).split('"').join('');
//         let typeMatch = strBody.match(/^(.*?):/);
//         let type = typeMatch ? typeMatch[1].trim() : null;
//         console.log('BODY: ', strBody)
//         console.log('TYPE:', type);
//         // strBody: `${type}: Click here for some tips to make the most of your visit.`,
//         // get the $type from the strBody

//         const key = JSON.stringify(safeId).split('"').join('');
//         PushNotification.createChannel(
//           {
//             channelId: key, // (required & must be unique)
//             channelName: 'remote messasge', // (required)
//             channelDescription: 'Notification for remote message', // (optional) default: undefined.
//             importance: 4, // (optional) default: 4. Int value of the Android notification importance
//             vibrate: true, // (optional) default: true. Creates the default vibration patten if true.
//           },
//           created => console.log(`createChannel returned '${created}'`), // (optional) callback returns whether the channel was created, false means it already existed.
//         );
//         PushNotification.localNotification({
//           channelId: key, //this must be same with channelId in createchannel
//           title: strTitle,
//           message: strBody,
//         });
//         const lastWord = strTitle.split(' ').pop();
//         console.log(
//           'REMOTE NOTIFICATION ==>',
//           title,
//           message,
//           id,
//           notification,
//           type,
//         );
//         (navigationRef.current as any)?.navigate('Home', {
//           notificationTitle: type,
//         });
//         // process the notification here
//       },
//       // Android only: GCM or FCM Sender ID
//       // senderID: '1234567890'
//       popInitialNotification: true,
//       // senderID: '1234567890',
//       requestPermissions: true,
//     });
//   }, []);
//   return null;
// };
// export default RemoteNotification;


import AsyncStorage from '@react-native-async-storage/async-storage';
import {useEffect} from 'react';
import {PermissionsAndroid, Platform} from 'react-native';
import PushNotification from 'react-native-push-notification';
import {navigationRef} from '../ref/NavigationRef';

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
  useEffect(() => {
    checkApplicationPermission();
    PushNotification.getChannels(function (channel_ids) {
      channel_ids.forEach(id => {
        PushNotification.deleteChannel(id);
      });
    });

    PushNotification.configure({
      onRegister: async function (token) {
        const androidToken = await AsyncStorage.getItem('android_token');
        if (androidToken) {
          return;
        }
        console.log('TOKEN:', token);
        const jwt = await AsyncStorage.getItem('userInfo');
        const userInfo = JSON.parse(jwt || '{}');
        console.log('JWT:', userInfo.access_token);
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
            AsyncStorage.setItem('android_token', JSON.stringify(responseJson));
            console.log('Data sent to server:', responseJson);
          })
          .catch(error => {
            console.error('Error sending token data:', error);
          });
      },

      onNotification: function (notification) {
        // @ts-ignore
        const {message, id, title, userInteraction} = notification;

        const safeTitle = title || 'New Notification';
        const safeMessage = message || 'You have a new notification';
        const safeId = id || Date.now().toString();

        let strTitle = safeTitle.toString();
        let strBody = safeMessage.toString();
        let typeMatch = strBody.match(/^(.*?):/);
        let type = typeMatch ? typeMatch[1].trim() : 'notification';

        console.log('NOTIFICATION RECEIVED:', {
          title: strTitle,
          body: strBody,
          type: type,
          userInteraction: userInteraction
        });

        if (userInteraction) {
          // User clicked on the notification
          console.log('User clicked on notification. Navigating to HomeScreen.');
          (navigationRef.current as any)?.navigate('Home', {
            notificationTitle: type,
          });
        } else {
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
            userInfo: { type: type },  // Pass additional data
          });
        }
      },

      popInitialNotification: true,
      requestPermissions: true,
    });
  }, []);

  return null;
};

export default RemoteNotification;