// a component called notification

import React, {useEffect} from 'react';
import {PermissionsAndroid, Platform} from 'react-native';
import PushNotification from 'react-native-push-notification';

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

const Notification = () => {
  useEffect(() => {
    // console.log('Notification component mounted');
    // checkApplicationPermission();
    // PushNotification.getChannels(function (channel_ids) {
    //   channel_ids.forEach(id => {
    //     PushNotification.deleteChannel(id);
    //   });
    // });

    // brain not working
  }, []);

  return null;
};

export default Notification;
