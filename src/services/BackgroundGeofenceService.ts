import BackgroundFetch from 'react-native-background-fetch';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {BASE_URL} from '../config';

class BackgroundGeofenceService {
  private isConfigured = false;

  // Get current position
  private getCurrentPosition(): Promise<{latitude: number; longitude: number}> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        error => {
          reject(error);
        },
        {
          enableHighAccuracy: false,
          timeout: 30000,
          maximumAge: 60000,
        },
      );
    });
  }

  // Check location and send to server
  private async checkLocationAndNotify(): Promise<void> {
    console.log('[BackgroundGeofence] Background location check...');

    try {
      const userInfoStr = await AsyncStorage.getItem('userInfo');
      if (!userInfoStr) {
        console.log('[BackgroundGeofence] No user info, skipping');
        return;
      }

      const userInfo = JSON.parse(userInfoStr);
      if (!userInfo.access_token) {
        console.log('[BackgroundGeofence] No access token, skipping');
        return;
      }

      const coords = await this.getCurrentPosition();
      console.log('[BackgroundGeofence] Got location:', coords);

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
        console.log('[BackgroundGeofence] Server response:', result);
      }
    } catch (error) {
      console.error('[BackgroundGeofence] Error:', error);
    }
  }

  // Configure background fetch
  async configure(): Promise<void> {
    if (this.isConfigured) {
      return;
    }

    console.log('[BackgroundGeofence] Configuring...');

    try {
      await BackgroundFetch.configure(
        {
          minimumFetchInterval: 15,
          stopOnTerminate: false,
          startOnBoot: true,
          enableHeadless: true,
        },
        async (taskId: string) => {
          console.log('[BackgroundGeofence] Fetch event:', taskId);
          await this.checkLocationAndNotify();
          BackgroundFetch.finish(taskId);
        },
        async (taskId: string) => {
          console.log('[BackgroundGeofence] Timeout:', taskId);
          BackgroundFetch.finish(taskId);
        },
      );

      this.isConfigured = true;
      await BackgroundFetch.start();
      console.log('[BackgroundGeofence] Started');
    } catch (error) {
      console.error('[BackgroundGeofence] Config error:', error);
    }
  }

  async stop(): Promise<void> {
    await BackgroundFetch.stop();
    this.isConfigured = false;
  }
}

export const backgroundGeofenceService = new BackgroundGeofenceService();
export default backgroundGeofenceService;
